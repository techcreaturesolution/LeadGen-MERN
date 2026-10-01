import pLimit from 'p-limit';
import { env } from '../config/env.js';
import { Lead } from '../models/Lead.js';
import { SearchJob } from '../models/SearchJob.js';
import { domainOf, isCompanyWebsite, normalizeUrl, websiteMatchesName } from '../utils/http.js';
import { crawlWebsite } from './crawler.js';
import { planSearch, rankEmails, scoreLead, summarizeJob } from './agent/leadAgent.js';
import { aiVerify, assessRelevance, cleanEmails, dedupeKey, dedupeLeads, normName } from './agent/qualityAgent.js';
import { llmEnabled } from './agent/llm.js';
import { searchGoogleMaps } from './sources/googleMaps.js';
import { findOfficialWebsite, searchInstagram, searchLinkedIn } from './sources/social.js';
import { webSearchProvider } from './sources/webSearch.js';
import { findCachedLeads, mergeWithCached, searchCacheKey } from './leadCache.js';
import { enrichCompanies, enrichContacts, enrichmentProviders } from './enrich/index.js';

function toRecord(c) {
  const website = c.website && isCompanyWebsite(c.website) ? normalizeUrl(c.website) : null;
  const rawEmails = [
    ...(c.snippetEmails || []).map((e) => ({ email: e, foundOn: c.linkedinUrl || c.instagramUrl || c.source })),
    ...(c.email ? [{ email: String(c.email).toLowerCase().trim(), foundOn: 'maps listing' }] : []),
  ];
  const r = { ...c, website, domain: website ? domainOf(website) : null, sources: [c.source], rawEmails };
  delete r.snippetEmails;
  delete r.email;
  delete r.source;
  return r;
}

const RANK = { verified: 0, likely: 1 };

export const bestFirst = (plan) => (a, b) =>
  (RANK[a.verification] ?? 2) - (RANK[b.verification] ?? 2) ||
  Number(b.primaryEmailCategory === plan.targetRole) - Number(a.primaryEmailCategory === plan.targetRole) ||
  Number(Boolean(b.primaryEmail)) - Number(Boolean(a.primaryEmail)) ||
  (b.score || 0) - (a.score || 0);

export async function runSearchJob(jobId) {
  const job = await SearchJob.findById(jobId);
  if (!job) return;
  const logs = [];
  const log = (level, message) => {
    logs.push({ at: new Date(), level, message });
    console.log(`[job ${jobId}] ${level}: ${message}`);
  };
  const progress = { stage: 'planning', discovered: 0, crawled: 0, withEmail: 0, withRoleEmail: 0 };
  let lastFlush = 0;
  const flush = async (force = false, extra = {}) => {
    if (!force && Date.now() - lastFlush < 1500) return;
    lastFlush = Date.now();
    const pending = logs.splice(0);
    await SearchJob.updateOne({ _id: jobId }, { $set: { progress, ...extra }, ...(pending.length ? { $push: { logs: { $each: pending } } } : {}) });
  };

  const finalize = async (input, plan, quality) => {
    const target = job.targetCount;
    const seen = new Set();
    const leads = input
      .filter((l) => !seen.has(l.dedupeKey) && seen.add(l.dedupeKey))
      .sort(bestFirst(plan))
      .slice(0, target);
    const reusedLeads = leads.filter((l) => l.reusedFrom);
    if (leads.length < target) log('warn', `Only ${leads.length} of ${target} requested leads passed verification (${quality.likely || 0} likely matches held back in ${env.leadMatchMode} mode)`);
    progress.withEmail = leads.filter((l) => l.primaryEmail).length;
    progress.withRoleEmail = leads.filter((l) => l.primaryEmailCategory === plan.targetRole).length;

    progress.stage = 'ai summary';
    await flush(true);
    const { summary, notes } = await summarizeJob(job.query, plan, leads);

    const now = new Date();
    await Lead.deleteMany({ job: jobId });
    await Lead.insertMany(
      leads.map((l, i) => ({
        ...l,
        owner: job.owner,
        job: jobId,
        rank: i + 1,
        discoveredAt: l.discoveredAt || now,
        aiNote: notes[String(i)] || l.aiNote || undefined,
        description: undefined,
      })),
    );
    progress.stage = 'done';
    log('info', `Saved ${leads.length} leads (${progress.withEmail} with email, ${progress.withRoleEmail} ${plan.targetRole}; ${reusedLeads.length} reused from recent searches)`);
    const cache = { reused: reusedLeads.length, fresh: leads.length - reusedLeads.length, sourceJobs: [...new Set(reusedLeads.map((l) => String(l.reusedFrom)))] };
    await flush(true, { status: 'completed', leadCount: leads.length, summary, quality, cache, finishedAt: new Date() });
  };

  try {
    await flush(true, { status: 'running', startedAt: new Date() });
    const plan = await planSearch(job.query);
    log('info', `Agent plan (${plan.planner}): ${plan.businessType} | ${plan.location || 'any location'} | role=${plan.targetRole}`);
    const cacheKey = searchCacheKey(plan);
    await flush(true, { plan, cacheKey });

    const target = job.targetCount;
    const cached = env.sharedLeadCache ? await findCachedLeads({ key: cacheKey, plan, sources: job.sources, excludeJob: job._id }) : { leads: [] };
    if (cached.leads.length >= target) {
      log('info', `Shared results: ${cached.leads.length} matching leads already found by searches in the last ${env.dataRetentionDays} days, reusing them`);
      progress.discovered = cached.leads.length;
      const quality = { rawResults: 0, duplicatesRemoved: 0, rejected: 0, likely: cached.leads.filter((l) => l.verification === 'likely').length, verified: cached.leads.filter((l) => l.verification === 'verified').length, emailsRemoved: 0, aiChecked: llmEnabled() };
      return await finalize(cached.leads, plan, quality);
    }
    if (cached.leads.length) log('info', `Shared results: ${cached.leads.length} leads from recent searches, searching for more`);
    const sourceStats = {};
    const candidates = [];
    progress.stage = 'discovering';
    const locations = plan.locations?.length ? plan.locations : [plan.location || ''];
    const perLocation = (fn, limit) => async () => {
      const rows = [];
      for (const location of locations) rows.push(...(await fn({ ...plan, location }, limit, log)).map((r) => ({ ...r, searchLocation: r.searchLocation || location || undefined })));
      return rows;
    };
    const runners = {
      google_maps: () => searchGoogleMaps(plan, Math.min(60, target * 2), log),
      linkedin: perLocation(searchLinkedIn, Math.ceil(target / locations.length) + 5),
      instagram: perLocation(searchInstagram, Math.ceil(target / locations.length) + 5),
    };
    for (const source of job.sources) {
      if ((source === 'linkedin' || source === 'instagram') && !webSearchProvider()) {
        log('warn', `${source}: skipped, no web search provider configured`);
        continue;
      }
      try {
        const rows = await runners[source]();
        sourceStats[source] = rows.length;
        candidates.push(...rows);
        log('info', `${source}: ${rows.length} raw results`);
      } catch (err) {
        sourceStats[source] = 0;
        log('error', `${source} failed: ${err.response?.data?.error?.message || err.message}`);
      }
      progress.discovered = candidates.length;
      await flush(true, { sourceStats });
    }

    const quality = { rawResults: candidates.length, duplicatesRemoved: 0, rejected: 0, likely: 0, verified: 0, emailsRemoved: 0, aiChecked: llmEnabled() };
    const records = candidates.filter((c) => c.name && normName(c.name)).map(toRecord);
    let { leads, removed } = dedupeLeads(records);
    quality.duplicatesRemoved += removed + (candidates.length - records.length);
    for (const l of leads) Object.assign(l, assessRelevance(l, plan));
    const early = leads.filter((l) => l.verification === 'rejected' && !l.website);
    quality.rejected += early.length;
    leads = leads.filter((l) => !(l.verification === 'rejected' && !l.website));
    progress.discovered = leads.length;
    log('info', `Merged ${candidates.length} results into ${leads.length} unique businesses (${removed} duplicates, ${early.length} off-target dropped)`);

    progress.stage = 'resolving websites';
    await flush(true);
    const missing = leads.filter((l) => !l.website).slice(0, target);
    if (missing.length && webSearchProvider()) {
      const limitSearch = pLimit(2);
      await Promise.all(
        missing.map((l) =>
          limitSearch(async () => {
            try {
              const rows = await findOfficialWebsite(l.name, l.matchedLocation || l.searchLocation || locations[0]);
              const hit = rows.find((r) => isCompanyWebsite(r.link) && websiteMatchesName(l.name, r));
              if (hit) {
                l.website = new URL(hit.link).origin;
                l.domain = domainOf(l.website);
              }
            } catch {
              /* best effort */
            }
          }),
        ),
      );
    }

    if (enrichmentProviders().includes('apollo')) {
      progress.stage = 'enriching companies';
      await flush(true);
      quality.enrichedCompanies = await enrichCompanies(leads, log);
      log('info', `Apollo.io: added company details for ${quality.enrichedCompanies} businesses`);
    }

    ({ leads, removed } = dedupeLeads(leads));
    quality.duplicatesRemoved += removed;

    progress.stage = 'crawling websites';
    await flush(true);
    const limit = pLimit(env.crawlConcurrency);
    const toCrawl = leads
      .filter((l) => l.website)
      .sort((a, b) => (RANK[a.verification] ?? 2) - (RANK[b.verification] ?? 2))
      .slice(0, Math.max(target * 3, 30));
    await Promise.all(
      toCrawl.map((l) =>
        limit(async () => {
          try {
            const r = await crawlWebsite(l.website);
            l.rawEmails.push(...r.emails);
            l.linkedinUrl ||= r.linkedinUrl;
            l.instagramUrl ||= r.instagramUrl;
            l.facebookUrl ||= r.facebookUrl;
            l.phone ||= r.phone;
            l.siteTitle ||= r.siteTitle;
            l.siteDescription ||= r.siteDescription;
          } catch (err) {
            log('warn', `crawl ${l.website}: ${err.message}`);
          }
          progress.crawled += 1;
          await flush();
        }),
      ),
    );

    progress.stage = 'qualifying';
    await flush(true);
    ({ leads, removed } = dedupeLeads(leads));
    quality.duplicatesRemoved += removed;
    for (const l of leads) Object.assign(l, assessRelevance(l, plan));
    if (llmEnabled()) {
      const candidatesForAi = leads.filter((l) => l.verification !== 'rejected').slice(0, Math.max(target * 2, 40));
      const changed = await aiVerify(job.query, plan, candidatesForAi, log);
      log('info', `AI verification agent reviewed ${candidatesForAi.length} businesses (${changed} changed)`);
    }
    const rejected = leads.filter((l) => l.verification === 'rejected');
    quality.rejected += rejected.length;
    rejected.slice(0, 8).forEach((l) => log('info', `Dropped "${l.name}": ${l.matchReason}`));
    leads = leads.filter((l) => l.verification !== 'rejected');

    if (enrichmentProviders().length) {
      progress.stage = 'finding contacts';
      await flush(true);
      const found = await enrichContacts(leads, plan, log);
      quality.enrichedContacts = found.hunter + found.apollo;
      log('info', `Contact enrichment: Hunter.io emails for ${found.hunter} domains, Apollo.io decision-makers for ${found.apollo} companies`);
    }

    quality.emailsRemoved = await cleanEmails(leads);
    for (const l of leads) {
      const kept = new Set(l.rawEmails.map((e) => e.email));
      if (l.contacts?.length) l.contacts = l.contacts.map((c) => (c.email && !kept.has(c.email) ? { ...c, email: undefined } : c));
      l.emails = rankEmails(l.rawEmails, plan, l.website).slice(0, 10);
      l.primaryEmail = l.emails[0]?.email;
      l.primaryEmailCategory = l.emails[0]?.category;
      l.score = scoreLead(l, plan) + (l.verification === 'verified' ? 0 : -15);
      l.dedupeKey = dedupeKey(l);
      if (!l.city && l.matchedLocation) l.city = l.matchedLocation;
      delete l.rawEmails;
      delete l.searchLocation;
      delete l.siteDescription;
    }
    quality.verified = leads.filter((l) => l.verification === 'verified').length;
    quality.likely = leads.filter((l) => l.verification === 'likely').length;
    if (env.leadMatchMode !== 'balanced') leads = leads.filter((l) => l.verification === 'verified');
    await finalize(mergeWithCached(leads, cached.leads), plan, quality);
  } catch (err) {
    log('error', err.message);
    progress.stage = 'failed';
    await flush(true, { status: 'failed', error: err.message, finishedAt: new Date() });
  }
}
