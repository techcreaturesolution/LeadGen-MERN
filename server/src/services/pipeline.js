import pLimit from 'p-limit';
import { env } from '../config/env.js';
import { Lead } from '../models/Lead.js';
import { SearchJob } from '../models/SearchJob.js';
import { domainOf, isCompanyWebsite, normalizeUrl } from '../utils/http.js';
import { crawlWebsite } from './crawler.js';
import { planSearch, rankEmails, scoreLead, summarizeJob } from './agent/leadAgent.js';
import { searchGoogleMaps } from './sources/googleMaps.js';
import { findOfficialWebsite, searchInstagram, searchLinkedIn } from './sources/social.js';
import { webSearchProvider } from './sources/webSearch.js';

const normName = (n) =>
  String(n || '')
    .toLowerCase()
    .replace(/\b(pvt|private|ltd|limited|llp|inc|technologies|technology|solutions|services|infotech|software)\b/g, '')
    .replace(/[^a-z0-9]/g, '');

function websiteMatchesName(name, result) {
  const tokens = String(name)
    .toLowerCase()
    .replace(/\b(pvt|private|ltd|limited|llp|inc|the|and|of|co)\b/g, ' ')
    .split(/[^a-z0-9]+/)
    .filter((t) => t.length >= 3);
  if (!tokens.length) return false;
  const domain = (domainOf(result.link) || '').replace(/[^a-z0-9]/g, '');
  const title = String(result.title || '').toLowerCase();
  return tokens.some((t) => domain.includes(t)) || tokens.every((t) => title.includes(t));
}

function mergeCandidates(candidates) {
  const byKey = new Map();
  for (const c of candidates) {
    if (!c.name) continue;
    const website = c.website && isCompanyWebsite(c.website) ? normalizeUrl(c.website) : null;
    const domain = website ? domainOf(website) : null;
    const key = domain || normName(c.name);
    if (!key) continue;
    const existing = byKey.get(key) || byKey.get(normName(c.name));
    const emails = [...(c.snippetEmails || []).map((e) => ({ email: e, foundOn: c.linkedinUrl || c.instagramUrl || c.source })), ...(c.email ? [{ email: c.email.toLowerCase(), foundOn: 'maps listing' }] : [])];
    if (existing) {
      existing.sources = [...new Set([...existing.sources, c.source])];
      for (const f of ['category', 'address', 'city', 'phone', 'linkedinUrl', 'instagramUrl', 'facebookUrl', 'rating', 'reviewsCount', 'lat', 'lng']) {
        if (existing[f] == null && c[f] != null) existing[f] = c[f];
      }
      if (!existing.website && website) {
        existing.website = website;
        existing.domain = domain;
      }
      existing.rawEmails.push(...emails);
    } else {
      const lead = { ...c, website, domain, sources: [c.source], rawEmails: emails };
      delete lead.snippetEmails;
      delete lead.email;
      delete lead.source;
      byKey.set(key, lead);
      if (domain) byKey.set(normName(c.name), lead);
    }
  }
  return [...new Set(byKey.values())];
}

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

  try {
    await flush(true, { status: 'running', startedAt: new Date() });
    const plan = await planSearch(job.query);
    log('info', `Agent plan (${plan.planner}): ${plan.businessType} | ${plan.location || 'any location'} | role=${plan.targetRole}`);
    await flush(true, { plan });

    const target = job.targetCount;
    const sourceStats = {};
    const candidates = [];
    progress.stage = 'discovering';
    const runners = {
      google_maps: () => searchGoogleMaps(plan, Math.min(60, target * 2), log),
      linkedin: () => searchLinkedIn(plan, target, log),
      instagram: () => searchInstagram(plan, target, log),
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

    let leads = mergeCandidates(candidates);
    progress.discovered = leads.length;
    log('info', `Merged into ${leads.length} unique businesses`);

    progress.stage = 'resolving websites';
    await flush(true);
    const missing = leads.filter((l) => !l.website).slice(0, target);
    if (missing.length && webSearchProvider()) {
      const limitSearch = pLimit(2);
      await Promise.all(
        missing.map((l) =>
          limitSearch(async () => {
            try {
              const rows = await findOfficialWebsite(l.name, plan.location);
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

    progress.stage = 'crawling websites';
    await flush(true);
    const limit = pLimit(env.crawlConcurrency);
    const toCrawl = leads.filter((l) => l.website).slice(0, Math.max(target * 2, 20));
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
          } catch (err) {
            log('warn', `crawl ${l.website}: ${err.message}`);
          }
          progress.crawled += 1;
          await flush();
        }),
      ),
    );

    progress.stage = 'qualifying';
    for (const l of leads) {
      const unique = [...new Map(l.rawEmails.map((e) => [e.email, e])).values()];
      l.emails = rankEmails(unique, plan, l.website).slice(0, 10);
      l.primaryEmail = l.emails[0]?.email;
      l.primaryEmailCategory = l.emails[0]?.category;
      l.score = scoreLead(l, plan);
      delete l.rawEmails;
    }
    leads.sort(
      (a, b) =>
        Number(b.primaryEmailCategory === plan.targetRole) - Number(a.primaryEmailCategory === plan.targetRole) ||
        Number(Boolean(b.primaryEmail)) - Number(Boolean(a.primaryEmail)) ||
        b.score - a.score,
    );
    leads = leads.slice(0, target);
    progress.withEmail = leads.filter((l) => l.primaryEmail).length;
    progress.withRoleEmail = leads.filter((l) => l.primaryEmailCategory === plan.targetRole).length;

    progress.stage = 'ai summary';
    await flush(true);
    const { summary, notes } = await summarizeJob(job.query, plan, leads);

    await Lead.deleteMany({ job: jobId });
    await Lead.insertMany(
      leads.map((l, i) => ({
        ...l,
        owner: job.owner,
        job: jobId,
        rank: i + 1,
        aiNote: notes[String(i)] || undefined,
        description: undefined,
      })),
    );
    progress.stage = 'done';
    log('info', `Saved ${leads.length} leads (${progress.withEmail} with email, ${progress.withRoleEmail} ${plan.targetRole})`);
    await flush(true, { status: 'completed', leadCount: leads.length, summary, finishedAt: new Date() });
  } catch (err) {
    log('error', err.message);
    progress.stage = 'failed';
    await flush(true, { status: 'failed', error: err.message, finishedAt: new Date() });
  }
}
