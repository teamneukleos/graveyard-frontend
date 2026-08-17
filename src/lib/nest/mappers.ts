import type { FeedItem } from "@/components/FeedCard";
import type { NestSubmission, NestSubmissionStatus } from "./types";

export function coverUrlOf(submission: NestSubmission) {
  const cover = submission.assets.find((asset) => asset.isCover) ?? submission.assets[0];
  return cover?.url ?? null;
}

export function mapNestStatus(status: NestSubmissionStatus): string {
  switch (status) {
    case "DRAFT":
      return "draft";
    case "PUBLISHED":
      return "published";
    case "UNDER_REVIEW":
      return "under_review";
    case "SHORTLISTED":
      return "shortlisted";
    case "WINNER":
      return "winner";
    case "REJECTED":
    case "ARCHIVED":
      return "rejected";
    default:
      return "published";
  }
}

export function isDraftEditable(status: NestSubmissionStatus | string) {
  return status === "DRAFT" || status === "draft";
}

export function submissionToFeedItem(
  submission: NestSubmission,
  opts?: { voted?: boolean },
): FeedItem {
  return {
    id: submission.slug,
    title: submission.title,
    category: submission.category.name,
    status: mapNestStatus(submission.status),
    yearCreated: submission.yearCreated,
    coverUrl: coverUrlOf(submission),
    submitter: submission.creator.agencyName || submission.creator.name,
    concept: submission.concept,
    votes: submission.likeCount,
    voted: opts?.voted ?? false,
    submissionId: submission.id,
  };
}

export function safeApi<T>(promise: Promise<T>, fallback: T): Promise<T> {
  return promise.catch(() => fallback);
}
