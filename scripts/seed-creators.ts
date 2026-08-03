#!/usr/bin/env npx tsx
/**
 * Seed extra creator accounts, redistribute submissions, fetch avatars.
 * Fills the homepage "Top creators" board.
 */
import fs from "fs";
import path from "path";
import { hash } from "bcryptjs";
import { eq, ne } from "drizzle-orm";
import { v4 as uuid } from "uuid";
import { db } from "../src/db";
import { submissions, users, votes } from "../src/db/schema";

const UPLOAD_DIR = path.join(process.cwd(), "data", "uploads");

const EXTRA_CREATORS = [
  { name: "Amaka Eze", email: "amaka@graveyard.studio", agency: null },
  { name: "Kofi Mensah", email: "kofi@graveyard.studio", agency: null },
  { name: "Zainab Bello", email: "zainab@graveyard.studio", agency: null },
  { name: "Ifeanyi Okafor", email: "ifeanyi@graveyard.studio", agency: null },
  { name: "Amina Yusuf", email: "amina@graveyard.studio", agency: null },
  { name: "Kwame Boateng", email: "kwame@graveyard.studio", agency: null },
  { name: "Ngozi Nwosu", email: "ngozi@graveyard.studio", agency: "Àjọ Studio" },
  { name: "Sade Balogun", email: "sade@graveyard.studio", agency: "Palm & Clay" },
];

function hashSeed(input: string) {
  let h = 0;
  for (let i = 0; i < input.length; i++) h = (h * 31 + input.charCodeAt(i)) >>> 0;
  return h;
}

async function downloadAvatar(seed: string, filename: string) {
  const n = (hashSeed(seed) % 70) + 1;
  const url = `https://i.pravatar.cc/200?img=${n}`;
  const res = await fetch(url, { redirect: "follow" });
  if (!res.ok) throw new Error(`avatar failed ${seed}: ${res.status}`);
  const buffer = Buffer.from(await res.arrayBuffer());
  await fs.promises.writeFile(path.join(UPLOAD_DIR, filename), buffer);
}

async function main() {
  await fs.promises.mkdir(UPLOAD_DIR, { recursive: true });
  const passwordHash = await hash("password123", 10);
  const now = new Date().toISOString();

  const existing = await db.query.users.findMany();
  const byEmail = new Map(existing.map((u) => [u.email, u]));

  const creatorIds: string[] = [];

  for (const u of existing) {
    if (u.role === "creator") creatorIds.push(u.id);
  }

  for (const c of EXTRA_CREATORS) {
    const found = byEmail.get(c.email);
    if (found) {
      creatorIds.push(found.id);
      continue;
    }
    const id = uuid();
    await db.insert(users).values({
      id,
      email: c.email,
      passwordHash,
      name: c.name,
      role: "creator",
      agencyName: c.agency,
      agencySlug: c.agency
        ? c.agency.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "")
        : null,
      bio: "",
      avatarFilename: null,
      emailVerifiedAt: now,
      googleId: null,
      active: true,
      createdAt: now,
    });
    creatorIds.push(id);
    console.log(`Created ${c.name}`);
  }

  // Unique creator ids
  const uniqueCreators = [...new Set(creatorIds)];

  // Redistribute published submissions across creators
  const published = await db.query.submissions.findMany({
    where: eq(submissions.published, true),
  });

  for (let i = 0; i < published.length; i++) {
    const ownerId = uniqueCreators[i % uniqueCreators.length];
    await db
      .update(submissions)
      .set({ userId: ownerId, updatedAt: now })
      .where(eq(submissions.id, published[i].id));
  }
  console.log(`Reassigned ${published.length} submissions across ${uniqueCreators.length} creators`);

  // Avatars for all non-admin users missing one
  const all = await db.query.users.findMany({ where: ne(users.role, "admin") });
  for (const user of all) {
    if (user.avatarFilename) {
      const exists = fs.existsSync(path.join(UPLOAD_DIR, user.avatarFilename));
      if (exists) continue;
    }
    const filename = `avatar-${user.id.slice(0, 12)}.jpg`;
    await downloadAvatar(user.id + user.name, filename);
    await db.update(users).set({ avatarFilename: filename }).where(eq(users.id, user.id));
  }
  console.log(`Avatars ready for ${all.length} users`);

  // Refresh vote timestamps into this week so weekly board fills
  const allVotes = await db.query.votes.findMany();
  const t = Date.now();
  for (let i = 0; i < allVotes.length; i++) {
    const daysAgo = i % 6;
    await db
      .update(votes)
      .set({
        createdAt: new Date(t - daysAgo * 86400000 - (i % 12) * 3600000).toISOString(),
      })
      .where(eq(votes.id, allVotes[i].id));
  }
  console.log(`Refreshed ${allVotes.length} votes`);
  console.log("Done.");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
