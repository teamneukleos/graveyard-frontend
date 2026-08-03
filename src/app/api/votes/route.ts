import { and, eq } from "drizzle-orm";
import { NextResponse } from "next/server";
import { v4 as uuid } from "uuid";
import { z } from "zod";
import { db } from "@/db";
import { submissions, votes } from "@/db/schema";
import { requireSession } from "@/lib/auth";
import { isKnownCategoryName } from "@/lib/categories";

const voteSchema = z.object({
  submissionId: z.string().min(1),
});

export async function POST(request: Request) {
  const session = await requireSession();
  if (!session) {
    return NextResponse.json({ error: "Log in to vote." }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { submissionId } = voteSchema.parse(body);

    const submission = await db.query.submissions.findFirst({
      where: eq(submissions.id, submissionId),
    });

    if (!submission || !submission.published) {
      return NextResponse.json({ error: "Submission not found." }, { status: 404 });
    }

    if (!(await isKnownCategoryName(submission.category))) {
      return NextResponse.json({ error: "Invalid category." }, { status: 400 });
    }

    const existing = await db.query.votes.findFirst({
      where: and(eq(votes.submissionId, submissionId), eq(votes.userId, session.id)),
    });

    if (existing) {
      await db.delete(votes).where(eq(votes.id, existing.id));
      return NextResponse.json({ voted: false, submissionId });
    }

    await db.insert(votes).values({
      id: uuid(),
      submissionId,
      userId: session.id,
      category: submission.category,
      createdAt: new Date().toISOString(),
    });

    return NextResponse.json({ voted: true, submissionId });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: "Invalid vote." }, { status: 400 });
    }
    return NextResponse.json({ error: "Could not save vote." }, { status: 500 });
  }
}
