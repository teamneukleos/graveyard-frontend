import {
  nestLeaderboardCreators,
  nestLeaderboardWorks,
  nestListSubmissions,
} from "@/lib/nest/client";
import { coverUrlOf, safeApi } from "@/lib/nest/mappers";

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
  // Nest list responses already include likeCount; callers usually pass mapped counts.
  for (const id of ids) map.set(id, 0);
  return map;
}

export async function getUserVotesForSubmissions(_userId: string, _submissionIds: string[]) {
  return new Set<string>();
}

export type CategoryLeader = {
  submissionId: string;
  slug: string;
  title: string;
  category: string;
  coverUrl: string | null;
  coverFilename?: string | null;
  submitter: string;
  submitterType: string;
  votes: number;
};

export async function getCategoryLeaders(category?: string, limit = 10) {
  const categorySlug = category
    ? category
        .toLowerCase()
        .trim()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-|-$/g, "")
    : undefined;

  const page = await safeApi(
    nestListSubmissions({ category: categorySlug, page: 1, limit: Math.min(limit * 3, 100) }),
    { data: [], total: 0, page: 1, limit },
  );

  return page.data
    .map((s) => ({
      submissionId: s.id,
      slug: s.slug,
      title: s.title,
      category: s.category.name,
      coverUrl: coverUrlOf(s),
      coverFilename: null,
      submitter: s.creator.agencyName || s.creator.name,
      submitterType: s.submitterType.toLowerCase(),
      votes: s.likeCount,
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
  avatarUrl?: string | null;
  avatarFilename?: string | null;
  href: string;
};

export async function getWeeklyLeaderboard(kind: "creator" | "agency", limit = 20) {
  if (kind === "agency") {
    // Nest has no agency leaderboard yet — derive lightly from works board.
    const works = await safeApi(nestLeaderboardWorks(Math.min(limit * 3, 50)), {
      window: { startsAt: "", endsAt: "" },
      items: [],
    });
    const map = new Map<string, EntityLeader>();
    for (const item of works.items) {
      if (!item.agencyName) continue;
      const key = item.agencyName;
      const current = map.get(key) || {
        key,
        name: item.agencyName,
        kind: "agency" as const,
        votes: 0,
        entries: 0,
        avatarUrl: null,
        href: `/agencies/${encodeURIComponent(item.agencyName)}`,
      };
      current.votes += item.weeklyLikes;
      current.entries += 1;
      map.set(key, current);
    }
    return Array.from(map.values())
      .sort((a, b) => b.votes - a.votes || b.entries - a.entries)
      .slice(0, limit);
  }

  const board = await safeApi(nestLeaderboardCreators(limit), {
    window: { startsAt: "", endsAt: "" },
    items: [],
  });

  return board.items.map((item) => ({
    key: item.creatorId,
    name: item.name,
    kind: "creator" as const,
    votes: item.weeklyLikes,
    entries: item.likedSubmissions,
    avatarUrl: item.avatarUrl,
    avatarFilename: null,
    href: `/creators/${item.creatorId}`,
  }));
}

export async function getTrendingWorks(limit = 12): Promise<CategoryLeader[]> {
  const board = await safeApi(nestLeaderboardWorks(limit), {
    window: { startsAt: "", endsAt: "" },
    items: [],
  });
  return board.items.map((item) => ({
    submissionId: item.submissionId,
    slug: item.slug,
    title: item.title,
    category: item.categorySlug,
    coverUrl: item.coverUrl,
    coverFilename: null,
    submitter: item.agencyName || item.creatorName,
    submitterType: item.agencyName ? "agency" : "individual",
    votes: item.weeklyLikes || item.likeCount,
  }));
}

export async function getTopByCategoryPreview(perCategory = 3) {
  const { getActiveCategories } = await import("@/lib/categories");
  const categories = await getActiveCategories();
  const result: { category: string; leaders: CategoryLeader[] }[] = [];
  for (const cat of categories) {
    result.push({
      category: cat.name,
      leaders: await getCategoryLeaders(cat.slug, perCategory),
    });
  }
  return result;
}
