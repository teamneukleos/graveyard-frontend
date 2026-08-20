import { NextResponse } from "next/server";
import { z } from "zod";
import { resolveAssetUrl } from "@/lib/asset-url";
import { getAccessToken, requireSession } from "@/lib/auth";
import {
  NestApiError,
  nestCategories,
  nestCreateSubmission,
  nestMySubmissions,
  nestPublishSubmission,
} from "@/lib/nest/client";
import { coverUrlOf, mapNestStatus } from "@/lib/nest/mappers";
import type { NestSubmission } from "@/lib/nest/types";
import { SUBMITTER_TYPES } from "@/lib/constants";

const submissionSchema = z.object({
  title: z.string().min(1),
  category: z.string().min(1),
  submitterType: z.enum(SUBMITTER_TYPES),
  teamMembers: z.string().default(""),
  yearCreated: z.number().int().min(1950).max(2100),
  concept: z.string().default(""),
  whyNeverLived: z.string().default(""),
  status: z.enum(["draft", "submitted"]).default("draft"),
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

export async function GET() {
  const session = await requireSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const token = await getAccessToken();
  if (!token) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const mine = await nestMySubmissions(token);
    return NextResponse.json({ submissions: mine.map(serializeSubmission) });
  } catch (error) {
    if (error instanceof NestApiError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }
    return NextResponse.json({ error: "Could not load submissions." }, { status: 500 });
  }
}

export async function POST(request: Request) {
  const session = await requireSession(["creator", "agency", "admin"]);
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const token = await getAccessToken();
  if (!token) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const data = submissionSchema.parse(body);

    if (data.status === "submitted") {
      if (!data.concept.trim() || !data.whyNeverLived.trim()) {
        return NextResponse.json(
          { error: "Concept and why-it-never-went-live are required to submit." },
          { status: 400 },
        );
      }
    }

    const categories = await nestCategories();
    const category = categories.find(
      (c) => c.name === data.category || c.slug === data.category,
    );
    if (!category) {
      return NextResponse.json({ error: "Invalid or inactive category." }, { status: 400 });
    }

    let created = await nestCreateSubmission(
      {
        title: data.title.trim(),
        categoryId: category.id,
        yearCreated: data.yearCreated,
        concept: data.concept.trim(),
        whyNeverLived: data.whyNeverLived.trim(),
        submitterType: data.submitterType === "agency" ? "AGENCY" : "INDIVIDUAL",
        rightsAttested: true,
        teamMembers: parseTeamMembers(data.teamMembers),
      },
      token,
    );

    if (data.status === "submitted") {
      created = await nestPublishSubmission(created.id, token);
    }

    return NextResponse.json({ submission: serializeSubmission(created) }, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: "Invalid submission data." }, { status: 400 });
    }
    if (error instanceof NestApiError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }
    return NextResponse.json({ error: "Could not create submission." }, { status: 500 });
  }
}
