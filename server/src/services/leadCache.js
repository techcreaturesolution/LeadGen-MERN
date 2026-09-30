import { env } from '../config/env.js';
import { Lead } from '../models/Lead.js';
import { SearchJob } from '../models/SearchJob.js';
import { dedupeKey } from './agent/qualityAgent.js';

const GENERIC = new Set(['company', 'firm', 'business', 'organisation', 'organization', 'enterprise', 'list', 'detail', 'data']);

function singular(w) {
  if (w.length > 4 && w.endsWith('ies')) return `${w.slice(0, -3)}y`;
  if (w.length > 3 && w.endsWith('s') && !w.endsWith('ss')) return w.slice(0, -1);
  return w;
}

const tokens = (s) =>
  String(s || '')
    .toLowerCase()
    .split(/[^a-z0-9]+/)
    .filter(Boolean)
    .map(singular);

// Same business type + same set of locations => same key, regardless of wording order, plurals or role.
export function searchCacheKey(plan) {
  const business = [...new Set(tokens(plan.businessType).filter((t) => !GENERIC.has(t)))].sort();
  const locations = [...new Set((plan.locations?.length ? plan.locations : [plan.location || '']).map((l) => tokens(l).join(' ')).filter(Boolean))].sort();
  return `${business.join(' ') || 'company'}@${locations.join('+') || 'any'}`;
}

export const cacheCutoff = (now = Date.now()) => new Date(now - env.dataRetentionDays * 24 * 3600 * 1000);

export function pickPrimaryEmail(lead, role) {
  const emails = lead.emails || [];
  const hit = emails.find((e) => e.category === role);
  if (!hit) return { primaryEmail: lead.primaryEmail, primaryEmailCategory: lead.primaryEmailCategory };
  return { primaryEmail: hit.email, primaryEmailCategory: hit.category };
}

const OMIT = ['_id', 'owner', 'job', 'rank', 'createdAt', 'updatedAt', '__v', 'aiNote'];

export function toReusedLead(lead, plan) {
  const out = Object.fromEntries(Object.entries(lead).filter(([k]) => !OMIT.includes(k)));
  Object.assign(out, pickPrimaryEmail(lead, plan.targetRole));
  out.discoveredAt = lead.discoveredAt || lead.createdAt;
  out.reusedFrom = lead.job;
  out.dedupeKey = lead.dedupeKey || dedupeKey(lead);
  return out;
}

// Leads found by any user's completed search with the same key during the retention window, freshest first, one per business.
export async function findCachedLeads({ key, plan, sources, excludeJob, matchMode = env.leadMatchMode }) {
  const cutoff = cacheCutoff();
  const jobs = await SearchJob.find({ cacheKey: key, status: 'completed', _id: { $ne: excludeJob }, createdAt: { $gte: cutoff } })
    .select('_id')
    .lean();
  if (!jobs.length) return { leads: [], jobIds: [] };
  const rows = await Lead.find({
    job: { $in: jobs.map((j) => j._id) },
    sources: { $in: sources },
    verification: matchMode === 'strict' ? 'verified' : { $in: ['verified', 'likely'] },
    $or: [{ discoveredAt: { $gte: cutoff } }, { discoveredAt: null, createdAt: { $gte: cutoff } }],
  })
    .sort({ discoveredAt: -1, createdAt: -1 })
    .lean();
  const seen = new Set();
  const leads = [];
  const used = new Set();
  for (const l of rows) {
    const k = l.dedupeKey || dedupeKey(l);
    if (seen.has(k)) continue;
    seen.add(k);
    used.add(String(l.job));
    leads.push(toReusedLead(l, plan));
  }
  return { leads, jobIds: [...used] };
}

// Fresh leads win over cached copies of the same business.
export function mergeWithCached(fresh, cached) {
  const keys = new Set(fresh.map((l) => l.dedupeKey));
  return [...fresh, ...cached.filter((l) => !keys.has(l.dedupeKey))];
}
