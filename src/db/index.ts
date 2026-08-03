import Database from "better-sqlite3";
import { count } from "drizzle-orm";
import { drizzle } from "drizzle-orm/better-sqlite3";
import { v4 as uuid } from "uuid";
import { CATEGORIES, CATEGORY_COLORS } from "../lib/constants";
import { CREATOR_EVENTS } from "../lib/events-seed";
import { getDbPath } from "../lib/paths";
import * as schema from "./schema";
import { categories, events } from "./schema";

const dbPath = getDbPath();
const sqlite = new Database(dbPath);
sqlite.pragma("journal_mode = WAL");
sqlite.pragma("foreign_keys = ON");

sqlite.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id TEXT PRIMARY KEY,
    email TEXT NOT NULL UNIQUE,
    password_hash TEXT NOT NULL,
    name TEXT NOT NULL,
    role TEXT NOT NULL DEFAULT 'creator',
    agency_name TEXT,
    agency_slug TEXT,
    bio TEXT NOT NULL DEFAULT '',
    avatar_filename TEXT,
    email_verified_at TEXT,
    google_id TEXT,
    active INTEGER NOT NULL DEFAULT 1,
    created_at TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS categories (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL UNIQUE,
    slug TEXT NOT NULL UNIQUE,
    sort_order INTEGER NOT NULL DEFAULT 0,
    active INTEGER NOT NULL DEFAULT 1,
    color_bg TEXT NOT NULL DEFAULT '#111111',
    color_fg TEXT NOT NULL DEFAULT '#ffffff',
    created_at TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS submissions (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL REFERENCES users(id),
    title TEXT NOT NULL,
    category TEXT NOT NULL,
    submitter_type TEXT NOT NULL DEFAULT 'individual',
    team_members TEXT NOT NULL DEFAULT '',
    year_created INTEGER NOT NULL,
    concept TEXT NOT NULL DEFAULT '',
    why_never_live TEXT NOT NULL DEFAULT '',
    status TEXT NOT NULL DEFAULT 'draft',
    published INTEGER NOT NULL DEFAULT 0,
    showcase_year INTEGER,
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL,
    submitted_at TEXT
  );

  CREATE TABLE IF NOT EXISTS assets (
    id TEXT PRIMARY KEY,
    submission_id TEXT NOT NULL REFERENCES submissions(id) ON DELETE CASCADE,
    filename TEXT NOT NULL,
    original_name TEXT NOT NULL,
    mime_type TEXT NOT NULL,
    size INTEGER NOT NULL,
    created_at TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS reviews (
    id TEXT PRIMARY KEY,
    submission_id TEXT NOT NULL REFERENCES submissions(id) ON DELETE CASCADE,
    judge_id TEXT NOT NULL REFERENCES users(id),
    score REAL NOT NULL,
    comment TEXT NOT NULL DEFAULT '',
    shortlisted INTEGER NOT NULL DEFAULT 0,
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS votes (
    id TEXT PRIMARY KEY,
    submission_id TEXT NOT NULL REFERENCES submissions(id) ON DELETE CASCADE,
    user_id TEXT REFERENCES users(id),
    guest_name TEXT,
    guest_email TEXT,
    ip_hash TEXT,
    voter_session_id TEXT,
    category TEXT NOT NULL,
    created_at TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS events (
    id TEXT PRIMARY KEY,
    title TEXT NOT NULL,
    type TEXT NOT NULL,
    city TEXT NOT NULL,
    venue TEXT NOT NULL,
    starts_at TEXT NOT NULL,
    format TEXT NOT NULL,
    capacity INTEGER NOT NULL,
    blurb TEXT NOT NULL DEFAULT '',
    active INTEGER NOT NULL DEFAULT 1,
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS event_rsvps (
    id TEXT PRIMARY KEY,
    event_id TEXT NOT NULL,
    user_id TEXT NOT NULL REFERENCES users(id),
    created_at TEXT NOT NULL,
    UNIQUE(event_id, user_id)
  );

  CREATE TABLE IF NOT EXISTS auth_tokens (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    type TEXT NOT NULL,
    token_hash TEXT NOT NULL UNIQUE,
    expires_at TEXT NOT NULL,
    used_at TEXT,
    created_at TEXT NOT NULL
  );

  CREATE INDEX IF NOT EXISTS votes_category_idx ON votes(category);
  CREATE INDEX IF NOT EXISTS votes_user_idx ON votes(user_id);
  CREATE INDEX IF NOT EXISTS votes_created_idx ON votes(created_at);
  CREATE INDEX IF NOT EXISTS event_rsvps_event_idx ON event_rsvps(event_id);
  CREATE INDEX IF NOT EXISTS events_starts_idx ON events(starts_at);
`);

function hasColumn(table: string, column: string) {
  const cols = sqlite.prepare(`PRAGMA table_info(${table})`).all() as { name: string }[];
  return cols.some((c) => c.name === column);
}

const userMigrations: [string, string][] = [
  ["active", `ALTER TABLE users ADD COLUMN active INTEGER NOT NULL DEFAULT 1`],
  ["avatar_filename", `ALTER TABLE users ADD COLUMN avatar_filename TEXT`],
  ["agency_slug", `ALTER TABLE users ADD COLUMN agency_slug TEXT`],
  ["bio", `ALTER TABLE users ADD COLUMN bio TEXT NOT NULL DEFAULT ''`],
  ["email_verified_at", `ALTER TABLE users ADD COLUMN email_verified_at TEXT`],
  ["google_id", `ALTER TABLE users ADD COLUMN google_id TEXT`],
];

for (const [column, sql] of userMigrations) {
  if (!hasColumn("users", column)) {
    sqlite.exec(sql);
  }
}

sqlite.exec(`CREATE INDEX IF NOT EXISTS users_agency_slug_idx ON users(agency_slug)`);

// Guest voting columns + rebuild if still on legacy NOT NULL user_id
if (!hasColumn("votes", "voter_session_id")) {
  sqlite.exec(`
    CREATE TABLE votes_v2 (
      id TEXT PRIMARY KEY,
      submission_id TEXT NOT NULL REFERENCES submissions(id) ON DELETE CASCADE,
      user_id TEXT REFERENCES users(id),
      guest_name TEXT,
      guest_email TEXT,
      ip_hash TEXT,
      voter_session_id TEXT,
      category TEXT NOT NULL,
      created_at TEXT NOT NULL
    );
    INSERT INTO votes_v2 (id, submission_id, user_id, category, created_at)
      SELECT id, submission_id, user_id, category, created_at FROM votes;
    DROP TABLE votes;
    ALTER TABLE votes_v2 RENAME TO votes;
  `);
}

sqlite.exec(`
  CREATE INDEX IF NOT EXISTS votes_category_idx ON votes(category);
  CREATE INDEX IF NOT EXISTS votes_user_idx ON votes(user_id);
  CREATE INDEX IF NOT EXISTS votes_created_idx ON votes(created_at);
  CREATE INDEX IF NOT EXISTS votes_session_idx ON votes(voter_session_id);
  CREATE INDEX IF NOT EXISTS votes_ip_idx ON votes(ip_hash);
  CREATE UNIQUE INDEX IF NOT EXISTS votes_submission_user_uidx
    ON votes(submission_id, user_id) WHERE user_id IS NOT NULL;
  CREATE UNIQUE INDEX IF NOT EXISTS votes_submission_session_uidx
    ON votes(submission_id, voter_session_id) WHERE voter_session_id IS NOT NULL;
  CREATE UNIQUE INDEX IF NOT EXISTS votes_submission_ip_uidx
    ON votes(submission_id, ip_hash) WHERE ip_hash IS NOT NULL;
`);

export const db = drizzle(sqlite, { schema });

function slugify(name: string) {
  return name
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

async function ensureCategoriesSeeded() {
  const [{ total }] = await db.select({ total: count() }).from(categories);
  if (total > 0) return;

  const now = new Date().toISOString();
  await db.insert(categories).values(
    CATEGORIES.map((name, index) => {
      const colors = CATEGORY_COLORS[name];
      return {
        id: uuid(),
        name,
        slug: slugify(name),
        sortOrder: index,
        active: true,
        colorBg: colors.bg,
        colorFg: colors.fg,
        createdAt: now,
      };
    }),
  );
}

async function ensureEventsSeeded() {
  const [{ total }] = await db.select({ total: count() }).from(events);
  if (total > 0) return;

  const now = new Date().toISOString();
  await db.insert(events).values(
    CREATOR_EVENTS.map((event) => ({
      id: event.id,
      title: event.title,
      type: event.type,
      city: event.city,
      venue: event.venue,
      startsAt: event.startsAt,
      format: event.format,
      capacity: event.capacity,
      blurb: event.blurb,
      active: true,
      createdAt: now,
      updatedAt: now,
    })),
  );
}

let dbReady: Promise<void> | null = null;

/** Await before reading public/portal data so Vercel /tmp boots with demo content. */
export function ensureDbReady() {
  if (!dbReady) {
    dbReady = (async () => {
      await ensureCategoriesSeeded();
      await ensureEventsSeeded();
      // When the committed local snapshot is present, skip procedural seed so
      // production matches the local catalog and media exactly.
      const { getDemoDataDir } = await import("../lib/paths");
      const fs = await import("fs");
      const path = await import("path");
      const hasSnapshot = fs.existsSync(path.join(getDemoDataDir(), "graveyard.db"));
      if (!hasSnapshot) {
        const { ensureDemoSeed } = await import("./demo-seed");
        await ensureDemoSeed();
      }
    })().catch((err) => {
      dbReady = null;
      console.error("[db] ready failed", err);
      throw err;
    });
  }
  return dbReady;
}

// Backfill: verify existing seeded accounts; slug agency names once
try {
  sqlite.exec(`
    UPDATE users
    SET email_verified_at = COALESCE(email_verified_at, created_at)
    WHERE email_verified_at IS NULL
  `);
  sqlite.exec(`
    UPDATE users
    SET agency_slug = lower(replace(replace(agency_name, ' ', '-'), '&', 'and'))
    WHERE agency_name IS NOT NULL AND (agency_slug IS NULL OR agency_slug = '')
  `);
} catch {
  /* ignore */
}
