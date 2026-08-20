import { NextResponse } from "next/server";
import { getNestApiUrl } from "@/lib/nest/config";

/** Legacy shim — prefer linking straight to Nest `/auth/google`. */
export async function GET(request: Request) {
  const incoming = new URL(request.url);
  const next = incoming.searchParams.get("next") || "";
  const role = incoming.searchParams.get("role") || "";
  const nest = new URL(`${getNestApiUrl()}/auth/google`);
  if (next.startsWith("/") && !next.startsWith("//")) {
    nest.searchParams.set("next", next);
  }
  if (role === "CREATOR" || role === "AGENCY") {
    nest.searchParams.set("role", role);
  }
  return NextResponse.redirect(nest.toString());
}
