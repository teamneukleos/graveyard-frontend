import { NextResponse } from "next/server";
import { z } from "zod";
import { findUserByEmail } from "@/lib/auth";
import { sendPasswordResetForUser } from "@/lib/auth-tokens";

const schema = z.object({
  email: z.string().email(),
});

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { email } = schema.parse(body);
    const user = await findUserByEmail(email);

    // Always succeed to avoid account enumeration
    if (user && user.active) {
      await sendPasswordResetForUser(user.id, user.email);
    }

    return NextResponse.json({ ok: true });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: "Invalid email." }, { status: 400 });
    }
    return NextResponse.json({ error: "Could not process request." }, { status: 500 });
  }
}
