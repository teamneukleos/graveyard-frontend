import {
  nestLeaderboardAgencies,
  nestLeaderboardCreators,
  nestLeaderboardWorks,
  nestListSubmissions,
} from "@/lib/nest/client";
import { resolveAssetUrl } from "@/lib/asset-url";
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
      votes: s.voteScore ?? s.likeCount,
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
    const board = await safeApi(nestLeaderboardAgencies(limit), {
      window: { startsAt: "", endsAt: "" },
      items: [],
    });
    return board.items.map((item) => ({
      key: item.creatorId,
      name: item.agencyName || item.name,
      kind: "agency" as const,
      votes: item.weeklyLikes,
      entries: item.likedSubmissions,
      avatarUrl: resolveAssetUrl(item.avatarUrl),
      avatarFilename: null,
      href: `/agencies/${item.creatorId}`,
    }));
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
    avatarUrl: resolveAssetUrl(item.avatarUrl),
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
    coverUrl: resolveAssetUrl(item.coverUrl),
    coverFilename: null,
    submitter: item.agencyName || item.creatorName,
    submitterType: item.creatorRole === "AGENCY" || item.agencyName ? "agency" : "individual",
    votes: item.weeklyLikes || item.voteScore || item.likeCount,
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
