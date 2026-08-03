import { createHash, randomUUID } from "crypto";
import { and, eq, inArray, or } from "drizzle-orm";
import { cookies, headers } from "next/headers";
import { db } from "@/db";
import { votes } from "@/db/schema";
import { getSession } from "@/lib/auth";

export const VOTER_COOKIE = "graveyard_voter";
const VOTER_MAX_AGE = 60 * 60 * 24 * 365; // 1 year

export type VoterIdentity = {
  userId: string | null;
  voterSessionId: string;
  ipHash: string;
  guestName?: string | null;
  guestEmail?: string | null;
};

export function hashIp(ip: string) {
  return createHash("sha256").update(`graveyard-ip:${ip}`).digest("hex").slice(0, 32);
}

export async function readClientIp() {
  const h = await headers();
  const forwarded = h.get("x-forwarded-for");
  if (forwarded) return forwarded.split(",")[0]?.trim() || "unknown";
  return h.get("x-real-ip")?.trim() || h.get("cf-connecting-ip")?.trim() || "unknown";
}

/** Read existing voter cookie, or mint one (caller must set via cookies().set). */
export async function resolveVoterSessionId() {
  const jar = await cookies();
  const existing = jar.get(VOTER_COOKIE)?.value;
  if (existing && existing.length >= 16) return { id: existing, isNew: false };
  return { id: randomUUID(), isNew: true };
}

export function applyVoterCookie(jar: Awaited<ReturnType<typeof cookies>>, id: string) {
  jar.set(VOTER_COOKIE, id, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production" || Boolean(process.env.VERCEL),
    path: "/",
    maxAge: VOTER_MAX_AGE,
  });
}

export async function getVoterIdentity(opts?: {
  guestName?: string | null;
  guestEmail?: string | null;
}): Promise<VoterIdentity & { isNewSession: boolean }> {
  const session = await getSession();
  const { id, isNew } = await resolveVoterSessionId();
  const ipHash = hashIp(await readClientIp());
  return {
    userId: session?.id ?? null,
    voterSessionId: id,
    ipHash,
    guestName: opts?.guestName?.trim() || session?.name || null,
    guestEmail: opts?.guestEmail?.trim().toLowerCase() || session?.email || null,
    isNewSession: isNew,
  };
}

/** Find an existing vote for this person on a submission (user, device, or IP). */
export async function findMatchingVote(submissionId: string, identity: VoterIdentity) {
  const clauses = [];
  if (identity.voterSessionId) {
    clauses.push(
      and(eq(votes.submissionId, submissionId), eq(votes.voterSessionId, identity.voterSessionId)),
    );
  }
  if (identity.ipHash) {
    clauses.push(and(eq(votes.submissionId, submissionId), eq(votes.ipHash, identity.ipHash)));
  }
  if (identity.userId) {
    clauses.push(and(eq(votes.submissionId, submissionId), eq(votes.userId, identity.userId)));
  }

  if (!clauses.length) return null;

  return (
    (await db.query.votes.findFirst({
      where: or(...clauses),
    })) ?? null
  );
}

/** Which of these submissions has the current visitor already voted for. */
export async function getCurrentVoterVotes(submissionIds: string[]) {
  const set = new Set<string>();
  if (!submissionIds.length) return set;

  const identity = await getVoterIdentity();
  // Persist cookie on page loads that check vote state
  if (identity.isNewSession) {
    try {
      const jar = await cookies();
      applyVoterCookie(jar, identity.voterSessionId);
    } catch {
      /* cookies may be read-only in some RSC contexts */
    }
  }

  const clauses = [
    eq(votes.voterSessionId, identity.voterSessionId),
    eq(votes.ipHash, identity.ipHash),
  ];
  if (identity.userId) clauses.push(eq(votes.userId, identity.userId));

  const rows = await db
    .select({ submissionId: votes.submissionId })
    .from(votes)
    .where(and(inArray(votes.submissionId, submissionIds), or(...clauses)));

  for (const row of rows) set.add(row.submissionId);
  return set;
}
