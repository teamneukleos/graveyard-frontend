import { NextResponse } from "next/server";
import { z } from "zod";
import { consumeAuthToken, markEmailVerified } from "@/lib/auth-tokens";

const schema = z.object({
  token: z.string().min(10),
});

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { token } = schema.parse(body);
    const row = await consumeAuthToken(token, "verify");
    if (!row) {
      return NextResponse.json({ error: "Verification link is invalid or expired." }, { status: 400 });
    }

    await markEmailVerified(row.userId);
    return NextResponse.json({ ok: true });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: "Invalid token." }, { status: 400 });
    }
    return NextResponse.json({ error: "Could not verify email." }, { status: 500 });
  }
}
