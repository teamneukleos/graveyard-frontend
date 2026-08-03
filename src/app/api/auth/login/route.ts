import { NextResponse } from "next/server";
import { z } from "zod";
import { ensureDbReady } from "@/db";
import { createSession, findUserByEmail, verifyPassword } from "@/lib/auth";

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

export async function POST(request: Request) {
  try {
    await ensureDbReady();
    const body = await request.json();
    const data = loginSchema.parse(body);

    const user = await findUserByEmail(data.email);
    if (!user) {
      return NextResponse.json({ error: "Invalid email or password." }, { status: 401 });
    }

    const valid = await verifyPassword(data.password, user.passwordHash);
    if (!valid) {
      return NextResponse.json({ error: "Invalid email or password." }, { status: 401 });
    }

    if (!user.active) {
      return NextResponse.json(
        { error: "This account has been deactivated." },
        { status: 403 },
      );
    }

    await createSession(user);

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
      return NextResponse.json({ error: "Invalid login data." }, { status: 400 });
    }
    return NextResponse.json({ error: "Login failed." }, { status: 500 });
  }
}
