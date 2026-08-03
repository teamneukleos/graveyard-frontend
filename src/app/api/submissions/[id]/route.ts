import { and, eq } from "drizzle-orm";
import { NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/db";
import { submissions } from "@/db/schema";
import { requireSession } from "@/lib/auth";
import { findCategoryByName } from "@/lib/categories";
import { SUBMITTER_TYPES } from "@/lib/constants";

type Params = { params: Promise<{ id: string }> };

const updateSchema = z.object({
  title: z.string().min(1).optional(),
  category: z.string().min(1).optional(),
  submitterType: z.enum(SUBMITTER_TYPES).optional(),
  teamMembers: z.string().optional(),
  yearCreated: z.number().int().min(1950).max(2100).optional(),
  concept: z.string().optional(),
  whyNeverLive: z.string().optional(),
  status: z.enum(["draft", "submitted"]).optional(),
});

export async function GET(_request: Request, { params }: Params) {
  const session = await requireSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const submission = await db.query.submissions.findFirst({
    where: eq(submissions.id, id),
    with: { user: true, assets: true, reviews: { with: { judge: true } } },
  });

  if (!submission) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const isOwner = submission.userId === session.id;
  const isStaff = session.role === "admin" || session.role === "judge";
  if (!isOwner && !isStaff) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  return NextResponse.json({ submission });
}

export async function PATCH(request: Request, { params }: Params) {
  const session = await requireSession(["creator", "admin"]);
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const existing = await db.query.submissions.findFirst({
    where: eq(submissions.id, id),
  });

  if (!existing) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  if (existing.userId !== session.id && session.role !== "admin") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  if (!["draft", "submitted"].includes(existing.status) && session.role !== "admin") {
    return NextResponse.json(
      { error: "This submission can no longer be edited." },
      { status: 400 },
    );
  }

  try {
    const body = await request.json();
    const data = updateSchema.parse(body);
    const now = new Date().toISOString();

    const nextStatus = data.status ?? existing.status;
    const concept = data.concept ?? existing.concept;
    const whyNeverLive = data.whyNeverLive ?? existing.whyNeverLive;
    const nextCategory = data.category ?? existing.category;

    if (data.category && data.category !== existing.category) {
      const cat = await findCategoryByName(data.category);
      if (!cat?.active) {
        return NextResponse.json({ error: "Invalid or inactive category." }, { status: 400 });
      }
    }

    if (nextStatus === "submitted" && (!concept.trim() || !whyNeverLive.trim())) {
      return NextResponse.json(
        { error: "Concept and why-it-never-went-live are required to submit." },
        { status: 400 },
      );
    }

    await db
      .update(submissions)
      .set({
        title: data.title?.trim() ?? existing.title,
        category: nextCategory,
        submitterType: data.submitterType ?? existing.submitterType,
        teamMembers: data.teamMembers?.trim() ?? existing.teamMembers,
        yearCreated: data.yearCreated ?? existing.yearCreated,
        concept: concept.trim(),
        whyNeverLive: whyNeverLive.trim(),
        status: nextStatus,
        updatedAt: now,
        submittedAt:
          nextStatus === "submitted" && !existing.submittedAt
            ? now
            : existing.submittedAt,
      })
      .where(and(eq(submissions.id, id)));

    const updated = await db.query.submissions.findFirst({
      where: eq(submissions.id, id),
      with: { assets: true, reviews: true },
    });

    return NextResponse.json({ submission: updated });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: "Invalid submission data." }, { status: 400 });
    }
    return NextResponse.json({ error: "Could not update submission." }, { status: 500 });
  }
}

export async function DELETE(_request: Request, { params }: Params) {
  const session = await requireSession(["creator", "admin"]);
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const existing = await db.query.submissions.findFirst({
    where: eq(submissions.id, id),
  });

  if (!existing) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  if (existing.userId !== session.id && session.role !== "admin") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  if (existing.status !== "draft" && session.role !== "admin") {
    return NextResponse.json(
      { error: "Only drafts can be deleted." },
      { status: 400 },
    );
  }

  await db.delete(submissions).where(eq(submissions.id, id));
  return NextResponse.json({ ok: true });
}
