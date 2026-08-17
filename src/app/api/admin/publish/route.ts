import { NextResponse } from "next/server";
import { z } from "zod";
import { getAccessToken, requireSession } from "@/lib/auth";
import { NestApiError, nestAdminBulkSubmissions } from "@/lib/nest/client";

export async function POST(request: Request) {
  const session = await requireSession(["admin"]);
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const token = await getAccessToken();
  if (!token) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = z
      .object({
        ids: z.array(z.string().min(1)).min(1),
        published: z.boolean(),
        showcaseYear: z.number().optional(),
        markWinners: z.boolean().optional(),
      })
      .parse(await request.json());

    let action: "publish" | "unpublish" | "winners" = body.published
      ? "publish"
      : "unpublish";
    if (body.published && body.markWinners) {
      action = "winners";
    }

    const result = await nestAdminBulkSubmissions(
      {
        ids: body.ids,
        action,
        markCyclePublished: true,
      },
      token,
    );

    return NextResponse.json({ ok: true, updated: result.updated });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: "Invalid publish payload." }, { status: 400 });
    }
    if (error instanceof NestApiError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }
    return NextResponse.json({ error: "Publish failed." }, { status: 500 });
  }
}
