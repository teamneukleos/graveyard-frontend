import { and, eq, gt, isNull } from "drizzle-orm";
import { v4 as uuid } from "uuid";
import { db } from "@/db";
import { authTokens, users } from "@/db/schema";
import { createRawToken, hashToken, sendMail, verificationEmail, resetPasswordEmail } from "./mail";

export type AuthTokenType = "verify" | "reset";

export async function issueAuthToken(userId: string, type: AuthTokenType, hoursValid: number) {
  const raw = createRawToken();
  const now = new Date();
  const expires = new Date(now.getTime() + hoursValid * 60 * 60 * 1000);

  await db.insert(authTokens).values({
    id: uuid(),
    userId,
    type,
    tokenHash: hashToken(raw),
    expiresAt: expires.toISOString(),
    usedAt: null,
    createdAt: now.toISOString(),
  });

  return raw;
}

export async function consumeAuthToken(rawToken: string, type: AuthTokenType) {
  const tokenHash = hashToken(rawToken);
  const now = new Date().toISOString();
  const row = await db.query.authTokens.findFirst({
    where: and(
      eq(authTokens.tokenHash, tokenHash),
      eq(authTokens.type, type),
      isNull(authTokens.usedAt),
      gt(authTokens.expiresAt, now),
    ),
  });
  if (!row) return null;

  await db
    .update(authTokens)
    .set({ usedAt: now })
    .where(eq(authTokens.id, row.id));

  return row;
}

export async function sendVerificationForUser(userId: string, email: string) {
  const token = await issueAuthToken(userId, "verify", 48);
  return sendMail(verificationEmail(email, token));
}

export async function sendPasswordResetForUser(userId: string, email: string) {
  const token = await issueAuthToken(userId, "reset", 2);
  return sendMail(resetPasswordEmail(email, token));
}

export async function markEmailVerified(userId: string) {
  await db
    .update(users)
    .set({ emailVerifiedAt: new Date().toISOString() })
    .where(eq(users.id, userId));
}

export async function isEmailVerified(userId: string) {
  const user = await db.query.users.findFirst({
    where: eq(users.id, userId),
    columns: { emailVerifiedAt: true },
  });
  return Boolean(user?.emailVerifiedAt);
}
