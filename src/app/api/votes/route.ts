import { NextResponse } from "next/server";
import { z } from "zod";
import { getAccessToken } from "@/lib/auth";
import { NestApiError, nestLike, nestUnlike } from "@/lib/nest/client";

const voteSchema = z.object({
  submissionId: z.string().min(1),
});

async function handle(request: Request, liked: boolean) {
  const token = await getAccessToken();
  if (!token) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { submissionId } = voteSchema.parse(body);
    const result = liked
      ? await nestLike(submissionId, token)
      : await nestUnlike(submissionId, token);

    return NextResponse.json({
      voted: result.liked,
      count: result.likeCount,
      submissionId: result.submissionId,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: "Invalid vote." }, { status: 400 });
    }
    if (error instanceof NestApiError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }
    console.error("[votes]", error);
    return NextResponse.json({ error: "Could not save vote." }, { status: 500 });
  }
}

export async function POST(request: Request) {
  return handle(request, true);
}

export async function DELETE(request: Request) {
  return handle(request, false);
}
