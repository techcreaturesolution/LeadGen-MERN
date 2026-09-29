import dns from 'node:dns/promises';
import { env } from '../../config/env.js';
import { llmEnabled, llmJson } from './llm.js';

const LEGAL_WORDS = /\b(pvt|private|ltd|limited|llp|inc|co|corp|corporation|company|the|and|of|technologies|technology|solutions|services|infotech|software)\b/g;

export const normName = (n) =>
  String(n || '')
    .toLowerCase()
    .replace(/&/g, ' and ')
    .replace(LEGAL_WORDS, ' ')
    .replace(/[^a-z0-9]/g, '');

const nameTokens = (n) =>
  String(n || '')
    .toLowerCase()
    .replace(LEGAL_WORDS, ' ')
    .split(/[^a-z0-9]+/)
    .filter((t) => t.length >= 4);

export function phoneKey(phone) {
  const digits = String(phone || '').replace(/\D/g, '');
  return digits.length >= 8 ? digits.slice(-10) : null;
}

function socialKey(url) {
  const m = String(url || '')
    .toLowerCase()
    .match(/(linkedin\.com\/company|instagram\.com)\/([a-z0-9._-]+)/);
  return m ? `${m[1].split('.')[0]}:${m[2]}` : null;
}

function distanceKm(a, b) {
  if (![a.lat, a.lng, b.lat, b.lng].every((v) => typeof v === 'number')) return null;
  const rad = (d) => (d * Math.PI) / 180;
  const dLat = rad(b.lat - a.lat);
  const dLng = rad(b.lng - a.lng);
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(rad(a.lat)) * Math.cos(rad(b.lat)) * Math.sin(dLng / 2) ** 2;
  return 12742 * Math.asin(Math.sqrt(h));
}

const cityOf = (r) => String(r.matchedLocation || r.searchLocation || r.city || '').toLowerCase();

function sameArea(a, b) {
  const d = distanceKm(a, b);
  if (d != null) return d < 5;
  const ca = cityOf(a);
  const cb = cityOf(b);
  return !ca || !cb || ca === cb;
}

const tokensOverlap = (a, b) => {
  const tb = new Set(nameTokens(b.name));
  return nameTokens(a.name).some((t) => tb.has(t));
};

function nearDuplicateNames(a, b) {
  const na = normName(a.name);
  const nb = normName(b.name);
  if (na.length < 6 || nb.length < 6) return false;
  const d = distanceKm(a, b);
  return d != null && d < 1 && (na.includes(nb) || nb.includes(na));
}

export function dedupeKey(lead) {
  if (lead.domain) return `d:${lead.domain}`;
  return `n:${normName(lead.name)}|${cityOf(lead)}`;
}

// Groups records that describe the same organisation (same domain / social profile, or same name or phone in the same area).
export function clusterDuplicates(records) {
  const parent = records.map((_, i) => i);
  const find = (i) => (parent[i] === i ? i : (parent[i] = find(parent[i])));
  const union = (a, b) => {
    parent[find(a)] = find(b);
  };
  const strong = new Map();
  const weak = new Map();
  records.forEach((r, i) => {
    const strongKeys = [r.domain && `d:${r.domain}`, socialKey(r.linkedinUrl), socialKey(r.instagramUrl)].filter(Boolean);
    for (const k of strongKeys) {
      if (strong.has(k)) union(i, strong.get(k));
      else strong.set(k, i);
    }
    const n = normName(r.name);
    const p = phoneKey(r.phone);
    for (const [k, ok] of [
      [n.length >= 3 && `n:${n}`, (j) => sameArea(r, records[j])],
      [p && `p:${p}`, (j) => sameArea(r, records[j]) && tokensOverlap(r, records[j])],
    ]) {
      if (!k) continue;
      const prev = weak.get(k) || [];
      prev.filter(ok).forEach((j) => union(i, j));
      weak.set(k, [...prev, i]);
    }
  });
  for (let i = 0; i < records.length; i += 1) {
    for (let j = i + 1; j < records.length; j += 1) {
      if (find(i) !== find(j) && nearDuplicateNames(records[i], records[j])) union(i, j);
    }
  }
  const groups = new Map();
  records.forEach((r, i) => {
    const root = find(i);
    if (!groups.has(root)) groups.set(root, []);
    groups.get(root).push(r);
  });
  return [...groups.values()];
}

const MERGE_FIELDS = ['category', 'address', 'city', 'phone', 'website', 'domain', 'linkedinUrl', 'instagramUrl', 'facebookUrl', 'rating', 'reviewsCount', 'lat', 'lng', 'searchLocation', 'siteTitle', 'siteDescription'];
const richness = (r) => MERGE_FIELDS.filter((f) => r[f] != null && r[f] !== '').length + (r.domain ? 3 : 0);

export function mergeGroup(group) {
  const [base, ...rest] = [...group].sort((a, b) => richness(b) - richness(a));
  const out = { ...base, sources: [...(base.sources || [])], rawEmails: [...(base.rawEmails || [])] };
  for (const r of rest) {
    out.sources = [...new Set([...out.sources, ...(r.sources || [])])];
    for (const f of MERGE_FIELDS) if ((out[f] == null || out[f] === '') && r[f] != null && r[f] !== '') out[f] = r[f];
    out.rawEmails.push(...(r.rawEmails || []));
  }
  return out;
}

export function dedupeLeads(records) {
  const groups = clusterDuplicates(records);
  return { leads: groups.map(mergeGroup), removed: records.length - groups.length };
}

const mxCache = new Map();

export async function emailDomainAccepts(domain) {
  if (!env.emailMxCheck) return true;
  if (mxCache.has(domain)) return mxCache.get(domain);
  const check = (async () => {
    try {
      const mx = await Promise.race([dns.resolveMx(domain), new Promise((_, rej) => setTimeout(() => rej(Object.assign(new Error('timeout'), { code: 'ETIMEOUT' })), 5000))]);
      return mx.some((m) => m.exchange && m.exchange !== '.');
    } catch (err) {
      return ['ENOTFOUND', 'ENODATA', 'NXDOMAIN'].includes(err.code) ? false : null;
    }
  })();
  mxCache.set(domain, check);
  return check;
}

// Removes emails whose domain cannot receive mail and emails shared by unrelated businesses (directories, web agencies).
export async function cleanEmails(leads) {
  const owners = new Map();
  for (const l of leads) {
    for (const e of new Set(l.rawEmails.map((x) => x.email))) owners.set(e, (owners.get(e) || 0) + 1);
  }
  let removed = 0;
  for (const l of leads) {
    const unique = [...new Map(l.rawEmails.map((e) => [e.email, e])).values()];
    const kept = [];
    for (const e of unique) {
      const domain = e.email.split('@')[1];
      const own = l.domain && (domain === l.domain || l.domain.endsWith(`.${domain}`) || domain.endsWith(`.${l.domain}`));
      if (owners.get(e.email) > 1 && !own) {
        removed += 1;
        continue;
      }
      const accepts = await emailDomainAccepts(domain);
      if (accepts === false) {
        removed += 1;
        continue;
      }
      kept.push({ ...e, mxValid: accepts === true });
    }
    l.rawEmails = kept;
  }
  return removed;
}

const TERM_SYNONYMS = [
  [/^(it|software|tech)$/i, 'software|\\bit\\b|infotech|info tech|technolog|\\btech|techno|digital|\\bweb|\\bapps?\\b|cloud|systems|solutions|computer|\\bdata\\b|\\bai\\b|saas|developer|development|telecommunication'],
  [/^colleges?$/i, 'college|universit|institute|polytechnic|vidyapith|vidyapeeth|campus|faculty|school of'],
  [/^(universit(y|ies)|vidyapith)$/i, 'universit|vidyapith|vidyapeeth'],
  [/^engineering$/i, 'engineer|technolog|technical|polytechnic|b\\.?\\s?tech|\\bb\\.?\\s?e\\.?\\b|\\biit\\b|\\bgec\\b|\\bldce\\b|\\bgtu\\b'],
  [/^schools?$/i, 'school|vidyalaya|vidya mandir|academy'],
  [/^hospitals?$/i, 'hospital|clinic|medical|health|nursing home'],
  [/^hotels?$/i, 'hotel|resort|\\binn\\b|residency|stay'],
  [/^restaurants?$/i, 'restaurant|cafe|dine|dining|kitchen|food|eatery|bistro'],
  [/^(real|estate|builders?|developers?|property|properties)$/i, 'real estate|realty|builder|developer|propert|infra|construction|homes|estate'],
  [/^pharma(ceuticals?)?$/i, 'pharma|drug|healthcare|life ?science|laborator'],
  [/^(manufactur\w*|factor(y|ies))$/i, 'manufactur|industr|engineering|works|fabricat|products|factory'],
  [/^(ca|chartered|accountants?)$/i, 'chartered accountant|\\bca\\b|& co|associates|accountan'],
];

const SUB_FACILITY = /\b(hostel|canteen|mess|parking|gate( no\.?)?|atm|bus stop|toilet|guest house|auditorium|playground|cafeteria|boys hostel|girls hostel|quarters)\b/i;

const escapeRe = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

function stem(word) {
  const w = word.toLowerCase();
  if (w.length > 4 && w.endsWith('ies')) return `${w.slice(0, -3)}(y|ies)`;
  if (w.length > 4 && w.endsWith('es')) return w.slice(0, -2);
  if (w.length > 3 && w.endsWith('s')) return w.slice(0, -1);
  return escapeRe(w);
}

export function planTerms(plan) {
  const words = (plan.keywords?.length ? plan.keywords : String(plan.businessType || '').split(/\s+/))
    .flatMap((k) => String(k).split(/\s+/))
    .map((w) => w.replace(/[^a-z0-9.&-]/gi, ''))
    .filter((w) => w.length > 1 && !/^(companies|company|firms?|businesses|agenc(y|ies)|details?|list|top|best|near)$/i.test(w));
  return [...new Set(words.map((w) => w.toLowerCase()))].map((w) => {
    const syn = TERM_SYNONYMS.find(([re]) => re.test(w));
    return { word: w, re: new RegExp(syn ? syn[1] : stem(w), 'i') };
  });
}

export function matchLocation(lead, plan) {
  const locations = plan.locations?.length ? plan.locations : plan.location ? [plan.location] : [];
  if (!locations.length) return { ok: true, location: null };
  const text = `${lead.address || ''} ${lead.city || ''}`.toLowerCase();
  const hit = locations.find((l) => text.includes(l.toLowerCase()));
  if (hit) return { ok: true, location: hit };
  const area = locations.find((l) => l.toLowerCase() === String(lead.areaMatched || '').toLowerCase());
  if (area) return { ok: true, location: area };
  if (!lead.address || !(lead.sources || []).includes('google_maps')) return { ok: true, location: lead.searchLocation || null };
  return { ok: false, location: null };
}

// Deterministic relevance check: every keyword of the request must be supported by the business name, category or website title.
export function assessRelevance(lead, plan) {
  const loc = matchLocation(lead, plan);
  const base = { matchedLocation: loc.location || undefined };
  const wantsFacility = SUB_FACILITY.test(plan.businessType || '');
  if (!wantsFacility && SUB_FACILITY.test(lead.name || '')) return { ...base, verification: 'rejected', matchReason: 'Part of a campus/building, not an organisation' };
  if (!loc.ok) return { ...base, verification: 'rejected', matchReason: `Outside ${(plan.locations || [plan.location]).join(' / ')}` };
  const terms = planTerms(plan);
  const text = [lead.name, lead.category, lead.siteTitle].filter(Boolean).join(' | ');
  const hits = terms.filter((t) => t.re.test(text)).map((t) => t.word);
  const missing = terms.filter((t) => !hits.includes(t.word)).map((t) => t.word);
  if (!terms.length || !missing.length) return { ...base, verification: 'verified', matchReason: terms.length ? `Matches ${hits.join(' + ')}` : 'Matches request' };
  if (hits.length) return { ...base, verification: 'likely', matchReason: `Matches ${hits.join(' + ')}; no evidence for ${missing.join(', ')}` };
  return { ...base, verification: 'rejected', matchReason: `No evidence it is ${plan.businessType}` };
}

// LLM verification pass. It can reject or confirm candidates, but cannot revive rule-rejected ones.
export async function aiVerify(query, plan, leads, log) {
  if (!llmEnabled() || !leads.length) return 0;
  let changed = 0;
  const locations = (plan.locations?.length ? plan.locations : [plan.location]).filter(Boolean);
  for (let start = 0; start < leads.length; start += 40) {
    const batch = leads.slice(start, start + 40);
    try {
      const out = await llmJson(
        'You are a strict B2B lead-verification agent. For each candidate decide if it truly is a ' +
          `"${plan.businessType}"${locations.length ? ` located in ${locations.join(' or ')}` : ''}. ` +
          'Use the evidence given and well-known public facts only; never guess. ' +
          'Return JSON {"results":[{"i":number,"verdict":"match"|"no_match"|"unsure","reason":"max 12 words"}]}.',
        JSON.stringify({
          request: query,
          candidates: batch.map((l, i) => ({ i, name: l.name, category: l.category, address: l.address, website: l.website, siteTitle: l.siteTitle, siteDescription: l.siteDescription?.slice(0, 200) })),
        }),
        { maxTokens: 3000 },
      );
      for (const r of out?.results || []) {
        const l = batch[Number(r.i)];
        if (!l) continue;
        const reason = String(r.reason || '').slice(0, 120);
        if (r.verdict === 'no_match') {
          l.verification = 'rejected';
          l.matchReason = `AI: ${reason || 'not a match'}`;
          changed += 1;
        } else if (r.verdict === 'match') {
          if (l.verification === 'likely') changed += 1;
          l.verification = 'verified';
          l.aiVerified = true;
          if (reason) l.matchReason = `${l.matchReason}; AI: ${reason}`;
        }
      }
    } catch (err) {
      log('warn', `AI verification failed: ${err.message}`);
      return changed;
    }
  }
  return changed;
}
