import { NextResponse } from "next/server";
import { z } from "zod";
import { resolveAssetUrl } from "@/lib/asset-url";
import { getAccessToken, requireSession } from "@/lib/auth";
import {
  NestApiError,
  nestCategories,
  nestDeleteSubmission,
  nestMySubmission,
  nestPublishSubmission,
  nestUpdateSubmission,
} from "@/lib/nest/client";
import { coverUrlOf, mapNestStatus } from "@/lib/nest/mappers";
import type { NestSubmission } from "@/lib/nest/types";
import { SUBMITTER_TYPES } from "@/lib/constants";

type Params = { params: Promise<{ id: string }> };

const updateSchema = z.object({
  title: z.string().min(1).optional(),
  category: z.string().min(1).optional(),
  submitterType: z.enum(SUBMITTER_TYPES).optional(),
  teamMembers: z.string().optional(),
  yearCreated: z.number().int().min(1950).max(2100).optional(),
  concept: z.string().optional(),
  whyNeverLived: z.string().optional(),
  status: z.enum(["draft", "submitted"]).optional(),
});

function serializeSubmission(s: NestSubmission) {
  return {
    id: s.id,
    slug: s.slug,
    title: s.title,
    category: s.category.name,
    categoryId: s.category.id,
    submitterType: s.submitterType.toLowerCase(),
    teamMembers: s.teamMembers.map((m) => m.name).join(", "),
    yearCreated: s.yearCreated,
    concept: s.concept,
    whyNeverLived: s.whyNeverLived,
    status: mapNestStatus(s.status),
    published: Boolean(s.publishedAt),
    showcaseYear: s.publishedAt ? new Date(s.publishedAt).getFullYear() : null,
    likeCount: s.likeCount,
    coverUrl: coverUrlOf(s),
    assets: s.assets.map((a) => ({
      id: a.id,
      originalName: a.fileName || "asset",
      filename: a.fileName || a.url,
      url: resolveAssetUrl(a.url) || a.url,
      mimeType: a.mimeType || "application/octet-stream",
    })),
    user: {
      id: s.creator.id,
      name: s.creator.name,
      agencyName: s.creator.agencyName,
      avatarUrl: resolveAssetUrl(s.creator.avatarUrl) || s.creator.avatarUrl,
    },
    reviews: [],
  };
}

function parseTeamMembers(raw: string) {
  return raw
    .split(",")
    .map((part) => part.trim())
    .filter(Boolean)
    .map((name, sortOrder) => ({ name, sortOrder }));
}

export async function GET(_request: Request, { params }: Params) {
  const session = await requireSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const token = await getAccessToken();
  if (!token) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;

  try {
    const submission = await nestMySubmission(id, token);
    return NextResponse.json({ submission: serializeSubmission(submission) });
  } catch (error) {
    if (error instanceof NestApiError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
}

export async function PATCH(request: Request, { params }: Params) {
  const session = await requireSession(["creator", "agency", "admin"]);
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const token = await getAccessToken();
  if (!token) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;

  try {
    const body = await request.json();
    const data = updateSchema.parse(body);

    const patch: Record<string, unknown> = {};
    if (data.title !== undefined) patch.title = data.title.trim();
    if (data.yearCreated !== undefined) patch.yearCreated = data.yearCreated;
    if (data.concept !== undefined) patch.concept = data.concept.trim();
    if (data.whyNeverLived !== undefined) patch.whyNeverLived = data.whyNeverLived.trim();
    if (data.submitterType !== undefined) {
      patch.submitterType = data.submitterType === "agency" ? "AGENCY" : "INDIVIDUAL";
    }
    if (data.teamMembers !== undefined) {
      patch.teamMembers = parseTeamMembers(data.teamMembers);
    }
    if (data.category !== undefined) {
      const categories = await nestCategories();
      const category = categories.find(
        (c) => c.name === data.category || c.slug === data.category,
      );
      if (!category) {
        return NextResponse.json({ error: "Invalid or inactive category." }, { status: 400 });
      }
      patch.categoryId = category.id;
    }

    if (data.status === "submitted") {
      const concept = (patch.concept as string | undefined) ?? "";
      const why = (patch.whyNeverLived as string | undefined) ?? "";
      if (data.concept !== undefined || data.whyNeverLived !== undefined) {
        if (!concept.trim() || !why.trim()) {
          return NextResponse.json(
            { error: "Concept and why-it-never-went-live are required to submit." },
            { status: 400 },
          );
        }
      }
    }

    let updated = await nestUpdateSubmission(id, patch, token);

    if (data.status === "submitted") {
      updated = await nestPublishSubmission(id, token);
    }

    return NextResponse.json({ submission: serializeSubmission(updated) });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: "Invalid submission data." }, { status: 400 });
    }
    if (error instanceof NestApiError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }
    return NextResponse.json({ error: "Could not update submission." }, { status: 500 });
  }
}

export async function DELETE(_request: Request, { params }: Params) {
  const session = await requireSession(["creator", "agency", "admin"]);
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const token = await getAccessToken();
  if (!token) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;

  try {
    await nestDeleteSubmission(id, token);
    return NextResponse.json({ ok: true });
  } catch (error) {
    if (error instanceof NestApiError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }
    return NextResponse.json({ error: "Could not delete submission." }, { status: 500 });
  }
}
