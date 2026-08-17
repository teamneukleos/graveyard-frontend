import { getAccessToken } from "@/lib/auth";
import { NestApiError, nestResendVerification } from "@/lib/nest/client";

/** Asks Nest to issue + email a verification link (Resend on the API). */
export async function sendVerificationForUser(_userId: string, _email: string) {
  const accessToken = await getAccessToken();
  if (!accessToken) {
    return { ok: false as const, error: "Unauthorized" };
  }

  try {
    await nestResendVerification(accessToken);
    return { ok: true as const };
  } catch (error) {
    if (error instanceof NestApiError) {
      return { ok: false as const, error: error.message };
    }
    return { ok: false as const, error: "Could not send verification email." };
  }
}
