#!/usr/bin/env npx tsx
/**
 * Download full-bleed cover images (portrait 4:5) for published submissions.
 */
import fs from "fs";
import path from "path";
import { eq } from "drizzle-orm";
import { v4 as uuid } from "uuid";
import { db } from "../src/db";
import { assets, submissions } from "../src/db/schema";

const UPLOAD_DIR = path.join(process.cwd(), "data", "uploads");
const WIDTH = 900;
const HEIGHT = 1125;

async function downloadCover(seed: number, filename: string) {
  const url = `https://picsum.photos/seed/graveyard-${seed}/${WIDTH}/${HEIGHT}`;
  const res = await fetch(url, { redirect: "follow" });
  if (!res.ok) {
    throw new Error(`Failed to download cover ${seed}: ${res.status}`);
  }
  const buffer = Buffer.from(await res.arrayBuffer());
  await fs.promises.writeFile(path.join(UPLOAD_DIR, filename), buffer);
  return buffer.length;
}

async function main() {
  await fs.promises.mkdir(UPLOAD_DIR, { recursive: true });

  const rows = await db.query.submissions.findMany({
    where: eq(submissions.published, true),
    with: { assets: true },
  });

  console.log(`Updating full-bleed covers for ${rows.length} published submissions…`);

  for (let i = 0; i < rows.length; i++) {
    const piece = rows[i];
    const filename = `cover-${piece.id.slice(0, 8)}.jpg`;
    const size = await downloadCover(i + 1, filename);

    const existing = piece.assets[0];
    if (existing) {
      await db
        .update(assets)
        .set({
          filename,
          originalName: `${piece.title}.jpg`,
          mimeType: "image/jpeg",
          size,
        })
        .where(eq(assets.id, existing.id));
    } else {
      await db.insert(assets).values({
        id: uuid(),
        submissionId: piece.id,
        filename,
        originalName: `${piece.title}.jpg`,
        mimeType: "image/jpeg",
        size,
        createdAt: new Date().toISOString(),
      });
    }

    if ((i + 1) % 10 === 0 || i === rows.length - 1) {
      console.log(`  ${i + 1}/${rows.length}`);
    }
  }

  console.log("Done.");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
