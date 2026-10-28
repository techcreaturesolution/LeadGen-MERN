/**
 * Visual Asset Engine: Provides sanitized, email-compatible SVG illustrations
 * and vector iconography tailored to each detected industry theme.
 */

/**
 * Strict SVG sanitizer ensuring only safe vector tags, paths, and attributes.
 * Prevents script injection, external references, and unsafe event handlers.
 */
export function sanitizeSvg(svg) {
  if (!svg || typeof svg !== 'string') return '';
  const trimmed = svg.trim();
  if (!/^<svg[\s\S]*<\/svg>$/i.test(trimmed)) return '';

  // Disallow scripts, external links, event handlers, and embedded external URLs
  if (/<script|<\/?style|<iframe|<object|<embed|<link/i.test(trimmed)) return '';
  if (/on[a-z]+\s*=|javascript:|href\s*=\s*['"](?!#)[^'"]+['"]/i.test(trimmed)) return '';

  return trimmed;
}

export const INDUSTRY_VISUAL_ASSETS = {
  bakery_food: {
    visualObjects: [
      'celebration cake illustration',
      'frosted cupcake with cherry',
      'artisan bread loaf',
      'chocolate cookie',
      'bakery sprinkles and stars',
    ],
    illustrationStyle: 'warm artisan vector',
    defaultCards: [
      { icon: 'cake', title: 'Cakes & Pastries', desc: 'Custom celebration cakes and daily baked goods' },
      { icon: 'bread', title: 'Fresh Daily Bakes', desc: 'Artisan breads, cookies and savory treats' },
      { icon: 'store', title: 'Local Bakery Orders', desc: 'Fast customer orders and local neighborhood delivery' },
    ],
    heroSvg: (p) => `<svg viewBox="0 0 460 90" width="100%" height="90" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="bakeryHeroBg" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stop-color="${p.headerBg || '#7A3E2E'}" stop-opacity="0.95"/>
          <stop offset="100%" stop-color="${p.accent || '#DFA5A0'}" stop-opacity="0.85"/>
        </linearGradient>
      </defs>
      <rect width="460" height="90" rx="8" fill="url(#bakeryHeroBg)"/>
      <circle cx="28" cy="18" r="3" fill="#FFFBEB" opacity="0.6"/>
      <circle cx="430" cy="22" r="2.5" fill="#FFFBEB" opacity="0.5"/>
      <circle cx="410" cy="70" r="3" fill="#FFFBEB" opacity="0.4"/>
      <path d="M70,22 L72,28 L78,28 L73,32 L75,38 L70,34 L65,38 L67,32 L62,28 L68,28 Z" fill="#FEF3C7" opacity="0.75"/>
      <path d="M390,28 L391.5,33 L396,33 L392,36 L393.5,41 L390,38 L386.5,41 L388,36 L384,33 L388.5,33 Z" fill="#FEF3C7" opacity="0.8"/>
      
      <!-- Group 1: Artisan Bread Loaf & Scoring Marks (Left) -->
      <g transform="translate(42, 38)">
        <ellipse cx="46" cy="30" rx="36" ry="16" fill="#D97706"/>
        <ellipse cx="46" cy="28" rx="34" ry="14" fill="#F59E0B"/>
        <path d="M26,24 Q30,28 34,26" stroke="#78350F" stroke-width="2.5" stroke-linecap="round" fill="none"/>
        <path d="M42,22 Q46,26 50,24" stroke="#78350F" stroke-width="2.5" stroke-linecap="round" fill="none"/>
        <path d="M58,22 Q62,26 66,24" stroke="#78350F" stroke-width="2.5" stroke-linecap="round" fill="none"/>
        <path d="M34,14 Q32,8 36,4" stroke="#FEF3C7" stroke-width="1.8" stroke-linecap="round" fill="none" opacity="0.75"/>
        <path d="M48,12 Q46,6 50,2" stroke="#FEF3C7" stroke-width="1.8" stroke-linecap="round" fill="none" opacity="0.85"/>
        <path d="M62,14 Q60,8 64,4" stroke="#FEF3C7" stroke-width="1.8" stroke-linecap="round" fill="none" opacity="0.75"/>
      </g>

      <!-- Group 2: Centerpiece 2-Tier Celebration Cake (Center) -->
      <g transform="translate(195, 12)">
        <ellipse cx="35" cy="73" rx="38" ry="5" fill="#E2E8F0"/>
        <path d="M28,73 L30,68 L40,68 L42,73 Z" fill="#CBD5E1"/>
        <rect x="2" y="65" width="66" height="4" rx="2" fill="#FFFFFF"/>
        <rect x="8" y="44" width="54" height="22" rx="3" fill="#FFF9F0"/>
        <path d="M8,48 Q14,54 20,48 Q26,54 32,48 Q38,54 44,48 Q50,54 56,48 Q59,52 62,48 L62,44 L8,44 Z" fill="${p.accent || '#DFA5A0'}"/>
        <line x1="8" y1="58" x2="62" y2="58" stroke="#FDE68A" stroke-width="2" stroke-dasharray="3,3"/>
        <rect x="18" y="24" width="34" height="20" rx="3" fill="#FFF9F0"/>
        <path d="M18,28 Q23,33 28,28 Q33,33 38,28 Q43,33 48,28 Q50,30 52,28 L52,24 L18,24 Z" fill="${p.accent || '#DFA5A0'}"/>
        <line x1="35" y1="24" x2="35" y2="15" stroke="#FFFFFF" stroke-width="2.2" stroke-linecap="round"/>
        <ellipse cx="35" cy="11" rx="2.5" ry="4" fill="#F59E0B"/>
        <ellipse cx="35" cy="12" rx="1.2" ry="2" fill="#FEF3C7"/>
        <circle cx="21" cy="23" r="3.2" fill="#E11D48"/>
        <circle cx="49" cy="23" r="3.2" fill="#E11D48"/>
      </g>

      <!-- Group 3: Swirled Cupcake & Cookie (Right) -->
      <g transform="translate(305, 20)">
        <polygon points="26,65 14,42 46,42 34,65" fill="#FED7AA"/>
        <line x1="20" y1="42" x2="28" y2="65" stroke="#FDBA74" stroke-width="1.2"/>
        <line x1="30" y1="42" x2="31" y2="65" stroke="#FDBA74" stroke-width="1.2"/>
        <line x1="40" y1="42" x2="32" y2="65" stroke="#FDBA74" stroke-width="1.2"/>
        <ellipse cx="30" cy="40" rx="18" ry="9" fill="#FFF9F0"/>
        <ellipse cx="30" cy="33" rx="14" ry="8" fill="#FCE7F3"/>
        <ellipse cx="30" cy="26" rx="9" ry="6" fill="${p.accent || '#DFA5A0'}"/>
        <path d="M28,22 Q30,17 33,21" stroke="${p.accent || '#DFA5A0'}" stroke-width="3" stroke-linecap="round" fill="none"/>
        <circle cx="24" cy="34" r="1.3" fill="#E11D48"/>
        <circle cx="36" cy="33" r="1.3" fill="#3B82F6"/>
        <circle cx="29" cy="38" r="1.3" fill="#10B981"/>
        <circle cx="33" cy="26" r="1.3" fill="#F59E0B"/>
        <circle cx="68" cy="54" r="15" fill="#D97706"/>
        <circle cx="68" cy="54" r="13.5" fill="#F59E0B"/>
        <circle cx="64" cy="50" r="2" fill="#451A03"/>
        <circle cx="72" cy="49" r="2.2" fill="#451A03"/>
        <circle cx="66" cy="58" r="2" fill="#451A03"/>
        <circle cx="74" cy="57" r="1.8" fill="#451A03"/>
      </g>
    </svg>`,
    icons: {
      cake: (col) => `<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="${col}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 21v-8a2 2 0 0 0-2-2H6a2 2 0 0 0-2 2v8"/><path d="M4 16s.5-1 2-1 2.5 2 4 2 2.5-2 4-2 2.5 2 4 2 2-1 2-1"/><path d="M2 21h20"/><path d="M7 8v3"/><path d="M12 8v3"/><path d="M17 8v3"/><path d="M7 4h.01"/><path d="M12 4h.01"/><path d="M17 4h.01"/></svg>`,
      bread: (col) => `<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="${col}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><ellipse cx="12" cy="12" rx="9" ry="5"/><path d="M7 11c1-1 2-1 3 0"/><path d="M11 11c1-1 2-1 3 0"/><path d="M15 11c1-1 2-1 3 0"/></svg>`,
      store: (col) => `<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="${col}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>`,
    },
  },

  pharma: {
    visualObjects: [
      'laboratory flask with solution',
      'prescription capsules and tablets',
      'medical cross trust badge',
      'molecular structure nodes',
    ],
    illustrationStyle: 'clean clinical vector',
    defaultCards: [
      { icon: 'capsule', title: 'Quality Standards', desc: 'GMP compliance and reliable batch consistency' },
      { icon: 'flask', title: 'R&D & Formulations', desc: 'Precise scientific formulations and verification' },
      { icon: 'shield', title: 'Healthcare Safety', desc: 'Verified clinical integrity and regulatory trust' },
    ],
    heroSvg: (p) => `<svg viewBox="0 0 460 90" width="100%" height="90" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="pharmaHeroBg" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stop-color="${p.headerBg || '#0369A1'}" stop-opacity="0.95"/>
          <stop offset="100%" stop-color="${p.accent || '#0284C7'}" stop-opacity="0.85"/>
        </linearGradient>
      </defs>
      <rect width="460" height="90" rx="8" fill="url(#pharmaHeroBg)"/>
      <circle cx="48" cy="24" r="3.5" fill="#BAE6FD" opacity="0.6"/>
      <circle cx="80" cy="18" r="2.5" fill="#BAE6FD" opacity="0.4"/>
      <line x1="48" y1="24" x2="80" y2="18" stroke="#BAE6FD" stroke-width="1.2" opacity="0.3"/>
      <circle cx="390" cy="70" r="3" fill="#BAE6FD" opacity="0.5"/>
      <circle cx="420" cy="55" r="3.5" fill="#BAE6FD" opacity="0.6"/>
      <line x1="390" y1="70" x2="420" y2="55" stroke="#BAE6FD" stroke-width="1.2" opacity="0.3"/>

      <!-- Group 1: Laboratory Flask (Left) -->
      <g transform="translate(58, 14)">
        <path d="M22,12 L22,24 L6,60 A4,4 0 0,0 10,66 L38,66 A4,4 0 0,0 42,60 L26,24 L26,12 Z" fill="#E0F2FE" stroke="#FFFFFF" stroke-width="2"/>
        <path d="M9.5,56 L15,44 Q24,47 33,44 L38.5,56 A3,3 0 0,1 36,63 L12,63 A3,3 0 0,1 9.5,56 Z" fill="${p.accent || '#0284C7'}" opacity="0.9"/>
        <circle cx="20" cy="54" r="2.2" fill="#FFFFFF" opacity="0.85"/>
        <circle cx="28" cy="48" r="1.8" fill="#FFFFFF" opacity="0.8"/>
        <circle cx="23" cy="38" r="1.5" fill="#FFFFFF" opacity="0.6"/>
        <rect x="20" y="8" width="8" height="4" rx="1.5" fill="#FFFFFF"/>
      </g>

      <!-- Group 2: Center Dual Capsules & Tablets -->
      <g transform="translate(195, 18)">
        <g transform="rotate(-30, 24, 30)">
          <rect x="10" y="14" width="28" height="14" rx="7" fill="#FFFFFF"/>
          <path d="M10,21 A7,7 0 0,0 24,21 L24,14 A7,7 0 0,0 10,14 Z" fill="#38BDF8"/>
          <line x1="24" y1="14" x2="24" y2="28" stroke="#0284C7" stroke-width="1"/>
        </g>
        <g transform="rotate(35, 48, 36)">
          <rect x="34" y="22" width="28" height="14" rx="7" fill="#FFFFFF"/>
          <path d="M34,29 A7,7 0 0,0 48,29 L48,22 A7,7 0 0,0 34,22 Z" fill="#F43F5E"/>
          <line x1="48" y1="22" x2="48" y2="36" stroke="#BE123C" stroke-width="1"/>
        </g>
        <circle cx="36" cy="54" r="10" fill="#FFFFFF" stroke="#BAE6FD" stroke-width="1.5"/>
        <line x1="36" y1="46" x2="36" y2="62" stroke="#94A3B8" stroke-width="1.5"/>
      </g>

      <!-- Group 3: Healthcare Trust Shield (Right) -->
      <g transform="translate(330, 16)">
        <path d="M30,12 L50,18 C50,38 30,54 30,54 C30,54 10,38 10,18 Z" fill="#FFFFFF" stroke="#BAE6FD" stroke-width="1.5"/>
        <rect x="27" y="24" width="6" height="18" rx="1.5" fill="${p.headerBg || '#0369A1'}"/>
        <rect x="21" y="30" width="18" height="6" rx="1.5" fill="${p.headerBg || '#0369A1'}"/>
      </g>
    </svg>`,
    icons: {
      capsule: (col) => `<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="${col}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="10.5" width="18" height="9" rx="4.5" transform="rotate(-45 12 15)"/><line x1="8.8" y1="11.8" x2="15.2" y2="18.2"/></svg>`,
      flask: (col) => `<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="${col}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M10 2v7.31L4.19 19A2 2 0 0 0 5.91 22h12.18a2 2 0 0 0 1.72-3L14 9.31V2"/><line x1="8.5" y1="2" x2="15.5" y2="2"/><path d="M8 15h8"/></svg>`,
      shield: (col) => `<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="${col}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/><line x1="12" y1="8" x2="12" y2="14"/><line x1="9" y1="11" x2="15" y2="11"/></svg>`,
    },
  },

  real_estate: {
    visualObjects: [
      'modern high-rise tower skyline',
      'luxury residential villa silhouette',
      'construction crane and blueprint grid',
      'architectural geometry',
    ],
    illustrationStyle: 'architectural premium vector',
    defaultCards: [
      { icon: 'tower', title: 'Residential & Commercial', desc: 'Premium apartments, towers and commercial developments' },
      { icon: 'house', title: 'Luxury Villa Projects', desc: 'Bespoke layouts, landscaping and modern architecture' },
      { icon: 'blueprint', title: 'Buyer Engagement', desc: 'Direct property inquiries, site tours and customer reach' },
    ],
    heroSvg: (p) => `<svg viewBox="0 0 460 90" width="100%" height="90" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="estateHeroBg" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stop-color="${p.headerBg || '#0F172A'}" stop-opacity="0.96"/>
          <stop offset="100%" stop-color="${p.accent || '#D97706'}" stop-opacity="0.85"/>
        </linearGradient>
      </defs>
      <rect width="460" height="90" rx="8" fill="url(#estateHeroBg)"/>
      <circle cx="230" cy="38" r="32" fill="#F59E0B" opacity="0.25"/>

      <!-- Group 1: Construction Crane (Left) -->
      <g transform="translate(42, 16)">
        <line x1="20" y1="62" x2="20" y2="10" stroke="#F8FAFC" stroke-width="2"/>
        <line x1="12" y1="12" x2="52" y2="12" stroke="#F8FAFC" stroke-width="2"/>
        <line x1="16" y1="6" x2="20" y2="12" stroke="#F8FAFC" stroke-width="1.5"/>
        <line x1="20" y1="12" x2="44" y2="28" stroke="#F59E0B" stroke-width="1.2"/>
        <line x1="44" y1="12" x2="44" y2="34" stroke="#F8FAFC" stroke-width="1.5"/>
        <rect x="40" y="34" width="8" height="6" fill="#F59E0B"/>
      </g>

      <!-- Group 2: Modern High-Rise Cityscape (Center) -->
      <g transform="translate(170, 10)">
        <rect x="10" y="24" width="28" height="52" fill="#1E293B" stroke="#475569" stroke-width="1"/>
        <rect x="15" y="29" width="5" height="6" fill="#F8FAFC" opacity="0.9"/>
        <rect x="25" y="29" width="5" height="6" fill="#F8FAFC" opacity="0.9"/>
        <rect x="15" y="39" width="5" height="6" fill="#FDE68A"/>
        <rect x="25" y="39" width="5" height="6" fill="#F8FAFC" opacity="0.9"/>
        <rect x="15" y="49" width="5" height="6" fill="#F8FAFC" opacity="0.9"/>
        <rect x="25" y="49" width="5" height="6" fill="#FDE68A"/>
        <polygon points="42,16 68,6 68,76 42,76" fill="#334155" stroke="#64748B" stroke-width="1"/>
        <rect x="47" y="18" width="5" height="6" fill="#FDE68A"/>
        <rect x="57" y="18" width="5" height="6" fill="#F8FAFC" opacity="0.8"/>
        <rect x="47" y="28" width="5" height="6" fill="#F8FAFC" opacity="0.9"/>
        <rect x="57" y="28" width="5" height="6" fill="#FDE68A"/>
        <rect x="47" y="38" width="5" height="6" fill="#F8FAFC" opacity="0.8"/>
        <rect x="57" y="38" width="5" height="6" fill="#F8FAFC" opacity="0.8"/>
        <rect x="47" y="48" width="5" height="6" fill="#FDE68A"/>
        <rect x="57" y="48" width="5" height="6" fill="#F8FAFC" opacity="0.9"/>
        <rect x="72" y="32" width="24" height="44" fill="#1E293B" stroke="#475569" stroke-width="1"/>
        <rect x="77" y="38" width="4" height="6" fill="#F8FAFC" opacity="0.9"/>
        <rect x="85" y="38" width="4" height="6" fill="#F8FAFC" opacity="0.9"/>
        <rect x="77" y="48" width="4" height="6" fill="#FDE68A"/>
        <rect x="85" y="48" width="4" height="6" fill="#F8FAFC" opacity="0.9"/>
      </g>

      <!-- Group 3: Luxury Villa Silhouette (Right) -->
      <g transform="translate(320, 24)">
        <polygon points="35,14 10,34 60,34" fill="#F59E0B"/>
        <rect x="14" y="34" width="42" height="32" fill="#F8FAFC"/>
        <rect x="28" y="48" width="14" height="18" rx="2" fill="#0F172A"/>
        <rect x="18" y="38" width="8" height="8" rx="1" fill="#38BDF8"/>
        <rect x="44" y="38" width="8" height="8" rx="1" fill="#38BDF8"/>
        <rect x="46" y="16" width="5" height="12" fill="#475569"/>
      </g>
    </svg>`,
    icons: {
      tower: (col) => `<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="${col}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="4" y="2" width="16" height="20" rx="2"/><line x1="9" y1="6" x2="9.01" y2="6"/><line x1="15" y1="6" x2="15.01" y2="6"/><line x1="9" y1="10" x2="9.01" y2="10"/><line x1="15" y1="10" x2="15.01" y2="10"/><line x1="9" y1="14" x2="9.01" y2="14"/><line x1="15" y1="14" x2="15.01" y2="14"/><line x1="9" y1="18" x2="15" y2="18"/></svg>`,
      house: (col) => `<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="${col}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>`,
      blueprint: (col) => `<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="${col}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polygon points="12 2 2 7 12 12 22 7 12 2"/><polyline points="2 17 12 22 22 17"/><polyline points="2 12 12 17 22 12"/></svg>`,
    },
  },

  technology: {
    visualObjects: [
      'floating SaaS analytics dashboard',
      'connected cloud architecture node',
      'developer code brackets and APIs',
      'digital circuit network',
    ],
    illustrationStyle: 'modern tech vector',
    defaultCards: [
      { icon: 'dashboard', title: 'Digital Platforms & SaaS', desc: 'Custom portals, cloud workflows and web solutions' },
      { icon: 'cloud', title: 'Cloud Infrastructure', desc: 'Reliable, scalable hosting and API system integrations' },
      { icon: 'code', title: 'Tech Modernization', desc: 'Modern software engineering tailored for performance' },
    ],
    heroSvg: (p) => `<svg viewBox="0 0 460 90" width="100%" height="90" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="techHeroBg" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stop-color="${p.headerBg || '#1E1B4B'}" stop-opacity="0.96"/>
          <stop offset="100%" stop-color="${p.accent || '#6366F1'}" stop-opacity="0.88"/>
        </linearGradient>
      </defs>
      <rect width="460" height="90" rx="8" fill="url(#techHeroBg)"/>
      <circle cx="45" cy="22" r="3" fill="#A5B4FC" opacity="0.6"/>
      <line x1="45" y1="22" x2="75" y2="35" stroke="#A5B4FC" stroke-width="1.2" opacity="0.3"/>
      <circle cx="75" cy="35" r="2.5" fill="#A5B4FC" opacity="0.7"/>

      <!-- Group 1: Floating SaaS Dashboard Window -->
      <g transform="translate(65, 14)">
        <rect x="0" y="0" width="115" height="66" rx="6" fill="#0F172A" stroke="#818CF8" stroke-width="1.5"/>
        <rect x="0" y="0" width="115" height="14" rx="6" fill="#1E293B"/>
        <circle cx="8" cy="7" r="2.2" fill="#EF4444"/>
        <circle cx="16" cy="7" r="2.2" fill="#F59E0B"/>
        <circle cx="24" cy="7" r="2.2" fill="#10B981"/>
        <rect x="12" y="42" width="12" height="16" rx="2" fill="#6366F1"/>
        <rect x="30" y="32" width="12" height="26" rx="2" fill="#818CF8"/>
        <rect x="48" y="24" width="12" height="34" rx="2" fill="#38BDF8"/>
        <rect x="66" y="38" width="12" height="20" rx="2" fill="#6366F1"/>
        <path d="M16,36 Q40,18 70,26 T105,18" stroke="#34D399" stroke-width="2" fill="none" stroke-linecap="round"/>
      </g>

      <!-- Group 2: Cloud Node -->
      <g transform="translate(225, 16)">
        <ellipse cx="40" cy="32" rx="30" ry="18" fill="#312E81" stroke="#A5B4FC" stroke-width="1.5"/>
        <circle cx="24" cy="28" r="14" fill="#312E81"/>
        <circle cx="48" cy="22" r="16" fill="#312E81"/>
        <rect x="26" y="28" width="28" height="5" rx="1.5" fill="#38BDF8"/>
        <circle cx="29" cy="30.5" r="1.2" fill="#FFFFFF"/>
        <rect x="26" y="36" width="28" height="5" rx="1.5" fill="#818CF8"/>
        <circle cx="29" cy="38.5" r="1.2" fill="#FFFFFF"/>
      </g>

      <!-- Group 3: Code Chip & API -->
      <g transform="translate(340, 18)">
        <polygon points="35,6 62,20 62,50 35,64 8,50 8,20" fill="#0F172A" stroke="#38BDF8" stroke-width="1.8"/>
        <path d="M22,35 L17,40 L22,45" stroke="#F8FAFC" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" fill="none"/>
        <line x1="28" y1="46" x2="34" y2="34" stroke="#818CF8" stroke-width="2" stroke-linecap="round"/>
        <path d="M40,35 L45,40 L40,45" stroke="#F8FAFC" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" fill="none"/>
      </g>
    </svg>`,
    icons: {
      dashboard: (col) => `<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="${col}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="18" height="18" rx="2"/><line x1="3" y1="9" x2="21" y2="9"/><line x1="9" y1="21" x2="9" y2="9"/></svg>`,
      cloud: (col) => `<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="${col}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M18 10h-1.26A8 8 0 1 0 9 20h9a5 5 0 0 0 0-10z"/></svg>`,
      code: (col) => `<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="${col}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="16 18 22 12 16 6"/><polyline points="8 6 2 12 8 18"/></svg>`,
    },
  },

  hospitality: {
    visualObjects: [
      'gourmet cloche dome platter with steam',
      'ceramic coffee cup with latte art',
      'crossed chef cutlery',
      'dining ambiance stars',
    ],
    illustrationStyle: 'inviting dining vector',
    defaultCards: [
      { icon: 'cloche', title: 'Signature Offerings', desc: 'Distinctive menus and culinary quality' },
      { icon: 'coffee', title: 'Guest Experience', desc: 'Delightful cafe, dining and hospitality atmosphere' },
      { icon: 'dining', title: 'Table Inquiries & Events', desc: 'Direct guest inquiries, reservations and celebrations' },
    ],
    heroSvg: (p) => `<svg viewBox="0 0 460 90" width="100%" height="90" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="diningHeroBg" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stop-color="${p.headerBg || '#831843'}" stop-opacity="0.95"/>
          <stop offset="100%" stop-color="${p.accent || '#E11D48'}" stop-opacity="0.85"/>
        </linearGradient>
      </defs>
      <rect width="460" height="90" rx="8" fill="url(#diningHeroBg)"/>
      <circle cx="36" cy="22" r="3" fill="#FFE4E6" opacity="0.6"/>
      <circle cx="424" cy="26" r="2.5" fill="#FFE4E6" opacity="0.5"/>

      <!-- Group 1: Artisan Steaming Coffee Cup (Left) -->
      <g transform="translate(55, 20)">
        <ellipse cx="30" cy="56" rx="26" ry="6" fill="#4C0519"/>
        <path d="M12,28 L16,50 A14,14 0 0,0 44,50 L48,28 Z" fill="#FFF1F2"/>
        <path d="M48,32 C54,32 58,36 58,42 C58,48 52,50 46,50" stroke="#FFF1F2" stroke-width="3" fill="none"/>
        <path d="M22,20 Q20,12 24,6" stroke="#FFE4E6" stroke-width="2" stroke-linecap="round" fill="none"/>
        <path d="M30,18 Q28,10 32,4" stroke="#FFE4E6" stroke-width="2" stroke-linecap="round" fill="none"/>
        <path d="M38,20 Q36,12 40,6" stroke="#FFE4E6" stroke-width="2" stroke-linecap="round" fill="none"/>
      </g>

      <!-- Group 2: Center Cloche Dome Serving Dish -->
      <g transform="translate(185, 14)">
        <ellipse cx="45" cy="66" rx="42" ry="7" fill="#4C0519"/>
        <line x1="5" y1="62" x2="85" y2="62" stroke="#FFFFFF" stroke-width="3" stroke-linecap="round"/>
        <path d="M10,62 C10,32 30,22 45,22 C60,22 80,32 80,62 Z" fill="#FFE4E6"/>
        <circle cx="45" cy="18" r="4.5" fill="#FFFFFF"/>
        <path d="M25,52 Q45,36 65,52" stroke="#FFFFFF" stroke-width="2" fill="none" opacity="0.8"/>
        <path d="M40,12 Q36,6 42,2" stroke="#FDE047" stroke-width="1.8" stroke-linecap="round" fill="none"/>
        <path d="M50,12 Q46,6 52,2" stroke="#FDE047" stroke-width="1.8" stroke-linecap="round" fill="none"/>
      </g>

      <!-- Group 3: Crossed Dining Cutlery (Right) -->
      <g transform="translate(325, 20)">
        <circle cx="40" cy="40" r="26" fill="#4C0519" stroke="#FDA4AF" stroke-width="1.5"/>
        <g transform="rotate(-25, 40, 40)">
          <line x1="40" y1="18" x2="40" y2="62" stroke="#FFFFFF" stroke-width="2.5" stroke-linecap="round"/>
          <path d="M36,18 L36,30 A4,4 0 0,0 44,30 L44,18" stroke="#FFFFFF" stroke-width="1.8" fill="none"/>
          <line x1="40" y1="18" x2="40" y2="30" stroke="#FFFFFF" stroke-width="1.8"/>
        </g>
        <g transform="rotate(25, 40, 40)">
          <line x1="40" y1="18" x2="40" y2="62" stroke="#FFFFFF" stroke-width="2.5" stroke-linecap="round"/>
          <path d="M40,18 C44,22 44,32 40,36 Z" fill="#FFFFFF"/>
        </g>
      </g>
    </svg>`,
    icons: {
      cloche: (col) => `<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="${col}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M2 19h20"/><path d="M4 19a8 8 0 0 1 16 0"/><circle cx="12" cy="7" r="2"/></svg>`,
      coffee: (col) => `<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="${col}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M18 8h1a4 4 0 0 1 0 8h-1"/><path d="M2 8h16v9a4 4 0 0 1-4 4H6a4 4 0 0 1-4-4V8z"/><line x1="6" y1="1" x2="6" y2="4"/><line x1="10" y1="1" x2="10" y2="4"/><line x1="14" y1="1" x2="14" y2="4"/></svg>`,
      dining: (col) => `<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="${col}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="9"/><path d="M9 7v10"/><path d="M15 7v10"/></svg>`,
    },
  },

  manufacturing: {
    visualObjects: [
      'modern factory plant with saw-tooth roof and smokestacks',
      'automated conveyor belt with packaged production',
      'overhead gantry crane hoist mechanism',
      'precision drive gear mechanism',
    ],
    illustrationStyle: 'light modern industrial vector',
    defaultCards: [],
    heroSvg: (p) => `<svg viewBox="0 0 532 108" width="100%" height="108" xmlns="http://www.w3.org/2000/svg">
      <rect width="532" height="108" rx="8" fill="#F4F7FA" stroke="#DCE4EC" stroke-width="1.2"/>
      <line x1="16" y1="84" x2="516" y2="84" stroke="#DCE4EC" stroke-width="1"/>
      
      <!-- Facility with saw-tooth architectural roofline & stacks (Left) -->
      <g transform="translate(18, 12)">
        <polygon points="10,72 10,38 30,22 30,38 50,22 50,38 70,22 70,72" fill="#1E3A5F"/>
        <polygon points="14,36 28,25 28,36" fill="#E99A35" opacity="0.9"/>
        <polygon points="34,36 48,25 48,36" fill="#E99A35" opacity="0.9"/>
        <polygon points="54,36 68,25 68,36" fill="#E99A35" opacity="0.9"/>
        <rect x="76" y="16" width="8" height="56" rx="1" fill="#334E68"/>
        <rect x="88" y="24" width="7" height="48" rx="1" fill="#486581"/>
        <line x1="77" y1="12" x2="83" y2="6" stroke="#9FB3C8" stroke-width="1.5" stroke-linecap="round"/>
        <line x1="89" y1="18" x2="94" y2="12" stroke="#9FB3C8" stroke-width="1.5" stroke-linecap="round"/>
        <rect x="18" y="48" width="8" height="12" rx="1" fill="#FFFFFF"/>
        <rect x="34" y="48" width="8" height="12" rx="1" fill="#FFFFFF"/>
        <rect x="50" y="48" width="8" height="12" rx="1" fill="#FFFFFF"/>
      </g>

      <!-- Automated conveyor belt with packaged production (Center) -->
      <g transform="translate(150, 16)">
        <line x1="10" y1="58" x2="10" y2="68" stroke="#486581" stroke-width="3" stroke-linecap="round"/>
        <line x1="90" y1="58" x2="90" y2="68" stroke="#486581" stroke-width="3" stroke-linecap="round"/>
        <line x1="170" y1="58" x2="170" y2="68" stroke="#486581" stroke-width="3" stroke-linecap="round"/>
        <rect x="0" y="52" width="180" height="8" rx="4" fill="#1E3A5F"/>
        <circle cx="15" cy="56" r="3.5" fill="#E99A35"/>
        <circle cx="45" cy="56" r="3.5" fill="#E99A35"/>
        <circle cx="75" cy="56" r="3.5" fill="#E99A35"/>
        <circle cx="105" cy="56" r="3.5" fill="#E99A35"/>
        <circle cx="135" cy="56" r="3.5" fill="#E99A35"/>
        <circle cx="165" cy="56" r="3.5" fill="#E99A35"/>
        <rect x="25" y="32" width="28" height="20" rx="2" fill="#FFFFFF" stroke="#1E3A5F" stroke-width="1.8"/>
        <line x1="25" y1="42" x2="53" y2="42" stroke="#E99A35" stroke-width="2"/>
        <rect x="68" y="24" width="36" height="28" rx="2" fill="#334E68" stroke="#1E3A5F" stroke-width="1.8"/>
        <rect x="74" y="32" width="16" height="8" rx="1" fill="#FFFFFF"/>
        <rect x="120" y="34" width="30" height="18" rx="2" fill="#FFFFFF" stroke="#E99A35" stroke-width="1.8"/>
        <path d="M85,68 L95,68 M91,64 L96,68 L91,72" stroke="#E99A35" stroke-width="2" stroke-linecap="round"/>
      </g>

      <!-- Gantry hoist crane & precision drive gear (Right) -->
      <g transform="translate(360, 14)">
        <rect x="10" y="10" width="140" height="6" rx="2" fill="#334E68"/>
        <circle cx="35" cy="48" r="22" fill="#FFFFFF" stroke="#1E3A5F" stroke-width="2.5"/>
        <circle cx="35" cy="48" r="8" fill="#1E3A5F"/>
        <circle cx="35" cy="48" r="14" fill="none" stroke="#E99A35" stroke-width="2" stroke-dasharray="3,3"/>
        <rect x="105" y="14" width="16" height="10" rx="1" fill="#E99A35"/>
        <line x1="113" y1="24" x2="113" y2="44" stroke="#1E3A5F" stroke-width="1.5" stroke-dasharray="2,2"/>
        <path d="M110,44 C110,50 116,50 116,46" stroke="#1E3A5F" stroke-width="2" fill="none"/>
        <rect x="98" y="50" width="30" height="20" rx="2" fill="#FFFFFF" stroke="#1E3A5F" stroke-width="1.8"/>
        <line x1="98" y1="60" x2="128" y2="60" stroke="#E99A35" stroke-width="2"/>
      </g>
    </svg>`,
    icons: {
      factory: (col) => `<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="${col}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M2 20a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V8l-7 5V8l-7 5V4H2z"/></svg>`,
      gear: (col) => `<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="${col}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg>`,
      caliper: (col) => `<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="${col}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 6H3"/><path d="M7 12H3"/><path d="M7 18H3"/><path d="M14 6v14"/><path d="M18 6v14"/></svg>`,
    },
  },

  manufacturing_chemical: {
    visualObjects: [
      'bulk chemical storage tanks with level gauge',
      'high-pressure distillation reactor column',
      'interconnected industrial pipeline network',
      'pipeline handwheel valves',
      'laboratory verification testing flask',
    ],
    illustrationStyle: 'light modern chemical industrial vector',
    defaultCards: [],
    heroSvg: (p) => `<svg viewBox="0 0 532 108" width="100%" height="108" xmlns="http://www.w3.org/2000/svg">
      <rect width="532" height="108" rx="8" fill="#F4F7FA" stroke="#DCE4EC" stroke-width="1.2"/>
      <line x1="16" y1="84" x2="516" y2="84" stroke="#DCE4EC" stroke-width="1"/>

      <!-- Cylindrical Bulk Storage Tanks & Level Indicators (Left) -->
      <g transform="translate(20, 14)">
        <path d="M10,26 C10,16 45,16 45,26 L45,70 L10,70 Z" fill="#FFFFFF" stroke="#1E3A5F" stroke-width="2"/>
        <line x1="38" y1="28" x2="38" y2="65" stroke="#DCE4EC" stroke-width="3"/>
        <line x1="38" y1="44" x2="38" y2="65" stroke="#E99A35" stroke-width="3"/>
        <rect x="16" y="70" width="8" height="5" fill="#1E3A5F"/>
        <rect x="32" y="70" width="8" height="5" fill="#1E3A5F"/>
        <!-- Horizontal Process Tank -->
        <rect x="58" y="38" width="54" height="32" rx="14" fill="#334E68" stroke="#1E3A5F" stroke-width="2"/>
        <line x1="68" y1="54" x2="102" y2="54" stroke="#DCE4EC" stroke-width="2"/>
        <circle cx="85" cy="54" r="5" fill="#E99A35"/>
        <rect x="70" y="70" width="6" height="5" fill="#1E3A5F"/>
        <rect x="94" y="70" width="6" height="5" fill="#1E3A5F"/>
      </g>

      <!-- Distillation Column & Interconnected Pipeline Network (Center) -->
      <g transform="translate(160, 10)">
        <rect x="15" y="10" width="40" height="65" rx="3" fill="#FFFFFF" stroke="#1E3A5F" stroke-width="2"/>
        <rect x="31" y="4" width="8" height="6" rx="1" fill="#E99A35"/>
        <line x1="15" y1="24" x2="55" y2="24" stroke="#DCE4EC" stroke-width="2"/>
        <line x1="15" y1="38" x2="55" y2="38" stroke="#DCE4EC" stroke-width="2"/>
        <line x1="15" y1="52" x2="55" y2="52" stroke="#DCE4EC" stroke-width="2"/>
        <line x1="15" y1="66" x2="55" y2="66" stroke="#DCE4EC" stroke-width="2"/>
        <!-- Connecting pipeline with handwheel valve -->
        <path d="M55,30 L100,30 L100,60 L160,60" fill="none" stroke="#1E3A5F" stroke-width="3.5" stroke-linejoin="round"/>
        <circle cx="100" cy="45" r="7" fill="#FFFFFF" stroke="#E99A35" stroke-width="2"/>
        <line x1="100" y1="39" x2="100" y2="51" stroke="#E99A35" stroke-width="1.8"/>
        <line x1="94" y1="45" x2="106" y2="45" stroke="#E99A35" stroke-width="1.8"/>
        <path d="M125,56 L133,60 L125,64" stroke="#E99A35" stroke-width="2" fill="none"/>
      </g>

      <!-- Chemical Lab Testing Flask & Analysis (Right) -->
      <g transform="translate(365, 12)">
        <path d="M30,22 L30,32 L10,68 A3,3 0 0,0 13,72 L47,72 A3,3 0 0,0 50,68 L30,32 L30,22 Z" fill="#FFFFFF" stroke="#1E3A5F" stroke-width="2"/>
        <rect x="26" y="18" width="8" height="4" rx="1" fill="#334E68"/>
        <path d="M16,63 L22,50 Q30,52 38,50 L44,63 A2,2 0 0,1 42,67 L18,67 A2,2 0 0,1 16,63 Z" fill="#E99A35" opacity="0.9"/>
        <circle cx="28" cy="58" r="2.2" fill="#FFFFFF"/>
        <circle cx="34" cy="54" r="1.8" fill="#FFFFFF"/>
        <!-- Tube rack station -->
        <rect x="75" y="42" width="56" height="30" rx="3" fill="#FFFFFF" stroke="#DCE4EC" stroke-width="1.5"/>
        <rect x="83" y="30" width="7" height="36" rx="3.5" fill="#1E3A5F"/>
        <rect x="97" y="25" width="7" height="41" rx="3.5" fill="#E99A35"/>
        <rect x="111" y="32" width="7" height="34" rx="3.5" fill="#334E68"/>
      </g>
    </svg>`,
    icons: {
      flask: (col) => `<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="${col}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M10 2v7.31L4.15 19.3A2 2 0 0 0 5.86 22h12.28a2 2 0 0 0 1.71-2.7L14 9.31V2"/><line x1="8.5" y1="2" x2="15.5" y2="2"/><line x1="7" y1="16" x2="17" y2="16"/></svg>`,
      tank: (col) => `<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="${col}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="4" y="6" width="16" height="12" rx="4"/><line x1="8" y1="18" x2="8" y2="21"/><line x1="16" y1="18" x2="16" y2="21"/></svg>`,
      shield: (col) => `<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="${col}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>`,
    },
  },

  manufacturing_automotive: {
    visualObjects: [
      'multi-axis robotic assembly arm',
      'ventilated disc brake rotor and caliper',
      'transmission drive gear assembly and shaft',
      'automotive components and parts',
    ],
    illustrationStyle: 'light modern automotive industrial vector',
    defaultCards: [],
    heroSvg: (p) => `<svg viewBox="0 0 532 108" width="100%" height="108" xmlns="http://www.w3.org/2000/svg">
      <rect width="532" height="108" rx="8" fill="#F4F7FA" stroke="#DCE4EC" stroke-width="1.2"/>
      <line x1="16" y1="84" x2="516" y2="84" stroke="#DCE4EC" stroke-width="1"/>

      <!-- Multi-Axis Robotic Assembly Arm (Left) -->
      <g transform="translate(25, 14)">
        <rect x="10" y="62" width="40" height="10" rx="2" fill="#1E3A5F"/>
        <circle cx="30" cy="62" r="8" fill="#334E68" stroke="#DCE4EC" stroke-width="1.8"/>
        <line x1="30" y1="62" x2="54" y2="34" stroke="#1E3A5F" stroke-width="6" stroke-linecap="round"/>
        <circle cx="54" cy="34" r="6" fill="#E99A35"/>
        <line x1="54" y1="34" x2="90" y2="40" stroke="#334E68" stroke-width="4.5" stroke-linecap="round"/>
        <polygon points="90,36 102,40 90,44" fill="#1E3A5F"/>
        <path d="M106,40 L114,36 M106,40 L115,43 M106,40 L113,40" stroke="#E99A35" stroke-width="2" stroke-linecap="round"/>
      </g>

      <!-- Ventilated Disc Brake Rotor & Caliper (Center) -->
      <g transform="translate(195, 12)">
        <circle cx="45" cy="44" r="32" fill="#FFFFFF" stroke="#1E3A5F" stroke-width="2.5"/>
        <circle cx="45" cy="44" r="14" fill="#334E68"/>
        <!-- Rotor cooling vents -->
        <circle cx="34" cy="32" r="2.2" fill="#486581"/>
        <circle cx="56" cy="32" r="2.2" fill="#486581"/>
        <circle cx="34" cy="56" r="2.2" fill="#486581"/>
        <circle cx="56" cy="56" r="2.2" fill="#486581"/>
        <circle cx="24" cy="44" r="2.2" fill="#486581"/>
        <circle cx="66" cy="44" r="2.2" fill="#486581"/>
        <circle cx="45" cy="38" r="2" fill="#FFFFFF"/>
        <circle cx="45" cy="50" r="2" fill="#FFFFFF"/>
        <!-- Caliper assembly -->
        <path d="M22,18 C32,10 54,10 68,16 L64,34 C54,30 38,30 28,34 Z" fill="#E99A35" stroke="#1E3A5F" stroke-width="1.8"/>
        <rect x="42" y="6" width="6" height="5" rx="1" fill="#1E3A5F"/>
      </g>

      <!-- Transmission Drive Gear & Shaft (Right) -->
      <g transform="translate(345, 14)">
        <rect x="0" y="40" width="150" height="8" rx="2" fill="#DCE4EC" stroke="#1E3A5F" stroke-width="1.5"/>
        <circle cx="45" cy="44" r="24" fill="#1E3A5F"/>
        <circle cx="45" cy="44" r="10" fill="#FFFFFF"/>
        <circle cx="85" cy="30" r="16" fill="#334E68"/>
        <circle cx="85" cy="30" r="6" fill="#FFFFFF"/>
        <circle cx="120" cy="44" r="18" fill="none" stroke="#E99A35" stroke-width="2.8" stroke-dasharray="4,3"/>
      </g>
    </svg>`,
    icons: {
      gear: (col) => `<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="${col}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg>`,
      car: (col) => `<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="${col}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M19 17h2c.6 0 1-.4 1-1v-3c0-.9-.7-1.7-1.5-1.9C18.7 10.6 16 10 16 10s-1.3-1.4-2.2-2.3c-.5-.4-1.1-.7-1.8-.7H5c-.6 0-1.1.4-1.4.9l-1.4 2.9A3.7 3.7 0 0 0 2 12v4c0 .6.4 1 1 1h2"/><circle cx="7" cy="17" r="2"/><path d="M9 17h6"/><circle cx="17" cy="17" r="2"/></svg>`,
      shield: (col) => `<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="${col}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>`,
    },
  },

  manufacturing_electronics: {
    visualObjects: [
      'high-density PCB substrate with gold copper traces',
      'quad flat package QFP microprocessor with pin leads',
      'surface-mount SMT capacitors and resistors',
      'automated pick-and-place placement tool head',
    ],
    illustrationStyle: 'light precision electronics vector',
    defaultCards: [],
    heroSvg: (p) => `<svg viewBox="0 0 532 108" width="100%" height="108" xmlns="http://www.w3.org/2000/svg">
      <rect width="532" height="108" rx="8" fill="#F4F7FA" stroke="#DCE4EC" stroke-width="1.2"/>
      <line x1="16" y1="84" x2="516" y2="84" stroke="#DCE4EC" stroke-width="1"/>

      <!-- High-Density PCB Board with Conductive Bus Traces (Left) -->
      <g transform="translate(24, 14)">
        <rect x="0" y="4" width="120" height="66" rx="4" fill="#1E3A5F" stroke="#334E68" stroke-width="1.8"/>
        <path d="M10,16 L40,16 L54,30 L80,30" fill="none" stroke="#E99A35" stroke-width="2" stroke-linecap="round"/>
        <path d="M10,32 L34,32 L44,42 L70,42" fill="none" stroke="#E99A35" stroke-width="2" stroke-linecap="round"/>
        <path d="M10,54 L50,54 L60,44 L100,44" fill="none" stroke="#E99A35" stroke-width="2" stroke-linecap="round"/>
        <circle cx="10" cy="16" r="2.5" fill="#E99A35" stroke="#FFFFFF" stroke-width="1"/>
        <circle cx="80" cy="30" r="2.5" fill="#E99A35" stroke="#FFFFFF" stroke-width="1"/>
        <circle cx="10" cy="32" r="2.5" fill="#E99A35" stroke="#FFFFFF" stroke-width="1"/>
        <circle cx="70" cy="42" r="2.5" fill="#E99A35" stroke="#FFFFFF" stroke-width="1"/>
        <circle cx="10" cy="54" r="2.5" fill="#E99A35" stroke="#FFFFFF" stroke-width="1"/>
        <circle cx="100" cy="44" r="2.5" fill="#E99A35" stroke="#FFFFFF" stroke-width="1"/>
      </g>

      <!-- Central QFP Processor & SMT Components (Center) -->
      <g transform="translate(195, 12)">
        <rect x="35" y="14" width="48" height="48" rx="3" fill="#243447" stroke="#1E3A5F" stroke-width="1.5"/>
        <rect x="45" y="24" width="28" height="28" rx="2" fill="#1E3A5F"/>
        <circle cx="50" cy="29" r="2" fill="#E99A35"/>
        <!-- Microchip Pins -->
        <line x1="42" y1="9" x2="42" y2="14" stroke="#DCE4EC" stroke-width="1.8"/>
        <line x1="50" y1="9" x2="50" y2="14" stroke="#DCE4EC" stroke-width="1.8"/>
        <line x1="58" y1="9" x2="58" y2="14" stroke="#DCE4EC" stroke-width="1.8"/>
        <line x1="66" y1="9" x2="66" y2="14" stroke="#DCE4EC" stroke-width="1.8"/>
        <line x1="42" y1="62" x2="42" y2="67" stroke="#DCE4EC" stroke-width="1.8"/>
        <line x1="50" y1="62" x2="50" y2="67" stroke="#DCE4EC" stroke-width="1.8"/>
        <line x1="58" y1="62" x2="58" y2="67" stroke="#DCE4EC" stroke-width="1.8"/>
        <line x1="66" y1="62" x2="66" y2="67" stroke="#DCE4EC" stroke-width="1.8"/>
        <line x1="30" y1="22" x2="35" y2="22" stroke="#DCE4EC" stroke-width="1.8"/>
        <line x1="30" y1="30" x2="35" y2="30" stroke="#DCE4EC" stroke-width="1.8"/>
        <line x1="30" y1="38" x2="35" y2="38" stroke="#DCE4EC" stroke-width="1.8"/>
        <line x1="30" y1="46" x2="35" y2="46" stroke="#DCE4EC" stroke-width="1.8"/>
        <line x1="83" y1="22" x2="88" y2="22" stroke="#DCE4EC" stroke-width="1.8"/>
        <line x1="83" y1="30" x2="88" y2="30" stroke="#DCE4EC" stroke-width="1.8"/>
        <line x1="83" y1="38" x2="88" y2="38" stroke="#DCE4EC" stroke-width="1.8"/>
        <line x1="83" y1="46" x2="88" y2="46" stroke="#DCE4EC" stroke-width="1.8"/>
        <!-- SMT Components -->
        <rect x="5" y="20" width="16" height="8" rx="1" fill="#FFFFFF" stroke="#334E68" stroke-width="1.2"/>
        <rect x="5" y="42" width="16" height="8" rx="1" fill="#FFFFFF" stroke="#334E68" stroke-width="1.2"/>
        <rect x="98" y="20" width="16" height="8" rx="1" fill="#FFFFFF" stroke="#334E68" stroke-width="1.2"/>
        <rect x="98" y="42" width="16" height="8" rx="1" fill="#FFFFFF" stroke="#334E68" stroke-width="1.2"/>
      </g>

      <!-- Automated SMT Pick-and-Place Tool Head (Right) -->
      <g transform="translate(365, 14)">
        <rect x="0" y="6" width="135" height="5" rx="1" fill="#334E68"/>
        <rect x="45" y="11" width="36" height="24" rx="2" fill="#FFFFFF" stroke="#1E3A5F" stroke-width="1.8"/>
        <rect x="59" y="35" width="8" height="22" fill="#1E3A5F"/>
        <rect x="55" y="57" width="16" height="9" rx="1" fill="#E99A35" stroke="#1E3A5F" stroke-width="1.2"/>
        <line x1="63" y1="70" x2="63" y2="78" stroke="#E99A35" stroke-width="1.5" stroke-dasharray="2,2"/>
        <line x1="56" y1="74" x2="70" y2="74" stroke="#E99A35" stroke-width="1.5" stroke-dasharray="2,2"/>
      </g>
    </svg>`,
    icons: {
      chip: (col) => `<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="${col}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="4" y="4" width="16" height="16" rx="2"/><rect x="9" y="9" width="6" height="6"/><line x1="9" y1="1" x2="9" y2="4"/><line x1="15" y1="1" x2="15" y2="4"/><line x1="9" y1="20" x2="9" y2="23"/><line x1="15" y1="20" x2="15" y2="23"/><line x1="20" y1="9" x2="23" y2="9"/><line x1="20" y1="14" x2="23" y2="14"/><line x1="1" y1="9" x2="4" y2="9"/><line x1="1" y1="14" x2="4" y2="14"/></svg>`,
      shield: (col) => `<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="${col}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>`,
    },
  },

  manufacturing_metal: {
    visualObjects: [
      'CNC vertical milling spindle head',
      'machined metal workpiece with coolant spray nozzles',
      'heavy-duty precision spur gear pair',
      'digital vernier caliper gauge with metric scale',
    ],
    illustrationStyle: 'light precision engineering vector',
    defaultCards: [],
    heroSvg: (p) => `<svg viewBox="0 0 532 108" width="100%" height="108" xmlns="http://www.w3.org/2000/svg">
      <rect width="532" height="108" rx="8" fill="#F4F7FA" stroke="#DCE4EC" stroke-width="1.2"/>
      <line x1="16" y1="84" x2="516" y2="84" stroke="#DCE4EC" stroke-width="1"/>

      <!-- CNC Vertical Milling Machine Spindle & Workpiece (Left) -->
      <g transform="translate(25, 12)">
        <path d="M20,6 L68,6 L68,30 L56,42 L32,42 L20,30 Z" fill="#1E3A5F"/>
        <rect x="36" y="42" width="16" height="10" fill="#334E68"/>
        <rect x="42" y="52" width="4" height="14" fill="#DCE4EC"/>
        <rect x="18" y="66" width="76" height="14" rx="2" fill="#FFFFFF" stroke="#1E3A5F" stroke-width="1.8"/>
        <rect x="36" y="66" width="16" height="7" fill="#E99A35"/>
        <line x1="26" y1="34" x2="38" y2="56" stroke="#486581" stroke-width="1.8"/>
        <line x1="62" y1="34" x2="50" y2="56" stroke="#486581" stroke-width="1.8"/>
      </g>

      <!-- Heavy-Duty Precision Spur Gear Pair (Center) -->
      <g transform="translate(195, 12)">
        <circle cx="40" cy="44" r="30" fill="#FFFFFF" stroke="#1E3A5F" stroke-width="2.5"/>
        <circle cx="40" cy="28" r="4.5" fill="#F4F7FA" stroke="#DCE4EC" stroke-width="1.5"/>
        <circle cx="54" cy="44" r="4.5" fill="#F4F7FA" stroke="#DCE4EC" stroke-width="1.5"/>
        <circle cx="40" cy="60" r="4.5" fill="#F4F7FA" stroke="#DCE4EC" stroke-width="1.5"/>
        <circle cx="26" cy="44" r="4.5" fill="#F4F7FA" stroke="#DCE4EC" stroke-width="1.5"/>
        <circle cx="40" cy="44" r="8" fill="#1E3A5F"/>
        <circle cx="82" cy="28" r="16" fill="#334E68" stroke="#E99A35" stroke-width="2"/>
        <circle cx="82" cy="28" r="6" fill="#FFFFFF"/>
      </g>

      <!-- Digital Vernier Caliper Gauge (Right) -->
      <g transform="translate(345, 16)">
        <rect x="10" y="32" width="150" height="10" rx="2" fill="#FFFFFF" stroke="#1E3A5F" stroke-width="1.8"/>
        <line x1="25" y1="32" x2="25" y2="38" stroke="#1E3A5F" stroke-width="1.2"/>
        <line x1="35" y1="32" x2="35" y2="36" stroke="#1E3A5F" stroke-width="1"/>
        <line x1="45" y1="32" x2="45" y2="38" stroke="#1E3A5F" stroke-width="1.2"/>
        <line x1="55" y1="32" x2="55" y2="36" stroke="#1E3A5F" stroke-width="1"/>
        <line x1="65" y1="32" x2="65" y2="38" stroke="#1E3A5F" stroke-width="1.2"/>
        <path d="M10,32 L10,68 L20,68 L20,42 L10,42 Z" fill="#1E3A5F"/>
        <path d="M55,24 L90,24 L90,68 L80,68 L80,42 L55,42 Z" fill="#E99A35" stroke="#1E3A5F" stroke-width="1.5"/>
        <rect x="62" y="28" width="20" height="9" rx="1" fill="#FFFFFF"/>
        <line x1="65" y1="32.5" x2="78" y2="32.5" stroke="#1E3A5F" stroke-width="1.5"/>
      </g>
    </svg>`,
    icons: {
      gear: (col) => `<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="${col}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg>`,
      caliper: (col) => `<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="${col}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 6H3"/><path d="M7 12H3"/><path d="M7 18H3"/><path d="M14 6v14"/><path d="M18 6v14"/></svg>`,
      shield: (col) => `<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="${col}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>`,
    },
  },

  education: {
    visualObjects: [
      'open hardcover book with rays',
      'academic graduation cap with tassel',
      'diploma certificate scroll',
      'star of learning',
    ],
    illustrationStyle: 'academic clarity vector',
    defaultCards: [
      { icon: 'book', title: 'Course Curricula', desc: 'Structured academic programs and certifications' },
      { icon: 'mortarboard', title: 'Student Advancement', desc: 'Skill growth, tutoring and practical learning' },
      { icon: 'diploma', title: 'Verified Excellence', desc: 'Accredited coursework and recognized standards' },
    ],
    heroSvg: (p) => `<svg viewBox="0 0 460 90" width="100%" height="90" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="eduHeroBg" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stop-color="${p.headerBg || '#1E3A8A'}" stop-opacity="0.96"/>
          <stop offset="100%" stop-color="${p.accent || '#2563EB'}" stop-opacity="0.86"/>
        </linearGradient>
      </defs>
      <rect width="460" height="90" rx="8" fill="url(#eduHeroBg)"/>

      <!-- Group 1: Open Book (Left) -->
      <g transform="translate(60, 24)">
        <path d="M10,48 C20,38 35,40 45,44 C55,40 70,38 80,48 L80,18 C70,10 55,12 45,16 C35,12 20,10 10,18 Z" fill="#FFFFFF"/>
        <line x1="45" y1="16" x2="45" y2="44" stroke="#CBD5E1" stroke-width="2"/>
        <line x1="18" y1="22" x2="38" y2="24" stroke="#94A3B8" stroke-width="1.5"/>
        <line x1="18" y1="28" x2="38" y2="30" stroke="#94A3B8" stroke-width="1.5"/>
        <line x1="52" y1="24" x2="72" y2="22" stroke="#94A3B8" stroke-width="1.5"/>
        <line x1="52" y1="30" x2="72" y2="28" stroke="#94A3B8" stroke-width="1.5"/>
      </g>

      <!-- Group 2: Graduation Mortarboard (Center) -->
      <g transform="translate(195, 20)">
        <polygon points="45,14 80,26 45,38 10,26" fill="#F8FAFC"/>
        <path d="M25,32 L25,48 C25,54 45,60 45,60 C45,60 65,54 65,48 L65,32" fill="#3B82F6"/>
        <line x1="45" y1="26" x2="76" y2="38" stroke="#F59E0B" stroke-width="2"/>
        <circle cx="76" cy="42" r="3" fill="#F59E0B"/>
      </g>

      <!-- Group 3: Diploma Scroll (Right) -->
      <g transform="translate(330, 22)">
        <rect x="15" y="18" width="46" height="30" rx="4" fill="#FFFFFF"/>
        <line x1="22" y1="26" x2="54" y2="26" stroke="#94A3B8" stroke-width="1.5"/>
        <line x1="22" y1="32" x2="48" y2="32" stroke="#94A3B8" stroke-width="1.5"/>
        <circle cx="38" cy="48" r="7" fill="#F59E0B"/>
        <polygon points="34,54 38,62 42,54" fill="#DC2626"/>
      </g>
    </svg>`,
    icons: {
      book: (col) => `<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="${col}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/></svg>`,
      mortarboard: (col) => `<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="${col}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 10v6M2 10l10-5 10 5-10 5z"/><path d="M6 12v5c3 3 9 3 12 0v-5"/></svg>`,
      diploma: (col) => `<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="${col}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="8" r="6"/><path d="M15.477 12.89 17 22l-5-3-5 3 1.523-9.11"/></svg>`,
    },
  },

  finance: {
    visualObjects: [
      'ascending growth bar chart with upward trend arrow',
      'vault security lock',
      'stacked wealth coins',
    ],
    illustrationStyle: 'corporate trust vector',
    defaultCards: [
      { icon: 'chart', title: 'Financial Strategy', desc: 'Sound fiscal planning and performance analysis' },
      { icon: 'vault', title: 'Compliance & Security', desc: 'Reliable tax, audit and risk governance' },
      { icon: 'coins', title: 'Capital Growth', desc: 'Sustainable optimization of business value' },
    ],
    heroSvg: (p) => `<svg viewBox="0 0 460 90" width="100%" height="90" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="finHeroBg" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stop-color="${p.headerBg || '#064E3B'}" stop-opacity="0.96"/>
          <stop offset="100%" stop-color="${p.accent || '#10B981'}" stop-opacity="0.86"/>
        </linearGradient>
      </defs>
      <rect width="460" height="90" rx="8" fill="url(#finHeroBg)"/>

      <!-- Group 1: Ascending Bar Chart with Trend Arrow (Left) -->
      <g transform="translate(60, 18)">
        <rect x="8" y="38" width="12" height="24" rx="2" fill="#34D399"/>
        <rect x="26" y="28" width="12" height="34" rx="2" fill="#6EE7B7"/>
        <rect x="44" y="16" width="12" height="46" rx="2" fill="#A7F3D0"/>
        <rect x="62" y="8" width="12" height="54" rx="2" fill="#FFFFFF"/>
        <!-- Trend Arrow -->
        <path d="M12,32 L30,22 L48,14 L68,4" stroke="#FDE047" stroke-width="2.5" fill="none" stroke-linecap="round"/>
        <polygon points="66,0 74,4 68,10" fill="#FDE047"/>
      </g>

      <!-- Group 2: Secure Vault (Center) -->
      <g transform="translate(195, 18)">
        <rect x="15" y="10" width="50" height="50" rx="8" fill="#047857" stroke="#A7F3D0" stroke-width="2"/>
        <circle cx="40" cy="35" r="14" fill="#065F46" stroke="#FFFFFF" stroke-width="2"/>
        <circle cx="40" cy="35" r="5" fill="#FDE047"/>
        <line x1="40" y1="21" x2="40" y2="49" stroke="#A7F3D0" stroke-width="2"/>
        <line x1="26" y1="35" x2="54" y2="35" stroke="#A7F3D0" stroke-width="2"/>
      </g>

      <!-- Group 3: Wealth Coin Stack (Right) -->
      <g transform="translate(330, 22)">
        <ellipse cx="35" cy="52" rx="24" ry="7" fill="#F59E0B"/>
        <rect x="11" y="44" width="48" height="8" fill="#F59E0B"/>
        <ellipse cx="35" cy="44" rx="24" ry="7" fill="#FBBF24"/>
        <rect x="11" y="36" width="48" height="8" fill="#F59E0B"/>
        <ellipse cx="35" cy="36" rx="24" ry="7" fill="#FBBF24"/>
        <rect x="11" y="28" width="48" height="8" fill="#F59E0B"/>
        <ellipse cx="35" cy="28" rx="24" ry="7" fill="#FDE68A"/>
      </g>
    </svg>`,
    icons: {
      chart: (col) => `<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="${col}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/></svg>`,
      vault: (col) => `<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="${col}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="12" cy="12" r="4"/><line x1="12" y1="8" x2="12" y2="16"/><line x1="8" y1="12" x2="16" y2="12"/></svg>`,
      coins: (col) => `<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="${col}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><ellipse cx="12" cy="7" rx="9" ry="3"/><path d="M21 7v10c0 1.66-4 3-9 3s-9-1.34-9-3V7"/><path d="M3 12c0 1.66 4 3 9 3s9-1.34 9-3"/></svg>`,
    },
  },

  general_professional: {
    visualObjects: [
      'geometric partnership shield emblem',
      'upward growth trajectory arrow',
      'executive portfolio briefcase',
      'star of service excellence',
    ],
    illustrationStyle: 'clean neutral professional vector',
    defaultCards: [
      { icon: 'briefcase', title: 'Quality Solutions', desc: 'Reliable service tailored to business objectives' },
      { icon: 'growth', title: 'Strategic Growth', desc: 'Streamlined communication and measurable progress' },
      { icon: 'handshake', title: 'Professional Reach', desc: 'Direct engagement and trusted collaboration' },
    ],
    heroSvg: (p) => `<svg viewBox="0 0 460 90" width="100%" height="90" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="profHeroBg" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stop-color="${p.headerBg || '#1E293B'}" stop-opacity="0.96"/>
          <stop offset="100%" stop-color="${p.accent || '#2563EB'}" stop-opacity="0.86"/>
        </linearGradient>
      </defs>
      <rect width="460" height="90" rx="8" fill="url(#profHeroBg)"/>
      <circle cx="34" cy="22" r="3" fill="#E2E8F0" opacity="0.6"/>

      <!-- Group 1: Executive Briefcase (Left) -->
      <g transform="translate(60, 22)">
        <rect x="10" y="16" width="54" height="36" rx="4" fill="#F8FAFC"/>
        <path d="M24,16 L24,10 A4,4 0 0,1 28,6 L46,6 A4,4 0 0,1 50,10 L50,16" stroke="#F8FAFC" stroke-width="2.5" fill="none"/>
        <line x1="10" y1="28" x2="64" y2="28" stroke="#CBD5E1" stroke-width="1.5"/>
        <rect x="33" y="26" width="8" height="6" rx="1.5" fill="#3B82F6"/>
      </g>

      <!-- Group 2: Geometric Collaboration Shield (Center) -->
      <g transform="translate(195, 14)">
        <polygon points="40,8 68,18 68,44 40,64 12,44 12,18" fill="#1E293B" stroke="#60A5FA" stroke-width="2"/>
        <circle cx="40" cy="34" r="14" fill="#2563EB"/>
        <path d="M32,34 L38,40 L48,28" stroke="#FFFFFF" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" fill="none"/>
      </g>

      <!-- Group 3: Upward Growth & Star (Right) -->
      <g transform="translate(330, 20)">
        <circle cx="38" cy="36" r="24" fill="#0F172A" stroke="#93C5FD" stroke-width="1.5"/>
        <path d="M24,44 L34,34 L40,40 L52,26" stroke="#60A5FA" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" fill="none"/>
        <polygon points="44,26 52,26 52,34" fill="#60A5FA"/>
      </g>
    </svg>`,
    icons: {
      briefcase: (col) => `<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="${col}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="2" y="7" width="20" height="14" rx="2" ry="2"/><path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"/></svg>`,
      growth: (col) => `<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="${col}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="23 6 13.5 15.5 8.5 10.5 1 18"/><polyline points="17 6 23 6 23 12"/></svg>`,
      handshake: (col) => `<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="${col}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20.42 4.58a5.4 5.4 0 0 0-7.65 0l-.77.78-.77-.78a5.4 5.4 0 0 0-7.65 7.65l.77.78L12 20.67l7.65-7.66.77-.78a5.4 5.4 0 0 0 0-7.65z"/></svg>`,
    },
  },
};

// Aliases for compatibility
INDUSTRY_VISUAL_ASSETS.general_b2b = INDUSTRY_VISUAL_ASSETS.general_professional;
