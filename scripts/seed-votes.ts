#!/usr/bin/env npx tsx
import { eq } from "drizzle-orm";
import { v4 as uuid } from "uuid";
import { db } from "../src/db";
import { submissions, users, votes } from "../src/db/schema";

async function main() {
  const existing = await db.query.votes.findFirst();
  if (existing) {
    console.log("Votes already seeded.");
    return;
  }

  const allUsers = await db.query.users.findMany();
  const published = await db.query.submissions.findMany({
    where: eq(submissions.published, true),
  });

  if (!allUsers.length || !published.length) {
    console.log("Need users and published submissions first.");
    return;
  }

  const now = Date.now();
  let added = 0;

  for (let i = 0; i < published.length; i++) {
    const piece = published[i];
    // Vary popularity: earlier index pieces get more votes
    const voterCount = Math.max(1, Math.min(allUsers.length, 1 + ((published.length - i) % allUsers.length)));
    for (let v = 0; v < voterCount; v++) {
      const voter = allUsers[(i + v * 3) % allUsers.length];
      // Skip self-votes for a bit of realism (optional allow)
      const daysAgo = (i + v) % 10;
      const createdAt = new Date(now - daysAgo * 86400000 - v * 3600000).toISOString();
      try {
        await db.insert(votes).values({
          id: uuid(),
          submissionId: piece.id,
          userId: voter.id,
          category: piece.category,
          createdAt,
        });
        added += 1;
      } catch {
        // unique constraint — ignore
      }
    }
  }

  console.log(`Seeded ${added} votes.`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
