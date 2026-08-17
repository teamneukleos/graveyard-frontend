import { NextResponse } from "next/server";
import { z } from "zod";
import { getAccessToken, requireSession } from "@/lib/auth";
import { NestApiError, nestUpdateProfile } from "@/lib/nest/client";
import { mapNestRole } from "@/lib/nest/roles";

const patchSchema = z.object({
  name: z.string().min(1).optional(),
  agencyName: z.string().nullable().optional(),
  bio: z.string().max(1000).optional(),
});

export async function GET() {
  const session = await requireSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  return NextResponse.json({
    user: {
      id: session.id,
      email: session.email,
      name: session.name,
      role: session.role,
      nestRole: session.nestRole,
      agencyName: session.agencyName,
      bio: session.bio ?? "",
      avatarUrl: session.avatarUrl,
      emailVerified: session.emailVerified,
    },
  });
}

export async function PATCH(request: Request) {
  const session = await requireSession();
  const token = await getAccessToken();
  if (!session || !token) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const data = patchSchema.parse(body);

    const updated = await nestUpdateProfile(token, {
      name: data.name?.trim(),
      bio: data.bio,
      agencyName: data.agencyName === null ? "" : data.agencyName?.trim(),
    });

    return NextResponse.json({
      user: {
        id: updated.id,
        email: updated.email,
        name: updated.name,
        role: mapNestRole(updated.role),
        nestRole: updated.role,
        agencyName: updated.agencyName,
        bio: updated.bio ?? "",
        avatarUrl: updated.avatarUrl,
        emailVerified: Boolean(updated.emailVerified),
      },
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: "Invalid profile data." }, { status: 400 });
    }
    if (error instanceof NestApiError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }
    return NextResponse.json({ error: "Could not update profile." }, { status: 500 });
  }
}
