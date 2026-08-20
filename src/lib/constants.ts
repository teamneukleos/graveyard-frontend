export const CATEGORIES = [
  "Campaign",
  "Branding",
  "Digital",
  "Film",
  "Social Media",
  "Copywriting",
  "Motion",
  "Illustration",
  "Innovation",
  "Student Work",
] as const;

export type Category = (typeof CATEGORIES)[number];

/** Bold graveyard-adjacent category colors (bg + ink) */
export const CATEGORY_COLORS: Record<
  Category,
  { bg: string; fg: string; soft: string }
> = {
  Campaign: { bg: "#D8FF3C", fg: "#111111", soft: "#F3FFC4" },
  Branding: { bg: "#6DFFB0", fg: "#111111", soft: "#D8FFE9" },
  Digital: { bg: "#5B8CFF", fg: "#ffffff", soft: "#DCE6FF" },
  Film: { bg: "#B48CFF", fg: "#111111", soft: "#EDE0FF" },
  "Social Media": { bg: "#FF5C9A", fg: "#ffffff", soft: "#FFD6E7" },
  Copywriting: { bg: "#FFC14D", fg: "#111111", soft: "#FFE9B8" },
  Motion: { bg: "#2EE6C7", fg: "#111111", soft: "#C9FFF4" },
  Illustration: { bg: "#FF7A59", fg: "#111111", soft: "#FFD5CA" },
  Innovation: { bg: "#9BFF5A", fg: "#111111", soft: "#E3FFC9" },
  "Student Work": { bg: "#8B93FF", fg: "#ffffff", soft: "#DBDEFF" },
};

export function categoryColor(category: string) {
  if (category in CATEGORY_COLORS) {
    return CATEGORY_COLORS[category as Category];
  }
  return { bg: "#111111", fg: "#ffffff", soft: "#F5F5F7" };
}

export const SUBMISSION_STATUSES = [
  "draft",
  "published",
  "submitted", // legacy alias used by submit forms (= publish action)
  "under_review",
  "shortlisted",
  "winner",
  "rejected",
] as const;

export type SubmissionStatus = (typeof SUBMISSION_STATUSES)[number];

export const ROLES = ["creator", "agency", "judge", "admin"] as const;
export type Role = (typeof ROLES)[number];

export const SUBMITTER_TYPES = ["individual", "agency"] as const;
export type SubmitterType = (typeof SUBMITTER_TYPES)[number];

export const CURRENT_YEAR = new Date().getFullYear();

export const STATUS_LABELS: Record<SubmissionStatus, string> = {
  draft: "Draft",
  published: "Published",
  submitted: "Published",
  under_review: "Under Review",
  shortlisted: "Shortlisted",
  winner: "Winner",
  rejected: "Rejected",
};
