import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { decodeJwt, jwtVerify } from "jose";

const COOKIE_NAME = "graveyard_token";

function secretKey() {
  const fromEnv = process.env.JWT_SECRET?.trim();
  if (fromEnv) return new TextEncoder().encode(fromEnv);
  return new TextEncoder().encode("change-me-in-production-use-a-long-random-string");
}

function mapRole(role: string) {
  if (role === "SUPER_ADMIN" || role === "ADMIN") return "admin";
  if (role === "JUDGE") return "judge";
  if (role === "AGENCY") return "agency";
  if (role === "CREATOR") return "creator";
  // Already-mapped lowercase (shouldn't appear in Nest tokens)
  if (role === "admin" || role === "judge" || role === "creator" || role === "agency")
    return role;
  return null;
}

async function readRole(token: string | undefined) {
  if (!token) return null;
  try {
    const { payload } = await jwtVerify(token, secretKey());
    if (typeof payload.role !== "string") return null;
    return mapRole(payload.role);
  } catch {
    try {
      const payload = decodeJwt(token);
      if (typeof payload.role !== "string") return null;
      return mapRole(payload.role);
    } catch {
      return null;
    }
  }
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const token = request.cookies.get(COOKIE_NAME)?.value;
  const role = await readRole(token);

  const needsAuth =
    pathname.startsWith("/admin") ||
    pathname.startsWith("/judge") ||
    pathname.startsWith("/portal") ||
    pathname.startsWith("/settings") ||
    pathname.startsWith("/onboarding");

  if (!needsAuth) return NextResponse.next();

  if (!role) {
    const login = new URL("/login", request.url);
    login.searchParams.set("next", pathname);
    return NextResponse.redirect(login);
  }

  if (pathname.startsWith("/admin") && role !== "admin") {
    return NextResponse.redirect(new URL("/", request.url));
  }

  if (pathname.startsWith("/judge") && role !== "judge" && role !== "admin") {
    return NextResponse.redirect(new URL("/", request.url));
  }

  if (pathname.startsWith("/portal") && role !== "creator" && role !== "agency" && role !== "admin") {
    return NextResponse.redirect(new URL("/", request.url));
  }

  if (pathname.startsWith("/onboarding/agency") && role !== "agency") {
    return NextResponse.redirect(new URL(homePathForMappedRole(role), request.url));
  }

  return NextResponse.next();
}

function homePathForMappedRole(role: string) {
  if (role === "admin") return "/admin";
  if (role === "judge") return "/judge";
  return "/portal";
}

export const config = {
  matcher: [
    "/admin/:path*",
    "/judge/:path*",
    "/portal/:path*",
    "/settings/:path*",
    "/onboarding/:path*",
  ],
};
