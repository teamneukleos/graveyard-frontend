import { eq } from "drizzle-orm";
import { NextResponse } from "next/server";
import { z } from "zod";
import { hashPassword } from "@/lib/auth";
import { consumeAuthToken } from "@/lib/auth-tokens";
import { db } from "@/db";
import { users } from "@/db/schema";

const schema = z.object({
  token: z.string().min(10),
  password: z.string().min(8),
});

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const data = schema.parse(body);
    const token = await consumeAuthToken(data.token, "reset");
    if (!token) {
      return NextResponse.json({ error: "Reset link is invalid or expired." }, { status: 400 });
    }

    const passwordHash = await hashPassword(data.password);
    await db.update(users).set({ passwordHash }).where(eq(users.id, token.userId));

    return NextResponse.json({ ok: true });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: "Invalid reset data." }, { status: 400 });
    }
    return NextResponse.json({ error: "Could not reset password." }, { status: 500 });
  }
}
