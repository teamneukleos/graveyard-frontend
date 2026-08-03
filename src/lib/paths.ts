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

export function getUploadsDir() {
  const dir = path.join(getDataDir(), "uploads");
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
  return dir;
}

export function getDbPath() {
  return path.join(getDataDir(), "graveyard.db");
}
