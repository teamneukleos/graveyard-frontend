import { desc, eq } from "drizzle-orm";
import { NextResponse } from "next/server";
import { v4 as uuid } from "uuid";
import { z } from "zod";
import { db } from "@/db";
import { submissions } from "@/db/schema";
import { requireSession } from "@/lib/auth";
import { isActiveCategoryName } from "@/lib/categories";
import { SUBMITTER_TYPES } from "@/lib/constants";

const submissionSchema = z.object({
  title: z.string().min(1),
  category: z.string().min(1),
  submitterType: z.enum(SUBMITTER_TYPES),
  teamMembers: z.string().default(""),
  yearCreated: z.number().int().min(1950).max(2100),
  concept: z.string().default(""),
  whyNeverLive: z.string().default(""),
  status: z.enum(["draft", "submitted"]).default("draft"),
});

export async function GET() {
  const session = await requireSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (session.role === "admin" || session.role === "judge") {
    const all = await db.query.submissions.findMany({
      orderBy: [desc(submissions.updatedAt)],
      with: { user: true, assets: true, reviews: true },
    });

    if (session.role === "judge") {
      const filtered = all.filter((s) =>
        ["submitted", "under_review", "shortlisted", "winner"].includes(s.status),
      );
      return NextResponse.json({ submissions: filtered });
    }

    return NextResponse.json({ submissions: all });
  }

  const mine = await db.query.submissions.findMany({
    where: eq(submissions.userId, session.id),
    orderBy: [desc(submissions.updatedAt)],
    with: { assets: true, reviews: true },
  });

  return NextResponse.json({ submissions: mine });
}

export async function POST(request: Request) {
  const session = await requireSession(["creator", "admin"]);
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (session.role === "creator") {
    const { isEmailVerified } = await import("@/lib/auth-tokens");
    if (!(await isEmailVerified(session.id))) {
      return NextResponse.json(
        { error: "Verify your email before creating submissions." },
        { status: 403 },
      );
    }
  }

  try {
    const body = await request.json();
    const data = submissionSchema.parse(body);
    const now = new Date().toISOString();

    if (!(await isActiveCategoryName(data.category))) {
      return NextResponse.json({ error: "Invalid or inactive category." }, { status: 400 });
    }

    if (data.status === "submitted") {
      if (!data.concept.trim() || !data.whyNeverLive.trim()) {
        return NextResponse.json(
          { error: "Concept and why-it-never-went-live are required to submit." },
          { status: 400 },
        );
      }
    }

    const row = {
      id: uuid(),
      userId: session.id,
      title: data.title.trim(),
      category: data.category,
      submitterType: data.submitterType,
      teamMembers: data.teamMembers.trim(),
      yearCreated: data.yearCreated,
      concept: data.concept.trim(),
      whyNeverLive: data.whyNeverLive.trim(),
      status: data.status,
      published: false,
      showcaseYear: null as number | null,
      createdAt: now,
      updatedAt: now,
      submittedAt: data.status === "submitted" ? now : null,
    };

    await db.insert(submissions).values(row);
    const created = await db.query.submissions.findFirst({
      where: eq(submissions.id, row.id),
      with: { assets: true },
    });

    return NextResponse.json({ submission: created }, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: "Invalid submission data." }, { status: 400 });
    }
    return NextResponse.json({ error: "Could not create submission." }, { status: 500 });
  }
}
