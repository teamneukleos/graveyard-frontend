import type { MetadataRoute } from "next";
import { absoluteUrl } from "@/lib/seo";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  return [
    "",
    "/showcase",
    "/categories",
    "/leaderboards",
    "/leaderboards/creators",
    "/leaderboards/agencies",
    "/events",
    "/privacy",
    "/terms",
    "/cookies",
  ].map((path) => ({
    url: absoluteUrl(path || "/"),
    lastModified: new Date(),
    changeFrequency: path === "" || path === "/showcase" ? "daily" : "weekly",
    priority: path === "" ? 1 : path === "/showcase" ? 0.9 : 0.7,
  }));
}
