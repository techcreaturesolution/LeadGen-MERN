import { ROLE_PREFIXES, categorizeEmail, isFreeMail } from '../emails.js';
import { domainOf } from '../../utils/http.js';
import { llmEnabled, llmJson } from './llm.js';

const ROLE_ALIASES = [
  { role: 'hr', re: /\b(hr|human resources?|recruit(er|ment|ing)?|talent|hiring|careers?|jobs?|placement)\b/i },
  { role: 'sales', re: /\b(sales|business development|bd|marketing|purchase|procurement|enquir(y|ies))\b/i },
  { role: 'support', re: /\b(support|customer care|helpdesk)\b/i },
  { role: 'founder', re: /\b(ceo|founder|owner|director|md|managing director|proprietor)\b/i },
];

const STOP = /\b(email|emails|e-mail|mail|mails|id|ids|contact|contacts|details?|list|of|the|all|find|get|give|me|want|need|leads?|for|from|address(es)?|please|kindly|and|with|top|best|company's)\b/gi;

export function rolePrefixes(role) {
  if (role === 'founder') return ['ceo', 'founder', 'director', 'md', 'owner'];
  return ROLE_PREFIXES[role] || ROLE_PREFIXES.generic;
}

export function ruleBasedPlan(query) {
  const q = query.replace(/\s+/g, ' ').trim();
  const roleHit = ROLE_ALIASES.find((r) => r.re.test(q));
  const targetRole = roleHit?.role || 'generic';

  let location = '';
  const locMatch = q.match(/\b(?:in|at|near|around|from)\s+([A-Za-z][A-Za-z .,-]{1,60})$/i);
  let rest = q;
  if (locMatch) {
    location = locMatch[1].replace(/[.,\s]+$/, '').trim();
    rest = q.slice(0, locMatch.index);
  }

  let businessType = rest;
  const ofMatch = rest.match(/\b(?:of|for)\s+(.+)$/i);
  if (ofMatch) businessType = ofMatch[1];
  if (roleHit) businessType = businessType.replace(roleHit.re, ' ');
  businessType = businessType.replace(STOP, ' ').replace(/\s+/g, ' ').trim();
  if (!businessType) businessType = 'companies';

  const titleCase = (s) => s.replace(/\b\w/g, (c) => c.toUpperCase());
  location = titleCase(location);
  const keywords = businessType
    .split(' ')
    .filter((w) => w.length > 1 && !/^(companies|company|firms?|businesses|agenc(y|ies))$/i.test(w));

  return {
    businessType,
    location,
    targetRole,
    keywords: keywords.length ? keywords : [businessType],
    emailPrefixes: rolePrefixes(targetRole).slice(0, 8),
    searchQueries: [`${businessType} in ${location}`.trim()],
    planner: 'rules',
  };
}

export async function planSearch(query) {
  const base = ruleBasedPlan(query);
  if (!llmEnabled()) return base;
  try {
    const out = await llmJson(
      'You are a B2B lead-generation planning agent. Convert the user request into a JSON search plan. ' +
        'Return keys: businessType (short noun phrase used on Google Maps, e.g. "IT companies"), location (city/region, empty if none), ' +
        'targetRole (one of: hr, sales, support, founder, generic), keywords (array of 1-4 short keywords), ' +
        'emailPrefixes (array of likely mailbox prefixes for the target role, e.g. hr, careers, jobs), ' +
        'searchQueries (array of 1-3 Google Maps style queries).',
      query,
    );
    if (!out?.businessType) return base;
    return {
      businessType: String(out.businessType).slice(0, 80),
      location: String(out.location || base.location).slice(0, 80),
      targetRole: ['hr', 'sales', 'support', 'founder', 'generic'].includes(out.targetRole) ? out.targetRole : base.targetRole,
      keywords: (Array.isArray(out.keywords) ? out.keywords : base.keywords).map(String).slice(0, 4),
      emailPrefixes: (Array.isArray(out.emailPrefixes) ? out.emailPrefixes : base.emailPrefixes).map((s) => String(s).toLowerCase()).slice(0, 10),
      searchQueries: (Array.isArray(out.searchQueries) ? out.searchQueries : base.searchQueries).map(String).slice(0, 3),
      planner: 'openai',
    };
  } catch (err) {
    return { ...base, planner: `rules (openai error: ${err.message})` };
  }
}

function emailConfidence(email, category, targetRole, siteDomain, prefixes) {
  const local = email.split('@')[0];
  const domain = email.split('@')[1];
  let c = 0.4;
  if (siteDomain && (domain === siteDomain || siteDomain.endsWith(`.${domain}`) || domain.endsWith(`.${siteDomain}`))) c += 0.3;
  if (category === targetRole || (targetRole === 'founder' && category === 'other')) c += 0.2;
  if (prefixes.some((p) => local === p || local.startsWith(p))) c += 0.1;
  if (isFreeMail(email)) c -= 0.1;
  return Math.max(0, Math.min(1, Number(c.toFixed(2))));
}

export function rankEmails(emails, plan, website) {
  const siteDomain = domainOf(website);
  const prefixes = plan.emailPrefixes?.length ? plan.emailPrefixes : rolePrefixes(plan.targetRole);
  const scored = emails.map(({ email, foundOn }) => {
    const category = categorizeEmail(email);
    return { email, foundOn, category, confidence: emailConfidence(email, category, plan.targetRole, siteDomain, prefixes) };
  });
  const order = { hr: 1, generic: 2, sales: 3, support: 4, other: 5, personal: 6 };
  order[plan.targetRole] = 0;
  scored.sort((a, b) => (order[a.category] ?? 7) - (order[b.category] ?? 7) || b.confidence - a.confidence);
  return scored;
}

export function scoreLead(lead, plan) {
  let s = 0;
  if (lead.primaryEmail) s += 30;
  if (lead.primaryEmailCategory === plan.targetRole) s += 30;
  if (lead.website) s += 10;
  if (lead.phone) s += 10;
  if (lead.linkedinUrl) s += 5;
  if (lead.instagramUrl) s += 5;
  if (lead.rating) s += Math.min(10, Math.round(lead.rating * 2));
  return Math.min(100, s);
}

export async function summarizeJob(query, plan, leads) {
  const withEmail = leads.filter((l) => l.primaryEmail).length;
  const withRole = leads.filter((l) => l.primaryEmailCategory === plan.targetRole).length;
  const fallback = `Found ${leads.length} ${plan.businessType} leads${plan.location ? ` in ${plan.location}` : ''}; ${withEmail} have an email and ${withRole} have a ${plan.targetRole.toUpperCase()} mailbox.`;
  if (!llmEnabled() || !leads.length) return { summary: fallback, notes: {} };
  try {
    const compact = leads.slice(0, 60).map((l, i) => ({
      i,
      name: l.name,
      email: l.primaryEmail,
      emailType: l.primaryEmailCategory,
      website: l.website,
      rating: l.rating,
      sources: l.sources,
    }));
    const out = await llmJson(
      'You are a lead-qualification agent. Given a search request and leads, return JSON {"summary": string (2-3 sentences), ' +
        '"notes": {"<i>": "one short outreach tip or qualification note (max 18 words)"}}.',
      JSON.stringify({ request: query, targetRole: plan.targetRole, leads: compact }),
      { maxTokens: 2500 },
    );
    return { summary: out?.summary || fallback, notes: out?.notes || {} };
  } catch {
    return { summary: fallback, notes: {} };
  }
}
