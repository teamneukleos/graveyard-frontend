export function getNestApiUrl() {
  const url =
    process.env.GRAVEYARD_API_URL?.trim() ||
    process.env.NEXT_PUBLIC_GRAVEYARD_API_URL?.trim();
  if (url) return url.replace(/\/$/, "");
  return "http://localhost:3000";
}

/** Browser-safe Nest base URL (Google OAuth start, etc.). */
export function getPublicNestApiUrl() {
  const url = process.env.NEXT_PUBLIC_GRAVEYARD_API_URL?.trim();
  if (url) return url.replace(/\/$/, "");
  return "http://localhost:3000";
}

/** Direct Nest Google OAuth start URL (not the Next BFF). */
export function googleAuthStartUrl(
  nextPath?: string | null,
  role?: "CREATOR" | "AGENCY" | null,
) {
  const url = new URL(`${getPublicNestApiUrl()}/auth/google`);
  if (nextPath && nextPath.startsWith("/") && !nextPath.startsWith("//")) {
    url.searchParams.set("next", nextPath);
  }
  if (role === "CREATOR" || role === "AGENCY") {
    url.searchParams.set("role", role);
  }
  return url.toString();
}

