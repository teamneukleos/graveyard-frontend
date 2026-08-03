import { eq } from "drizzle-orm";
import { NextResponse } from "next/server";
import { v4 as uuid } from "uuid";
import { createSession, findUserByEmail, hashPassword } from "@/lib/auth";
import { db } from "@/db";
import { users } from "@/db/schema";
import { getAppUrl } from "@/lib/mail";

type GoogleTokenResponse = {
  access_token?: string;
  error?: string;
};

type GoogleUserInfo = {
  id: string;
  email: string;
  name?: string;
  verified_email?: boolean;
  picture?: string;
};

export async function GET(request: Request) {
  const url = new URL(request.url);
  const code = url.searchParams.get("code");
  const error = url.searchParams.get("error");
  const appUrl = getAppUrl();

  if (error || !code) {
    return NextResponse.redirect(`${appUrl}/login?error=google_denied`);
  }

  const clientId = process.env.GOOGLE_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
  if (!clientId || !clientSecret) {
    return NextResponse.redirect(`${appUrl}/login?error=google_not_configured`);
  }

  const redirectUri = `${appUrl}/api/auth/google/callback`;
  const tokenRes = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      code,
      client_id: clientId,
      client_secret: clientSecret,
      redirect_uri: redirectUri,
      grant_type: "authorization_code",
    }),
  });

  const tokenJson = (await tokenRes.json()) as GoogleTokenResponse;
  if (!tokenRes.ok || !tokenJson.access_token) {
    return NextResponse.redirect(`${appUrl}/login?error=google_token`);
  }

  const profileRes = await fetch("https://www.googleapis.com/oauth2/v2/userinfo", {
    headers: { Authorization: `Bearer ${tokenJson.access_token}` },
  });
  const profile = (await profileRes.json()) as GoogleUserInfo;
  if (!profileRes.ok || !profile.email) {
    return NextResponse.redirect(`${appUrl}/login?error=google_profile`);
  }

  const email = profile.email.toLowerCase();
  let user = await findUserByEmail(email);

  if (!user) {
    const byGoogle = await db.query.users.findFirst({
      where: eq(users.googleId, profile.id),
    });
    user = byGoogle ?? undefined;
  }

  if (!user) {
    const passwordHash = await hashPassword(uuid());
    const now = new Date().toISOString();
    const created = {
      id: uuid(),
      email,
      passwordHash,
      name: profile.name?.trim() || email.split("@")[0],
      role: "creator" as const,
      agencyName: null,
      agencySlug: null,
      bio: "",
      avatarFilename: null,
      emailVerifiedAt: profile.verified_email ? now : null,
      googleId: profile.id,
      active: true,
      createdAt: now,
    };
    await db.insert(users).values(created);
    user = created;
  } else {
    const now = new Date().toISOString();
    await db
      .update(users)
      .set({
        googleId: profile.id,
        emailVerifiedAt: user.emailVerifiedAt || (profile.verified_email ? now : null),
      })
      .where(eq(users.id, user.id));
  }

  if (!user.active) {
    return NextResponse.redirect(`${appUrl}/login?error=inactive`);
  }

  await createSession(user);

  const dest =
    user.role === "admin" ? "/admin" : user.role === "judge" ? "/judge" : "/portal";
  return NextResponse.redirect(`${appUrl}${dest}`);
}
