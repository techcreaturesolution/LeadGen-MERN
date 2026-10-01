import 'dotenv/config';

const list = (v) =>
  (v || '')
    .split(',')
    .map((s) => s.trim().toLowerCase())
    .filter(Boolean);

const bool = (v, def = false) => (v === undefined || v === '' ? def : ['1', 'true', 'yes'].includes(String(v).toLowerCase()));

export const env = {
  nodeEnv: process.env.NODE_ENV || 'development',
  port: Number(process.env.PORT || 5000),
  mongoUri: process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/leadgen',
  jwtSecret: process.env.JWT_SECRET || 'change-me-in-production',
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || '7d',
  clientOrigins: list(process.env.CLIENT_ORIGIN || 'http://localhost:5173'),

  googleClientId: process.env.GOOGLE_CLIENT_ID || '',
  googleClientSecret: process.env.GOOGLE_CLIENT_SECRET || '',
  allowedEmailDomains: list(process.env.ALLOWED_EMAIL_DOMAINS),
  adminEmails: list(process.env.ADMIN_EMAILS),
  devLoginEnabled: bool(process.env.DEV_LOGIN_ENABLED) && process.env.NODE_ENV !== 'production',

  googleMapsApiKey: process.env.GOOGLE_MAPS_API_KEY || '',
  serpApiKey: process.env.SERPAPI_KEY || '',
  googleCseKey: process.env.GOOGLE_CSE_KEY || '',
  googleCseCx: process.env.GOOGLE_CSE_CX || '',
  openaiApiKey: process.env.OPENAI_API_KEY || '',
  openaiModel: process.env.OPENAI_MODEL || 'gpt-4o-mini',
  overpassUrls: list(
    process.env.OVERPASS_URLS ||
      'https://overpass-api.de/api/interpreter,https://maps.mail.ru/osm/tools/overpass/api/interpreter,https://overpass.kumi.systems/api/interpreter,https://overpass.private.coffee/api/interpreter',
  ),
  enableFreeSearchFallback: bool(process.env.ENABLE_FREE_SEARCH_FALLBACK, false),

  enrichment: {
    apolloApiKey: process.env.APOLLO_API_KEY || '',
    hunterApiKey: process.env.HUNTER_API_KEY || '',
    maxCompanies: Math.max(0, Number(process.env.ENRICH_MAX_COMPANIES || 20)),
    maxDomainSearches: Math.max(0, Number(process.env.ENRICH_MAX_DOMAIN_SEARCHES || 20)),
    contactsPerCompany: Math.min(10, Math.max(1, Number(process.env.ENRICH_CONTACTS_PER_COMPANY || 5))),
  },

  adsense: {
    client: /^ca-pub-\d{10,20}$/.test(process.env.ADSENSE_CLIENT_ID || '') ? process.env.ADSENSE_CLIENT_ID : '',
    slots: {
      banner: process.env.ADSENSE_SLOT_BANNER || '',
      sidebar: process.env.ADSENSE_SLOT_SIDEBAR || '',
      inline: process.env.ADSENSE_SLOT_INLINE || '',
      rail: process.env.ADSENSE_SLOT_RAIL || '',
    },
    testMode: bool(process.env.ADSENSE_TEST_MODE, false),
    demo: bool(process.env.ADSENSE_DEMO, true),
  },

  videoAd: {
    required: bool(process.env.VIDEO_AD_REQUIRED, true),
    seconds: Math.max(5, Number(process.env.VIDEO_AD_SECONDS || 30)),
    exemptAdmins: bool(process.env.VIDEO_AD_EXEMPT_ADMINS, true),
    duringCampaigns: bool(process.env.VIDEO_AD_DURING_CAMPAIGNS, true),
    vastTag: /^https:\/\//.test(process.env.VIDEO_AD_VAST_TAG || '') ? process.env.VIDEO_AD_VAST_TAG : '',
  },

  emailMxCheck: bool(process.env.EMAIL_MX_CHECK, true),
  leadMatchMode: process.env.LEAD_MATCH_MODE === 'balanced' ? 'balanced' : 'strict',
  dataRetentionDays: Math.max(1, Number(process.env.DATA_RETENTION_DAYS || 7)),
  sharedLeadCache: bool(process.env.SHARED_LEAD_CACHE, true),

  mail: {
    redirectUri: process.env.GMAIL_REDIRECT_URI || `http://localhost:${process.env.PORT || 5000}/api/gmail/callback`,
    tokenKey: process.env.TOKEN_ENCRYPTION_KEY || '',
    dryRun: bool(process.env.EMAIL_DRY_RUN, false),
    dailyLimit: Math.max(1, Number(process.env.GMAIL_DAILY_LIMIT || 400)),
    sendIntervalMs: Math.max(0, Number(process.env.GMAIL_SEND_INTERVAL_MS || 4000)),
    maxRecipients: Math.max(1, Number(process.env.CAMPAIGN_MAX_RECIPIENTS || 2000)),
    publicUrl: (process.env.PUBLIC_API_URL || `http://localhost:${process.env.PORT || 5000}`).replace(/\/$/, ''),
  },

  maxConcurrentJobs: Number(process.env.MAX_CONCURRENT_JOBS || 2),
  crawlConcurrency: Number(process.env.CRAWL_CONCURRENCY || 5),
  crawlTimeoutMs: Number(process.env.CRAWL_TIMEOUT_MS || 10000),
  dailySearchLimit: Number(process.env.DAILY_SEARCH_LIMIT || 25),
};

if (env.nodeEnv === 'production' && env.googleClientSecret && !env.mail.tokenKey) {
  throw new Error('TOKEN_ENCRYPTION_KEY must be set in production when Gmail sending is enabled');
}

if (env.nodeEnv === 'production' && env.jwtSecret === 'change-me-in-production') {
  throw new Error('JWT_SECRET must be set in production');
}
