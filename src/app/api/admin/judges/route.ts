import { NextResponse } from "next/server";
import { z } from "zod";
import { getAccessToken, requireSession } from "@/lib/auth";
import {
  NestApiError,
  nestCreateManagedUser,
  nestListUsers,
  nestUpdateUserRole,
} from "@/lib/nest/client";

function serializeJudge(user: {
  id: string;
  email: string;
  name: string;
  role: string;
  createdAt: string;
}) {
  return {
    id: user.id,
    email: user.email,
    name: user.name,
    active: user.role === "JUDGE" || user.role === "ADMIN" || user.role === "SUPER_ADMIN",
    createdAt: user.createdAt,
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
    const listed = await nestListUsers({ role: "JUDGE", limit: 100 }, token);
    return NextResponse.json({ judges: listed.data.map(serializeJudge) });
  } catch (error) {
    if (error instanceof NestApiError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }
    return NextResponse.json({ error: "Could not load judges." }, { status: 500 });
  }
}

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
        name: z.string().min(1),
        email: z.string().email(),
        password: z.string().min(8),
      })
      .parse(await request.json());

    const user = await nestCreateManagedUser(
      {
        name: body.name.trim(),
        email: body.email.trim(),
        password: body.password,
        role: "JUDGE",
      },
      token,
    );

    return NextResponse.json({ judge: serializeJudge(user) }, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: "Invalid judge data." }, { status: 400 });
    }
    if (error instanceof NestApiError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }
    return NextResponse.json({ error: "Could not create judge." }, { status: 500 });
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
        active: z.boolean(),
      })
      .parse(await request.json());

    // Nest has no soft-disable flag — map active to JUDGE / CREATOR.
    const user = await nestUpdateUserRole(
      body.id,
      body.active ? "JUDGE" : "CREATOR",
      token,
    );

    return NextResponse.json({ judge: serializeJudge(user) });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: "Invalid update." }, { status: 400 });
    }
    if (error instanceof NestApiError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }
    return NextResponse.json({ error: "Could not update judge." }, { status: 500 });
  }
}
