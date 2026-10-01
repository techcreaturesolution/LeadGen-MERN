import { env } from '../../config/env.js';
import { http } from '../../utils/http.js';

const DEPARTMENT_CATEGORY = { hr: 'hr', sales: 'sales', marketing: 'sales', support: 'support' };

export const hunterEnabled = () => Boolean(env.enrichment.hunterApiKey);

export async function hunterDomainSearch(domain, limit) {
  const { data } = await http.get('https://api.hunter.io/v2/domain-search', {
    params: { domain, limit },
    headers: { 'X-API-KEY': env.enrichment.hunterApiKey },
    timeout: 20000,
  });
  return data?.data || null;
}

export function fromHunter(data) {
  const rows = (data?.emails || []).filter((e) => e.value && e.verification?.status !== 'invalid');
  return {
    emails: rows.map((e) => ({
      email: String(e.value).toLowerCase().trim(),
      foundOn: 'hunter.io',
      ...(DEPARTMENT_CATEGORY[e.department] ? { category: DEPARTMENT_CATEGORY[e.department] } : {}),
    })),
    contacts: rows
      .filter((e) => e.first_name || e.position)
      .map((e) => ({
        name: [e.first_name, e.last_name].filter(Boolean).join(' ') || undefined,
        title: e.position || undefined,
        department: e.department || undefined,
        seniority: e.seniority || undefined,
        email: String(e.value).toLowerCase().trim(),
        linkedinUrl: e.linkedin || undefined,
        source: 'hunter',
      })),
  };
}
