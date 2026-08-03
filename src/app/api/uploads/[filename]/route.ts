import { eq } from "drizzle-orm";
import fs from "fs";
import path from "path";
import { NextResponse } from "next/server";
import { db } from "@/db";
import { assets } from "@/db/schema";
import { resolveUploadPath } from "@/lib/paths";

type Params = { params: Promise<{ filename: string }> };

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

  const filePath = resolveUploadPath(filename);

  if (!fs.existsSync(filePath)) {
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
