# LeadGen AI (MERN)

AI-assisted B2B lead generation from **Google Maps**, **LinkedIn** and **Instagram**.
Type a request like _"HR email of IT companies in Ahmedabad"_, pick 20 / 40 / 60 leads, and the agent:

1. **Plans** the search (business type, location, target mailbox such as HR / sales / CEO) — OpenAI if configured, otherwise a rule-based planner.
2. **Discovers** businesses on Google Maps (Places API → SerpAPI → OpenStreetMap fallback) and company pages on LinkedIn / Instagram (SerpAPI or Google Programmable Search).
3. **Resolves** each business's official website and **crawls** home / contact / careers / about pages for emails (incl. Cloudflare-obfuscated), phones and social links.
4. **Qualifies** leads: classifies emails (`hr`, `sales`, `support`, `generic`, `personal`), ranks the one matching your target role first and scores each lead.
5. **Exports** Excel reports (Top 20 / 40 / 60 / All) with a `Summary` sheet (counts, email-type and source breakdown, Top 20/40/60 metrics) and a `Leads` sheet.

Other features:

- **Sign in with Google (Gmail)** — Google ID token verified on the server, app JWT session. Optional domain restriction, admin list by email.
- **Sponsored ads in the dashboard** — admins create ads for other companies (banner, sidebar, inline placements, priority, schedule); impressions & clicks are tracked with CTR in the admin panel.
- **New Jobs** — job seekers (Google sign-in) pick Fresher / Experienced, type a prompt, choose category, **education qualification**, state and city, and get a table of Indian jobs with description, company, address, email, phone, salary, source and a direct **Apply** link to the original posting. See [New Jobs](#new-jobs).
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
| `SERPAPI_KEY` | SerpAPI — Google Maps fallback **and** LinkedIn/Instagram discovery |
| `GOOGLE_CSE_KEY`, `GOOGLE_CSE_CX` | Alternative for LinkedIn/Instagram discovery |
| `OPENAI_API_KEY`, `OPENAI_MODEL` | Enables the LLM planner & AI summaries/notes |
| `ADSENSE_CLIENT_ID`, `ADSENSE_SLOT_{BANNER,SIDEBAR,INLINE,RAIL}` | Google AdSense publisher ID and display ad unit IDs |
| `ADSENSE_TEST_MODE`, `ADSENSE_DEMO` | `data-adtest="on"` for non-billed test ads; show demo creatives in unconfigured slots (default `true`) |
| `MAX_CONCURRENT_JOBS`, `CRAWL_CONCURRENCY`, `CRAWL_TIMEOUT_MS`, `DAILY_SEARCH_LIMIT` | Tuning / limits |

### Google (Gmail) sign-in setup

1. Google Cloud Console → **APIs & Services → Credentials → Create credentials → OAuth client ID → Web application**.
2. Authorised JavaScript origins: `http://localhost:5173` and your production URL.
3. Put the client ID into `GOOGLE_CLIENT_ID`. The login page loads it from `/api/auth/config`.

### Google Maps / search keys

- Places API (New): enable **Places API (New)** in the same project and create an API key → `GOOGLE_MAPS_API_KEY`.
- SerpAPI: https://serpapi.com/manage-api-key → `SERPAPI_KEY`.
- Programmable Search: create an engine searching the whole web → `GOOGLE_CSE_CX`, key from Custom Search JSON API → `GOOGLE_CSE_KEY`.

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

## New Jobs

`/jobs` aggregates public job postings from across India:

| Source | How |
|--------|-----|
| Jobs posted by admins on this portal | MongoDB (`Admin → Jobs`) |
| Google Jobs (Google's index of Naukri, Indeed, LinkedIn, Apna, WorkIndia, foundit, company career pages, …) | SerpAPI `engine=google_jobs` (`SERPAPI_KEY`) |
| Job boards (Apna, WorkIndia, Naukri, Indeed, LinkedIn jobs, foundit, Shine, Internshala) | `site:` web search (SerpAPI or Google CSE) |
| Public hiring posts on X, LinkedIn posts, Facebook, Instagram | `site:` web search |
| Company career pages | web search for "careers / apply now" pages |

For each search the **job agent**:

1. Builds the query from the prompt, category, education and location (OpenAI if configured, otherwise rules).
2. Collects results in parallel, then normalises them: experience level, education (10th, 12th, ITI, Diploma, any graduate, B.E./B.Tech, B.Com, MBA, …), city / state, posted date and platform.
3. Removes duplicates (same title + company + city) and merges their apply links.
4. **Verifies** listings against the original job page. A job counts as verified when it's a portal job, a Google Jobs listing, a page with matching `JobPosting` structured data, or a page where the AI agent (`OPENAI_API_KEY`) confirms it is an open posting. The agent only keeps values that appear word for word in the page text. Expired, closed, filled or 404 postings are dropped. **Show only verified jobs** is on by default.
5. Enriches jobs with public contact details: emails and phones from the posting, the company's Google Maps listing and its website contact pages.

Seekers only see jobs that fit their qualification. For example, a B.Tech seeker gets "any graduate" and "12th pass" jobs but not B.Com-only jobs. Jobs that don't state an education requirement still appear.

**Video ads:** every job search opens a video ad that plays for `VIDEO_AD_SECONDS` (default 60). The search runs in the background and results show when the ad ends. Ads are picked in this order:
1. `VIDEO_AD_TAG_URL`, a VAST ad tag from Google Ad Manager / AdSense for video, played with the Google IMA SDK.
2. Admin sponsored ads with the **Video ad** placement (MP4 URL).
3. Demo creatives.

AdSense display units also appear on the New Jobs page.

`npm --prefix server run seed:jobs` inserts 10 sample portal jobs for local testing.

## API overview

| Method & path | Description |
|---------------|-------------|
| `GET /api/auth/config` · `POST /api/auth/google` · `GET /api/auth/me` | Auth |
| `GET /api/searches/capabilities` · `POST /api/searches/preview-plan` | Provider info, agent plan preview |
| `POST /api/searches` `{ query, sources[], targetCount: 20\|40\|60 }` | Start a lead search job |
| `GET /api/searches` · `GET /api/searches/:id` · `DELETE /api/searches/:id` | Jobs, progress & logs |
| `GET /api/leads?jobId&emailType&source&hasEmail&search` · `GET /api/leads/stats` | Leads |
| `GET /api/leads/export?jobId=&count=20\|40\|60\|all` | Excel download |
| `GET /api/ads?placement=` · `POST /api/ads/:id/click` | Dashboard ads |
| `GET /api/adsense/config` · `GET /ads.txt` | AdSense publisher/slot config (public), ads.txt |
| `GET /api/jobs/meta` | Job categories, education levels, states, providers |
| `POST /api/jobs/search` `{ level, prompt, category, education, state, city, postedWithin, verifiedOnly }` | Aggregate, verify and return jobs |
| `GET /api/jobs/searches` · `GET /api/jobs/:id` · `POST /api/jobs/:id/apply` | Job search history, job details, apply redirect URL (click tracked) |
| `/api/admin/{stats,ads,users,jobs}` | Admin (ads CRUD, portal jobs CRUD, user roles) |

## Scripts

```bash
npm run lint     # server + client ESLint
npm test         # server unit tests (planner, email extraction/ranking, job parsing/education/verification)
npm run build    # client production build
npm start        # production: Express serves client/dist and the API on one port
```

## Production

Build the client (`npm run build`), set `NODE_ENV=production`, a strong `JWT_SECRET`, `MONGO_URI`, `GOOGLE_CLIENT_ID`, `CLIENT_ORIGIN`, then `npm start`. Express serves `client/dist` and the API from the same port.

## Notes on data sources

The app only uses public business listings, search-engine results and companies' own public websites; it never logs into LinkedIn or Instagram. Respect each provider's terms, robots rules and local anti-spam / data-protection laws when contacting leads.
