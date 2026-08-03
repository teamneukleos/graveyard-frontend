import { and, count, eq } from "drizzle-orm";
import { db } from "@/db";
import { submissions, votes } from "@/db/schema";
import type { Category } from "@/lib/constants";

export function weekStartIso(date = new Date()) {
  const d = new Date(date);
  const day = d.getUTCDay();
  const diff = (day + 6) % 7;
  d.setUTCDate(d.getUTCDate() - diff);
  d.setUTCHours(0, 0, 0, 0);
  return d.toISOString();
}

export async function getVoteCountsForIds(ids: string[]) {
  const map = new Map<string, number>();
  if (!ids.length) return map;

  for (const id of ids) {
    const [{ total }] = await db
      .select({ total: count() })
      .from(votes)
      .where(eq(votes.submissionId, id));
    map.set(id, Number(total));
  }
  return map;
}

export async function getUserVotesForSubmissions(userId: string, submissionIds: string[]) {
  const set = new Set<string>();
  if (!submissionIds.length) return set;

  for (const id of submissionIds) {
    const row = await db.query.votes.findFirst({
      where: and(eq(votes.userId, userId), eq(votes.submissionId, id)),
    });
    if (row) set.add(id);
  }
  return set;
}

export type CategoryLeader = {
  submissionId: string;
  title: string;
  category: string;
  coverFilename: string | null;
  submitter: string;
  submitterType: string;
  votes: number;
};

export async function getCategoryLeaders(category?: Category | string, limit = 10) {
  const published = await db.query.submissions.findMany({
    where: category
      ? and(eq(submissions.published, true), eq(submissions.category, category))
      : eq(submissions.published, true),
    with: { user: true, assets: true, votes: true },
  });

  return published
    .map((s) => ({
      submissionId: s.id,
      title: s.title,
      category: s.category,
      coverFilename: s.assets[0]?.filename ?? null,
      submitter: s.user.agencyName || s.user.name,
      submitterType: s.submitterType,
      votes: s.votes.length,
    }))
    .sort((a, b) => b.votes - a.votes || a.title.localeCompare(b.title))
    .slice(0, limit);
}

export type EntityLeader = {
  key: string;
  name: string;
  kind: "creator" | "agency";
  votes: number;
  entries: number;
  avatarFilename?: string | null;
  href: string;
};

export async function getWeeklyLeaderboard(kind: "creator" | "agency", limit = 20) {
  const since = weekStartIso();
  const published = await db.query.submissions.findMany({
    where: eq(submissions.published, true),
    with: { user: true, votes: true },
  });

  const map = new Map<string, EntityLeader>();

  for (const s of published) {
    const weeklyVotes = s.votes.filter((v) => v.createdAt >= since).length;
    if (kind === "agency") {
      if (s.submitterType !== "agency" || !s.user.agencyName) continue;
      const key = s.user.agencySlug || s.user.agencyName;
      const current = map.get(key) || {
        key,
        name: s.user.agencyName,
        kind: "agency" as const,
        votes: 0,
        entries: 0,
        avatarFilename: s.user.avatarFilename,
        href: `/agencies/${encodeURIComponent(s.user.agencySlug || s.user.agencyName)}`,
      };
      current.votes += weeklyVotes;
      current.entries += 1;
      if (!current.avatarFilename && s.user.avatarFilename) {
        current.avatarFilename = s.user.avatarFilename;
      }
      map.set(key, current);
    } else {
      const key = s.user.id;
      const current = map.get(key) || {
        key,
        name: s.user.name,
        kind: "creator" as const,
        votes: 0,
        entries: 0,
        avatarFilename: s.user.avatarFilename,
        href: `/creators/${s.user.id}`,
      };
      current.votes += weeklyVotes;
      current.entries += 1;
      map.set(key, current);
    }
  }

  return Array.from(map.values())
    .sort((a, b) => b.votes - a.votes || b.entries - a.entries)
    .slice(0, limit);
}

export async function getTopByCategoryPreview(perCategory = 3) {
  const { getActiveCategoryNames } = await import("@/lib/categories");
  const names = await getActiveCategoryNames();
  const result: { category: string; leaders: CategoryLeader[] }[] = [];
  for (const cat of names) {
    result.push({ category: cat, leaders: await getCategoryLeaders(cat, perCategory) });
  }
  return result;
}
