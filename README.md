# NexaVest

MERN investment and 3-level referral platform for the **Nexachain AI** technical assessment.

One Vercel deployment serves the React dashboard and the Express API under `/api`. MongoDB Atlas stores data. Daily ROI runs via Vercel Cron in production and `node-cron` locally.

## Features

### Backend
- JWT register / login with bcrypt password hashing
- Change password (authenticated)
- Investments create + list (amounts stored as integer paise)
- Transactional 3-level referral income: **5% / 3% / 2%** on new investments
- Idempotent daily ROI cron (unique per investment + date)
- Wallet history with idempotency keys
- Referral direct list + nested tree (max depth 10)
- Dashboard summary + earnings history
- Zod validation, Helmet, CORS, auth rate limiting, centralized errors

### Frontend
- Login / Register
- Dashboard sections: **Overview**, **Investments**, **Earnings**, **Network**, **Settings**
- Metric cards, 7-day dual-axis earnings graph, investment list, referral network
- New investment modal with client-side validation
- Toast / alert feedback for API success and errors
- Change password in Settings
- Responsive layout with icon sidebar + mobile nav

## Tech stack

| Layer | Stack |
| --- | --- |
| Frontend | React 19, Vite, TypeScript, React Query, React Hook Form |
| Backend | Express 5, Mongoose 9, Zod, JWT, bcryptjs |
| Database | MongoDB Atlas (replica set required for transactions) |
| Deploy | Vercel (SPA + serverless `/api` + Cron) |

## Project structure

```text
api/                  Vercel serverless entry (re-exports Express app)
server/
  config/             Env, database, business rules
  controllers/        HTTP adapters
  jobs/               Local node-cron scheduler
  middleware/         Auth, validation, errors
  models/             Mongoose schemas
  routes/             REST routes
  services/           Domain logic + transactions
  scripts/            seed, clear, backdate-roi helpers
src/                  Vite React app (pages, components, lib)
tests/                Domain / validation / idempotency tests
docs/API.md           Short API reference
server/docs/openapi.ts  OpenAPI 3 spec (Swagger source)
vercel.json           Build, rewrites, daily ROI cron
```

## Local setup

**Requirements:** Node.js 20+, MongoDB Atlas (or local replica set).  
Standalone MongoDB does **not** support transactions used by this app.

1. Install dependencies:

```bash
npm install
```

2. Copy env file and fill in real values:

```bash
cp .env.example .env
```

3. Start the API (terminal 1):

```bash
npm run dev:api
```

4. Start the React app (terminal 2):

```bash
npm run dev
```

5. Open [http://localhost:5173](http://localhost:5173).  
   Vite proxies `/api` → `http://127.0.0.1:3000`.

### Optional local scripts

| Command | Purpose |
| --- | --- |
| `npm run seed` | Sample users / investments (blocked in production) |
| `npm run clear` | Wipe database collections |
| `npm run backdate-roi` | Backdate sample data and run ROI for prior UTC days |
| `npm run dev:cron` | Local daily ROI scheduler (`00:00 UTC`) |
| `npm run lint` | Lint |
| `npm test` | Unit / integration tests |
| `npm run build` | Production frontend build |

Seed login (after `npm run seed`):

- Email: `demo@nexavest.local`
- Password: `DemoPass1!`

## Environment variables

Copy from `.env.example`. Never commit `.env`. Never use `VITE_` for secrets.

| Variable | Required | Purpose |
| --- | --- | --- |
| `MONGODB_URI` | Yes | Atlas / replica-set connection string |
| `JWT_SECRET` | Yes | JWT signing secret (min 32 characters) |
| `JWT_EXPIRES_IN` | No | Token lifetime (default `7d`) |
| `CRON_SECRET` | Yes | Protects `GET /api/cron/daily-roi` (min 24 characters) |
| `CLIENT_ORIGIN` | Yes in prod | Allowed CORS origin (local: `http://localhost:5173`) |
| `NODE_ENV` | No | `development` \| `test` \| `production` |
| `PORT` | No | Local API port (default `3000`) |

## API documentation (Swagger)

With the API running (`npm run dev:api`):

| Resource | URL |
| --- | --- |
| Interactive Swagger UI | [http://127.0.0.1:3000/api/docs](http://127.0.0.1:3000/api/docs) |
| OpenAPI JSON | [http://127.0.0.1:3000/api/docs.json](http://127.0.0.1:3000/api/docs.json) |
| Via Vite proxy | [http://localhost:5173/api/docs](http://localhost:5173/api/docs) |

How to use:

1. Open Swagger UI  
2. Try **Auth → Register** or **Login**  
3. Copy `data.token` from the response  
4. Click **Authorize**, paste the JWT, then call protected routes  

Edit `server/docs/openapi.ts` whenever you add or change endpoints — that file is the single source for Swagger.

## API overview

Short markdown reference: [docs/API.md](docs/API.md).

| Method | Path | Auth | Description |
| --- | --- | --- | --- |
| `POST` | `/api/auth/register` | No | Register (+ optional referral code) |
| `POST` | `/api/auth/login` | No | Login |
| `POST` | `/api/auth/change-password` | JWT | Change password |
| `POST` | `/api/investments` | JWT | Create investment + level income |
| `GET` | `/api/investments` | JWT | List investments |
| `GET` | `/api/dashboard/summary` | JWT | Metrics / wallet |
| `GET` | `/api/dashboard/history` | JWT | ROI + referral history |
| `GET` | `/api/referrals/direct` | JWT | Direct referrals |
| `GET` | `/api/referrals/tree` | JWT | Nested referral tree |
| `GET` | `/api/cron/daily-roi` | Bearer `CRON_SECRET` | Process daily ROI |
| `GET` | `/api/health` | No | Liveness (no DB) |

Response shape: `{ "success": true, "data": ... }`  
Errors: `{ "success": false, "error": { "code", "message" } }`

## Business rules

- Currency: **INR** (persisted as integer **paise**)
- Referral levels on investment create: **5% / 3% / 2%**
- Investment + referral payouts run in **one MongoDB transaction**
- Daily ROI starts the **UTC day after** investment creation
- ROI history unique on `(investment, earningDate)` — safe to re-run cron
- Referral tree traversal capped at **10** levels

## Deploy to Vercel (step by step)

### 1. Prepare MongoDB Atlas

1. Create a free cluster at [MongoDB Atlas](https://www.mongodb.com/cloud/atlas).
2. Database Access → create a DB user with password.
3. Network Access → allow `0.0.0.0/0` (or Vercel IPs if you prefer tighter rules).
4. Connect → Drivers → copy the URI, e.g.  
   `mongodb+srv://USER:PASS@cluster.mongodb.net/nexavest?retryWrites=true&w=majority`

### 2. Push code to GitHub

```bash
git add .
git commit -m "Prepare NexaVest for Vercel deployment"
git push -u origin main
```

(Use your real branch name if it is not `main`.)

### 3. Import project in Vercel

1. Go to [vercel.com](https://vercel.com) → **Add New…** → **Project**.
2. Import the GitHub repository.
3. Framework Preset: **Vite** (already set in `vercel.json`).
4. Root Directory: leave as repository root (do **not** set a subfolder).
5. Build Command: `npm run build` (from `vercel.json`).
6. Output Directory: `dist`.
7. Do **not** deploy yet — add env vars first (next step).

### 4. Add environment variables in Vercel

Project → **Settings** → **Environment Variables** → add for **Production** (and Preview if you want):

| Name | Example / notes |
| --- | --- |
| `MONGODB_URI` | Your Atlas connection string |
| `JWT_SECRET` | Long random string (≥ 32 chars) |
| `JWT_EXPIRES_IN` | `7d` |
| `CRON_SECRET` | Different long random string (≥ 24 chars) |
| `CLIENT_ORIGIN` | Your Vercel URL, e.g. `https://assesment-six-chi.vercel.app` |
| `NODE_ENV` | `production` |

Generate secrets locally if needed:

```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

**Important:** After the first deploy you will know the exact Vercel URL. Set `CLIENT_ORIGIN` to that URL (no trailing slash), then **redeploy** so CORS matches.

When `CRON_SECRET` is set, Vercel Cron sends  
`Authorization: Bearer <CRON_SECRET>` to `/api/cron/daily-roi` at **00:00 UTC**.

### 5. Deploy

Click **Deploy**. Wait for the build to finish.

`vercel.json` already:

- Builds the Vite SPA into `dist`
- Rewrites `/api/*` → Express serverless handler `api/index.ts`
- Falls back other routes to `index.html` (SPA routing)
- Schedules daily ROI cron at `0 0 * * *`

### 6. Verify production

1. Open `https://YOUR-PROJECT.vercel.app`
2. Register a user and log in
3. Create an investment
4. Check health: `https://YOUR-PROJECT.vercel.app/api/health`
5. Manually test cron (optional):

```bash
curl -H "Authorization: Bearer YOUR_CRON_SECRET" https://YOUR-PROJECT.vercel.app/api/cron/daily-roi
```

6. Confirm `CLIENT_ORIGIN` matches the live URL; redeploy if you changed it after first deploy.

### 7. Optional seed on Atlas

From your machine (with production `MONGODB_URI` in a local `.env` — **do not** set `NODE_ENV=production` for seed, or seed will refuse):

```bash
npm run seed
```

Prefer seeding only against a non-production / demo database.

## Vercel Cron note

Hobby plans support cron, but schedules may be limited. This project uses once daily at midnight UTC. Production does **not** run `node-cron`; only the HTTP cron route is used.

## Quality checks before submission

```bash
npm run lint
npm test
npm run build
```

## Assessment mapping

| Requirement | Implementation |
| --- | --- |
| User auth (JWT) | `/api/auth/register`, `/api/auth/login` |
| Investment APIs | `/api/investments` |
| Daily ROI job | `/api/cron/daily-roi` + Vercel Cron / local `dev:cron` |
| Level income 5/3/2% | On investment create (transactional) |
| Dashboard cards | Overview summary metrics |
| Histories | Earnings section + dashboard history API |
| Referral tree | Network section + `/api/referrals/tree` |
| Charts | 7-day dual-series earnings graph |
| Idempotent cron | Unique indexes + wallet idempotency keys |

## License

Private assessment submission — not licensed for redistribution.
