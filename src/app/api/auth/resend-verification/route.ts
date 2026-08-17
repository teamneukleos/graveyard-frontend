import { NextResponse } from "next/server";
import { requireSession } from "@/lib/auth";
import { sendVerificationForUser } from "@/lib/auth-tokens";

export async function POST() {
  const session = await requireSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (session.emailVerified) {
    return NextResponse.json({ ok: true, alreadyVerified: true });
  }

  const result = await sendVerificationForUser(session.id, session.email);
  if (!result.ok) {
    return NextResponse.json({ error: result.error }, { status: 400 });
  }
  return NextResponse.json({ ok: true });
}
