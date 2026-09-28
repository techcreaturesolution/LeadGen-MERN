import { extractEmails } from '../emails.js';
import { webSearch } from './webSearch.js';

function cleanLinkedInTitle(title) {
  return title
    .replace(/\s*[|\-–]\s*LinkedIn.*$/i, '')
    .replace(/\s*:\s*(Overview|About|Jobs|People|Posts)\s*$/i, '')
    .trim();
}

function cleanInstagramTitle(title) {
  const m = title.match(/^(.*?)\s*\(@([\w.]+)\)/);
  if (m) return { name: m[1].trim() || m[2], handle: m[2] };
  return { name: title.replace(/\s*[•|·-]\s*Instagram.*$/i, '').trim(), handle: null };
}

function snippetWebsite(snippet) {
  const m = snippet.match(/\b((?:https?:\/\/)?(?:www\.)?[a-z0-9-]+(?:\.[a-z0-9-]+)*\.(?:com|in|io|co|net|org|tech|ai|biz|info)(?:\.[a-z]{2})?)\b/i);
  if (!m) return null;
  const v = m[1].toLowerCase();
  if (/linkedin|instagram|facebook|google/.test(v)) return null;
  return v;
}

async function runQueries(queries, perQuery, log, label) {
  const results = [];
  for (const q of queries) {
    try {
      const rows = await webSearch(q, perQuery);
      log('info', `${label}: "${q}" → ${rows.length} results`);
      results.push(...rows);
    } catch (err) {
      log('warn', `${label}: search failed for "${q}": ${err.message}`);
    }
  }
  return results;
}

export async function searchLinkedIn(plan, limit, log) {
  const { businessType = '', location = '' } = plan;
  const queries = [
    `site:linkedin.com/company "${businessType}" "${location}"`,
    ...(plan.emailPrefixes?.length
      ? [`site:linkedin.com "${plan.emailPrefixes[0]}@" "${businessType}" "${location}"`]
      : []),
  ];
  const rows = await runQueries(queries, limit, log, 'LinkedIn');
  const out = [];
  for (const r of rows) {
    if (!/linkedin\.com\/(company|in|posts|school)\//i.test(r.link)) continue;
    const isCompany = /linkedin\.com\/company\//i.test(r.link);
    const emails = extractEmails(`${r.title} ${r.snippet}`);
    if (!isCompany && !emails.length) continue;
    out.push({
      name: isCompany ? cleanLinkedInTitle(r.title) : cleanLinkedInTitle(r.title).split(/\s+[-–|]\s+/).pop(),
      category: businessType,
      city: location,
      linkedinUrl: isCompany ? r.link.split('?')[0] : undefined,
      website: snippetWebsite(r.snippet),
      snippetEmails: emails,
      description: r.snippet,
      source: 'linkedin',
    });
  }
  return out;
}

export async function searchInstagram(plan, limit, log) {
  const { businessType = '', location = '' } = plan;
  const queries = [`site:instagram.com "${businessType}" "${location}"`];
  if (plan.emailPrefixes?.length) queries.push(`site:instagram.com "${businessType}" "${location}" "@gmail.com" OR "${plan.emailPrefixes[0]}@"`);
  const rows = await runQueries(queries, limit, log, 'Instagram');
  const out = [];
  for (const r of rows) {
    if (!/instagram\.com\/[\w.]+\/?$/i.test(r.link.split('?')[0]) && !/instagram\.com\/[\w.]+\/?(\?|$)/i.test(r.link)) continue;
    if (/instagram\.com\/(p|reel|explore|stories)\//i.test(r.link)) continue;
    const { name, handle } = cleanInstagramTitle(r.title);
    out.push({
      name,
      category: businessType,
      city: location,
      instagramUrl: handle ? `https://www.instagram.com/${handle}/` : r.link.split('?')[0],
      website: snippetWebsite(r.snippet),
      snippetEmails: extractEmails(`${r.title} ${r.snippet}`),
      description: r.snippet,
      source: 'instagram',
    });
  }
  return out;
}

export async function findOfficialWebsite(name, location) {
  const rows = await webSearch(`"${name}" ${location || ''} official website`, 5);
  return rows;
}
