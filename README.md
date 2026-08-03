# Graveyard

Digital platform celebrating exceptional creative work that never shipped — rejected, shelved, unpublished, or abandoned.

## Stack

- Next.js (App Router) + TypeScript + Tailwind
- SQLite via Drizzle ORM + better-sqlite3
- Cookie JWT sessions (jose) + bcrypt passwords
- Local file uploads under `data/uploads`
- Optional Resend email + Google OAuth

## Setup

```bash
cp .env.example .env.local
# Optional in development — AUTH_SECRET falls back to a local default.
# Required in production: openssl rand -base64 32
npm install
npm run db:seed
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

### Environment

| Variable | Purpose |
|----------|---------|
| `AUTH_SECRET` | JWT signing secret (required in production) |
| `APP_URL` | Canonical URL for email links + Google OAuth callback |
| `RESEND_API_KEY` / `RESEND_FROM` | Send verify/reset emails (otherwise logged to console) |
| `GOOGLE_CLIENT_ID` / `GOOGLE_CLIENT_SECRET` | Google sign-in |

Google redirect URI: `{APP_URL}/api/auth/google/callback`

### Deploy notes

- Set `AUTH_SECRET` in the environment before running in production.
- Uploads are stored on the local filesystem under `data/uploads` (single-node only).
- SQLite database lives at `data/graveyard.db`.
- **Vercel:** the app stores SQLite + uploads under `/tmp` (the only writable path). Data is **ephemeral** — cold starts / new instances reset it. For a real production deploy, move to Turso/Postgres + object storage. Also set `AUTH_SECRET` and `APP_URL` in the Vercel project env.

### Demo accounts

Password for all: `password123`

| Role    | Email                     |
|---------|---------------------------|
| Admin   | admin@graveyard.studio    |
| Judge   | judge@graveyard.studio    |
| Creator | creator@example.com       |
| Agency  | studio@wura.studio        |

## Product surfaces

- **Public** — explore feed, showcase, categories, events, leaderboards, creator/agency profiles
- **Auth** — login/register, Google OAuth, forgot/reset password, email verification
- **Creator portal** — submit (after verify), draft, upload assets, track status, settings
- **Judge portal** — review queue, score, comment, shortlist
- **Admin portal** — submissions, categories, judges, events CRUD, analytics
