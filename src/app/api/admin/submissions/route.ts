import { NextResponse } from "next/server";
import { z } from "zod";
import { getAccessToken, requireSession } from "@/lib/auth";
import {
  NestApiError,
  nestAdminSubmissions,
  nestAdminUpdateSubmission,
} from "@/lib/nest/client";
import { mapNestStatus } from "@/lib/nest/mappers";

const UI_TO_NEST_STATUS: Record<string, string> = {
  draft: "DRAFT",
  published: "PUBLISHED",
  submitted: "PUBLISHED",
  under_review: "UNDER_REVIEW",
  shortlisted: "SHORTLISTED",
  winner: "WINNER",
  rejected: "REJECTED",
};

function serialize(row: Awaited<ReturnType<typeof nestAdminSubmissions>>[number]) {
  return {
    id: row.id,
    title: row.title,
    slug: row.slug,
    category: row.category.name,
    status: mapNestStatus(row.status),
    published:
      Boolean(row.publishedAt) &&
      row.status !== "DRAFT" &&
      row.status !== "REJECTED" &&
      row.status !== "ARCHIVED",
    showcaseYear: row.publishedAt ? new Date(row.publishedAt).getFullYear() : null,
    submitter: row.creator.agencyName || row.creator.name,
    likeCount: row.likeCount,
    avgScore: null as number | null,
  };
}

export async function GET() {
  const session = await requireSession(["admin"]);
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const token = await getAccessToken();
  if (!token) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const submissions = await nestAdminSubmissions(100, token);
    return NextResponse.json({ submissions: submissions.map(serialize) });
  } catch (error) {
    if (error instanceof NestApiError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }
    return NextResponse.json({ error: "Could not load submissions." }, { status: 500 });
  }
}

export async function PATCH(request: Request) {
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
        id: z.string().min(1),
        status: z.string().optional(),
        published: z.boolean().optional(),
        showcaseYear: z.number().optional(),
      })
      .parse(await request.json());

    let nestStatus: string | undefined;
    if (body.status) {
      nestStatus = UI_TO_NEST_STATUS[body.status] || body.status.toUpperCase();
    } else if (body.published === true) {
      nestStatus = "PUBLISHED";
    } else if (body.published === false) {
      nestStatus = "REJECTED";
    }

    if (!nestStatus) {
      return NextResponse.json({ error: "No status change provided." }, { status: 400 });
    }

    const updated = await nestAdminUpdateSubmission(body.id, { status: nestStatus }, token);
    return NextResponse.json({ submission: serialize(updated) });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: "Invalid update." }, { status: 400 });
    }
    if (error instanceof NestApiError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }
    return NextResponse.json({ error: "Update failed." }, { status: 500 });
  }
}
