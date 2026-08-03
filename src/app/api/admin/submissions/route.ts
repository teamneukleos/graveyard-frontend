import { desc, eq } from "drizzle-orm";
import { NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/db";
import { submissions } from "@/db/schema";
import { requireSession } from "@/lib/auth";
import { SUBMISSION_STATUSES } from "@/lib/constants";

const updateSchema = z.object({
  id: z.string().min(1),
  status: z.enum(SUBMISSION_STATUSES).optional(),
  published: z.boolean().optional(),
  showcaseYear: z.number().int().nullable().optional(),
});

export async function GET() {
  const session = await requireSession(["admin"]);
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const rows = await db.query.submissions.findMany({
    orderBy: [desc(submissions.updatedAt)],
    with: { user: true, assets: true, reviews: true },
  });

  return NextResponse.json({ submissions: rows });
}

export async function PATCH(request: Request) {
  const session = await requireSession(["admin"]);
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const data = updateSchema.parse(body);
    const existing = await db.query.submissions.findFirst({
      where: eq(submissions.id, data.id),
    });

    if (!existing) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    await db
      .update(submissions)
      .set({
        status: data.status ?? existing.status,
        published: data.published ?? existing.published,
        showcaseYear:
          data.showcaseYear === undefined ? existing.showcaseYear : data.showcaseYear,
        updatedAt: new Date().toISOString(),
      })
      .where(eq(submissions.id, data.id));

    const updated = await db.query.submissions.findFirst({
      where: eq(submissions.id, data.id),
      with: { user: true, assets: true, reviews: true },
    });

    return NextResponse.json({ submission: updated });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: "Invalid data." }, { status: 400 });
    }
    return NextResponse.json({ error: "Update failed." }, { status: 500 });
  }
}
