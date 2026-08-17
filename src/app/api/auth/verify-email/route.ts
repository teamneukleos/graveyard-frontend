import { NextResponse } from "next/server";
import { z } from "zod";
import { NestApiError, nestVerifyEmail } from "@/lib/nest/client";

const schema = z.object({
  token: z.string().min(16),
});

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const data = schema.parse(body);
    const user = await nestVerifyEmail(data.token);
    return NextResponse.json({
      ok: true,
      user: {
        id: user.id,
        email: user.email,
        emailVerified: Boolean(user.emailVerified),
      },
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: "Invalid verification token." }, { status: 400 });
    }
    if (error instanceof NestApiError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }
    return NextResponse.json({ error: "Verification failed." }, { status: 500 });
  }
}
