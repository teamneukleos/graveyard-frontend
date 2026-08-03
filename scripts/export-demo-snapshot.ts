#!/usr/bin/env npx tsx
/**
 * Copy local data/graveyard.db + data/uploads into demo-data/ for Vercel.
 */
import fs from "fs";
import path from "path";
import Database from "better-sqlite3";

const root = process.cwd();
const srcDb = path.join(root, "data", "graveyard.db");
const srcUploads = path.join(root, "data", "uploads");
const destDir = path.join(root, "demo-data");
const destDb = path.join(destDir, "graveyard.db");
const destUploads = path.join(destDir, "uploads");

if (!fs.existsSync(srcDb)) {
  console.error("Missing data/graveyard.db — run npm run db:seed first.");
  process.exit(1);
}

// Flush WAL into the main DB file
const db = new Database(srcDb);
db.pragma("wal_checkpoint(TRUNCATE)");
db.close();

fs.mkdirSync(destUploads, { recursive: true });
fs.copyFileSync(srcDb, destDb);

for (const name of fs.readdirSync(destUploads)) {
  fs.unlinkSync(path.join(destUploads, name));
}
for (const name of fs.readdirSync(srcUploads)) {
  if (name.startsWith(".")) continue;
  fs.copyFileSync(path.join(srcUploads, name), path.join(destUploads, name));
}

const version = `snapshot-${new Date().toISOString().replace(/[:.]/g, "-")}`;
fs.writeFileSync(path.join(destDir, "VERSION"), `${version}\n`);

console.log(`Wrote ${destDir} (${version})`);
console.log(`  db: ${fs.statSync(destDb).size} bytes`);
console.log(`  uploads: ${fs.readdirSync(destUploads).length} files`);
