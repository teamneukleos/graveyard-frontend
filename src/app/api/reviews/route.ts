import { NextResponse } from "next/server";
import { z } from "zod";
import { getAccessToken, requireSession } from "@/lib/auth";
import {
  NestApiError,
  nestAwardCycles,
  nestUpsertScore,
} from "@/lib/nest/client";

const reviewSchema = z.object({
  submissionId: z.string().min(1),
  score: z.number().min(0).max(10),
  comment: z.string().optional(),
  shortlisted: z.boolean().optional(),
  cycleId: z.string().optional(),
});

export async function POST(request: Request) {
  const session = await requireSession(["judge", "admin"]);
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const token = await getAccessToken();
  if (!token) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const data = reviewSchema.parse(body);

    const cycles = await nestAwardCycles();
    const cycle =
      (data.cycleId ? cycles.find((c) => c.id === data.cycleId) : null) ||
      cycles.find((c) => c.status === "JUDGING") ||
      cycles.find((c) => c.status === "UPCOMING");

    if (!cycle) {
      return NextResponse.json(
        { error: "No active award cycle available for scoring." },
        { status: 400 },
      );
    }

    const overall = Math.max(1, Math.min(10, Math.round(data.score || 1)));

    const score = await nestUpsertScore(
      cycle.id,
      {
        submissionId: data.submissionId,
        overall,
        comment: data.comment?.trim() || undefined,
      },
      token,
    );

    return NextResponse.json({
      review: {
        submissionId: data.submissionId,
        score: overall,
        comment: data.comment?.trim() || "",
        shortlisted: Boolean(data.shortlisted),
        cycleId: cycle.id,
        nest: score,
      },
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: "Invalid review data." }, { status: 400 });
    }
    if (error instanceof NestApiError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }
    return NextResponse.json({ error: "Could not save review." }, { status: 500 });
  }
}
