import { eq } from "drizzle-orm";
import { NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/db";
import { submissions } from "@/db/schema";
import { requireSession } from "@/lib/auth";
import { CURRENT_YEAR } from "@/lib/constants";

const publishSchema = z.object({
  ids: z.array(z.string()).min(1),
  published: z.boolean(),
  showcaseYear: z.number().int().optional(),
  markWinners: z.boolean().optional(),
});

export async function POST(request: Request) {
  const session = await requireSession(["admin"]);
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const data = publishSchema.parse(body);
    const now = new Date().toISOString();
    const year = data.showcaseYear ?? CURRENT_YEAR;

    for (const id of data.ids) {
      const existing = await db.query.submissions.findFirst({
        where: eq(submissions.id, id),
      });
      if (!existing) continue;

      await db
        .update(submissions)
        .set({
          published: data.published,
          showcaseYear: data.published ? year : null,
          status: data.markWinners ? "winner" : existing.status,
          updatedAt: now,
        })
        .where(eq(submissions.id, id));
    }

    return NextResponse.json({ ok: true });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: "Invalid publish payload." }, { status: 400 });
    }
    return NextResponse.json({ error: "Publish failed." }, { status: 500 });
  }
}
