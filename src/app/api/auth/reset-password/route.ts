import { NextResponse } from "next/server";
import { z } from "zod";
import { NestApiError, nestResetPassword } from "@/lib/nest/client";

const schema = z.object({
  token: z.string().min(16),
  password: z.string().min(8),
});

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const data = schema.parse(body);
    const result = await nestResetPassword(data.token, data.password);
    return NextResponse.json({ ok: true, message: result.message });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: "Invalid reset data." }, { status: 400 });
    }
    if (error instanceof NestApiError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }
    return NextResponse.json({ error: "Could not reset password." }, { status: 500 });
  }
}
