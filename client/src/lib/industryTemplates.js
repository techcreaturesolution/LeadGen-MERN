/**
 * Industry themes and single-page HTML email template generator for the client.
 * Matches the backend templateAgent industry detection and styling rules.
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

export function detectIndustryKey(text = '') {
  const s = String(text || '').toLowerCase();

  // Bakery, cake shop, pastry, confection, sweets
  if (/\b(baker\w*|bakery|bakeries|bake\w*|cake\w*|pastry|pastries|patisserie|confection\w*|sweet[s]?\s*shop|dessert\w*|donut\w*|doughnut\w*|bread\w*|cupcake\w*|biscuit\w*|cookie\w*)\b/i.test(s)) {
    return 'bakery_food';
  }
  // Pharmaceuticals, medical, clinic, health
  if (/\b(pharmaceutic\w*|pharma\w*|biotech\w*|drug\w*|clinic\w*|medic\w*|health\w*|hospital\w*|doctor\w*|patholog\w*|lifescience\w*|dental\w*|biomed\w*|wellness|therap\w*)\b/i.test(s)) {
    return 'pharma';
  }
  // Real estate, builders, property, construction
  if (/\b(real\s*estate|builder\w*|propert\w*|realt\w*|construct\w*|architect\w*|housing|infra\w*|interior\w*|apartment\w*|villa\w*|flat[s]?|commercial\s*space|residential)\b/i.test(s)) {
    return 'real_estate';
  }
  // Technology, IT, software, SaaS
  if (/\b(it\b|tech\w*|software\w*|developer\w*|app\b|apps\b|web\b|webs\w*|cloud|ai\b|saas|digital|comput\w*|cyber\w*|data\w*|network\w*|host\w*|infotech|crm|erp)\b/i.test(s)) {
    return 'technology';
  }
  // Chemical manufacturing
  if (/\b(chemical\w*|petrochem\w*|polymers?|resins?|fertiliz\w*|specialty\s*chem\w*)\b/i.test(s)) {
    return 'manufacturing_chemical';
  }
  // Automotive manufacturing
  if (/\b(automotiv\w*|auto\s*parts?|auto\s*components?|vehicle\s*manufactur\w*|oem\s*parts?|automobile)\b/i.test(s)) {
    return 'manufacturing_automotive';
  }
  // Electronics manufacturing
  if (/\b(pcb\b|semiconductor\w*|microchip\w*|circuit\s*board\w*|smt\b|microelectron\w*)\b/i.test(s) ||
      (/\b(electronic\w*)\b/i.test(s) && /\b(manufactur\w*|plant\w*|assembl\w*|factory|factories)\b/i.test(s))) {
    return 'manufacturing_electronics';
  }
  // Metal fabrication, CNC, precision machining
  if (/\b(cnc\b|sheet\s*metal|machining|lathe|milling|die\s*cast\w*|precision\s*engineer\w*)\b/i.test(s) ||
      (/\b(metal\w*|machin\w*|fabricat\w*)\b/i.test(s) && /\b(cnc|machining|shop|precision|turning|milling)\b/i.test(s))) {
    return 'manufacturing_metal';
  }
  // Manufacturing, industrial, factories, engineering (general)
  if (/\b(manufactur\w*|industrial|factory|factories|plant\w*|steel|plastic\w*|machin\w*|engineer\w*|metal\w*|fabricat\w*|textile\w*|packag\w*|foundry|foundries|component\w*|casting\w*)\b/i.test(s)) {
    return 'manufacturing';
  }
  // Hospitality, restaurant, dining, hotel
  if (/\b(restaurant\w*|hotel\w*|hospitality|resort\w*|dining|bistro|bar\b|bars\b|pub\b|pubs\b|catering|cafe\b|cafes\b|motel\w*)\b/i.test(s)) {
    return 'hospitality';
  }
  // Education, schools, colleges, institutes
  if (/\b(school\w*|college\w*|university|universities|institute\w*|academy|academies|education\w*|coaching|tutor\w*)\b/i.test(s)) {
    return 'education';
  }
  // Finance, banking, CA, accounting, legal
  if (/\b(financ\w*|bank\w*|ca\b|account\w*|audit\w*|legal|tax\w*|invest\w*|law\b|lawyer\w*|advis\w*|wealth|loan\w*|insur\w*)\b/i.test(s)) {
    return 'finance';
  }
  // Neutral professional fallback for ambiguous or generic searches
  return 'general_professional';
}

import { INDUSTRY_VISUAL_ASSETS, sanitizeSvg } from './visualAssets.js';

export { INDUSTRY_VISUAL_ASSETS, sanitizeSvg };

export function isEmailHtml(text) {
  return typeof text === 'string' && /<\s*(table|html|body|div\s+[^>]*style\s*=)/i.test(text);
}

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
