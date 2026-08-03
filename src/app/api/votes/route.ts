import { count, eq } from "drizzle-orm";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { v4 as uuid } from "uuid";
import { z } from "zod";
import { db } from "@/db";
import { submissions, votes } from "@/db/schema";
import { isKnownCategoryName } from "@/lib/categories";
import {
  applyVoterCookie,
  findMatchingVote,
  getVoterIdentity,
} from "@/lib/voter";

const voteSchema = z.object({
  submissionId: z.string().min(1),
  name: z.string().trim().min(1).max(80).optional(),
  email: z.string().trim().email().max(120).optional(),
});

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const data = voteSchema.parse(body);
    const { submissionId } = data;

    const submission = await db.query.submissions.findFirst({
      where: eq(submissions.id, submissionId),
    });

    if (!submission || !submission.published) {
      return NextResponse.json({ error: "Submission not found." }, { status: 404 });
    }

    if (!(await isKnownCategoryName(submission.category))) {
      return NextResponse.json({ error: "Invalid category." }, { status: 400 });
    }

    const identity = await getVoterIdentity({
      guestName: data.name,
      guestEmail: data.email,
    });

    const jar = await cookies();
    applyVoterCookie(jar, identity.voterSessionId);

    const existing = await findMatchingVote(submissionId, identity);

    if (existing) {
      await db.delete(votes).where(eq(votes.id, existing.id));
      const [{ total }] = await db
        .select({ total: count() })
        .from(votes)
        .where(eq(votes.submissionId, submissionId));
      return NextResponse.json({
        voted: false,
        submissionId,
        count: Number(total),
      });
    }

    // First-time guest vote needs name + email (logged-in users already have both)
    if (!identity.userId && (!identity.guestName || !identity.guestEmail)) {
      return NextResponse.json(
        {
          error: "Add your name and email to vote.",
          code: "guest_required",
        },
        { status: 400 },
      );
    }

    try {
      await db.insert(votes).values({
        id: uuid(),
        submissionId,
        userId: identity.userId,
        guestName: identity.guestName,
        guestEmail: identity.guestEmail,
        ipHash: identity.ipHash,
        voterSessionId: identity.voterSessionId,
        category: submission.category,
        createdAt: new Date().toISOString(),
      });
    } catch {
      // Unique index race (same IP/session)  -  treat as already voted / toggle off
      const raced = await findMatchingVote(submissionId, identity);
      if (raced) {
        await db.delete(votes).where(eq(votes.id, raced.id));
        const [{ total }] = await db
          .select({ total: count() })
          .from(votes)
          .where(eq(votes.submissionId, submissionId));
        return NextResponse.json({
          voted: false,
          submissionId,
          count: Number(total),
        });
      }
      return NextResponse.json({ error: "Could not save vote." }, { status: 500 });
    }

    const [{ total }] = await db
      .select({ total: count() })
      .from(votes)
      .where(eq(votes.submissionId, submissionId));

    return NextResponse.json({
      voted: true,
      submissionId,
      count: Number(total),
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: "Invalid vote." }, { status: 400 });
    }
    console.error("[votes]", error);
    return NextResponse.json({ error: "Could not save vote." }, { status: 500 });
  }
}
