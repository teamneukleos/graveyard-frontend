import { NextResponse } from "next/server";
import { getNestApiUrl } from "@/lib/nest/config";

/** Legacy shim — prefer linking straight to Nest `/auth/google`. */
export async function GET(request: Request) {
  const incoming = new URL(request.url);
  const next = incoming.searchParams.get("next") || "";
  const nest = new URL(`${getNestApiUrl()}/auth/google`);
  if (next.startsWith("/") && !next.startsWith("//")) {
    nest.searchParams.set("next", next);
  }
  return NextResponse.redirect(nest.toString());
}
