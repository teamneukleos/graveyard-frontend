#!/usr/bin/env npx tsx
/**
 * Seed extra agency studios, give them published agency submissions + weekly votes.
 */
import fs from "fs";
import path from "path";
import { hash } from "bcryptjs";
import { and, eq } from "drizzle-orm";
import { v4 as uuid } from "uuid";
import { db } from "../src/db";
import { assets, submissions, users, votes } from "../src/db/schema";
import { CATEGORIES } from "../src/lib/constants";

const UPLOAD_DIR = path.join(process.cwd(), "data", "uploads");

const NEW_AGENCIES = [
  { name: "Eko Type", email: "hello@ekotype.studio", lead: "Bola Adebayo" },
  { name: "Danfo Works", email: "studio@danfoworks.com", lead: "Chidi Okonkwo" },
  { name: "Harmattan Co", email: "team@harmattan.co", lead: "Fatima Diallo" },
  { name: "Sabo Form", email: "hello@saboform.africa", lead: "Yemi Alade" },
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

async function downloadCover(seed: string, filename: string) {
  const url = `https://picsum.photos/seed/graveyard-agency-${encodeURIComponent(seed)}/900/1125`;
  const res = await fetch(url, { redirect: "follow" });
  if (!res.ok) throw new Error(`cover failed ${seed}: ${res.status}`);
  const buffer = Buffer.from(await res.arrayBuffer());
  await fs.promises.writeFile(path.join(UPLOAD_DIR, filename), buffer);
  return buffer.length;
}


async function main() {
  await fs.promises.mkdir(UPLOAD_DIR, { recursive: true });
  const passwordHash = await hash("password123", 10);
  const now = new Date().toISOString();
  const thisWeek = new Date(Date.now() - 3 * 60 * 60 * 1000).toISOString();

  const existing = await db.query.users.findMany();
  const byEmail = new Map(existing.map((u) => [u.email, u]));
  const voters = existing.filter((u) => u.role === "creator" || u.role === "admin").slice(0, 12);

  for (let i = 0; i < NEW_AGENCIES.length; i++) {
    const agency = NEW_AGENCIES[i];
    let user = byEmail.get(agency.email);

    if (!user) {
      const id = uuid();
      const avatarFilename = `avatar-${id}.jpg`;
      try {
        await downloadAvatar(agency.name, avatarFilename);
      } catch {
        /* optional */
      }
      await db.insert(users).values({
        id,
        email: agency.email,
        passwordHash,
        name: agency.lead,
        role: "creator",
        agencyName: agency.name,
        agencySlug: agency.name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, ""),
        bio: "",
        avatarFilename: fs.existsSync(path.join(UPLOAD_DIR, avatarFilename))
          ? avatarFilename
          : null,
        emailVerifiedAt: now,
        googleId: null,
        active: true,
        createdAt: now,
      });
      user = (await db.query.users.findFirst({ where: eq(users.email, agency.email) }))!;
      console.log(`Created agency ${agency.name}`);
    } else {
      await db
        .update(users)
        .set({ agencyName: agency.name, name: agency.lead })
        .where(eq(users.id, user.id));
      console.log(`Updated agency ${agency.name}`);
    }

    // Ensure at least 2 published agency submissions
    const theirs = await db.query.submissions.findMany({
      where: eq(submissions.userId, user.id),
    });
    const agencyPublished = theirs.filter((s) => s.submitterType === "agency" && s.published);

    const need = Math.max(0, 2 - agencyPublished.length);
    for (let n = 0; n < need; n++) {
      const sid = uuid();
      const title = `${agency.name.split(" ")[0]} Plot ${n + 1}`;
      const category = CATEGORIES[(i + n) % CATEGORIES.length];
      await db.insert(submissions).values({
        id: sid,
        userId: user.id,
        title,
        category,
        yearCreated: 2024,
        submitterType: "agency",
        teamMembers: agency.lead,
        concept: `Shelved work from ${agency.name} — never made it past the client review.`,
        whyNeverLive: "Killed in the room for being too bold.",
        status: n === 0 ? "shortlisted" : "submitted",
        published: true,
        createdAt: now,
        updatedAt: now,
      });
      const coverFilename = `cover-${sid.slice(0, 8)}.jpg`;
      let size = 0;
      try {
        size = await downloadCover(`${agency.name}-${n}`, coverFilename);
      } catch (err) {
        console.warn(`  cover download failed for ${title}`, err);
      }
      await db.insert(assets).values({
        id: uuid(),
        submissionId: sid,
        filename: size ? coverFilename : "placeholder",
        originalName: `${title}.jpg`,
        mimeType: "image/jpeg",
        size,
        createdAt: now,
      });
      agencyPublished.push(
        (await db.query.submissions.findFirst({ where: eq(submissions.id, sid) }))!,
      );
      console.log(`  + submission ${title}`);
    }

    // Mark existing as agency if needed
    for (const s of theirs) {
      if (s.submitterType !== "agency" || !s.published) {
        await db
          .update(submissions)
          .set({ submitterType: "agency", published: true, updatedAt: now })
          .where(eq(submissions.id, s.id));
      }
    }

    // Fresh weekly votes
    const targets = await db.query.submissions.findMany({
      where: eq(submissions.userId, user.id),
    });
    const voteCount = 8 + i * 3;
    let placed = 0;
    for (const sub of targets.filter((s) => s.published)) {
      for (const voter of voters) {
        if (placed >= voteCount) break;
        if (voter.id === user.id) continue;
        const existingVote = await db.query.votes.findFirst({
          where: and(eq(votes.submissionId, sub.id), eq(votes.userId, voter.id)),
        });
        if (existingVote) {
          await db
            .update(votes)
            .set({ createdAt: thisWeek })
            .where(eq(votes.id, existingVote.id));
        } else {
          await db.insert(votes).values({
            id: uuid(),
            submissionId: sub.id,
            userId: voter.id,
            category: sub.category,
            createdAt: thisWeek,
          });
        }
        placed += 1;
      }
    }
    console.log(`  votes this week ~${placed}`);
  }

  console.log("Done. Agencies ready for homepage board.");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
