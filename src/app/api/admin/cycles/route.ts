import { NextResponse } from "next/server";
import { z } from "zod";
import { getAccessToken, requireSession } from "@/lib/auth";
import {
  NestApiError,
  nestAssignAwardJudge,
  nestAwardCycle,
  nestAwardCycles,
  nestCreateAwardCycle,
  nestRemoveAwardJudge,
  nestUpdateAwardCycle,
} from "@/lib/nest/client";

const statuses = ["UPCOMING", "JUDGING", "RESULTS_PUBLISHED", "CLOSED"] as const;

const createSchema = z.object({
  name: z.string().min(2),
  year: z.number().int().min(2000).max(2100),
  startsAt: z.string().min(1),
  endsAt: z.string().optional().nullable(),
  judgingEndsAt: z.string().optional().nullable(),
});

const patchSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(2).optional(),
  year: z.number().int().min(2000).max(2100).optional(),
  startsAt: z.string().optional(),
  endsAt: z.string().nullable().optional(),
  judgingEndsAt: z.string().nullable().optional(),
  status: z.enum(statuses).optional(),
});

const judgeSchema = z.object({
  cycleId: z.string().min(1),
  userId: z.string().min(1),
});

export async function GET(request: Request) {
  const session = await requireSession(["admin"]);
  const token = await getAccessToken();
  if (!session || !token) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const id = new URL(request.url).searchParams.get("id");

  try {
    if (id) {
      const cycle = await nestAwardCycle(id, token);
      return NextResponse.json({ cycle });
    }
    const cycles = await nestAwardCycles(token);
    return NextResponse.json({ cycles });
  } catch (error) {
    if (error instanceof NestApiError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }
    return NextResponse.json({ error: "Could not load award cycles." }, { status: 500 });
  }
}

export async function POST(request: Request) {
  const session = await requireSession(["admin"]);
  const token = await getAccessToken();
  if (!session || !token) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const action = body?.action as string | undefined;

    if (action === "assign-judge") {
      const data = judgeSchema.parse(body);
      const cycle = await nestAssignAwardJudge(data.cycleId, data.userId, token);
      return NextResponse.json({ cycle });
    }

    const data = createSchema.parse(body);
    const cycle = await nestCreateAwardCycle(
      {
        name: data.name.trim(),
        year: data.year,
        startsAt: new Date(data.startsAt).toISOString(),
        endsAt: data.endsAt ? new Date(data.endsAt).toISOString() : undefined,
        judgingEndsAt: data.judgingEndsAt
          ? new Date(data.judgingEndsAt).toISOString()
          : undefined,
      },
      token,
    );
    return NextResponse.json({ cycle }, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: "Invalid award cycle data." }, { status: 400 });
    }
    if (error instanceof NestApiError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }
    return NextResponse.json({ error: "Could not create award cycle." }, { status: 500 });
  }
}

export async function PATCH(request: Request) {
  const session = await requireSession(["admin"]);
  const token = await getAccessToken();
  if (!session || !token) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = patchSchema.parse(await request.json());
    const patch: Parameters<typeof nestUpdateAwardCycle>[1] = {};
    if (body.name !== undefined) patch.name = body.name.trim();
    if (body.year !== undefined) patch.year = body.year;
    if (body.startsAt !== undefined) patch.startsAt = new Date(body.startsAt).toISOString();
    if (body.endsAt !== undefined) {
      patch.endsAt = body.endsAt ? new Date(body.endsAt).toISOString() : null;
    }
    if (body.judgingEndsAt !== undefined) {
      patch.judgingEndsAt = body.judgingEndsAt
        ? new Date(body.judgingEndsAt).toISOString()
        : null;
    }
    if (body.status !== undefined) patch.status = body.status;

    const cycle = await nestUpdateAwardCycle(body.id, patch, token);
    return NextResponse.json({ cycle });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: "Invalid award cycle update." }, { status: 400 });
    }
    if (error instanceof NestApiError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }
    return NextResponse.json({ error: "Could not update award cycle." }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  const session = await requireSession(["admin"]);
  const token = await getAccessToken();
  if (!session || !token) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const url = new URL(request.url);
  const cycleId = url.searchParams.get("cycleId");
  const userId = url.searchParams.get("userId");
  if (!cycleId || !userId) {
    return NextResponse.json({ error: "Missing cycleId or userId." }, { status: 400 });
  }

  try {
    const cycle = await nestRemoveAwardJudge(cycleId, userId, token);
    return NextResponse.json({ cycle });
  } catch (error) {
    if (error instanceof NestApiError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }
    return NextResponse.json({ error: "Could not remove judge." }, { status: 500 });
  }
}
