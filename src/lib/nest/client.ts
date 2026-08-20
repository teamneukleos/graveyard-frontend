import { cookies } from "next/headers";
import { getNestApiUrl } from "./config";
import type {
  NestAuthResponse,
  NestAdminAnalytics,
  NestAwardCycle,
  NestAwardEntry,
  NestCategory,
  NestCreatorsLeaderboard,
  NestEvent,
  NestEventFormat,
  NestEventRsvpResponse,
  NestEventType,
  NestFeaturedItem,
  NestFollowResponse,
  NestJudgeQueueItem,
  NestLikeResponse,
  NestPaginatedSubmissions,
  NestPublicProfile,
  NestRole,
  NestShowcaseItem,
  NestSubmission,
  NestUser,
  NestWorksLeaderboard,
} from "./types";

const ACCESS_COOKIE = "graveyard_token";

export class NestApiError extends Error {
  status: number;

  constructor(status: number, message: string) {
    super(message);
    this.name = "NestApiError";
    this.status = status;
  }
}

type NestFetchOptions = {
  method?: string;
  body?: unknown;
  token?: string | null;
  formData?: FormData;
  query?: Record<string, string | number | undefined | null>;
};

function nestErrorMessage(payload: unknown, fallback: string) {
  if (!payload || typeof payload !== "object") return fallback;
  const message = (payload as { message?: unknown }).message;
  if (typeof message === "string" && message.trim()) return message;
  if (Array.isArray(message)) {
    const parts = message.filter((part): part is string => typeof part === "string");
    if (parts.length) return parts.join(", ");
  }
  return fallback;
}

function withQuery(path: string, query?: NestFetchOptions["query"]) {
  if (!query) return path;
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(query)) {
    if (value === undefined || value === null || value === "") continue;
    params.set(key, String(value));
  }
  const qs = params.toString();
  return qs ? `${path}?${qs}` : path;
}

export async function nestFetch<T>(path: string, options: NestFetchOptions = {}): Promise<T> {
  const headers = new Headers();
  if (options.token) {
    headers.set("Authorization", `Bearer ${options.token}`);
  }

  let body: BodyInit | undefined;
  if (options.formData) {
    body = options.formData;
  } else if (options.body !== undefined) {
    headers.set("Content-Type", "application/json");
    body = JSON.stringify(options.body);
  }

  const method =
    options.method ?? (options.body !== undefined || options.formData ? "POST" : "GET");

  const response = await fetch(`${getNestApiUrl()}${withQuery(path, options.query)}`, {
    method,
    headers,
    body,
    cache: "no-store",
  });

  if (!response.ok) {
    const payload = await response.json().catch(() => null);
    throw new NestApiError(
      response.status,
      nestErrorMessage(payload, `API request failed (${response.status})`),
    );
  }

  if (response.status === 204) {
    return undefined as T;
  }

  return (await response.json()) as T;
}

async function optionalToken(token?: string | null) {
  if (token !== undefined) return token;
  const cookieStore = await cookies();
  return cookieStore.get(ACCESS_COOKIE)?.value ?? null;
}

export function nestLogin(email: string, password: string) {
  return nestFetch<NestAuthResponse>("/auth/login", {
    method: "POST",
    body: { email, password },
  });
}

export function nestRegister(input: {
  email: string;
  password: string;
  name: string;
  role?: "CREATOR" | "AGENCY";
  agencyName?: string;
}) {
  return nestFetch<NestAuthResponse>("/auth/register", {
    method: "POST",
    body: input,
  });
}

export function nestMe(token: string) {
  return nestFetch<NestUser>("/auth/me", { token });
}

export function nestVerifyEmail(token: string) {
  return nestFetch<NestUser>("/auth/verify-email", {
    method: "POST",
    body: { token },
  });
}

export function nestResendVerification(accessToken: string) {
  return nestFetch<{ message: string }>("/auth/resend-verification", {
    method: "POST",
    token: accessToken,
  });
}

export function nestForgotPassword(email: string) {
  return nestFetch<{ message: string }>("/auth/forgot-password", {
    method: "POST",
    body: { email },
  });
}

export function nestResetPassword(token: string, newPassword: string) {
  return nestFetch<{ message: string }>("/auth/reset-password", {
    method: "POST",
    body: { token, newPassword },
  });
}

export function nestUpdateProfile(
  token: string,
  body: { name?: string; bio?: string; agencyName?: string },
) {
  return nestFetch<NestUser>("/auth/me", {
    method: "PATCH",
    token,
    body,
  });
}

export function nestUploadAvatar(token: string, file: Blob, fileName: string) {
  const formData = new FormData();
  formData.append("file", file, fileName);
  return nestFetch<NestUser>("/auth/me/avatar", {
    method: "POST",
    token,
    formData,
  });
}

export function nestCategories() {
  return nestFetch<NestCategory[]>("/categories");
}

export function nestListSubmissions(query?: {
  category?: string;
  year?: number;
  page?: number;
  limit?: number;
}) {
  return nestFetch<NestPaginatedSubmissions>("/submissions", { query });
}

export function nestSubmissionBySlug(slug: string) {
  return nestFetch<NestSubmission>(`/submissions/${encodeURIComponent(slug)}`);
}

export async function nestMySubmissions(token?: string | null) {
  return nestFetch<NestSubmission[]>("/submissions/mine", {
    token: await optionalToken(token),
  });
}

export async function nestMySubmission(id: string, token?: string | null) {
  return nestFetch<NestSubmission>(`/submissions/mine/${encodeURIComponent(id)}`, {
    token: await optionalToken(token),
  });
}

export async function nestCreateSubmission(
  body: {
    title: string;
    categoryId: string;
    yearCreated: number;
    concept: string;
    whyNeverLived: string;
    submitterType?: "INDIVIDUAL" | "AGENCY";
    rightsAttested?: boolean;
    teamMembers?: Array<{ name: string; roleTitle?: string; sortOrder?: number }>;
  },
  token?: string | null,
) {
  return nestFetch<NestSubmission>("/submissions", {
    method: "POST",
    token: await optionalToken(token),
    body,
  });
}

export async function nestUpdateSubmission(
  id: string,
  body: Record<string, unknown>,
  token?: string | null,
) {
  return nestFetch<NestSubmission>(`/submissions/${encodeURIComponent(id)}`, {
    method: "PATCH",
    token: await optionalToken(token),
    body,
  });
}

export async function nestPublishSubmission(id: string, token?: string | null) {
  return nestFetch<NestSubmission>(`/submissions/${encodeURIComponent(id)}/publish`, {
    method: "POST",
    token: await optionalToken(token),
  });
}

export async function nestDeleteSubmission(id: string, token?: string | null) {
  return nestFetch<void>(`/submissions/${encodeURIComponent(id)}`, {
    method: "DELETE",
    token: await optionalToken(token),
  });
}

export async function nestUploadAsset(
  submissionId: string,
  file: Blob,
  fileName: string,
  token?: string | null,
) {
  const formData = new FormData();
  formData.append("file", file, fileName);
  return nestFetch(`/submissions/${encodeURIComponent(submissionId)}/assets/upload`, {
    method: "POST",
    token: await optionalToken(token),
    formData,
  });
}

export async function nestDeleteAsset(
  submissionId: string,
  assetId: string,
  token?: string | null,
) {
  return nestFetch<{ message: string }>(
    `/submissions/${encodeURIComponent(submissionId)}/assets/${encodeURIComponent(assetId)}`,
    {
      method: "DELETE",
      token: await optionalToken(token),
    },
  );
}

export async function nestLike(submissionId: string, token?: string | null) {
  return nestFetch<NestLikeResponse>(`/submissions/${encodeURIComponent(submissionId)}/like`, {
    method: "POST",
    token: await optionalToken(token),
  });
}

export async function nestUnlike(submissionId: string, token?: string | null) {
  return nestFetch<NestLikeResponse>(`/submissions/${encodeURIComponent(submissionId)}/like`, {
    method: "DELETE",
    token: await optionalToken(token),
  });
}

export function nestLeaderboardWorks(limit = 20) {
  return nestFetch<NestWorksLeaderboard>("/leaderboard/works", { query: { limit } });
}

export function nestLeaderboardCreators(limit = 20) {
  return nestFetch<NestCreatorsLeaderboard>("/leaderboard/creators", { query: { limit } });
}

export function nestLeaderboardAgencies(limit = 20) {
  return nestFetch<NestCreatorsLeaderboard>("/leaderboard/agencies", { query: { limit } });
}

export function nestShowcase(query?: {
  year?: number;
  category?: string;
  placement?: string;
  cycleId?: string;
}) {
  return nestFetch<NestShowcaseItem[]>("/showcase", { query });
}

export function nestFeatured() {
  return nestFetch<NestFeaturedItem[]>("/featured");
}

export async function nestAwardCycles(token?: string | null) {
  return nestFetch<NestAwardCycle[]>("/award-cycles", {
    token: await optionalToken(token),
  });
}

export async function nestAwardCycle(id: string, token?: string | null) {
  return nestFetch<NestAwardCycle>(`/award-cycles/${encodeURIComponent(id)}`, {
    token: await optionalToken(token),
  });
}

export async function nestCreateAwardCycle(
  body: {
    name: string;
    year: number;
    startsAt: string;
    endsAt?: string;
    judgingEndsAt?: string;
  },
  token?: string | null,
) {
  return nestFetch<NestAwardCycle>("/award-cycles", {
    method: "POST",
    token: await optionalToken(token),
    body,
  });
}

export async function nestUpdateAwardCycle(
  id: string,
  body: Partial<{
    name: string;
    year: number;
    startsAt: string;
    endsAt: string | null;
    judgingEndsAt: string | null;
    status: NestAwardCycle["status"];
  }>,
  token?: string | null,
) {
  return nestFetch<NestAwardCycle>(`/award-cycles/${encodeURIComponent(id)}`, {
    method: "PATCH",
    token: await optionalToken(token),
    body,
  });
}

export async function nestAssignAwardJudge(
  cycleId: string,
  userId: string,
  token?: string | null,
) {
  return nestFetch<NestAwardCycle>(
    `/award-cycles/${encodeURIComponent(cycleId)}/judges`,
    {
      method: "POST",
      token: await optionalToken(token),
      body: { userId },
    },
  );
}

export async function nestRemoveAwardJudge(
  cycleId: string,
  userId: string,
  token?: string | null,
) {
  return nestFetch<NestAwardCycle>(
    `/award-cycles/${encodeURIComponent(cycleId)}/judges/${encodeURIComponent(userId)}`,
    {
      method: "DELETE",
      token: await optionalToken(token),
    },
  );
}

export function nestOpenAwardCycles() {
  return nestFetch<NestAwardCycle[]>("/award-cycles/open");
}

export async function nestAwardEntriesForSubmission(
  submissionId: string,
  token?: string | null,
) {
  return nestFetch<NestAwardEntry[]>(
    `/award-cycles/entries/by-submission/${encodeURIComponent(submissionId)}`,
    { token: await optionalToken(token) },
  );
}

export async function nestEnterAwardCycle(
  cycleId: string,
  submissionId: string,
  token?: string | null,
) {
  return nestFetch<NestAwardEntry>(
    `/award-cycles/${encodeURIComponent(cycleId)}/entries`,
    {
      method: "POST",
      token: await optionalToken(token),
      body: { submissionId },
    },
  );
}

export async function nestWithdrawAwardEntry(
  cycleId: string,
  submissionId: string,
  token?: string | null,
) {
  return nestFetch<{ message: string }>(
    `/award-cycles/${encodeURIComponent(cycleId)}/entries/${encodeURIComponent(submissionId)}`,
    {
      method: "DELETE",
      token: await optionalToken(token),
    },
  );
}

export async function nestAwardQueue(cycleId: string, token?: string | null) {
  return nestFetch<NestJudgeQueueItem[]>(
    `/award-cycles/${encodeURIComponent(cycleId)}/queue`,
    { token: await optionalToken(token) },
  );
}

export async function nestUpsertScore(
  cycleId: string,
  body: {
    submissionId: string;
    overall?: number;
    concept?: number;
    craft?: number;
    story?: number;
    deservedLife?: number;
    comment?: string;
  },
  token?: string | null,
) {
  return nestFetch(`/award-cycles/${encodeURIComponent(cycleId)}/scores`, {
    method: "POST",
    token: await optionalToken(token),
    body,
  });
}

export async function nestAdminCategories(token?: string | null) {
  return nestFetch<Array<NestCategory & { isActive?: boolean }>>("/categories/admin", {
    token: await optionalToken(token),
  });
}

export async function nestCreateCategory(
  body: { name: string; description?: string },
  token?: string | null,
) {
  return nestFetch<NestCategory & { isActive?: boolean }>("/categories", {
    method: "POST",
    token: await optionalToken(token),
    body,
  });
}

export async function nestUpdateCategory(
  id: string,
  body: {
    name?: string;
    description?: string;
    isActive?: boolean;
    direction?: "up" | "down";
  },
  token?: string | null,
) {
  return nestFetch<Array<NestCategory & { isActive?: boolean }>>(
    `/categories/${encodeURIComponent(id)}`,
    {
      method: "PATCH",
      token: await optionalToken(token),
      body,
    },
  );
}

export async function nestAdminSubmissions(limit = 100, token?: string | null) {
  return nestFetch<NestSubmission[]>("/admin/submissions", {
    token: await optionalToken(token),
    query: { limit },
  });
}

export async function nestAdminAnalytics(token?: string | null) {
  return nestFetch<NestAdminAnalytics>("/admin/analytics", {
    token: await optionalToken(token),
  });
}

export async function nestAdminUpdateSubmission(
  id: string,
  body: { status: string },
  token?: string | null,
) {
  return nestFetch<NestSubmission>(`/admin/submissions/${encodeURIComponent(id)}`, {
    method: "PATCH",
    token: await optionalToken(token),
    body,
  });
}

export async function nestAdminBulkSubmissions(
  body: {
    ids: string[];
    action: "publish" | "unpublish" | "winners" | "shortlist" | "enter_judging";
    cycleId?: string;
    markCyclePublished?: boolean;
  },
  token?: string | null,
) {
  return nestFetch<{ updated: number }>("/admin/submissions/bulk", {
    method: "POST",
    token: await optionalToken(token),
    body,
  });
}

export async function nestListUsers(
  query?: { role?: string; q?: string; page?: number; limit?: number },
  token?: string | null,
) {
  return nestFetch<{
    data: NestUser[];
    total: number;
    page: number;
    limit: number;
  }>("/users", {
    token: await optionalToken(token),
    query,
  });
}

export async function nestPublicProfile(userId: string, token?: string | null) {
  return nestFetch<NestPublicProfile>(
    `/users/${encodeURIComponent(userId)}/profile`,
    { token: await optionalToken(token) },
  );
}

export async function nestFollowUser(userId: string, token?: string | null) {
  return nestFetch<NestFollowResponse>(
    `/users/${encodeURIComponent(userId)}/follow`,
    {
      method: "POST",
      token: await optionalToken(token),
    },
  );
}

export async function nestUnfollowUser(userId: string, token?: string | null) {
  return nestFetch<NestFollowResponse>(
    `/users/${encodeURIComponent(userId)}/follow`,
    {
      method: "DELETE",
      token: await optionalToken(token),
    },
  );
}

export async function nestCreateManagedUser(
  body: {
    email: string;
    name: string;
    password: string;
    role: "JUDGE" | "ADMIN";
    agencyName?: string;
  },
  token?: string | null,
) {
  return nestFetch<NestUser>("/users", {
    method: "POST",
    token: await optionalToken(token),
    body,
  });
}

export async function nestUpdateUserRole(
  id: string,
  role: NestRole,
  token?: string | null,
) {
  return nestFetch<NestUser>(`/users/${encodeURIComponent(id)}/role`, {
    method: "PATCH",
    token: await optionalToken(token),
    body: { role },
  });
}

export async function nestUpcomingEvents(limit = 20, token?: string | null) {
  return nestFetch<NestEvent[]>("/events", {
    token: await optionalToken(token),
    query: { limit },
  });
}

export async function nestAdminEvents(token?: string | null) {
  return nestFetch<NestEvent[]>("/events/admin", {
    token: await optionalToken(token),
  });
}

export async function nestCreateEvent(
  body: {
    title: string;
    type: NestEventType;
    format: NestEventFormat;
    city: string;
    venue: string;
    startsAt: string;
    capacity: number;
    blurb: string;
    slug?: string;
  },
  token?: string | null,
) {
  return nestFetch<NestEvent>("/events", {
    method: "POST",
    token: await optionalToken(token),
    body,
  });
}

export async function nestUpdateEvent(
  id: string,
  body: Partial<{
    title: string;
    type: NestEventType;
    format: NestEventFormat;
    city: string;
    venue: string;
    startsAt: string;
    capacity: number;
    blurb: string;
    isActive: boolean;
    slug: string;
  }>,
  token?: string | null,
) {
  return nestFetch<NestEvent>(`/events/${encodeURIComponent(id)}`, {
    method: "PATCH",
    token: await optionalToken(token),
    body,
  });
}

export async function nestDeleteEvent(id: string, token?: string | null) {
  return nestFetch<void>(`/events/${encodeURIComponent(id)}`, {
    method: "DELETE",
    token: await optionalToken(token),
  });
}

export async function nestEventRsvp(eventId: string, token?: string | null) {
  return nestFetch<NestEventRsvpResponse>(
    `/events/${encodeURIComponent(eventId)}/rsvp`,
    {
      method: "POST",
      token: await optionalToken(token),
    },
  );
}

export async function nestCancelEventRsvp(eventId: string, token?: string | null) {
  return nestFetch<NestEventRsvpResponse>(
    `/events/${encodeURIComponent(eventId)}/rsvp`,
    {
      method: "DELETE",
      token: await optionalToken(token),
    },
  );
}
