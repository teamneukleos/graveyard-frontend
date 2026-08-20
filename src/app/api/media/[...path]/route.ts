import { NextResponse } from "next/server";
import { getNestApiUrl } from "@/lib/nest/config";

type Params = { params: Promise<{ path: string[] }> };

/**
 * Same-origin proxy for Nest local uploads (`/uploads/...`).
 * Keeps <img src> on the Next host so browsers do not need cross-port localhost permission.
 */
export async function GET(_request: Request, { params }: Params) {
  const segments = (await params).path || [];
  if (segments.length === 0 || segments[0] !== "uploads") {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  if (segments.some((part) => part === ".." || part === "." || part.includes("\\"))) {
    return NextResponse.json({ error: "Invalid path" }, { status: 400 });
  }

  const relative = segments.map(encodeURIComponent).join("/");
  const upstreamUrl = `${getNestApiUrl()}/${relative}`;

  let upstream: Response;
  try {
    upstream = await fetch(upstreamUrl, {
      // Asset bytes change rarely; allow CDN/browser caching when present.
      next: { revalidate: 3600 },
    });
  } catch {
    return NextResponse.json({ error: "Upstream unavailable" }, { status: 502 });
  }

  if (!upstream.ok) {
    return NextResponse.json(
      { error: "Asset not found" },
      { status: upstream.status === 404 ? 404 : 502 },
    );
  }

  const contentType = upstream.headers.get("content-type") || "application/octet-stream";
  const cacheControl =
    upstream.headers.get("cache-control") || "public, max-age=3600, stale-while-revalidate=86400";

  return new NextResponse(upstream.body, {
    status: 200,
    headers: {
      "Content-Type": contentType,
      "Cache-Control": cacheControl,
    },
  });
}
