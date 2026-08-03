import { eq } from "drizzle-orm";
import fs from "fs";
import path from "path";
import { NextResponse } from "next/server";
import { db } from "@/db";
import { assets } from "@/db/schema";
import { getUploadsDir } from "@/lib/paths";

type Params = { params: Promise<{ filename: string }> };

export async function GET(_request: Request, { params }: Params) {
  const { filename } = await params;
  if (filename.includes("..") || filename.includes("/") || filename.includes("\\")) {
    return NextResponse.json({ error: "Invalid filename" }, { status: 400 });
  }

  const asset = await db.query.assets.findFirst({
    where: eq(assets.filename, filename),
    with: { submission: true },
  });

  const filePath = path.join(getUploadsDir(), filename);
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
  const ext = path.extname(filename).toLowerCase();
  const fallbackType =
    ext === ".jpg" || ext === ".jpeg"
      ? "image/jpeg"
      : ext === ".png"
        ? "image/png"
        : ext === ".webp"
          ? "image/webp"
          : ext === ".svg"
            ? "image/svg+xml"
            : "application/octet-stream";

  return new NextResponse(buffer, {
    headers: {
      "Content-Type": asset?.mimeType || fallbackType,
      "Cache-Control": "private, max-age=3600",
      "Content-Disposition": `inline; filename="${asset?.originalName || filename}"`,
    },
  });
}
