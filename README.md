# LeadGen AI (MERN)

AI-assisted B2B lead generation from **Google Maps**, **LinkedIn** and **Instagram**.
Type a request like _"HR email of IT companies in Ahmedabad"_, pick 20 / 40 / 60 leads, and the agent:

1. **Plans** the search (business type, location, target mailbox such as HR / sales / CEO) — OpenAI if configured, otherwise a rule-based planner.
2. **Discovers** businesses on Google Maps (Google Places API and SerpAPI Google Maps run in parallel when both keys are set and their results are merged; OpenStreetMap when neither is set) and company pages on LinkedIn / Instagram (SerpAPI or Google Programmable Search).
3. **Enriches** missing data with Apollo.io (company type/industry, what they do, services, employee count, decision-makers) and Hunter.io (domain email search with name and designation) when their keys are set — see *Starter enrichment* below.
4. **Resolves** each business's official website and **crawls** home / contact / careers / about pages for emails (incl. Cloudflare-obfuscated), phones and social links.
5. **Qualifies** leads: classifies emails (`hr`, `sales`, `support`, `generic`, `personal`), ranks the one matching your target role first and scores each lead.
6. **Exports** Excel or CSV reports (Top 20 / 40 / 60 / All). Excel has a `Summary` sheet (counts, email-type and source breakdown, Top 20/40/60 metrics) and a `Leads` sheet.

Other features:

- **Sign in with Google (Gmail)** — Google ID token verified on the server, app JWT session. Optional domain restriction, admin list by email.
- **Sponsored ads in the dashboard** — admins create ads for other companies (banner, sidebar, inline placements, priority, schedule); impressions & clicks are tracked with CTR in the admin panel.
- **Shared results** — every search is stored on the server. When any user runs the same kind of search (same business type, locations and sources, e.g. _"HR email of IT companies in Ahmedabad"_ and _"sales emails of IT company in ahmedabad"_), verified leads found in the last `DATA_RETENTION_DAYS` are reused instantly, and a fresh search only runs to fill the gap. Fresh results replace older copies of the same business.
- **7-day retention** — searches and their leads are deleted for every user, Admin included, `DATA_RETENTION_DAYS` (default 7) after they were run. A cleanup runs at startup and every hour. Lead groups, templates and campaign history are kept.
- **Master Admin** — Clients tab (every account with searches, leads, groups, campaigns, emails sent, Gmail connection and last login; enable/disable, change role, delete a client and all their data), client detail page, all leads and all searches across clients, Excel/CSV export of the client list and of any client's leads.
- Search history with live progress & agent log, all-leads view with filters, per-user daily search limit, job queue.

## Stack

| Layer    | Tech |
|----------|------|
| Frontend | React 19, Vite, React Router, Tailwind CSS, `@react-oauth/google` |
| Backend  | Node.js, Express, Mongoose, `google-auth-library`, ExcelJS, Cheerio, Zod, OpenAI SDK |
| Database | MongoDB |

```
server/   Express API  (src/routes, src/models, src/services/{sources,agent}, test/)
client/   React app    (src/pages, src/components, src/lib)
```

## Quick start

Requirements: Node 20+, MongoDB 6+ running locally (or a MongoDB Atlas URI).

```bash
npm run install:all
cp server/.env.example server/.env    # then edit values (see below)
npm --prefix server run seed:ads      # optional: 3 sample ads
npm run dev:server                    # http://localhost:5000
npm run dev:client                    # http://localhost:5173  (proxies /api to :5000)
```

Without any API keys the app still works: OpenStreetMap for businesses, rule-based agent, and (if you set `DEV_LOGIN_ENABLED=true`) an email-only developer login. LinkedIn/Instagram need a search key.

## Configuration (`server/.env`)

| Variable | Purpose |
|----------|---------|
| `MONGO_URI` | MongoDB connection string |
| `JWT_SECRET` | Long random string (**required** in production) |
| `CLIENT_ORIGIN` | Allowed CORS origin(s), comma separated |
| `GOOGLE_CLIENT_ID` | OAuth 2.0 **Web** client ID for Gmail sign-in |
| `ALLOWED_EMAIL_DOMAINS` | Optional, e.g. `gmail.com,yourcompany.com` |
| `ADMIN_EMAILS` | Emails that become admins (manage ads & users) |
| `DEV_LOGIN_ENABLED` | `true` for local email-only login (ignored in production) |
| `GOOGLE_MAPS_API_KEY` | Google Places API (New) — best Google Maps results |
| `SERPAPI_KEY` | SerpAPI — Google Maps (in parallel with Places when both are set) **and** LinkedIn/Instagram discovery |
| `GOOGLE_CSE_KEY`, `GOOGLE_CSE_CX` | Alternative for LinkedIn/Instagram discovery |
| `APOLLO_API_KEY` | Apollo.io: fills missing website, company type/industry, what the company does, services, employee count, founded year and decision-makers (name + designation) |
| `HUNTER_API_KEY` | Hunter.io Domain Search: finds emails (with name, designation, department) for leads still missing the requested role's email |
| `ENRICH_MAX_COMPANIES`, `ENRICH_MAX_DOMAIN_SEARCHES`, `ENRICH_CONTACTS_PER_COMPANY` | Credit caps per search: Apollo company lookups (default `20`), Hunter/Apollo contact lookups (default `20`), contacts kept per company (default `5`) |
| `OPENAI_API_KEY`, `OPENAI_MODEL` | Enables the LLM planner & AI summaries/notes |
| `ADSENSE_CLIENT_ID`, `ADSENSE_SLOT_{BANNER,SIDEBAR,INLINE,RAIL}` | Google AdSense publisher ID and display ad unit IDs |
| `ADSENSE_TEST_MODE`, `ADSENSE_DEMO` | `data-adtest="on"` for non-billed test ads; show demo creatives in unconfigured slots (default `true`) |
| `GOOGLE_CLIENT_SECRET`, `GMAIL_REDIRECT_URI` | OAuth client secret + redirect URI for **Connect Gmail** (email campaigns sent from the user's own Gmail) |
| `TOKEN_ENCRYPTION_KEY` | Key used to encrypt stored Gmail refresh tokens (AES-256-GCM). **Required** in production when Gmail sending is on |
| `PUBLIC_API_URL` | Public URL of this API, used for unsubscribe links in emails |
| `EMAIL_DRY_RUN` | `true` disables real sending; campaigns only run as test runs |
| `GMAIL_DAILY_LIMIT`, `GMAIL_SEND_INTERVAL_MS`, `CAMPAIGN_MAX_RECIPIENTS` | Per-user 24 h cap (default 400), delay between emails (default 4000 ms), max recipients per campaign (default 2000) |
| `VIDEO_AD_SECONDS` | Length of the mandatory video ad before search results (default `30`) |
| `DATA_RETENTION_DAYS`, `SHARED_LEAD_CACHE` | Days searches/leads are kept before deletion (default `7`); reuse matching leads across users (default `true`) |
| `VIDEO_AD_DURING_CAMPAIGNS` | Play video ads on the campaign page while emails are sending (default `true`, admins exempt) |
| `MAX_CONCURRENT_JOBS`, `CRAWL_CONCURRENCY`, `CRAWL_TIMEOUT_MS`, `DAILY_SEARCH_LIMIT` | Tuning / limits |

### Google (Gmail) sign-in setup

1. Google Cloud Console → **APIs & Services → Credentials → Create credentials → OAuth client ID → Web application**.
2. Authorised JavaScript origins: `http://localhost:5173` and your production URL.
3. Put the client ID into `GOOGLE_CLIENT_ID`. The login page loads it from `/api/auth/config`.

### Email campaigns from the user's Gmail

Workflow: **Lead groups** (save leads from a search, from All leads, or upload an Excel report with an `Email` column) → **Email templates** (ready-made website / software / marketing offers, merge fields `{{business}}`, `{{city}}`, `{{website}}`, `{{email}}`, `{{phone}}`, `{{category}}`, `{{my_name}}`, `{{my_email}}`, fallbacks like `{{city|your city}}`, optional AI draft) → **Campaigns** (pick group + template, preview, send). Each group has a **Mail history** tab with every campaign sent to it and, per contact, when it was last emailed and with which template.

Mail is only ever sent through the Gmail API as the logged-in user, after they click **Connect Gmail** and grant the `gmail.send` permission; the connected Gmail must be the same address they log in with. There is no platform mailbox. Without Gmail set up, campaigns run as **test runs** that record exactly who would get what, without sending.

Safety built in: one email per address per campaign, contacts already emailed with the same template are skipped by default, every email has an unsubscribe link + `List-Unsubscribe` header (unsubscribed contacts are never emailed again by that user), emails go out one at a time with a delay and a 24 h cap, and a campaign can be paused, resumed or cancelled. An email interrupted by a server restart is marked failed instead of being resent.

Setup:

1. In the same Google Cloud project as sign-in, enable the **Gmail API**.
2. **OAuth consent screen** → add the scope `https://www.googleapis.com/auth/gmail.send`. While the app is in *Testing*, add your users as test users; for public use Google requires app verification for this scope.
3. In the OAuth **Web** client, add the authorised redirect URI `http://localhost:5000/api/gmail/callback` (and `https://your-domain/api/gmail/callback` in production → `GMAIL_REDIRECT_URI`).
4. Set `GOOGLE_CLIENT_SECRET`, `TOKEN_ENCRYPTION_KEY` (e.g. `openssl rand -hex 32`) and `PUBLIC_API_URL`.

### Google Maps / search keys

- Places API (New): enable **Places API (New)** in the same project and create an API key → `GOOGLE_MAPS_API_KEY`.
- SerpAPI: https://serpapi.com/manage-api-key → `SERPAPI_KEY`.
- Programmable Search: create an engine searching the whole web → `GOOGLE_CSE_CX`, key from Custom Search JSON API → `GOOGLE_CSE_KEY`.

### Starter enrichment (fast, low cost): Places + Apollo.io + Hunter.io

When `GOOGLE_MAPS_API_KEY`, `APOLLO_API_KEY` and `HUNTER_API_KEY` are set, each search runs:

1. **Google Places API (New) Text Search** finds the businesses (name, address, phone, website, category, Maps link; permanently closed places are skipped).
2. **Apollo.io Organization Enrichment** (1 credit per company) fills what is missing: website (matched by name + city when Maps has none), company type/industry, what they do, services, employee count, founded year, LinkedIn.
3. The company website is crawled for public emails as before.
4. **Hunter.io Domain Search** runs only for domains where no email of the requested role (HR, sales…) was found, adding emails with the person's name, designation and department.
5. **Apollo.io People API Search** (no credits) adds decision-makers' first name and designation. Apollo does not return emails from this endpoint.

Each step is skipped when its key is missing, and a provider that returns an auth/quota error (401/402/403/429) is stopped for the rest of that search. Results show in the leads table and in the Excel/CSV columns *Company Type / Industry*, *What They Do*, *Services / Keywords*, *Employees*, *Founded*, *Key Contacts* and *Data Enriched By*.

- Apollo.io key: https://app.apollo.io/#/settings/integrations/api → `APOLLO_API_KEY` (Apollo requires an account registered with a work email for API access).
- Hunter.io key: https://hunter.io/api-keys → `HUNTER_API_KEY`.

### Google AdSense

AdSense ads appear on the user-facing pages: login, dashboard, searches, search results and all leads. They are never shown on the Admin pages. Each ad sits in one of four slots:

| Slot | Where | Size |
|------|-------|------|
| `banner` | Top of every user page, under result tables, login page | responsive leaderboard (728×90) |
| `sidebar` | Left navigation | 200×200 |
| `inline` | Right rail on wide screens (in the dashboard column on smaller screens) | 300×250 |
| `rail` | Sticky right rail, `xl` screens | 300×600 |

To turn on real ads:

1. In AdSense, add your production domain as a site and get it approved.
2. Create one **Display ad** unit for each slot.
3. Set `ADSENSE_CLIENT_ID=ca-pub-…` and the matching `ADSENSE_SLOT_*` IDs in `server/.env`.
4. Express serves `/ads.txt` automatically, built from `ADSENSE_CLIENT_ID`.

Until then, every slot shows a labelled demo ad creative. Set `ADSENSE_DEMO=false` to hide the demo ads. The sponsored ads you manage in **Admin → Advertisements** keep running alongside AdSense.

## API overview

| Method & path | Description |
|---------------|-------------|
| `GET /api/auth/config` · `POST /api/auth/google` · `GET /api/auth/me` | Auth |
| `GET /api/searches/capabilities` · `POST /api/searches/preview-plan` | Provider info, agent plan preview |
| `POST /api/searches` `{ query, sources[], targetCount: 20\|40\|60 }` | Start a lead search job |
| `GET /api/searches` · `GET /api/searches/:id` · `DELETE /api/searches/:id` | Jobs, progress & logs |
| `GET /api/leads?jobId&emailType&source&hasEmail&search` · `GET /api/leads/stats` | Leads |
| `GET /api/leads/export?jobId=&count=20\|40\|60\|all&format=xlsx\|csv` | Excel or CSV download |
| `GET /api/ads?placement=` · `POST /api/ads/:id/click` | Dashboard ads |
| `GET /api/adsense/config` · `GET /ads.txt` | AdSense publisher/slot config (public), ads.txt |
| `GET /api/ads/video/next` · `POST /api/ads/:id/video-complete` | Video ads shown while a campaign sends |
| `GET /api/gmail/status` · `POST /api/gmail/connect` · `GET /api/gmail/callback` · `POST /api/gmail/disconnect` | Gmail send authorization |
| `/api/groups` · `POST /api/groups/:id/members {jobId\|leadIds\|filters}` · `POST /api/groups/:id/import` (xlsx body) · `GET /api/groups/:id/history` | Lead groups |
| `/api/templates` · `GET /api/templates/meta` · `POST /api/templates/preview` · `POST /api/templates/draft` | Email templates |
| `/api/campaigns` `{ groupId, templateId, mode: gmail\|dry_run }` · `POST /api/campaigns/:id/{pause,resume,cancel}` · `POST /api/campaigns/test` | Campaigns |
| `GET\|POST /api/unsubscribe/:token` | Public unsubscribe link |
| `/api/admin/{stats,ads}` | Admin stats, ads CRUD |
| `GET /api/admin/users?search&role&status` · `GET /api/admin/users/export?format` · `GET\|PATCH\|DELETE /api/admin/users/:id` | Clients: list with usage, export, full detail, role/status, delete with all data |
| `GET /api/admin/leads?owner&jobId&search&emailType&source&hasEmail` · `GET /api/admin/leads/export?…&count&format` · `DELETE /api/admin/leads/:id` | Leads across all clients |
| `GET /api/admin/searches?owner&search&status` · `DELETE /api/admin/searches/:id` | Searches across all clients |

## Scripts

```bash
npm run lint     # server + client ESLint
npm test         # server unit tests (planner, email extraction/ranking)
npm run build    # client production build
npm start        # production: Express serves client/dist and the API on one port
```

## Production

Build the client (`npm run build`), set `NODE_ENV=production`, a strong `JWT_SECRET`, `MONGO_URI`, `GOOGLE_CLIENT_ID`, `CLIENT_ORIGIN`, then `npm start`. Express serves `client/dist` and the API from the same port.

## Notes on data sources

The app only uses public business listings, search-engine results and companies' own public websites; it never logs into LinkedIn or Instagram. Respect each provider's terms, robots rules and local anti-spam / data-protection laws when contacting leads.
