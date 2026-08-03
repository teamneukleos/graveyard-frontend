import { eq } from "drizzle-orm";
import { NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/db";
import { users } from "@/db/schema";
import {
  createSession,
  hashPassword,
  requireSession,
  verifyPassword,
} from "@/lib/auth";
import { slugifyAgency } from "@/lib/events";

const patchSchema = z.object({
  name: z.string().min(2).optional(),
  agencyName: z.string().nullable().optional(),
  bio: z.string().max(800).optional(),
  currentPassword: z.string().optional(),
  newPassword: z.string().min(8).optional(),
});

export async function GET() {
  const session = await requireSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const user = await db.query.users.findFirst({ where: eq(users.id, session.id) });
  if (!user) return NextResponse.json({ error: "Not found" }, { status: 404 });

  return NextResponse.json({
    user: {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      agencyName: user.agencyName,
      agencySlug: user.agencySlug,
      bio: user.bio,
      avatarFilename: user.avatarFilename,
      emailVerified: Boolean(user.emailVerifiedAt),
    },
  });
}

export async function PATCH(request: Request) {
  const session = await requireSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const body = await request.json();
    const data = patchSchema.parse(body);
    const user = await db.query.users.findFirst({ where: eq(users.id, session.id) });
    if (!user) return NextResponse.json({ error: "Not found" }, { status: 404 });

    const patch: Partial<typeof users.$inferInsert> = {};

    if (data.name) patch.name = data.name.trim();
    if (data.bio !== undefined) patch.bio = data.bio.trim();
    if (data.agencyName !== undefined) {
      const agencyName = data.agencyName?.trim() || null;
      patch.agencyName = agencyName;
      patch.agencySlug = agencyName ? slugifyAgency(agencyName) : null;
    }

    if (data.newPassword) {
      if (!data.currentPassword) {
        return NextResponse.json({ error: "Current password required." }, { status: 400 });
      }
      const ok = await verifyPassword(data.currentPassword, user.passwordHash);
      if (!ok) {
        return NextResponse.json({ error: "Current password is incorrect." }, { status: 400 });
      }
      patch.passwordHash = await hashPassword(data.newPassword);
    }

    if (Object.keys(patch).length > 0) {
      await db.update(users).set(patch).where(eq(users.id, user.id));
    }

    const updated = await db.query.users.findFirst({ where: eq(users.id, user.id) });
    if (!updated) return NextResponse.json({ error: "Not found" }, { status: 404 });

    await createSession(updated);

    return NextResponse.json({
      user: {
        id: updated.id,
        email: updated.email,
        name: updated.name,
        role: updated.role,
        agencyName: updated.agencyName,
        agencySlug: updated.agencySlug,
        bio: updated.bio,
        avatarFilename: updated.avatarFilename,
        emailVerified: Boolean(updated.emailVerifiedAt),
      },
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: "Invalid profile data." }, { status: 400 });
    }
    return NextResponse.json({ error: "Could not update profile." }, { status: 500 });
  }
}
