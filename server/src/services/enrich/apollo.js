import { env } from '../../config/env.js';
import { http } from '../../utils/http.js';

const API = 'https://api.apollo.io/api/v1';

const ROLE_TITLES = {
  hr: ['hr manager', 'human resources', 'hr head', 'talent acquisition', 'recruiter'],
  sales: ['sales manager', 'business development', 'sales head', 'marketing manager'],
  support: ['customer support', 'customer success', 'support manager'],
};
const DECISION_MAKERS = ['owner', 'founder', 'c_suite', 'partner', 'director'];

export const apolloEnabled = () => Boolean(env.enrichment.apolloApiKey);

const headers = () => ({ 'x-api-key': env.enrichment.apolloApiKey, 'Cache-Control': 'no-cache', 'Content-Type': 'application/json' });

export async function apolloOrganization({ domain, name }) {
  const { data } = await http.get(`${API}/organizations/enrich`, {
    params: domain ? { domain } : { name },
    headers: headers(),
    timeout: 20000,
  });
  return data?.organization || null;
}

export function peopleSearchParams(domain, role, perPage) {
  const params = new URLSearchParams();
  params.append('q_organization_domains_list[]', domain);
  const titles = ROLE_TITLES[role];
  if (titles) {
    titles.forEach((t) => params.append('person_titles[]', t));
    params.append('include_similar_titles', 'true');
  } else {
    DECISION_MAKERS.forEach((s) => params.append('person_seniorities[]', s));
  }
  params.append('page', '1');
  params.append('per_page', String(perPage));
  return params;
}

export async function apolloPeople(domain, role, perPage) {
  const { data } = await http.post(`${API}/mixed_people/api_search?${peopleSearchParams(domain, role, perPage)}`, {}, { headers: headers(), timeout: 20000 });
  return (data?.people || [])
    .filter((p) => p.first_name && p.title)
    .slice(0, perPage)
    .map((p) => ({
      name: [p.first_name, p.last_name_obfuscated ? `${p.last_name_obfuscated[0]}.` : ''].filter(Boolean).join(' '),
      title: p.title,
      source: 'apollo',
    }));
}

export function fromApolloOrg(org) {
  if (!org) return null;
  const phone = org.primary_phone?.sanitized_number || org.sanitized_phone || org.phone || undefined;
  return {
    name: org.name,
    website: org.website_url || undefined,
    domain: org.primary_domain || undefined,
    companyType: org.industry || org.industries?.[0] || undefined,
    description: org.short_description ? org.short_description.replace(/\s+/g, ' ').trim().slice(0, 500) : undefined,
    services: (org.keywords || []).slice(0, 8),
    employeeCount: org.estimated_num_employees || undefined,
    foundedYear: org.founded_year || undefined,
    linkedinUrl: org.linkedin_url || undefined,
    facebookUrl: org.facebook_url || undefined,
    phone,
    address: org.raw_address || undefined,
    city: org.city || undefined,
  };
}
