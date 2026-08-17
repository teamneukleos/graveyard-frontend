import { NextResponse } from "next/server";
import { z } from "zod";
import { NestApiError, nestForgotPassword } from "@/lib/nest/client";

const schema = z.object({
  email: z.string().email(),
});

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const data = schema.parse(body);
    const result = await nestForgotPassword(data.email);
    return NextResponse.json({ ok: true, message: result.message });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: "Invalid email." }, { status: 400 });
    }
    if (error instanceof NestApiError) {
      // Still avoid leaking Nest internals for this flow.
      return NextResponse.json({
        ok: true,
        message:
          "If that email exists, we sent a password reset link. Check your inbox.",
      });
    }
    return NextResponse.json({ error: "Could not process request." }, { status: 500 });
  }
}
