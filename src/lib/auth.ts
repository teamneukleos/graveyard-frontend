import { decodeJwt, jwtVerify } from "jose";
import { cookies } from "next/headers";
import type { Role } from "./constants";
import { nestMe } from "./nest/client";
import { mapNestRole } from "./nest/roles";
import type { NestRole, NestUser } from "./nest/types";

/** httpOnly cookie holding the Nest API access token */
export const ACCESS_COOKIE = "graveyard_token";

const COOKIE_MAX_AGE_SECONDS = 60 * 60 * 24 * 7;

export type SessionUser = {
  id: string;
  email: string;
  name: string;
  role: Role;
  nestRole: NestRole;
  agencyName: string | null;
  bio: string | null;
  avatarUrl: string | null;
  emailVerified: boolean;
  memberOfAgency: NestUser["memberOfAgency"];
  agencyOnboardingRequired: boolean;
};

function jwtSecretKey() {
  const secret = process.env.JWT_SECRET?.trim();
  if (secret) return new TextEncoder().encode(secret);
  return new TextEncoder().encode("change-me-in-production-use-a-long-random-string");
}

function toSessionUser(user: NestUser): SessionUser {
  return {
    id: user.id,
    email: user.email,
    name: user.name,
    role: mapNestRole(user.role),
    nestRole: user.role,
    agencyName: user.agencyName ?? null,
    bio: user.bio ?? null,
    avatarUrl: user.avatarUrl ?? null,
    emailVerified: Boolean(user.emailVerified),
    memberOfAgency: user.memberOfAgency ?? null,
    agencyOnboardingRequired: Boolean(
      user.agencyOnboardingRequired ??
        (user.role === "AGENCY" && !user.agencyName?.trim()),
    ),
  };
}

export async function setAccessToken(accessToken: string) {
  const cookieStore = await cookies();
  cookieStore.set(ACCESS_COOKIE, accessToken, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: COOKIE_MAX_AGE_SECONDS,
  });
}

export async function destroySession() {
  const cookieStore = await cookies();
  cookieStore.delete(ACCESS_COOKIE);
}

export async function getAccessToken(): Promise<string | null> {
  const cookieStore = await cookies();
  return cookieStore.get(ACCESS_COOKIE)?.value ?? null;
}

export async function readAccessTokenRole(token: string | undefined): Promise<Role | null> {
  if (!token) return null;
  try {
    const { payload } = await jwtVerify(token, jwtSecretKey());
    if (typeof payload.role !== "string") return null;
    return mapNestRole(payload.role);
  } catch {
    try {
      const payload = decodeJwt(token);
      if (typeof payload.role !== "string") return null;
      return mapNestRole(payload.role);
    } catch {
      return null;
    }
  }
}

export async function getSession(): Promise<SessionUser | null> {
  const token = await getAccessToken();
  if (!token) return null;

  try {
    const user = await nestMe(token);
    return toSessionUser(user);
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
