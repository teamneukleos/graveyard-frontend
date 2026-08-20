export type NestRole = "CREATOR" | "AGENCY" | "JUDGE" | "ADMIN" | "SUPER_ADMIN";

export type NestMemberAgency = {
  id: string;
  name: string;
  agencyName: string | null;
  avatarUrl?: string | null;
};

export type NestUser = {
  id: string;
  email: string;
  name: string;
  role: NestRole;
  bio: string | null;
  agencyName: string | null;
  avatarUrl: string | null;
  emailVerified: boolean;
  emailVerifiedAt: string | null;
  memberOfAgency: NestMemberAgency | null;
  agencyOnboardingRequired?: boolean;
  createdAt: string;
};

export type NestAuthResponse = {
  accessToken: string;
  user: NestUser;
};

export type NestCategory = {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  sortOrder: number;
};

export type NestSubmissionStatus =
  | "DRAFT"
  | "PUBLISHED"
  | "UNDER_REVIEW"
  | "SHORTLISTED"
  | "WINNER"
  | "REJECTED"
  | "ARCHIVED";

export type NestAsset = {
  id: string;
  type: string;
  url: string;
  fileName: string | null;
  mimeType: string | null;
  sizeBytes: number | null;
  sortOrder: number;
  isCover: boolean;
};

export type NestSubmission = {
  id: string;
  title: string;
  slug: string;
  submitterType: "INDIVIDUAL" | "AGENCY";
  yearCreated: number;
  concept: string;
  whyNeverLived: string;
  rightsAttested: boolean;
  status: NestSubmissionStatus;
  likeCount: number;
  voteScore: number;
  publishedAt: string | null;
  createdAt: string;
  updatedAt: string;
  category: { id: string; name: string; slug: string };
  creator: {
    id: string;
    name: string;
    agencyName: string | null;
    avatarUrl: string | null;
    role?: NestRole;
    memberOfAgency?: NestMemberAgency | null;
  };
  teamMembers: Array<{
    id: string;
    name: string;
    roleTitle: string | null;
    sortOrder: number;
  }>;
  assets: NestAsset[];
};

export type NestPaginatedSubmissions = {
  data: NestSubmission[];
  total: number;
  page: number;
  limit: number;
};

export type NestWorksLeaderboard = {
  window: { startsAt: string; endsAt: string };
  items: Array<{
    rank: number;
    weeklyLikes: number;
    submissionId: string;
    title: string;
    slug: string;
    likeCount: number;
    voteScore: number;
    coverUrl: string | null;
    categorySlug: string;
    creatorId: string;
    creatorName: string;
    agencyName: string | null;
    creatorRole?: NestRole;
  }>;
};

export type NestCreatorsLeaderboard = {
  window: { startsAt: string; endsAt: string };
  items: Array<{
    rank: number;
    weeklyLikes: number;
    creatorId: string;
    name: string;
    agencyName: string | null;
    avatarUrl: string | null;
    likedSubmissions: number;
  }>;
};

export type NestShowcaseItem = {
  id: string;
  awardCycleId: string;
  cycleName: string;
  cycleYear: number;
  submissionId: string;
  title: string;
  slug: string;
  categoryId: string;
  categorySlug: string;
  categoryName: string;
  placement: "SHORTLISTED" | "WINNER";
  creatorName: string;
  agencyName: string | null;
  coverUrl: string | null;
  likeCount: number;
  publishedAt: string;
};

export type NestFeaturedItem = {
  id: string;
  title: string | null;
  startsAt: string;
  endsAt: string | null;
  sortOrder: number;
  isActive: boolean;
  submission: {
    id: string;
    title: string;
    slug: string;
    likeCount: number;
    coverUrl: string | null;
    categorySlug: string;
    creatorName: string;
    agencyName: string | null;
  };
};

export type NestAwardCycleJudge = {
  userId: string;
  name: string;
  email: string;
  assignedAt: string;
};

export type NestAwardCycle = {
  id: string;
  name: string;
  year: number;
  startsAt: string;
  endsAt: string | null;
  judgingEndsAt: string | null;
  status: "UPCOMING" | "JUDGING" | "RESULTS_PUBLISHED" | "CLOSED";
  judgeCount?: number;
  scoreCount?: number;
  judges?: NestAwardCycleJudge[];
};

export type NestAwardEntry = {
  id: string;
  awardCycleId: string;
  submissionId: string;
  enteredById: string;
  createdAt: string;
  cycleName?: string;
  cycleYear?: number;
  cycleStatus?: NestAwardCycle["status"];
  submissionTitle?: string;
};

export type NestJudgeQueueItem = {
  submissionId: string;
  title: string;
  slug: string;
  yearCreated: number;
  categorySlug: string;
  creatorName: string;
  coverUrl: string | null;
  scoredByMe: boolean;
  myTotal: number | null;
};

export type NestLikeResponse = {
  submissionId: string;
  liked: boolean;
  likeCount: number;
  voteScore: number;
};

export type NestPublicProfile = {
  id: string;
  name: string;
  role: NestRole;
  agencyName: string | null;
  bio: string | null;
  avatarUrl: string | null;
  followerCount: number;
  followingCount: number;
  viewerFollowing: boolean;
};

export type NestFollowResponse = {
  userId: string;
  following: boolean;
  followerCount: number;
};

export type NestEventType = "MEETUP" | "SALON" | "SCREENING" | "WORKSHOP";
export type NestEventFormat = "IN_PERSON" | "ONLINE" | "HYBRID";
export type NestEventRsvpStatus = "CONFIRMED" | "WAITLISTED" | "CANCELLED";

export type NestEvent = {
  id: string;
  slug: string;
  title: string;
  type: NestEventType;
  format: NestEventFormat;
  city: string;
  venue: string;
  startsAt: string;
  capacity: number;
  blurb: string;
  isActive: boolean;
  createdById: string;
  rsvpCount: number;
  spotsLeft: number;
  hasRsvp: boolean;
  requested: boolean;
  myRsvpStatus: NestEventRsvpStatus | null;
  createdAt: string;
  updatedAt: string;
};

export type NestEventRsvpResponse = {
  eventId: string;
  requested: boolean;
  spotsLeft: number;
  status: NestEventRsvpStatus;
};

export type NestAdminAnalytics = {
  submissionsByStatus: Array<{ status: string; total: number }>;
  votesLast7Days: number;
  rsvpsLast7Days: number;
  judgeCoverage: {
    covered: number;
    reviewable: number;
    percent: number;
    judges: Array<{ judgeName: string; reviews: number }>;
  };
  topCategories: Array<{ category: string; total: number }>;
  byCategory: Array<{ category: string; total: number }>;
  votesOverTime: Array<{ day: string; total: number }>;
  eventFill: Array<{
    id: string;
    title: string;
    rsvps: number;
    capacity: number;
    fill: number;
  }>;
  funnel: {
    total: number;
    published: number;
    byStatus: Record<string, number>;
  };
  totals: {
    votes: number;
    rsvps: number;
  };
};
