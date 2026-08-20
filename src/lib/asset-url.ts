/**
 * Nest local-disk uploads are stored as absolute URLs like
 * `{PUBLIC_BASE_URL}/uploads/submissions/...`.
 * Rewrite those to a same-origin Next proxy so:
 * - Local: Next (:3001) does not trigger Chrome's "localhost access" prompt for :3000
 * - Staging: wrong/baked localhost hosts still work if the API can serve `/uploads/...`
 *
 * Cloudflare R2 / external URLs are left unchanged.
 */

export function nestUploadPath(url: string | null | undefined): string | null {
  if (!url) return null;
  const trimmed = url.trim();
  if (!trimmed) return null;

  if (trimmed.startsWith("/uploads/")) {
    return trimmed.split("?")[0].split("#")[0];
  }

  try {
    const parsed = new URL(trimmed);
    if (parsed.pathname.startsWith("/uploads/")) {
      return parsed.pathname;
    }
  } catch {
    /* not an absolute URL */
  }

  return null;
}

export function resolveAssetUrl(url: string | null | undefined): string | null {
  if (!url) return null;
  const trimmed = url.trim();
  if (!trimmed) return null;

  if (trimmed.startsWith("/api/media/")) return trimmed;

  const uploadPath = nestUploadPath(trimmed);
  if (uploadPath) {
    return `/api/media${uploadPath}`;
  }

  return trimmed;
}
