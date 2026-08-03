import { compare, hash } from "bcryptjs";
import { eq } from "drizzle-orm";
import { SignJWT, jwtVerify } from "jose";
import { cookies } from "next/headers";
import { db } from "@/db";
import { users, type User } from "@/db/schema";
import type { Role } from "./constants";

const COOKIE_NAME = "graveyard_session";

function getAuthSecret() {
  const fromEnv = process.env.AUTH_SECRET;
  if (fromEnv) return fromEnv;
  // Vercel serverless: allow boot without env so pages can render; set AUTH_SECRET in project settings.
  if (process.env.VERCEL) {
    console.warn("AUTH_SECRET is not set  -  using an insecure fallback. Set it in Vercel env.");
    return "graveyard-vercel-insecure-fallback-change-me";
  }
  if (process.env.NODE_ENV === "production") {
    throw new Error("AUTH_SECRET must be set in production.");
  }
  return "graveyard-dev-secret-change-me";
}

function secretKey() {
  return new TextEncoder().encode(getAuthSecret());
}

export type SessionUser = {
  id: string;
  email: string;
  name: string;
  role: Role;
  agencyName: string | null;
  emailVerified: boolean;
};

type TokenPayload = {
  sub: string;
  email: string;
  name: string;
  role: Role;
  agencyName: string | null;
};

export async function hashPassword(password: string) {
  return hash(password, 10);
}

export async function verifyPassword(password: string, passwordHash: string) {
  return compare(password, passwordHash);
}

export async function createSession(user: Pick<User, "id" | "email" | "name" | "role" | "agencyName">) {
  const token = await new SignJWT({
    email: user.email,
    name: user.name,
    role: user.role as Role,
    agencyName: user.agencyName,
  })
    .setProtectedHeader({ alg: "HS256" })
    .setSubject(user.id)
    .setIssuedAt()
    .setExpirationTime("14d")
    .sign(secretKey());

  const cookieStore = await cookies();
  cookieStore.set(COOKIE_NAME, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 24 * 14,
  });
}

export async function destroySession() {
  const cookieStore = await cookies();
  cookieStore.delete(COOKIE_NAME);
}

export async function getSession(): Promise<SessionUser | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get(COOKIE_NAME)?.value;
  if (!token) return null;

  try {
    const { payload } = await jwtVerify(token, secretKey());
    const data = payload as unknown as TokenPayload;
    if (!data.sub || !data.email || !data.role) return null;

    const user = await db.query.users.findFirst({
      where: eq(users.id, data.sub),
    });
    if (!user || !user.active) return null;

    return {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role as Role,
      agencyName: user.agencyName ?? null,
      emailVerified: Boolean(user.emailVerifiedAt),
    };
  } catch {
    return null;
  }
}

export async function requireSession(roles?: Role[]) {
  const session = await getSession();
  if (!session) return null;
  if (roles && !roles.includes(session.role)) return null;
  return session;
}

export async function findUserByEmail(email: string) {
  return db.query.users.findFirst({
    where: eq(users.email, email.toLowerCase()),
  });
}
