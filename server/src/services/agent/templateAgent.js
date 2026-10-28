import pLimit from 'p-limit';
import { domainOf } from '../../utils/http.js';
import { crawlWebsite } from '../crawler.js';
import { htmlToPlainText, isEmailHtml, unknownFields } from '../mail/template.js';
import { HttpError } from '../../utils/httpError.js';
import { ruleBasedPlan } from './leadAgent.js';
import { llmEnabled, llmJson } from './llm.js';
import { INDUSTRY_VISUAL_ASSETS, sanitizeSvg } from './visualAssets.js';

export { INDUSTRY_VISUAL_ASSETS, sanitizeSvg };

export const SAFE_MERGE_FIELDS = ['business', 'city', 'website', 'email', 'phone', 'category', 'my_name', 'my_email'];

/**
 * Curated Industry Themes for single-page, email-compatible responsive templates.
 * Designed to fit ~350-520px height on typical 600px desktop email views.
 */
export const INDUSTRY_THEMES = {
  bakery_food: {
    key: 'bakery_food',
    name: 'Bakery and Food Retail',
    audience: 'bakery owners and cake shops',
    tagline: 'Bakery & Food Retail',
    designStyle: 'warm_bakery_retail',
    colors: {
      background: '#FFF9F0',
      primary: '#7A3E2E',
      accent: '#DFA5A0',
      text: '#332722',
      headerBg: '#7A3E2E',
      headerText: '#FFFFFF',
      border: '#FED7AA',
      badgeBg: '#FEF3C7',
      badgeText: '#7A3E2E',
      highlightBg: '#FFFBEB',
      ctaBg: '#7A3E2E',
    },
    headerBg: '#7A3E2E',
    headerText: '#FFFFFF',
    accent: '#DFA5A0',
    border: '#FED7AA',
    badgeBg: '#FEF3C7',
    badgeText: '#7A3E2E',
    highlightBg: '#FFFBEB',
    ctaBg: '#7A3E2E',
    relevantContext: 'cakes, baked products, customer orders, local retail, or bakery operations',
  },
  pharma: {
    key: 'pharma',
    name: 'Pharmaceuticals & Healthcare',
    audience: 'pharmaceutical businesses and healthcare organizations',
    tagline: 'Healthcare & Life Sciences',
    designStyle: 'clean_clinical_trust',
    colors: {
      background: '#F0F9FF',
      primary: '#0369A1',
      accent: '#0284C7',
      text: '#0F172A',
      headerBg: '#0369A1',
      headerText: '#FFFFFF',
      border: '#BAE6FD',
      badgeBg: '#E0F2FE',
      badgeText: '#0369A1',
      highlightBg: '#F0F9FF',
      ctaBg: '#0284C7',
    },
    headerBg: '#0369A1',
    headerText: '#FFFFFF',
    accent: '#0284C7',
    border: '#BAE6FD',
    badgeBg: '#E0F2FE',
    badgeText: '#0369A1',
    highlightBg: '#F0F9FF',
    ctaBg: '#0284C7',
    relevantContext: 'clinical quality, compliance, medicine, research and healthcare operations',
  },
  real_estate: {
    key: 'real_estate',
    name: 'Real Estate & Property',
    audience: 'property builders and developers',
    tagline: 'Real Estate & Infrastructure',
    designStyle: 'premium_property',
    colors: {
      background: '#FAFAF9',
      primary: '#0F172A',
      accent: '#D97706',
      text: '#1C1917',
      headerBg: '#0F172A',
      headerText: '#F8FAFC',
      border: '#E2E8F0',
      badgeBg: '#FEF3C7',
      badgeText: '#92400E',
      highlightBg: '#F8FAFC',
      ctaBg: '#0F172A',
    },
    headerBg: '#0F172A',
    headerText: '#F8FAFC',
    accent: '#D97706',
    border: '#E2E8F0',
    badgeBg: '#FEF3C7',
    badgeText: '#92400E',
    highlightBg: '#F8FAFC',
    ctaBg: '#0F172A',
    relevantContext: 'residential and commercial developments, property buyers, project inquiries',
  },
  technology: {
    key: 'technology',
    name: 'Technology & Software',
    audience: 'technology companies and software agencies',
    tagline: 'Cloud & IT Solutions',
    designStyle: 'modern_tech_minimal',
    colors: {
      background: '#F5F3FF',
      primary: '#1E1B4B',
      accent: '#6366F1',
      text: '#0F172A',
      headerBg: '#1E1B4B',
      headerText: '#F5F3FF',
      border: '#E0E7FF',
      badgeBg: '#EDE9FE',
      badgeText: '#4338CA',
      highlightBg: '#F5F3FF',
      ctaBg: '#4F46E5',
    },
    headerBg: '#1E1B4B',
    headerText: '#F5F3FF',
    accent: '#6366F1',
    border: '#E0E7FF',
    badgeBg: '#EDE9FE',
    badgeText: '#4338CA',
    highlightBg: '#F5F3FF',
    ctaBg: '#4F46E5',
    relevantContext: 'digital platforms, cloud systems, software engineering, tech innovation',
  },
  manufacturing: {
    key: 'manufacturing',
    name: 'Manufacturing & Industrial',
    audience: 'manufacturing plants and industrial operations',
    tagline: 'Industrial & Manufacturing',
    designStyle: 'light_industrial_modern',
    colors: {
      background: '#F4F7FA',
      cardBg: '#FFFFFF',
      primary: '#1E3A5F',
      accent: '#E99A35',
      text: '#243447',
      supportingText: '#5B6878',
      headerBg: '#FFFFFF',
      headerText: '#1E3A5F',
      border: '#DCE4EC',
      badgeBg: '#F4F7FA',
      badgeText: '#1E3A5F',
      highlightBg: '#F4F7FA',
      ctaBg: '#1E3A5F',
    },
    headerBg: '#FFFFFF',
    headerText: '#1E3A5F',
    accent: '#E99A35',
    border: '#DCE4EC',
    badgeBg: '#F4F7FA',
    badgeText: '#1E3A5F',
    highlightBg: '#F4F7FA',
    ctaBg: '#1E3A5F',
    relevantContext: 'production throughput, facility modernization, automated assembly, and plant operations',
  },
  manufacturing_chemical: {
    key: 'manufacturing_chemical',
    name: 'Chemical Manufacturing & Processing',
    audience: 'chemical processing plants and industrial manufacturers',
    tagline: 'Chemical Processing & Operations',
    designStyle: 'light_chemical_industrial',
    colors: {
      background: '#F4F7FA',
      cardBg: '#FFFFFF',
      primary: '#1E3A5F',
      accent: '#E99A35',
      text: '#243447',
      supportingText: '#5B6878',
      headerBg: '#FFFFFF',
      headerText: '#1E3A5F',
      border: '#DCE4EC',
      badgeBg: '#F4F7FA',
      badgeText: '#1E3A5F',
      highlightBg: '#F4F7FA',
      ctaBg: '#1E3A5F',
    },
    headerBg: '#FFFFFF',
    headerText: '#1E3A5F',
    accent: '#E99A35',
    border: '#DCE4EC',
    badgeBg: '#F4F7FA',
    badgeText: '#1E3A5F',
    highlightBg: '#F4F7FA',
    ctaBg: '#1E3A5F',
    relevantContext: 'chemical processing, storage systems, pipeline distribution, quality verification, and plant operations',
  },
  manufacturing_automotive: {
    key: 'manufacturing_automotive',
    name: 'Automotive & Components Manufacturing',
    audience: 'automotive component manufacturers and assembly facilities',
    tagline: 'Automotive & Component Manufacturing',
    designStyle: 'light_automotive_industrial',
    colors: {
      background: '#F4F7FA',
      cardBg: '#FFFFFF',
      primary: '#1E3A5F',
      accent: '#E99A35',
      text: '#243447',
      supportingText: '#5B6878',
      headerBg: '#FFFFFF',
      headerText: '#1E3A5F',
      border: '#DCE4EC',
      badgeBg: '#F4F7FA',
      badgeText: '#1E3A5F',
      highlightBg: '#F4F7FA',
      ctaBg: '#1E3A5F',
    },
    headerBg: '#FFFFFF',
    headerText: '#1E3A5F',
    accent: '#E99A35',
    border: '#DCE4EC',
    badgeBg: '#F4F7FA',
    badgeText: '#1E3A5F',
    highlightBg: '#F4F7FA',
    ctaBg: '#1E3A5F',
    relevantContext: 'component fabrication, assembly automation, quality standards, and supply chain logistics',
  },
  manufacturing_electronics: {
    key: 'manufacturing_electronics',
    name: 'Electronics & Hardware Manufacturing',
    audience: 'electronics manufacturers and hardware assembly plants',
    tagline: 'Electronics & Precision Assembly',
    designStyle: 'light_electronics_industrial',
    colors: {
      background: '#F4F7FA',
      cardBg: '#FFFFFF',
      primary: '#1E3A5F',
      accent: '#E99A35',
      text: '#243447',
      supportingText: '#5B6878',
      headerBg: '#FFFFFF',
      headerText: '#1E3A5F',
      border: '#DCE4EC',
      badgeBg: '#F4F7FA',
      badgeText: '#1E3A5F',
      highlightBg: '#F4F7FA',
      ctaBg: '#1E3A5F',
    },
    headerBg: '#FFFFFF',
    headerText: '#1E3A5F',
    accent: '#E99A35',
    border: '#DCE4EC',
    badgeBg: '#F4F7FA',
    badgeText: '#1E3A5F',
    highlightBg: '#F4F7FA',
    ctaBg: '#1E3A5F',
    relevantContext: 'PCB assembly, electronic components, precision surface-mount technology, and hardware verification',
  },
  manufacturing_metal: {
    key: 'manufacturing_metal',
    name: 'Metal Fabrication & Precision Machining',
    audience: 'metal fabrication shops, CNC machinists, and precision engineering plants',
    tagline: 'Precision Engineering & Metal Fabrication',
    designStyle: 'light_precision_machining',
    colors: {
      background: '#F4F7FA',
      cardBg: '#FFFFFF',
      primary: '#1E3A5F',
      accent: '#E99A35',
      text: '#243447',
      supportingText: '#5B6878',
      headerBg: '#FFFFFF',
      headerText: '#1E3A5F',
      border: '#DCE4EC',
      badgeBg: '#F4F7FA',
      badgeText: '#1E3A5F',
      highlightBg: '#F4F7FA',
      ctaBg: '#1E3A5F',
    },
    headerBg: '#FFFFFF',
    headerText: '#1E3A5F',
    accent: '#E99A35',
    border: '#DCE4EC',
    badgeBg: '#F4F7FA',
    badgeText: '#1E3A5F',
    highlightBg: '#F4F7FA',
    ctaBg: '#1E3A5F',
    relevantContext: 'CNC milling, precision metal fabrication, tight tolerances, and industrial machining',
  },
  hospitality: {
    key: 'hospitality',
    name: 'Hospitality & Dining',
    audience: 'restaurants, cafes, and hospitality businesses',
    tagline: 'Hospitality & Dining',
    designStyle: 'inviting_dining',
    colors: {
      background: '#FFFDF9',
      primary: '#831843',
      accent: '#E11D48',
      text: '#1C1917',
      headerBg: '#831843',
      headerText: '#FFF1F2',
      border: '#FBCFE8',
      badgeBg: '#FFE4E6',
      badgeText: '#9F1239',
      highlightBg: '#FFF1F2',
      ctaBg: '#BE123C',
    },
    headerBg: '#831843',
    headerText: '#FFF1F2',
    accent: '#E11D48',
    border: '#FBCFE8',
    badgeBg: '#FFE4E6',
    badgeText: '#9F1239',
    highlightBg: '#FFF1F2',
    ctaBg: '#BE123C',
    relevantContext: 'dining guests, menu offerings, customer reservations, and dining experiences',
  },
  education: {
    key: 'education',
    name: 'Education & Institutes',
    audience: 'schools, colleges, academies, and training institutes',
    tagline: 'Education & Learning',
    designStyle: 'academic_clarity',
    colors: {
      background: '#F8FAFC',
      primary: '#1E3A8A',
      accent: '#2563EB',
      text: '#0F172A',
      headerBg: '#1E3A8A',
      headerText: '#EFF6FF',
      border: '#BFDBFE',
      badgeBg: '#DBEAFE',
      badgeText: '#1E40AF',
      highlightBg: '#EFF6FF',
      ctaBg: '#2563EB',
    },
    headerBg: '#1E3A8A',
    headerText: '#EFF6FF',
    accent: '#2563EB',
    border: '#BFDBFE',
    badgeBg: '#DBEAFE',
    badgeText: '#1E40AF',
    highlightBg: '#EFF6FF',
    ctaBg: '#2563EB',
    relevantContext: 'student enrollment, courses, academic programs, and educational services',
  },
  finance: {
    key: 'finance',
    name: 'Financial & Advisory',
    audience: 'financial advisors, chartered accountants, and legal firms',
    tagline: 'Financial & Advisory Services',
    designStyle: 'corporate_trust',
    colors: {
      background: '#F0FDF4',
      primary: '#064E3B',
      accent: '#10B981',
      text: '#0F172A',
      headerBg: '#064E3B',
      headerText: '#ECFDF5',
      border: '#A7F3D0',
      badgeBg: '#D1FAE5',
      badgeText: '#065F46',
      highlightBg: '#F0FDF4',
      ctaBg: '#047857',
    },
    headerBg: '#064E3B',
    headerText: '#ECFDF5',
    accent: '#10B981',
    border: '#A7F3D0',
    badgeBg: '#D1FAE5',
    badgeText: '#065F46',
    highlightBg: '#F0FDF4',
    ctaBg: '#047857',
    relevantContext: 'tax, audit, compliance, financial planning, advisory guidance',
  },
  general_professional: {
    key: 'general_professional',
    name: 'Professional Services',
    audience: 'business professionals and organization owners',
    tagline: 'Professional Outreach',
    designStyle: 'clean_neutral_professional',
    colors: {
      background: '#F8FAFC',
      primary: '#1E293B',
      accent: '#2563EB',
      text: '#1E293B',
      headerBg: '#1E293B',
      headerText: '#F8FAFC',
      border: '#CBD5E1',
      badgeBg: '#E2E8F0',
      badgeText: '#334155',
      highlightBg: '#F1F5F9',
      ctaBg: '#2563EB',
    },
    headerBg: '#1E293B',
    headerText: '#F8FAFC',
    accent: '#2563EB',
    border: '#CBD5E1',
    badgeBg: '#E2E8F0',
    badgeText: '#334155',
    highlightBg: '#F1F5F9',
    ctaBg: '#2563EB',
    relevantContext: 'business operations, client inquiries, quality services, and professional collaboration',
  },
};

// Backward-compatibility alias
INDUSTRY_THEMES.general_b2b = INDUSTRY_THEMES.general_professional;

/**
 * Automatically detects the most appropriate industry key based on search query,
 * plan businessType, keywords, and aggregated lead categories.
 */
export function detectIndustryKey(searchContext = {}, companyAnalysis = {}) {
  const allTexts = [
    searchContext.query || '',
    searchContext.businessType || '',
    ...(searchContext.keywords || []),
    ...(companyAnalysis.categories || []),
    ...(companyAnalysis.commonServices || []),
  ]
    .join(' ')
    .toLowerCase();

  // Bakery, cake shop, pastry, confection, sweets
  if (/\b(baker\w*|bakery|bakeries|bake\w*|cake\w*|pastry|pastries|patisserie|confection\w*|sweet[s]?\s*shop|dessert\w*|donut\w*|doughnut\w*|bread\w*|cupcake\w*|biscuit\w*|cookie\w*)\b/i.test(allTexts)) {
    return 'bakery_food';
  }
  // Pharmaceuticals, medical, clinic, health
  if (/\b(pharmaceutic\w*|pharma\w*|biotech\w*|drug\w*|clinic\w*|medic\w*|health\w*|hospital\w*|doctor\w*|patholog\w*|lifescience\w*|dental\w*|biomed\w*|wellness|therap\w*)\b/i.test(allTexts)) {
    return 'pharma';
  }
  // Real estate, builders, property, construction
  if (/\b(real\s*estate|builder\w*|propert\w*|realt\w*|construct\w*|architect\w*|housing|infra\w*|interior\w*|apartment\w*|villa\w*|flat[s]?|commercial\s*space|residential)\b/i.test(allTexts)) {
    return 'real_estate';
  }
  // Technology, IT, software, SaaS
  if (/\b(it\b|tech\w*|software\w*|developer\w*|app\b|apps\b|web\b|webs\w*|cloud|ai\b|saas|digital|comput\w*|cyber\w*|data\w*|network\w*|host\w*|infotech|crm|erp)\b/i.test(allTexts)) {
    return 'technology';
  }
  // Chemical manufacturing
  if (/\b(chemical\w*|petrochem\w*|polymers?|resins?|fertiliz\w*|specialty\s*chem\w*)\b/i.test(allTexts)) {
    return 'manufacturing_chemical';
  }
  // Automotive manufacturing
  if (/\b(automotiv\w*|auto\s*parts?|auto\s*components?|vehicle\s*manufactur\w*|oem\s*parts?|automobile)\b/i.test(allTexts)) {
    return 'manufacturing_automotive';
  }
  // Electronics manufacturing
  if (/\b(pcb\b|semiconductor\w*|microchip\w*|circuit\s*board\w*|smt\b|microelectron\w*)\b/i.test(allTexts) ||
      (/\b(electronic\w*)\b/i.test(allTexts) && /\b(manufactur\w*|plant\w*|assembl\w*|factory|factories)\b/i.test(allTexts))) {
    return 'manufacturing_electronics';
  }
  // Metal fabrication, CNC, precision machining
  if (/\b(cnc\b|sheet\s*metal|machining|lathe|milling|die\s*cast\w*|precision\s*engineer\w*)\b/i.test(allTexts) ||
      (/\b(metal\w*|machin\w*|fabricat\w*)\b/i.test(allTexts) && /\b(cnc|machining|shop|precision|turning|milling)\b/i.test(allTexts))) {
    return 'manufacturing_metal';
  }
  // Manufacturing, industrial, factories, engineering (general)
  if (/\b(manufactur\w*|industrial|factory|factories|plant\w*|steel|plastic\w*|machin\w*|engineer\w*|metal\w*|fabricat\w*|textile\w*|packag\w*|foundry|foundries|component\w*|casting\w*)\b/i.test(allTexts)) {
    return 'manufacturing';
  }
  // Hospitality, restaurant, dining, hotel
  if (/\b(restaurant\w*|hotel\w*|hospitality|resort\w*|dining|bistro|bar\b|bars\b|pub\b|pubs\b|catering|cafe\b|cafes\b|motel\w*)\b/i.test(allTexts)) {
    return 'hospitality';
  }
  // Education, schools, colleges, institutes
  if (/\b(school\w*|college\w*|university|universities|institute\w*|academy|academies|education\w*|coaching|tutor\w*)\b/i.test(allTexts)) {
    return 'education';
  }
  // Finance, banking, CA, accounting, legal
  if (/\b(financ\w*|bank\w*|ca\b|account\w*|audit\w*|legal|tax\w*|invest\w*|law\b|lawyer\w*|advis\w*|wealth|loan\w*|insur\w*)\b/i.test(allTexts)) {
    return 'finance';
  }
  // Neutral professional fallback for ambiguous or generic searches
  return 'general_professional';
}

/**
 * Stage 2: Determines complete industry context, audience, and design configuration.
 */
export function determineIndustryContext(searchContext = {}, companyAnalysis = {}) {
  const key = detectIndustryKey(searchContext, companyAnalysis);
  const theme = INDUSTRY_THEMES[key] || INDUSTRY_THEMES.general_professional;
  const asset = INDUSTRY_VISUAL_ASSETS[key] || INDUSTRY_VISUAL_ASSETS.general_professional;
  const location = searchContext.location || (searchContext.locations && searchContext.locations[0]) || '';

  return {
    industry: theme.key,
    industryName: theme.name,
    audience: theme.audience,
    location,
    designStyle: theme.designStyle,
    tagline: theme.tagline,
    colors: { ...theme.colors },
    relevantContext: theme.relevantContext,
    visualObjects: asset?.visualObjects || [],
    illustrationStyle: asset?.illustrationStyle || 'clean vector',
    defaultCards: asset?.defaultCards || [],
    theme,
    asset,
  };
}

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
      if (a === 0 || a === 127 || a === 10) return false;
      if (a === 169 && b === 254) return false;
      if (a === 172 && b >= 16 && b <= 31) return false;
      if (a === 192 && b === 168) return false;
      if (a >= 224) return false;
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
 * Builds the compact, single-page, email-compatible HTML template (~350–520px height)
 * styled according to the detected industry theme and custom color palette.
 */
export function assembleSinglePageHtmlTemplate({
  theme = INDUSTRY_THEMES.general_professional,
  colors = null,
  heading = 'Strategic Solutions for {{business}}',
  mainMessage = 'I came across {{business}} while researching businesses in {{city|your area}}.',
  highlights = [],
  featureCards = null,
  calloutMessage = 'Would you be open to an exploratory 15-minute call this week?',
  ctaText = 'Explore Collaboration',
  includeHeroSvg = true,
}) {
  const cleanHeading = String(heading || `Strategic Solutions for {{business}}`).replace(/<[^>]+>/g, '').trim();
  const cleanMain = String(mainMessage || `I came across {{business}} while looking at companies in {{city|your area}}.`).replace(/<[^>]+>/g, '').trim();
  const cleanCallout = String(calloutMessage || 'Would you be open to a quick 15-minute call this week?').replace(/<[^>]+>/g, '').trim();
  const cleanCta = String(ctaText || 'Explore Collaboration').replace(/<[^>]+>/g, '').trim();

  const palette = {
    background: colors?.background || theme.colors?.background || theme.highlightBg || '#F4F7FA',
    primary: colors?.primary || theme.colors?.primary || theme.headerBg || '#1E3A5F',
    headerBg: colors?.headerBg || theme.colors?.headerBg || '#FFFFFF',
    headerText: colors?.headerText || theme.colors?.headerText || '#1E3A5F',
    accent: colors?.accent || theme.colors?.accent || theme.accent || '#E99A35',
    text: colors?.text || theme.colors?.text || '#243447',
    border: colors?.border || theme.colors?.border || theme.border || '#DCE4EC',
    badgeBg: colors?.badgeBg || theme.colors?.badgeBg || theme.badgeBg || '#F4F7FA',
    badgeText: colors?.badgeText || theme.colors?.badgeText || theme.badgeText || '#1E3A5F',
    highlightBg: colors?.highlightBg || theme.colors?.highlightBg || theme.highlightBg || '#F4F7FA',
    ctaBg: colors?.ctaBg || theme.colors?.ctaBg || '#1E3A5F',
    tagline: theme.tagline || 'Professional Outreach',
  };

  const assetKey = theme?.key || theme?.industry || 'general_professional';
  const asset = INDUSTRY_VISUAL_ASSETS[assetKey] || INDUSTRY_VISUAL_ASSETS.general_professional;

  // Render sanitized Vector Hero SVG Banner
  let heroSvgHtml = '';
  if (includeHeroSvg && asset?.heroSvg) {
    const rawHero = asset.heroSvg(palette);
    const cleanHero = sanitizeSvg(rawHero);
    if (cleanHero) {
      heroSvgHtml = `<tr>
      <td style="background-color:${palette.headerBg}; padding:0 14px 10px 14px;">
        <div style="border-radius:6px; overflow:hidden; line-height:0;">
          ${cleanHero}
        </div>
      </td>
    </tr>`;
    }
  }

  // Render Visual Industry Feature Cards with Vector SVG Icons
  const cardsToRender = (Array.isArray(featureCards) && featureCards.length > 0)
    ? featureCards.slice(0, 3)
    : (Array.isArray(highlights) && highlights.length > 0 ? null : (asset?.defaultCards || []).slice(0, 3));

  const cardsHtml = cardsToRender && cardsToRender.length > 0
    ? `<table width="100%" cellpadding="0" cellspacing="0" border="0" style="margin:12px 0 14px 0; border-collapse:separate; border-spacing:6px 0;">
        <tr>
          ${cardsToRender.map((c) => {
            const iconSvgRaw = (asset?.icons && asset.icons[c.icon]) ? asset.icons[c.icon](palette.primary) : '';
            const iconSvg = sanitizeSvg(iconSvgRaw);
            return `<td width="33%" valign="top" style="background-color:${palette.highlightBg}; border:1px solid ${palette.border}; border-radius:6px; padding:8px 6px; text-align:center;">
              ${iconSvg ? `<div style="display:inline-block; margin-bottom:4px;">${iconSvg}</div>` : ''}
              <div style="font-size:11px; font-weight:700; color:${palette.text}; line-height:1.2; margin-bottom:2px;">
                ${c.title}
              </div>
              <div style="font-size:9.5px; color:#64748b; line-height:1.25;">
                ${c.desc}
              </div>
            </td>`;
          }).join('')}
        </tr>
      </table>`
    : '';

  const highlightItems = (Array.isArray(highlights) ? highlights : [])
    .filter(Boolean)
    .map((h) => String(h).replace(/<[^>]+>/g, '').trim())
    .slice(0, 3);

  const highlightHtml = highlightItems.length > 0
    ? `<table width="100%" cellpadding="0" cellspacing="0" border="0" style="margin:10px 0 12px 0; background-color:${palette.highlightBg}; border-left:3px solid ${palette.accent}; border-radius:4px;">
        <tr>
          <td style="padding:10px 14px; font-size:12.5px; color:${palette.text}; line-height:1.5;">
            <ul style="margin:0; padding-left:16px;">
              ${highlightItems.map((item) => `<li style="margin-bottom:3px;">${item}</li>`).join('')}
            </ul>
          </td>
        </tr>
      </table>`
    : '';

  const ctaButtonHtml = cleanCta
    ? `<table width="100%" cellpadding="0" cellspacing="0" border="0" style="margin:14px 0 12px 0;">
        <tr>
          <td align="left">
            <a href="{{website|#}}" style="display:inline-block; background-color:${palette.ctaBg}; color:#ffffff; font-size:12.5px; font-weight:600; text-decoration:none; padding:8px 18px; border-radius:6px; letter-spacing:0.01em;">
              ${cleanCta} &rarr;
            </a>
          </td>
        </tr>
      </table>`
    : '';

  return `<div style="background-color:${palette.background}; padding:16px 8px; font-family:-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; line-height:1.5;">
  <table align="center" width="100%" cellpadding="0" cellspacing="0" border="0" style="max-width:580px; margin:0 auto; background-color:#ffffff; border-radius:10px; overflow:hidden; border:1px solid ${palette.border}; box-shadow:0 2px 4px rgba(0,0,0,0.04);">
    <tr>
      <td style="background-color:${palette.headerBg}; padding:14px 20px 10px 20px;">
        <span style="display:inline-block; font-size:10px; font-weight:700; text-transform:uppercase; letter-spacing:0.08em; color:${palette.badgeText}; background-color:${palette.badgeBg}; padding:2px 8px; border-radius:12px;">
          ${palette.tagline}
        </span>
        <h2 style="margin:6px 0 0 0; font-size:16px; font-weight:700; color:${palette.headerText}; line-height:1.25;">
          ${cleanHeading}
        </h2>
      </td>
    </tr>
    ${heroSvgHtml}
    <tr>
      <td style="padding:16px 20px 14px 20px; color:${palette.text}; font-size:13px; line-height:1.5;">
        <p style="margin:0 0 10px 0; font-size:13.5px; font-weight:600; color:#0f172a;">
          Hi {{business|there}} team,
        </p>
        <p style="margin:0 0 10px 0;">
          ${cleanMain}
        </p>
        ${cardsHtml}
        ${highlightHtml}
        <p style="margin:10px 0 12px 0;">
          ${cleanCallout}
        </p>
        ${ctaButtonHtml}
        <div style="margin-top:14px; padding-top:10px; border-top:1px solid #f1f5f9; font-size:12px; color:#64748b;">
          <span style="display:block; color:#1e293b; font-weight:600;">{{my_name}}</span>
          <span style="display:block;">{{my_email}}</span>
        </div>
      </td>
    </tr>
  </table>
</div>`;
}

/**
 * Builds the AI prompt for generating ONE single-page, industry-adaptive common template.
 */
export function buildPrompt({ searchContext, companyAnalysis, userOffer = {} }) {
  const industryCtx = determineIndustryContext(searchContext, companyAnalysis);
  const theme = industryCtx.theme;

  const hasSpecificOffer = Boolean(userOffer.service && userOffer.service.trim());
  const offerInstruction = hasSpecificOffer
    ? `The user offers: ${userOffer.service} (${userOffer.offerDescription || ''}). Main benefit: ${userOffer.mainBenefit || ''}. Incorporate this offer naturally.`
    : `No specific service or product was specified by the user. Write a neutral, respectful, industry-relevant introductory outreach draft tailored specifically to ${industryCtx.audience} in ${industryCtx.location || 'their area'}. Focus on mutual introduction, customer engagement, local business connections, or discussing relevant solutions for their sector. Never invent fake products, fake certifications, fictional awards, or claims that apply only to a single company. DO NOT write generic corporate B2B partnership or IT consulting messaging unless the search or user offer actually is for IT/consulting.`;

  const systemPrompt =
    'You are an expert copywriter and visual email outreach designer.\n' +
    'Your task is to generate ONE single-page, professionally designed email template for the user based on an existing lead search and aggregated company research.\n\n' +
    'DETERMINED SEARCH & INDUSTRY CONTEXT:\n' +
    '- Target Query: "' + searchContext.query + '"\n' +
    '- Industry: "' + industryCtx.industryName + '" (' + industryCtx.industry + ')\n' +
    '- Target Audience: "' + industryCtx.audience + '" in "' + (industryCtx.location || 'their area') + '"\n' +
    '- Design Style: "' + industryCtx.designStyle + '"\n' +
    '- Selected Visual Objects: ' + industryCtx.visualObjects.join(', ') + '\n' +
    '- Illustration Style: ' + industryCtx.illustrationStyle + '\n' +
    '- Relevant Context: ' + industryCtx.relevantContext + '\n\n' +
    'CRITICAL DESIGN & CONTENT RULES:\n' +
    '1. MATCH INDUSTRY & AUDIENCE EXACTLY:\n' +
    '   - The email MUST be specifically tailored to ' + industryCtx.audience + ' in the ' + industryCtx.industryName + ' sector.\n' +
    '   - For example, if the audience is bakery owners and cake shops, talk about bakery operations, customer orders, local reach, or menu inquiries. DO NOT talk about corporate B2B strategic partnerships, generic IT consulting, or unrelated enterprise services unless the user\'s specific offer explicitly specifies it.\n' +
    '   - ' + offerInstruction + '\n' +
    '2. KEYWORD-DRIVEN VISUAL INTELLIGENCE: Reflect the actual industry in the visual plan and cards using relevant graphical objects (such as ' + industryCtx.visualObjects.slice(0, 3).join(', ') + ').\n' +
    '3. ONE-PAGE COMPACT DESIGN: The email must fit within ONE single page on a typical desktop email preview (~350–550px height at 600px width). Keep copy concise (around 80–140 words total). Avoid unnecessary introductions, oversized sections, or excessive whitespace.\n' +
    '4. DYNAMIC COMPANY PERSONALIZATION: You MUST use {{business}} (or fallback {{business|there}}) for the recipient company name in both the heading and body greeting. At sending time, {{business}} will be automatically replaced with each recipient company name.\n' +
    '5. SUPPORTED MERGE FIELDS ONLY:\n' +
    '   - {{business}} : Recipient business / company name (fallback: {{business|there}})\n' +
    '   - {{city}} : Recipient city (fallback: {{city|your city}})\n' +
    '   - {{website}} : Recipient website (fallback: {{website|your site}})\n' +
    '   - {{email}} : Recipient email\n' +
    '   - {{phone}} : Recipient phone\n' +
    '   - {{category}} : Business category (fallback: {{category|industry}})\n' +
    '   - {{my_name}} : Sender name\n' +
    '   - {{my_email}} : Sender email\n' +
    '   DO NOT use {{company_name}} or any other unsupported merge fields.\n' +
    '6. STRUCTURED DESIGN & COPY OUTPUT:\n' +
    '   Return JSON only with this structure:\n' +
    '   {\n' +
    '     "name": "Short descriptive template name",\n' +
    '     "subject": "Compelling subject line tailored to {{business}} and the industry context",\n' +
    '     "industry": "' + industryCtx.industry + '",\n' +
    '     "industryName": "' + industryCtx.industryName + '",\n' +
    '     "audience": "' + industryCtx.audience + '",\n' +
    '     "location": "' + industryCtx.location + '",\n' +
    '     "designStyle": "' + industryCtx.designStyle + '",\n' +
    '     "visualPlan": {\n' +
    '       "visualObjects": ' + JSON.stringify(industryCtx.visualObjects) + ',\n' +
    '       "illustrationStyle": "' + industryCtx.illustrationStyle + '",\n' +
    '       "layout": {\n' +
    '         "header": "illustrated hero banner",\n' +
    '         "body": "compact single-page copy",\n' +
    '         "visualSection": "3-column feature cards with vector icons",\n' +
    '         "cta": "prominent button",\n' +
    '         "footer": "sender signature"\n' +
    '       }\n' +
    '     },\n' +
    '     "featureCards": [\n' +
    '       { "icon": "' + (industryCtx.defaultCards[0]?.icon || 'briefcase') + '", "title": "Card 1 title (max 4 words)", "desc": "Card 1 description (max 8 words)" },\n' +
    '       { "icon": "' + (industryCtx.defaultCards[1]?.icon || 'growth') + '", "title": "Card 2 title (max 4 words)", "desc": "Card 2 description (max 8 words)" },\n' +
    '       { "icon": "' + (industryCtx.defaultCards[2]?.icon || 'handshake') + '", "title": "Card 3 title (max 4 words)", "desc": "Card 3 description (max 8 words)" }\n' +
    '     ],\n' +
    '     "colors": {\n' +
    '       "background": "' + industryCtx.colors.background + '",\n' +
    '       "primary": "' + industryCtx.colors.primary + '",\n' +
    '       "accent": "' + industryCtx.colors.accent + '",\n' +
    '       "text": "' + industryCtx.colors.text + '",\n' +
    '       "headerBg": "' + industryCtx.colors.headerBg + '",\n' +
    '       "headerText": "' + industryCtx.colors.headerText + '",\n' +
    '       "border": "' + industryCtx.colors.border + '",\n' +
    '       "badgeBg": "' + industryCtx.colors.badgeBg + '",\n' +
    '       "badgeText": "' + industryCtx.colors.badgeText + '",\n' +
    '       "highlightBg": "' + industryCtx.colors.highlightBg + '",\n' +
    '       "ctaBg": "' + industryCtx.colors.ctaBg + '"\n' +
    '     },\n' +
    '     "heading": "Short punchy header title with {{business}} (max 8 words)",\n' +
    '     "mainMessage": "Opening paragraph (2-3 sentences, 40-60 words) tailored specifically to the audience in their area",\n' +
    '     "highlights": ["Short bullet point 1 (max 8 words)", "Short bullet point 2 (max 8 words)"],\n' +
    '     "calloutMessage": "Low-friction closing sentence proposing a brief conversation or order/collaboration discussion",\n' +
    '     "ctaText": "Short relevant CTA button label (2-4 words, e.g. Connect With Us / Discuss Requirements)",\n' +
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
      detectedIndustry: industryCtx.industry,
      industryName: industryCtx.industryName,
      targetAudience: industryCtx.audience,
      totalLeadsAnalyzed: companyAnalysis.totalLeads,
      companiesWithWebsite: companyAnalysis.withWebsite,
      sampleAudienceCompanies: companyAnalysis.sampleCompanies,
      primaryCategories: companyAnalysis.categories,
      commonServices: companyAnalysis.commonServices,
      locations: companyAnalysis.locations,
      sampleWebsiteTitles: companyAnalysis.siteTitles,
      visualObjects: industryCtx.visualObjects,
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

  return { systemPrompt, userPrompt, detectedIndustry: industryCtx.industry, industryContext: industryCtx };
}

/**
 * Validates and normalizes AI-generated template draft into a single-page HTML design.
 */
export function validateTemplateDraft(
  draft,
  {
    fallbackName = 'Outreach Template',
    fallbackKeywords = [],
    fallbackIndustry = 'general_professional',
    searchContext = null,
    userOffer = null,
  } = {},
) {
  if (!draft || typeof draft !== 'object') {
    throw new HttpError(502, 'AI did not return a valid JSON object');
  }

  let name = String(draft.name || fallbackName).trim().slice(0, 120);
  let subject = String(draft.subject || '').trim().slice(0, 250);

  if (!subject) throw new HttpError(502, 'AI generated a template without a subject line');

  // Fix common mistake: Replace {{company_name}} with {{business}}
  subject = subject.replace(/\{\{\s*company_name(\s*\|[^}]*)?\}\}/gi, (_m, fallback) => `{{business${fallback || ''}}}`);

  // Determine industry theme
  const detectedKey = fallbackIndustry && INDUSTRY_THEMES[fallbackIndustry] ? fallbackIndustry : 'general_professional';
  let industryKey = draft.industry && INDUSTRY_THEMES[draft.industry] ? draft.industry : detectedKey;

  // Prevent generic B2B takeover: If search is bakery / retail, do not allow AI to silently flip to technology/general_b2b
  const hasTechOffer = Boolean(userOffer?.service && /\b(tech|software|web|code|it|app|cloud|saas)\b/i.test(userOffer.service));
  if (detectedKey === 'bakery_food' && industryKey !== 'bakery_food' && !hasTechOffer) {
    industryKey = 'bakery_food';
  }

  const theme = INDUSTRY_THEMES[industryKey] || INDUSTRY_THEMES[detectedKey] || INDUSTRY_THEMES.general_professional;
  const asset = INDUSTRY_VISUAL_ASSETS[industryKey] || INDUSTRY_VISUAL_ASSETS[detectedKey] || INDUSTRY_VISUAL_ASSETS.general_professional;

  // Visual plan resolution
  const visualObjects = Array.isArray(draft.visualPlan?.visualObjects) && draft.visualPlan.visualObjects.length
    ? draft.visualPlan.visualObjects
    : (Array.isArray(draft.visualObjects) && draft.visualObjects.length ? draft.visualObjects : asset.visualObjects);
  const illustrationStyle = draft.visualPlan?.illustrationStyle || draft.illustrationStyle || asset.illustrationStyle;
  const visualPlan = {
    industry: theme.key,
    theme: theme.designStyle,
    visualObjects,
    illustrationStyle,
    layout: draft.visualPlan?.layout || {
      header: 'illustrated hero banner',
      body: 'compact single-page copy',
      visualSection: '3-column feature cards with vector icons',
      cta: 'prominent button',
      footer: 'sender signature',
    },
  };

  const isManuf = String(industryKey).startsWith('manufacturing');

  let featureCards = Array.isArray(draft.featureCards) && draft.featureCards.length > 0
    ? draft.featureCards.slice(0, 3)
    : (asset?.defaultCards || []);

  if (isManuf && !userOffer?.service) {
    // Benefits must be grounded in actual offer. Omit generic unjustified cards for manufacturing
    featureCards = featureCards.filter((c) => {
      const text = `${c.title || ''} ${c.desc || ''}`.toLowerCase();
      return !/(precision engineering|production capacity|quality assurance)/i.test(text);
    });
  }

  // Color sanitization and validation
  const safeHex = (val, fb) => (/^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/.test(String(val || '').trim()) ? String(val).trim() : fb);
  const resolvedColors = {
    background: safeHex(draft.colors?.background, theme.colors?.background || (isManuf ? '#F4F7FA' : '#F8FAFC')),
    primary: safeHex(draft.colors?.primary, theme.colors?.primary || theme.headerBg || (isManuf ? '#1E3A5F' : '#1E293B')),
    accent: safeHex(draft.colors?.accent, theme.colors?.accent || theme.accent || (isManuf ? '#E99A35' : '#2563EB')),
    text: safeHex(draft.colors?.text, theme.colors?.text || (isManuf ? '#243447' : '#332722')),
    headerBg: isManuf ? '#FFFFFF' : safeHex(draft.colors?.headerBg, theme.colors?.headerBg || theme.headerBg || '#1E293B'),
    headerText: isManuf ? '#1E3A5F' : safeHex(draft.colors?.headerText, theme.colors?.headerText || theme.headerText || '#FFFFFF'),
    border: safeHex(draft.colors?.border, theme.colors?.border || theme.border || (isManuf ? '#DCE4EC' : '#CBD5E1')),
    badgeBg: safeHex(draft.colors?.badgeBg, theme.colors?.badgeBg || theme.badgeBg || (isManuf ? '#F4F7FA' : '#E2E8F0')),
    badgeText: safeHex(draft.colors?.badgeText, theme.colors?.badgeText || theme.badgeText || (isManuf ? '#1E3A5F' : '#334155')),
    highlightBg: safeHex(draft.colors?.highlightBg, theme.colors?.highlightBg || theme.highlightBg || (isManuf ? '#F4F7FA' : '#F1F5F9')),
    ctaBg: safeHex(draft.colors?.ctaBg, theme.colors?.ctaBg || (isManuf ? '#1E3A5F' : '#2563EB')),
  };

  let body = '';
  let heading = draft.heading || (
    industryKey === 'bakery_food'
      ? `Connecting with {{business}}`
      : isManuf
        ? `Industrial & Operational Solutions for {{business}}`
        : `Strategic Solutions for {{business}}`
  );
  heading = heading.replace(/\{\{\s*company_name(\s*\|[^}]*)?\}\}/gi, (_m, fallback) => `{{business${fallback || ''}}}`);
  if (!heading.includes('{{business')) {
    heading = `${heading} for {{business}}`;
  }

  // Prevent generic contradictory B2B phrasing if search is bakery/food
  if (industryKey === 'bakery_food' && !hasTechOffer) {
    heading = heading.replace(/b2b strategic (solutions|partnership|collaboration)/gi, 'Connecting with {{business}}');
    subject = subject.replace(/b2b strategic (solutions|partnership|collaboration)/gi, 'Connecting with {{business}}');
  }

  let ctaText = String(draft.ctaText || (
    industryKey === 'bakery_food'
      ? 'Connect With Us'
      : isManuf
        ? 'Discuss Requirements'
        : 'Explore Collaboration'
  )).trim();
  if (industryKey === 'bakery_food' && /explore collaboration/i.test(ctaText)) {
    ctaText = 'Connect With Us';
  }

  // If AI provided structured fields (heading/mainMessage), assemble the single-page HTML
  if (draft.mainMessage || draft.calloutMessage) {
    let mainMessage = String(draft.mainMessage || '').trim();
    let calloutMessage = String(draft.calloutMessage || (industryKey === 'bakery_food' ? 'Would you be open to a brief chat this week about customer reach and orders?' : 'Would you be open to an introductory 15-minute call this week?')).trim();

    mainMessage = mainMessage.replace(/\{\{\s*company_name(\s*\|[^}]*)?\}\}/gi, (_m, fallback) => `{{business${fallback || ''}}}`);
    calloutMessage = calloutMessage.replace(/\{\{\s*company_name(\s*\|[^}]*)?\}\}/gi, (_m, fallback) => `{{business${fallback || ''}}}`);

    if (industryKey === 'bakery_food' && !hasTechOffer) {
      mainMessage = mainMessage.replace(/b2b strategic (solutions|partnership|collaboration)/gi, 'local bakery outreach');
      mainMessage = mainMessage.replace(/it consulting|cloud architecture|enterprise software/gi, 'customer orders and online visibility');
    }

    body = assembleSinglePageHtmlTemplate({
      theme,
      colors: resolvedColors,
      heading,
      mainMessage,
      highlights: draft.highlights || (industryKey === 'bakery_food' ? ['Tailored for local bakery orders', 'Custom reach for {{city|your area}}'] : []),
      featureCards,
      calloutMessage,
      ctaText,
      includeHeroSvg: true,
    });
  } else if (draft.body && isEmailHtml(draft.body)) {
    // If body is already complete email HTML
    body = String(draft.body).trim();
    body = body.replace(/\{\{\s*company_name(\s*\|[^}]*)?\}\}/gi, (_m, fallback) => `{{business${fallback || ''}}}`);
  } else if (draft.body) {
    // If body was given as plain text, assemble into single-page HTML layout
    let plain = String(draft.body).trim();
    plain = plain.replace(/\{\{\s*company_name(\s*\|[^}]*)?\}\}/gi, (_m, fallback) => `{{business${fallback || ''}}}`);
    const parts = plain.split(/\n{2,}/);
    const mainMessage = parts.slice(0, 2).join(' ');
    const calloutMessage = parts[2] || (industryKey === 'bakery_food' ? 'Would you be open to a quick chat this week?' : 'Would you be open to a quick 15-minute call this week?');

    body = assembleSinglePageHtmlTemplate({
      theme,
      colors: resolvedColors,
      heading,
      mainMessage,
      highlights: draft.highlights || (industryKey === 'bakery_food' ? ['Tailored for local bakery orders', 'Custom reach for {{city|your area}}'] : []),
      featureCards,
      calloutMessage,
      ctaText,
      includeHeroSvg: true,
    });
  } else {
    throw new HttpError(502, 'AI generated a template with empty content');
  }

  // Guarantee company-name personalization in template
  if (!body.includes('{{business') && !subject.includes('{{business')) {
    body = body.replace(/Hi\s*team/i, 'Hi {{business|there}} team');
  }

  // Validate supported merge fields
  const invalid = unknownFields(subject, body);
  if (invalid.length > 0) {
    for (const field of invalid) {
      const rx = new RegExp(`\\{\\{\\s*${field}(\\s*\\|([^}]*))?\\}\\}`, 'gi');
      subject = subject.replace(rx, (_m, _fb, fbVal) => (fbVal || '').trim());
      body = body.replace(rx, (_m, _fb, fbVal) => (fbVal || '').trim());
    }
  }

  const researchSummary = String(
    draft.researchSummary ||
      `Analysis of companies for "${fallbackName}" showing shared business needs in the ${theme.name} sector.`,
  ).trim();

  const keywords = Array.isArray(draft.keywords) && draft.keywords.length
    ? draft.keywords.map((k) => String(k).trim()).filter(Boolean).slice(0, 6)
    : fallbackKeywords;

  return {
    name,
    subject,
    body,
    plainText: htmlToPlainText(body),
    industry: theme.key,
    industryName: draft.industryName || theme.name,
    audience: draft.audience || theme.audience,
    location: draft.location || searchContext?.location || '',
    designStyle: draft.designStyle || theme.designStyle,
    colors: resolvedColors,
    visualPlan,
    visualObjects,
    featureCards,
    researchSummary,
    keywords,
  };
}

/**
 * Main AI Agent workflow: Retrieves search, analyzes company data, and produces
 * exactly ONE single-page, industry-adaptive email template.
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

  const { systemPrompt, userPrompt, detectedIndustry, industryContext } = buildPrompt({
    searchContext,
    companyAnalysis,
    userOffer: resolvedOffer,
  });

  let aiOutput = await llmJson(systemPrompt, userPrompt, { maxTokens: 1400 });
  if (!aiOutput) {
    throw new HttpError(502, 'AI failed to generate template. Please check OpenAI configuration and try again.');
  }

  // Prevent generic contradictory output: if search was for bakery / retail and AI produced generic IT B2B output
  const hasTechOffer = Boolean(resolvedOffer.service && /\b(tech|software|web|code|it|app|cloud|saas)\b/i.test(resolvedOffer.service));
  const isContradictory =
    detectedIndustry === 'bakery_food' &&
    !hasTechOffer &&
    /\b(b2b strategic partnership|enterprise saas|it consulting)\b/i.test(
      `${aiOutput.heading || ''} ${aiOutput.mainMessage || ''} ${aiOutput.subject || ''}`,
    );

  if (isContradictory) {
    const correctionPrompt = `Correction: The user searched for "${searchContext.query}" (${industryContext.industryName}). Your previous output contained generic B2B/IT corporate phrasing which contradicts this local retail search. Generate content strictly tailored to ${industryContext.audience} in ${searchContext.location || 'their area'}.`;
    const correctedOutput = await llmJson(systemPrompt, `${userPrompt}\n\n${correctionPrompt}`, { maxTokens: 1400 }).catch(() => null);
    if (correctedOutput) aiOutput = correctedOutput;
  }

  const businessTypeTitle = searchContext.businessType
    ? searchContext.businessType.charAt(0).toUpperCase() + searchContext.businessType.slice(1)
    : 'Business';
  const fallbackName = resolvedOffer.service
    ? `${resolvedOffer.service} outreach for ${searchContext.businessType || 'leads'}`
    : `${businessTypeTitle} Outreach Template`;

  const draft = validateTemplateDraft(aiOutput, {
    fallbackName,
    fallbackKeywords: searchContext.keywords,
    fallbackIndustry: detectedIndustry,
    searchContext,
    userOffer: resolvedOffer,
  });

  return {
    success: true,
    draft,
    meta: {
      searchId: job._id,
      leadsAnalyzed: companyAnalysis.totalLeads,
      industry: draft.industry,
      industryName: draft.industryName,
      designStyle: draft.designStyle,
      colors: draft.colors,
      visualObjects: draft.visualObjects,
      audienceCategories: companyAnalysis.categories,
    },
  };
}
