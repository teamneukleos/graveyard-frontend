import { NextResponse } from "next/server";
import { setAccessToken } from "@/lib/auth";
import { homePathForRole, mapNestRole } from "@/lib/nest/roles";
import { nestMe } from "@/lib/nest/client";

/**
 * Nest redirects here after Google OAuth with ?token=...
 * Sets the httpOnly cookie on the frontend origin, then sends the user to /portal (or ?next=).
 */
export async function GET(request: Request) {
  const url = new URL(request.url);
  const token = url.searchParams.get("token");
  const next = url.searchParams.get("next");
  // Use the request origin (e.g. http://localhost:3001) — not APP_URL / Nest.
  const appOrigin = url.origin;

  if (!token) {
    return NextResponse.redirect(
      new URL("/login?error=google&message=Missing+sign-in+token", appOrigin),
    );
  }

  try {
    await setAccessToken(token);
    const user = await nestMe(token);
    const role = mapNestRole(user.role);

    let destination = homePathForRole(role);
    if (next && next.startsWith("/") && !next.startsWith("//")) {
      destination = next;
    }

    return NextResponse.redirect(new URL(destination, appOrigin));
  } catch {
    return NextResponse.redirect(
      new URL("/login?error=google&message=Could+not+complete+Google+sign-in", appOrigin),
    );
  }
}
