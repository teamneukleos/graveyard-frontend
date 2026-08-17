import type { Role } from "@/lib/constants";
import type { NestRole } from "./types";

/** Map Nest API roles onto the frontend's three portal roles. */
export function mapNestRole(role: string): Role {
  switch (role) {
    case "SUPER_ADMIN":
    case "ADMIN":
      return "admin";
    case "JUDGE":
      return "judge";
    default:
      return "creator";
  }
}

export function isNestRole(role: string): role is NestRole {
  return (
    role === "CREATOR" ||
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
