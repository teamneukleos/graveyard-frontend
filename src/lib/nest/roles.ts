import type { Role } from "@/lib/constants";
import type { NestRole } from "./types";

/** Map Nest API roles onto the frontend portal roles. */
export function mapNestRole(role: string): Role {
  switch (role) {
    case "SUPER_ADMIN":
    case "ADMIN":
      return "admin";
    case "JUDGE":
      return "judge";
    case "AGENCY":
      return "agency";
    default:
      return "creator";
  }
}

export function isNestRole(role: string): role is NestRole {
  return (
    role === "CREATOR" ||
    role === "AGENCY" ||
    role === "JUDGE" ||
    role === "ADMIN" ||
    role === "SUPER_ADMIN"
  );
}

export function homePathForRole(role: Role) {
  if (role === "admin") return "/admin";
  if (role === "judge") return "/judge";
  return "/portal";
}

export function needsAgencyOnboarding(user: {
  role: string;
  agencyName?: string | null;
  agencyOnboardingRequired?: boolean;
}) {
  if (typeof user.agencyOnboardingRequired === "boolean") {
    return user.agencyOnboardingRequired;
  }
  return user.role === "AGENCY" && !user.agencyName?.trim();
}

/** Where to send the user after login / Google OAuth. */
export function postAuthPath(
  user: {
    role: string;
    agencyName?: string | null;
    agencyOnboardingRequired?: boolean;
  },
  next?: string | null,
) {
  if (needsAgencyOnboarding(user)) return "/onboarding/agency";
  if (next && next.startsWith("/") && !next.startsWith("//")) return next;
  return homePathForRole(mapNestRole(user.role));
}
