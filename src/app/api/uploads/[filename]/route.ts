import { eq } from "drizzle-orm";
import fs from "fs";
import path from "path";
import { NextResponse } from "next/server";
import { db } from "@/db";
import { assets, users } from "@/db/schema";
import { getUploadsDir } from "@/lib/paths";

type Params = { params: Promise<{ filename: string }> };

function hashSeed(input: string) {
  let h = 0;
  for (let i = 0; i < input.length; i++) h = (h * 31 + input.charCodeAt(i)) >>> 0;
  return h;
}

async function fetchAndCache(filePath: string, url: string) {
  const res = await fetch(url, { redirect: "follow", cache: "force-cache" });
  if (!res.ok) {
    throw new Error(`Upstream image failed: ${res.status}`);
  }
  const buffer = Buffer.from(await res.arrayBuffer());
  await fs.promises.mkdir(path.dirname(filePath), { recursive: true });
  await fs.promises.writeFile(filePath, buffer);
  return buffer;
}

function contentTypeFor(filename: string, mimeType?: string | null) {
  if (mimeType) return mimeType;
  const ext = path.extname(filename).toLowerCase();
  if (ext === ".jpg" || ext === ".jpeg") return "image/jpeg";
  if (ext === ".png") return "image/png";
  if (ext === ".webp") return "image/webp";
  if (ext === ".svg") return "image/svg+xml";
  return "application/octet-stream";
}

export async function GET(_request: Request, { params }: Params) {
  const { filename } = await params;
  if (filename.includes("..") || filename.includes("/") || filename.includes("\\")) {
    return NextResponse.json({ error: "Invalid filename" }, { status: 400 });
  }

  const asset = await db.query.assets.findFirst({
    where: eq(assets.filename, filename),
  });

  const filePath = path.join(getUploadsDir(), filename);

  if (!fs.existsSync(filePath)) {
    try {
      // Demo / cold-start: materialize covers & avatars from deterministic remote seeds
      if (filename.startsWith("avatar-") || filename.startsWith("cover-")) {
        const seed = filename.replace(/\.(jpg|jpeg|png|webp)$/i, "");
        const url = filename.startsWith("avatar-")
          ? `https://i.pravatar.cc/200?img=${(hashSeed(seed) % 70) + 1}`
          : `https://picsum.photos/seed/graveyard-${seed}/900/1125`;
        const buffer = await fetchAndCache(filePath, url);
        return new NextResponse(buffer, {
          headers: {
            "Content-Type": contentTypeFor(filename, asset?.mimeType || "image/jpeg"),
            "Cache-Control": "public, max-age=86400",
          },
        });
      }

      // Legacy shared "placeholder" rows — unique image per submission when possible
      if (asset || filename === "placeholder") {
        const url = new URL(_request.url);
        const tone = url.searchParams.get("tone") || "0";
        const seed = asset?.submissionId?.slice(0, 8) || `tone-${tone}`;
        const remote = `https://picsum.photos/seed/graveyard-${seed}/900/1125`;
        const cacheName = `cover-ph-${seed}.jpg`;
        const cachePath = path.join(getUploadsDir(), cacheName);
        const buffer = fs.existsSync(cachePath)
          ? fs.readFileSync(cachePath)
          : await fetchAndCache(cachePath, remote);
        return new NextResponse(buffer, {
          headers: {
            "Content-Type": "image/jpeg",
            "Cache-Control": "public, max-age=86400",
          },
        });
      }

      // Avatar on user record but file wiped with /tmp
      const user = await db.query.users.findFirst({
        where: eq(users.avatarFilename, filename),
      });
      if (user) {
        const seed = user.id.slice(0, 8);
        const remote = `https://i.pravatar.cc/200?img=${(hashSeed(seed) % 70) + 1}`;
        const buffer = await fetchAndCache(filePath, remote);
        return new NextResponse(buffer, {
          headers: {
            "Content-Type": "image/jpeg",
            "Cache-Control": "public, max-age=86400",
          },
        });
      }
    } catch (err) {
      console.error("[uploads] remote cover failed", err);
      // fall through to SVG fallback
    }

    if (asset || filename === "placeholder") {
      const tones = ["#eceae6", "#e7e9ef", "#ebe6e3", "#e5ebe8", "#eee8e8", "#e8ebe4"];
      const url = new URL(_request.url);
      const toneIndex = Number(url.searchParams.get("tone") || "0");
      const a = tones[Math.abs(toneIndex) % tones.length];
      const b = tones[(Math.abs(toneIndex) + 1) % tones.length];
      const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="900" height="1125" viewBox="0 0 900 1125">
        <defs>
          <linearGradient id="g" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stop-color="${a}"/>
            <stop offset="100%" stop-color="${b}"/>
          </linearGradient>
        </defs>
        <rect width="900" height="1125" fill="url(#g)"/>
        <circle cx="700" cy="260" r="160" fill="#ffffff" opacity="0.45"/>
        <rect x="72" y="860" width="280" height="3" fill="#121212" opacity="0.35"/>
        <text x="72" y="830" fill="#121212" font-family="Helvetica, Arial, sans-serif" font-size="36" font-weight="700" letter-spacing="4">UNSEEN</text>
      </svg>`;
      return new NextResponse(svg, {
        headers: {
          "Content-Type": "image/svg+xml",
          "Cache-Control": "public, max-age=3600",
        },
      });
    }

    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const buffer = fs.readFileSync(filePath);
  return new NextResponse(buffer, {
    headers: {
      "Content-Type": contentTypeFor(filename, asset?.mimeType),
      "Cache-Control": "public, max-age=86400",
      "Content-Disposition": `inline; filename="${asset?.originalName || filename}"`,
    },
  });
}
