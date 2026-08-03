import { desc, eq } from "drizzle-orm";
import { NextResponse } from "next/server";
import { v4 as uuid } from "uuid";
import { z } from "zod";
import { db } from "@/db";
import { users } from "@/db/schema";
import { hashPassword, requireSession } from "@/lib/auth";

const createJudgeSchema = z.object({
  email: z.string().email(),
  name: z.string().min(2),
  password: z.string().min(8),
});

const patchJudgeSchema = z.object({
  id: z.string().min(1),
  active: z.boolean(),
});

function serializeJudge(j: typeof users.$inferSelect) {
  return {
    id: j.id,
    email: j.email,
    name: j.name,
    active: j.active,
    createdAt: j.createdAt,
  };
}

export async function GET() {
  const session = await requireSession(["admin"]);
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const judges = await db.query.users.findMany({
    where: eq(users.role, "judge"),
    orderBy: [desc(users.createdAt)],
  });

  return NextResponse.json({
    judges: judges.map(serializeJudge),
  });
}

export async function POST(request: Request) {
  const session = await requireSession(["admin"]);
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const data = createJudgeSchema.parse(body);
    const existing = await db.query.users.findFirst({
      where: eq(users.email, data.email.toLowerCase()),
    });

    if (existing) {
      return NextResponse.json({ error: "Email already in use." }, { status: 409 });
    }

    const judge = {
      id: uuid(),
      email: data.email.toLowerCase(),
      passwordHash: await hashPassword(data.password),
      name: data.name.trim(),
      role: "judge" as const,
      agencyName: null,
      agencySlug: null,
      bio: "",
      avatarFilename: null,
      emailVerifiedAt: new Date().toISOString(),
      googleId: null,
      active: true,
      createdAt: new Date().toISOString(),
    };

    await db.insert(users).values(judge);

    return NextResponse.json(
      {
        judge: serializeJudge(judge),
      },
      { status: 201 },
    );
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: "Invalid judge data." }, { status: 400 });
    }
    return NextResponse.json({ error: "Could not create judge." }, { status: 500 });
  }
}

export async function PATCH(request: Request) {
  const session = await requireSession(["admin"]);
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const data = patchJudgeSchema.parse(body);

    const judge = await db.query.users.findFirst({
      where: eq(users.id, data.id),
    });

    if (!judge || judge.role !== "judge") {
      return NextResponse.json({ error: "Judge not found." }, { status: 404 });
    }

    await db.update(users).set({ active: data.active }).where(eq(users.id, judge.id));

    const updated = await db.query.users.findFirst({
      where: eq(users.id, judge.id),
    });

    return NextResponse.json({
      judge: updated ? serializeJudge(updated) : null,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: "Invalid judge data." }, { status: 400 });
    }
    return NextResponse.json({ error: "Could not update judge." }, { status: 500 });
  }
}
