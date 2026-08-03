#!/usr/bin/env npx tsx
/**
 * Download portrait avatars for creator/agency users and refresh vote dates into this week.
 */
import fs from "fs";
import path from "path";
import { eq, ne } from "drizzle-orm";
import { db } from "../src/db";
import { users, votes } from "../src/db/schema";

const UPLOAD_DIR = path.join(process.cwd(), "data", "uploads");

function hashSeed(input: string) {
  let h = 0;
  for (let i = 0; i < input.length; i++) h = (h * 31 + input.charCodeAt(i)) >>> 0;
  return h;
}

async function downloadAvatar(seed: string, filename: string) {
  // Deterministic portrait photos (pravatar)
  const n = (hashSeed(seed) % 70) + 1;
  const url = `https://i.pravatar.cc/200?img=${n}`;
  const res = await fetch(url, { redirect: "follow" });
  if (!res.ok) {
    throw new Error(`Failed to download avatar for ${seed}: ${res.status}`);
  }
  const buffer = Buffer.from(await res.arrayBuffer());
  await fs.promises.writeFile(path.join(UPLOAD_DIR, filename), buffer);
  return buffer.length;
}

async function main() {
  await fs.promises.mkdir(UPLOAD_DIR, { recursive: true });

  const creators = await db.query.users.findMany({
    where: ne(users.role, "admin"),
  });

  console.log(`Fetching avatars for ${creators.length} users…`);

  for (let i = 0; i < creators.length; i++) {
    const user = creators[i];
    const filename = `avatar-${user.id.slice(0, 12)}.jpg`;
    await downloadAvatar(user.id + user.name, filename);
    await db.update(users).set({ avatarFilename: filename }).where(eq(users.id, user.id));
    if ((i + 1) % 5 === 0 || i === creators.length - 1) {
      console.log(`  ${i + 1}/${creators.length}`);
    }
  }

  // Move existing votes into this week so the weekly board is populated
  const allVotes = await db.query.votes.findMany();
  const now = Date.now();
  let refreshed = 0;
  for (let i = 0; i < allVotes.length; i++) {
    const vote = allVotes[i];
    const daysAgo = i % 6;
    const createdAt = new Date(now - daysAgo * 86400000 - (i % 12) * 3600000).toISOString();
    await db.update(votes).set({ createdAt }).where(eq(votes.id, vote.id));
    refreshed += 1;
  }
  console.log(`Refreshed ${refreshed} vote timestamps into this week.`);
  console.log("Done.");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
