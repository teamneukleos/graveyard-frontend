import { and, eq } from "drizzle-orm";
import { NextResponse } from "next/server";
import { v4 as uuid } from "uuid";
import { z } from "zod";
import { db } from "@/db";
import { reviews, submissions } from "@/db/schema";
import { requireSession } from "@/lib/auth";

const reviewSchema = z.object({
  submissionId: z.string().min(1),
  score: z.number().min(0).max(10),
  comment: z.string().default(""),
  shortlisted: z.boolean().default(false),
});

export async function POST(request: Request) {
  const session = await requireSession(["judge", "admin"]);
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const data = reviewSchema.parse(body);

    const submission = await db.query.submissions.findFirst({
      where: eq(submissions.id, data.submissionId),
    });

    if (!submission) {
      return NextResponse.json({ error: "Submission not found." }, { status: 404 });
    }

    if (submission.status === "draft") {
      return NextResponse.json({ error: "Cannot review a draft." }, { status: 400 });
    }

    const now = new Date().toISOString();
    const existing = await db.query.reviews.findFirst({
      where: and(
        eq(reviews.submissionId, data.submissionId),
        eq(reviews.judgeId, session.id),
      ),
    });

    if (existing) {
      await db
        .update(reviews)
        .set({
          score: data.score,
          comment: data.comment.trim(),
          shortlisted: data.shortlisted,
          updatedAt: now,
        })
        .where(eq(reviews.id, existing.id));
    } else {
      await db.insert(reviews).values({
        id: uuid(),
        submissionId: data.submissionId,
        judgeId: session.id,
        score: data.score,
        comment: data.comment.trim(),
        shortlisted: data.shortlisted,
        createdAt: now,
        updatedAt: now,
      });
    }

    let nextStatus = submission.status;
    if (data.shortlisted && !["shortlisted", "winner"].includes(submission.status)) {
      nextStatus = "shortlisted";
    } else if (submission.status === "submitted") {
      nextStatus = "under_review";
    }

    if (nextStatus !== submission.status) {
      await db
        .update(submissions)
        .set({ status: nextStatus, updatedAt: now })
        .where(eq(submissions.id, data.submissionId));
    }

    const updated = await db.query.submissions.findFirst({
      where: eq(submissions.id, data.submissionId),
      with: { reviews: { with: { judge: true } }, assets: true, user: true },
    });

    return NextResponse.json({ submission: updated });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: "Invalid review data." }, { status: 400 });
    }
    return NextResponse.json({ error: "Could not save review." }, { status: 500 });
  }
}
