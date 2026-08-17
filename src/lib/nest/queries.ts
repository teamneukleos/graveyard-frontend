import { nestListSubmissions, nestShowcase } from "@/lib/nest/client";
import { safeApi } from "@/lib/nest/mappers";
import type { NestShowcaseItem, NestSubmission } from "@/lib/nest/types";

const PAGE_LIMIT = 100;

/** Walk Nest public submissions pages (max ~1000 rows). */
export async function listAllPublicSubmissions(opts?: {
  category?: string;
  year?: number;
  maxPages?: number;
}): Promise<NestSubmission[]> {
  const maxPages = opts?.maxPages ?? 10;
  const all: NestSubmission[] = [];
  let page = 1;
  let total = Infinity;

  while (page <= maxPages && all.length < total) {
    const batch = await safeApi(
      nestListSubmissions({
        category: opts?.category,
        year: opts?.year,
        page,
        limit: PAGE_LIMIT,
      }),
      { data: [], total: 0, page, limit: PAGE_LIMIT },
    );
    total = batch.total;
    all.push(...batch.data);
    if (batch.data.length === 0) break;
    page += 1;
  }

  return all;
}

export async function findSubmissionsByCreator(creatorId: string) {
  const all = await listAllPublicSubmissions();
  return all.filter((s) => s.creator.id === creatorId);
}

export async function findSubmissionsByAgency(agencyKey: string) {
  const decoded = decodeURIComponent(agencyKey);
  const all = await listAllPublicSubmissions();
  return all.filter((s) => {
    if (s.submitterType !== "AGENCY" || !s.creator.agencyName) return false;
    const name = s.creator.agencyName;
    return (
      name === decoded ||
      name.toLowerCase() === decoded.toLowerCase() ||
      slugifyLabel(name) === slugifyLabel(decoded)
    );
  });
}

export function slugifyLabel(value: string) {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

export async function listShowcaseItems(query?: {
  year?: number;
  category?: string;
  placement?: "SHORTLISTED" | "WINNER";
}): Promise<NestShowcaseItem[]> {
  return safeApi(nestShowcase(query), []);
}

export function showcaseItemToFeedFields(item: NestShowcaseItem) {
  return {
    id: item.slug,
    submissionId: item.submissionId,
    title: item.title,
    category: item.categoryName,
    status: item.placement === "WINNER" ? "winner" : "shortlisted",
    yearCreated: item.cycleYear,
    coverUrl: item.coverUrl,
    submitter: item.agencyName || item.creatorName,
    votes: item.likeCount,
    voted: false,
  };
}
