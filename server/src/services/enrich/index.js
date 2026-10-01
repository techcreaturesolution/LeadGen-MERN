import pLimit from 'p-limit';
import { env } from '../../config/env.js';
import { domainOf, isCompanyWebsite, normalizeUrl, websiteMatchesName } from '../../utils/http.js';
import { categorizeEmail } from '../emails.js';
import { apolloEnabled, apolloOrganization, apolloPeople, fromApolloOrg } from './apollo.js';
import { fromHunter, hunterDomainSearch, hunterEnabled } from './hunter.js';

const STOP_STATUSES = [401, 402, 403, 429];
const RANK = { verified: 0, likely: 1 };
const byQuality = (a, b) => (RANK[a.verification] ?? 2) - (RANK[b.verification] ?? 2);
const norm = (s) => String(s || '').toLowerCase().replace(/[^a-z]/g, '');

export function enrichmentProviders() {
  return [apolloEnabled() && 'apollo', hunterEnabled() && 'hunter'].filter(Boolean);
}

const errorText = (err) => {
  const d = err.response?.data;
  return d?.errors?.[0]?.details || d?.error || d?.message || err.message;
};

// Wraps provider calls so quota/auth errors stop that provider for the rest of the search instead of failing every lead.
function guarded(label, log) {
  let stopped = false;
  return async (fn) => {
    if (stopped) return null;
    try {
      return await fn();
    } catch (err) {
      const status = err.response?.status;
      if (STOP_STATUSES.includes(status)) {
        stopped = true;
        log('warn', `${label}: stopped for this search (${status} ${errorText(err)})`);
      } else {
        log('warn', `${label}: ${errorText(err)}`);
      }
      return null;
    }
  };
}

const addEnricher = (lead, name) => {
  lead.enrichedBy = [...new Set([...(lead.enrichedBy || []), name])];
};

export function mergeContacts(existing = [], incoming = [], max = env.enrichment.contactsPerCompany) {
  const out = [...existing];
  const keys = new Set(out.map((c) => c.email || `${norm(c.name)}|${norm(c.title)}`));
  for (const c of incoming) {
    const k = c.email || `${norm(c.name)}|${norm(c.title)}`;
    if (keys.has(k) || out.length >= max) continue;
    keys.add(k);
    out.push(c);
  }
  return out;
}

export function applyCompany(lead, company) {
  if (!company) return false;
  if (!lead.website && company.website && isCompanyWebsite(company.website)) {
    lead.website = normalizeUrl(company.website);
    lead.domain = domainOf(lead.website);
  }
  for (const k of ['phone', 'address', 'city', 'linkedinUrl', 'facebookUrl', 'companyType', 'description', 'employeeCount', 'foundedYear']) {
    if (!lead[k] && company[k]) lead[k] = company[k];
  }
  if (!lead.services?.length && company.services?.length) lead.services = company.services;
  addEnricher(lead, 'apollo');
  return true;
}

// Apollo matched by name alone can return a namesake elsewhere, so require the name and city to agree.
export function sameCompany(lead, company) {
  if (!company?.website || !websiteMatchesName(lead.name, { link: company.website, title: company.name })) return false;
  const city = lead.city || lead.matchedLocation || lead.searchLocation;
  return !city || !company.city || norm(company.city) === norm(city);
}

export async function enrichCompanies(leads, log, { organization = apolloEnabled() ? apolloOrganization : null, max = env.enrichment.maxCompanies } = {}) {
  if (!organization || !max) return 0;
  const call = guarded('Apollo.io company enrichment', log);
  const todo = leads.filter((l) => l.verification !== 'rejected' && (!l.website || !l.companyType)).sort(byQuality).slice(0, max);
  const limit = pLimit(3);
  let done = 0;
  await Promise.all(
    todo.map((l) =>
      limit(async () => {
        const company = fromApolloOrg(await call(() => organization(l.domain ? { domain: l.domain } : { name: l.name })));
        if (!company || (!l.domain && !sameCompany(l, company))) return;
        if (applyCompany(l, company)) done += 1;
      }),
    ),
  );
  return done;
}

const hasRoleEmail = (lead, role) => (lead.rawEmails || []).some((e) => (e.category || categorizeEmail(e.email)) === role);

export async function enrichContacts(
  leads,
  plan,
  log,
  {
    domainSearch = hunterEnabled() ? hunterDomainSearch : null,
    people = apolloEnabled() ? apolloPeople : null,
    max = env.enrichment.maxDomainSearches,
    perCompany = env.enrichment.contactsPerCompany,
  } = {},
) {
  const stats = { hunter: 0, apollo: 0 };
  if ((!domainSearch && !people) || !max) return stats;
  const hunterCall = guarded('Hunter.io domain search', log);
  const apolloCall = guarded('Apollo.io people search', log);
  const todo = leads.filter((l) => l.domain).sort(byQuality).slice(0, max);
  const limit = pLimit(3);
  await Promise.all(
    todo.map((l) =>
      limit(async () => {
        if (domainSearch && !hasRoleEmail(l, plan.targetRole)) {
          const found = fromHunter(await hunterCall(() => domainSearch(l.domain, Math.max(perCompany, 10))));
          if (found.emails.length) {
            l.rawEmails = [...(l.rawEmails || []), ...found.emails];
            l.contacts = mergeContacts(l.contacts, found.contacts, perCompany);
            addEnricher(l, 'hunter');
            stats.hunter += 1;
          }
        }
        if (people && (l.contacts?.length || 0) < perCompany) {
          const found = await apolloCall(() => people(l.domain, plan.targetRole, perCompany));
          if (found?.length) {
            l.contacts = mergeContacts(l.contacts, found, perCompany);
            addEnricher(l, 'apollo');
            stats.apollo += 1;
          }
        }
      }),
    ),
  );
  return stats;
}
