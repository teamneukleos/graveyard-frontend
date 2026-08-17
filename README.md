# Graveyard

Digital platform celebrating exceptional creative work that never shipped — rejected, shelved, unpublished, or abandoned.

## Stack

- Next.js (App Router) + TypeScript + Tailwind
- NestJS API (`graveyard-api`) + PostgreSQL for all domain data
- Auth: Nest Bearer JWT stored in httpOnly cookie `graveyard_token` via Next BFF
- Phase 2: public + portal + admin **reads** go through Nest (no SQLite)

## Setup

1. Start **graveyard-api** on port 3000 (Postgres + Nest). See that repo’s README.
2. In this app:

```bash
cp .env.example .env.local
# Set JWT_SECRET to the same value as graveyard-api
npm install
npm run dev
```

Open [http://localhost:3001](http://localhost:3001).

Login/register hit Nest through `/api/auth/*`. Seed admin (from API): `admin@graveyard.local` / `ChangeMeAdmin1!`

### Environment

| Variable | Purpose |
|----------|---------|
| `GRAVEYARD_API_URL` | Nest API base URL (default `http://localhost:3000`) |
| `JWT_SECRET` | Must match Nest `JWT_SECRET` (middleware role checks) |
| `APP_URL` | Canonical frontend URL (`http://localhost:3001` in local dev) |

### Notes

- No SQLite / Python / native module build required for this frontend.
- Events, Google OAuth, and email verify/reset are parked until added to Nest.
- Some admin tools return 501 until those Nest endpoints are wired in the UI.
- Ensure Nest `CORS_ORIGINS` includes `http://localhost:3001`.

## Product surfaces

- **Public** — explore feed, showcase, categories, leaderboards, creator profiles
- **Auth** — login/register (Nest)
- **Creator portal** — drafts, publish, assets (Nest)
- **Judge portal** — award-cycle queue (Nest)
- **Admin portal** — partial Nest wiring; some legacy admin actions stubbed
