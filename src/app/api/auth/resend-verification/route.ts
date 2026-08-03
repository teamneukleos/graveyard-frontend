import { NextResponse } from "next/server";
import { requireSession } from "@/lib/auth";
import { sendVerificationForUser } from "@/lib/auth-tokens";
import { db } from "@/db";
import { eq } from "drizzle-orm";
import { users } from "@/db/schema";

export async function POST() {
  const session = await requireSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const user = await db.query.users.findFirst({ where: eq(users.id, session.id) });
  if (!user) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }
  if (user.emailVerifiedAt) {
    return NextResponse.json({ ok: true, alreadyVerified: true });
  }

  await sendVerificationForUser(user.id, user.email);
  return NextResponse.json({ ok: true });
}
