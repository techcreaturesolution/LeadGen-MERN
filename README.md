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
| `MAX_CONCURRENT_JOBS`, `CRAWL_CONCURRENCY`, `CRAWL_TIMEOUT_MS`, `DAILY_SEARCH_LIMIT` | Tuning / limits |

### Google (Gmail) sign-in setup

1. Google Cloud Console → **APIs & Services → Credentials → Create credentials → OAuth client ID → Web application**.
2. Authorised JavaScript origins: `http://localhost:5173` and your production URL.
3. Put the client ID into `GOOGLE_CLIENT_ID`. The login page loads it from `/api/auth/config`.

### Google Maps / search keys

- Places API (New): enable **Places API (New)** in the same project and create an API key → `GOOGLE_MAPS_API_KEY`.
- SerpAPI: https://serpapi.com/manage-api-key → `SERPAPI_KEY`.
- Programmable Search: create an engine searching the whole web → `GOOGLE_CSE_CX`, key from Custom Search JSON API → `GOOGLE_CSE_KEY`.

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
| `/api/admin/{stats,ads,users}` | Admin (ads CRUD, user roles) |

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
