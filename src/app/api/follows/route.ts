import { NextResponse } from "next/server";
import { z } from "zod";
import { getAccessToken } from "@/lib/auth";
import { NestApiError, nestFollowUser, nestUnfollowUser } from "@/lib/nest/client";

const bodySchema = z.object({
  userId: z.string().min(1),
});

async function handle(request: Request, following: boolean) {
  const token = await getAccessToken();
  if (!token) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { userId } = bodySchema.parse(body);
    const result = following
      ? await nestFollowUser(userId, token)
      : await nestUnfollowUser(userId, token);

    return NextResponse.json({
      following: result.following,
      followerCount: result.followerCount,
      userId: result.userId,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: "Invalid follow request." }, { status: 400 });
    }
    if (error instanceof NestApiError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }
    console.error("[follows]", error);
    return NextResponse.json({ error: "Could not update follow." }, { status: 500 });
  }
}

export async function POST(request: Request) {
  return handle(request, true);
}

export async function DELETE(request: Request) {
  return handle(request, false);
}
