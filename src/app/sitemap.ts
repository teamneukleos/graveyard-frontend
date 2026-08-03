import type { MetadataRoute } from "next";
import { and, eq, isNotNull } from "drizzle-orm";
import { ensureDbReady, db } from "@/db";
import { events, submissions, users } from "@/db/schema";
import { getActiveCategoryNames } from "@/lib/categories";
import { absoluteUrl } from "@/lib/seo";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  await ensureDbReady();

  const staticRoutes: MetadataRoute.Sitemap = [
    "",
    "/showcase",
    "/categories",
    "/events",
    "/leaderboards",
    "/leaderboards/creators",
    "/leaderboards/agencies",
    "/privacy",
    "/terms",
    "/cookies",
  ].map((path) => ({
    url: absoluteUrl(path || "/"),
    lastModified: new Date(),
    changeFrequency: path === "" || path === "/showcase" ? "daily" : "weekly",
    priority: path === "" ? 1 : path === "/showcase" ? 0.9 : 0.7,
  }));

  const [published, categoryNames, agencies, creators, upcomingEvents] = await Promise.all([
    db.query.submissions.findMany({
      where: eq(submissions.published, true),
      columns: { id: true, updatedAt: true },
    }),
    getActiveCategoryNames(),
    db.query.users.findMany({
      where: and(isNotNull(users.agencySlug), eq(users.role, "creator")),
      columns: { agencySlug: true },
    }),
    db.query.users.findMany({
      where: eq(users.role, "creator"),
      columns: { id: true },
    }),
    db.query.events.findMany({
      where: eq(events.active, true),
      columns: { id: true, updatedAt: true },
    }),
  ]);

  const showcaseRoutes: MetadataRoute.Sitemap = published.map((piece) => ({
    url: absoluteUrl(`/showcase/${piece.id}`),
    lastModified: new Date(piece.updatedAt),
    changeFrequency: "weekly",
    priority: 0.85,
  }));

  const categoryRoutes: MetadataRoute.Sitemap = categoryNames.map((name) => ({
    url: absoluteUrl(`/categories/${encodeURIComponent(name)}`),
    changeFrequency: "daily",
    priority: 0.8,
  }));

  const agencyRoutes: MetadataRoute.Sitemap = agencies
    .filter((u) => u.agencySlug)
    .map((u) => ({
      url: absoluteUrl(`/agencies/${encodeURIComponent(u.agencySlug!)}`),
      changeFrequency: "weekly" as const,
      priority: 0.65,
    }));

  const creatorRoutes: MetadataRoute.Sitemap = creators.map((u) => ({
    url: absoluteUrl(`/creators/${u.id}`),
    changeFrequency: "weekly",
    priority: 0.65,
  }));

  const eventRoutes: MetadataRoute.Sitemap = upcomingEvents.map((event) => ({
    url: absoluteUrl(`/events#${event.id}`),
    lastModified: new Date(event.updatedAt),
    changeFrequency: "weekly",
    priority: 0.6,
  }));

  return [
    ...staticRoutes,
    ...showcaseRoutes,
    ...categoryRoutes,
    ...agencyRoutes,
    ...creatorRoutes,
    ...eventRoutes,
  ];
}
