import { NextResponse } from "next/server";
import { v4 as uuid } from "uuid";
import { z } from "zod";
import { createSession, findUserByEmail, hashPassword } from "@/lib/auth";
import { sendVerificationForUser } from "@/lib/auth-tokens";
import { db } from "@/db";
import { users } from "@/db/schema";
import { slugifyAgency } from "@/lib/events";

const registerSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
  name: z.string().min(2),
  agencyName: z.string().optional(),
});

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const data = registerSchema.parse(body);

    const existing = await findUserByEmail(data.email);
    if (existing) {
      return NextResponse.json(
        { error: "An account with this email already exists." },
        { status: 409 },
      );
    }

    const passwordHash = await hashPassword(data.password);
    const agencyName = data.agencyName?.trim() || null;
    const user = {
      id: uuid(),
      email: data.email.toLowerCase(),
      passwordHash,
      name: data.name.trim(),
      role: "creator" as const,
      agencyName,
      agencySlug: agencyName ? slugifyAgency(agencyName) : null,
      bio: "",
      avatarFilename: null,
      emailVerifiedAt: null,
      googleId: null,
      active: true,
      createdAt: new Date().toISOString(),
    };

    await db.insert(users).values(user);
    await createSession(user);
    await sendVerificationForUser(user.id, user.email);

    return NextResponse.json({
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        agencyName: user.agencyName,
      },
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: "Invalid registration data." }, { status: 400 });
    }
    return NextResponse.json({ error: "Registration failed." }, { status: 500 });
  }
}
