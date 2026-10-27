import pLimit from 'p-limit';
import { domainOf } from '../../utils/http.js';
import { crawlWebsite } from '../crawler.js';
import { unknownFields } from '../mail/template.js';
import { HttpError } from '../../utils/httpError.js';
import { ruleBasedPlan } from './leadAgent.js';
import { llmEnabled, llmJson } from './llm.js';

export const SAFE_MERGE_FIELDS = ['business', 'city', 'website', 'email', 'phone', 'category', 'my_name', 'my_email'];

/**
 * Checks if a URL is a safe public web address to prevent SSRF and internal network scanning.
 */
export function isSafePublicUrl(urlString) {
  if (!urlString || typeof urlString !== 'string') return false;
  const raw = urlString.trim();
  if (!raw) return false;
  // If a protocol is present, it must be http: or https:
  if (/^[a-z0-9+.-]+:/i.test(raw) && !/^https?:/i.test(raw)) return false;

  try {
    const target = /^https?:/i.test(raw) ? raw : `https://${raw}`;
    const parsed = new URL(target);
    if (!['http:', 'https:'].includes(parsed.protocol)) return false;
    const hostname = (parsed.hostname || '').toLowerCase();
    if (!hostname || hostname === 'localhost') return false;
    if (hostname.endsWith('.local') || hostname.endsWith('.internal') || hostname.endsWith('.lan') || hostname.endsWith('.corp')) {
      return false;
    }

    // Check for IPv6 loopback
    if (hostname === '[::1]' || hostname === '::1' || hostname === '0:0:0:0:0:0:0:1') return false;

    // Check IPv4 private and reserved ranges
    const ipv4Match = hostname.match(/^(\d{1,3})\.(\d{1,3})\.(\d{1,3})\.(\d{1,3})$/);
    if (ipv4Match) {
      const parts = ipv4Match.slice(1).map(Number);
      if (parts.some((n) => n < 0 || n > 255)) return false;
      const [a, b] = parts;
      if (a === 0 || a === 127 || a === 10) return false; // Current network, Loopback, Private class A
      if (a === 169 && b === 254) return false; // Link-local
      if (a === 172 && b >= 16 && b <= 31) return false; // Private class B
      if (a === 192 && b === 168) return false; // Private class C
      if (a >= 224) return false; // Multicast / Reserved
    }
    return true;
  } catch {
    return false;
  }
}

/**
 * Stage 1 & 2: Extract search intent, keywords, location, and audience context.
 */
export function extractSearchContext(job) {
  const query = String(job?.query || '').trim();
  const plan = job?.plan || {};
  const base = ruleBasedPlan(query);

  const businessType = plan.businessType || base.businessType || 'businesses';
  const location = plan.location || base.location || '';
  const locations = Array.isArray(plan.locations) && plan.locations.length ? plan.locations : base.locations || [];
  const targetRole = plan.targetRole || base.targetRole || 'generic';
  const rawKeywords = Array.isArray(plan.keywords) && plan.keywords.length ? plan.keywords : base.keywords || [];
  const keywords = [...new Set(rawKeywords.map((k) => String(k).trim()).filter(Boolean))].slice(0, 6);

  return {
    query,
    businessType,
    location,
    locations,
    targetRole,
    keywords: keywords.length ? keywords : [businessType],
  };
}

/**
 * Stage 3, 4 & 5: Analyze actual lead records, aggregate company context, and research accessible websites.
 */
export async function analyzeCompanies(leads = [], { crawl = true, maxCrawl = 3 } = {}) {
  const validLeads = (leads || []).filter((l) => l && l.name && String(l.name).trim());
  const categories = new Map();
  const cities = new Set();
  const servicesSet = new Set();
  const sampleCompanies = [];
  const domainSeen = new Set();
  const crawlCandidates = [];

  for (const l of validLeads) {
    if (sampleCompanies.length < 8 && !sampleCompanies.includes(l.name.trim())) {
      sampleCompanies.push(l.name.trim());
    }
    if (l.category) {
      const cat = String(l.category).trim();
      categories.set(cat, (categories.get(cat) || 0) + 1);
    }
    if (l.city) cities.add(String(l.city).trim());
    if (Array.isArray(l.services)) {
      l.services.forEach((s) => s && servicesSet.add(String(s).trim()));
    }

    if (l.website && isSafePublicUrl(l.website)) {
      const d = domainOf(l.website);
      if (d && !domainSeen.has(d)) {
        domainSeen.add(d);
        if (crawl && !l.siteTitle && crawlCandidates.length < maxCrawl) {
          crawlCandidates.push({ lead: l, url: l.website });
        }
      }
    }
  }

  // Safe bounded crawling of homepage meta info for leads missing site titles
  if (crawlCandidates.length > 0) {
    const limit = pLimit(2);
    await Promise.all(
      crawlCandidates.map(({ lead, url }) =>
        limit(async () => {
          try {
            const res = await crawlWebsite(url, { maxPages: 1 });
            if (res?.siteTitle && !lead.siteTitle) lead.siteTitle = res.siteTitle;
            if (res?.siteDescription && !lead.siteDescription) lead.siteDescription = res.siteDescription;
          } catch {
            // Ignore crawl errors gracefully so workflow never fails
          }
        }),
      ),
    );
  }

  // Top categories sorted by frequency
  const sortedCategories = [...categories.entries()]
    .sort((a, b) => b[1] - a[1])
    .map(([cat]) => cat)
    .slice(0, 5);

  const commonServices = [...servicesSet].slice(0, 8);
  const titles = validLeads
    .map((l) => l.siteTitle)
    .filter(Boolean)
    .slice(0, 5);

  return {
    totalLeads: validLeads.length,
    withWebsite: domainSeen.size,
    sampleCompanies,
    categories: sortedCategories,
    commonServices,
    locations: [...cities].slice(0, 5),
    siteTitles: titles,
  };
}

/**
 * Builds the AI prompt for generating ONE reusable common template.
 */
export function buildPrompt({ searchContext, companyAnalysis, userOffer = {} }) {
  const hasSpecificOffer = Boolean(userOffer.service && userOffer.service.trim());
  const offerInstruction = hasSpecificOffer
    ? `The user offers: ${userOffer.service} (${userOffer.offerDescription || ''}). Main benefit: ${userOffer.mainBenefit || ''}. Incorporate this offer naturally.`
    : `No specific service or product was specified by the user. Write a general, professional, consultative B2B introductory / collaboration outreach email tailored specifically to ${searchContext.businessType || 'businesses'} in ${searchContext.location || 'their area'}. The email must be an exploratory introductory outreach proposing a conversation or collaboration based on their industry needs, without fabricating fake products, fictional case studies, or specific pricing.`;

  const systemPrompt =
    'You are an expert B2B copywriter and sales outreach specialist.\n' +
    'Your task is to generate ONE reusable, professional cold email template based on an existing lead search and aggregated company research.\n\n' +
    'CRITICAL REQUIREMENTS:\n' +
    '1. ONE Common Template: Write ONE template that can be sent to ALL selected leads in this search. Do NOT generate a separate template per company.\n' +
    '2. Dynamic Company Personalization: You MUST use {{business}} (or fallback {{business|there}}) for the recipient company name. In the campaign, this variable is automatically replaced with the recipient’s actual business name.\n' +
    '3. Supported Merge Fields ONLY:\n' +
    '   - {{business}} : Recipient business / company name (fallback: {{business|there}})\n' +
    '   - {{city}} : Recipient city (fallback: {{city|your city}})\n' +
    '   - {{website}} : Recipient website (fallback: {{website|your site}})\n' +
    '   - {{email}} : Recipient email\n' +
    '   - {{phone}} : Recipient phone\n' +
    '   - {{category}} : Business category (fallback: {{category|industry}})\n' +
    '   - {{my_name}} : Sender name\n' +
    '   - {{my_email}} : Sender email\n' +
    '   DO NOT use {{company_name}}, {{first_name}}, {{last_name}}, or any other unsupported merge fields.\n' +
    '4. Truthful & Non-Fabricated: ' + offerInstruction + ' Never invent fake statistics, fake case studies, fictional awards, or claims that apply only to a single company.\n' +
    '5. Brevity & Structure: Keep the email body concise (under 140 words). Include a clear, compelling subject line. End with {{my_name}} and {{my_email}}.\n' +
    '6. Return JSON only with this structure:\n' +
    '   {\n' +
    '     "name": "Short descriptive template name",\n' +
    '     "subject": "Compelling subject line",\n' +
    '     "body": "Plain text email body with appropriate merge fields",\n' +
    '     "researchSummary": "A concise summary of shared audience characteristics and business context",\n' +
    '     "keywords": ["keyword1", "keyword2", "keyword3"]\n' +
    '   }';

  const userPrompt = JSON.stringify({
    search: {
      query: searchContext.query,
      businessType: searchContext.businessType,
      location: searchContext.location,
      targetRole: searchContext.targetRole,
      keywords: searchContext.keywords,
    },
    audienceResearch: {
      totalLeadsAnalyzed: companyAnalysis.totalLeads,
      companiesWithWebsite: companyAnalysis.withWebsite,
      sampleAudienceCompanies: companyAnalysis.sampleCompanies,
      primaryCategories: companyAnalysis.categories,
      commonServices: companyAnalysis.commonServices,
      locations: companyAnalysis.locations,
      sampleWebsiteTitles: companyAnalysis.siteTitles,
    },
    userContext: {
      businessName: userOffer.businessName || '',
      service: userOffer.service || '',
      offerDescription: userOffer.offerDescription || '',
      mainBenefit: userOffer.mainBenefit || '',
      tone: userOffer.tone || 'professional',
      language: userOffer.language || 'English',
    },
  });

  return { systemPrompt, userPrompt };
}

/**
 * Validates and normalizes AI-generated template draft.
 */
export function validateTemplateDraft(draft, { fallbackName = 'Outreach Template', fallbackKeywords = [] } = {}) {
  if (!draft || typeof draft !== 'object') {
    throw new HttpError(502, 'AI did not return a valid JSON object');
  }

  let name = String(draft.name || fallbackName).trim().slice(0, 120);
  let subject = String(draft.subject || '').trim().slice(0, 250);
  let body = String(draft.body || '').trim();

  if (!subject) throw new HttpError(502, 'AI generated a template without a subject line');
  if (!body) throw new HttpError(502, 'AI generated a template with an empty body');

  // Fix common mistake: Replace {{company_name}} with {{business}}
  subject = subject.replace(/\{\{\s*company_name(\s*\|[^}]*)?\}\}/gi, (_m, fallback) => `{{business${fallback || ''}}}`);
  body = body.replace(/\{\{\s*company_name(\s*\|[^}]*)?\}\}/gi, (_m, fallback) => `{{business${fallback || ''}}}`);

  // Guarantee company-name personalization if missing from both subject and body
  if (!body.includes('{{business') && !subject.includes('{{business')) {
    body = `Hi {{business|there}} team,\n\n${body}`;
  }

  // Ensure sign-off ends with {{my_name}} and {{my_email}} if missing
  if (!body.includes('{{my_name}}')) {
    body = `${body}\n\nBest regards,\n{{my_name}}\n{{my_email}}`;
  }

  // Validate supported merge fields
  const invalid = unknownFields(subject, body);
  if (invalid.length > 0) {
    // Sanitize any remaining unknown fields by stripping or replacing with empty string
    for (const field of invalid) {
      const rx = new RegExp(`\\{\\{\\s*${field}(\\s*\\|([^}]*))?\\}\\}`, 'gi');
      subject = subject.replace(rx, (_m, _fb, fbVal) => (fbVal || '').trim());
      body = body.replace(rx, (_m, _fb, fbVal) => (fbVal || '').trim());
    }
  }

  const researchSummary = String(
    draft.researchSummary ||
      `Analysis of companies from "${fallbackName}" showing shared business needs for ${name}.`,
  ).trim();

  const keywords = Array.isArray(draft.keywords) && draft.keywords.length
    ? draft.keywords.map((k) => String(k).trim()).filter(Boolean).slice(0, 6)
    : fallbackKeywords;

  return {
    name,
    subject,
    body,
    researchSummary,
    keywords,
  };
}

/**
 * Main AI Agent workflow: Retrieves search, analyzes company data, and produces ONE common template.
 */
export async function generateSearchTemplate({ job, leads = [], userOffer = {}, user, crawlWebsites = true }) {
  if (!llmEnabled()) {
    throw new HttpError(503, 'OpenAI is not configured on the server (OPENAI_API_KEY is required for AI template generation)');
  }

  const searchContext = extractSearchContext(job);
  const companyAnalysis = await analyzeCompanies(leads, { crawl: crawlWebsites, maxCrawl: 3 });

  const resolvedOffer = {
    businessName: userOffer?.businessName || user?.name || '',
    service: userOffer?.service || '',
    offerDescription: userOffer?.offerDescription || '',
    mainBenefit: userOffer?.mainBenefit || '',
    tone: userOffer?.tone || 'professional',
    language: userOffer?.language || 'English',
  };

  const { systemPrompt, userPrompt } = buildPrompt({ searchContext, companyAnalysis, userOffer: resolvedOffer });

  const aiOutput = await llmJson(systemPrompt, userPrompt, { maxTokens: 1200 });
  if (!aiOutput) {
    throw new HttpError(502, 'AI failed to generate template. Please check OpenAI configuration and try again.');
  }

  const businessTypeTitle = searchContext.businessType
    ? searchContext.businessType.charAt(0).toUpperCase() + searchContext.businessType.slice(1)
    : 'Business';
  const fallbackName = resolvedOffer.service
    ? `${resolvedOffer.service} outreach for ${searchContext.businessType || 'leads'}`
    : `${businessTypeTitle} Outreach Template`;

  const draft = validateTemplateDraft(aiOutput, { fallbackName, fallbackKeywords: searchContext.keywords });

  return {
    success: true,
    draft,
    meta: {
      searchId: job._id,
      leadsAnalyzed: companyAnalysis.totalLeads,
      audienceCategories: companyAnalysis.categories,
    },
  };
}
