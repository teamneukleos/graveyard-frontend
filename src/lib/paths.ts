import fs from "fs";
import path from "path";

/** Writable data root — /tmp on Vercel (read-only except /tmp), else ./data */
export function getDataDir() {
  const base =
    process.env.GRAVEYARD_DATA_DIR ||
    (process.env.VERCEL ? path.join("/tmp", "graveyard") : path.join(process.cwd(), "data"));

  if (!fs.existsSync(base)) {
    fs.mkdirSync(base, { recursive: true });
  }
  return base;
}

export function getDemoDataDir() {
  return path.join(process.cwd(), "demo-data");
}

export function getBundledUploadsDir() {
  return path.join(getDemoDataDir(), "uploads");
}

/**
 * On Vercel, materialize the committed local snapshot into /tmp so the live
 * site matches the local DB + cover/avatar files exactly.
 */
export function bootstrapDemoSnapshot() {
  if (!process.env.VERCEL && process.env.GRAVEYARD_USE_SNAPSHOT !== "1") {
    return false;
  }

  const demoDir = getDemoDataDir();
  const srcDb = path.join(demoDir, "graveyard.db");
  const versionPath = path.join(demoDir, "VERSION");
  if (!fs.existsSync(srcDb) || !fs.existsSync(versionPath)) return false;

  const version = fs.readFileSync(versionPath, "utf8").trim();
  const dataDir = getDataDir();
  const marker = path.join(dataDir, ".demo-snapshot");
  const destDb = path.join(dataDir, "graveyard.db");

  const current = fs.existsSync(marker) ? fs.readFileSync(marker, "utf8").trim() : "";
  if (current === version && fs.existsSync(destDb)) {
    return true;
  }

  fs.copyFileSync(srcDb, destDb);
  for (const suffix of ["-wal", "-shm"]) {
    const leftover = `${destDb}${suffix}`;
    if (fs.existsSync(leftover)) fs.unlinkSync(leftover);
  }
  fs.writeFileSync(marker, version);
  console.log(`[demo-snapshot] loaded ${version}`);
  return true;
}

export function getUploadsDir() {
  const dir = path.join(getDataDir(), "uploads");
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
  return dir;
}

/** Prefer writable /tmp copy, then committed demo-data uploads (exact local look). */
export function resolveUploadPath(filename: string) {
  const writable = path.join(getUploadsDir(), filename);
  if (fs.existsSync(writable)) return writable;

  const bundled = path.join(getBundledUploadsDir(), filename);
  if (fs.existsSync(bundled)) return bundled;

  return writable;
}

export function getDbPath() {
  bootstrapDemoSnapshot();
  return path.join(getDataDir(), "graveyard.db");
}
