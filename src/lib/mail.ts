import { createHash, randomBytes } from "crypto";

export type MailMessage = {
  to: string;
  subject: string;
  html: string;
  text: string;
};

function appUrl() {
  return process.env.APP_URL || process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3001";
}

export function getAppUrl() {
  return appUrl().replace(/\/$/, "");
}

export async function sendMail(message: MailMessage) {
  const key = process.env.RESEND_API_KEY;
  const from = process.env.RESEND_FROM || "Graveyard <onboarding@resend.dev>";

  if (!key) {
    console.info("[mail:dev]", {
      to: message.to,
      subject: message.subject,
      text: message.text,
    });
    return { ok: true as const, mode: "log" as const };
  }

  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${key}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from,
      to: [message.to],
      subject: message.subject,
      html: message.html,
      text: message.text,
    }),
  });

  if (!res.ok) {
    const body = await res.text();
    console.error("[mail:resend]", res.status, body);
    return { ok: false as const, mode: "resend" as const, error: body };
  }

  return { ok: true as const, mode: "resend" as const };
}

export function hashToken(token: string) {
  return createHash("sha256").update(token).digest("hex");
}

export function createRawToken() {
  return randomBytes(32).toString("hex");
}

export function verificationEmail(to: string, token: string) {
  const url = `${getAppUrl()}/verify-email?token=${token}`;
  return {
    to,
    subject: "Verify your Graveyard email",
    text: `Confirm your email to submit work on Graveyard:\n\n${url}\n\nThis link expires in 48 hours.`,
    html: `<p>Confirm your email to submit work on Graveyard.</p><p><a href="${url}">Verify email</a></p><p>This link expires in 48 hours.</p>`,
  } satisfies MailMessage;
}

export function resetPasswordEmail(to: string, token: string) {
  const url = `${getAppUrl()}/reset-password?token=${token}`;
  return {
    to,
    subject: "Reset your Graveyard password",
    text: `Reset your password:\n\n${url}\n\nThis link expires in 2 hours. If you did not request this, ignore the email.`,
    html: `<p>Reset your Graveyard password.</p><p><a href="${url}">Choose a new password</a></p><p>This link expires in 2 hours.</p>`,
  } satisfies MailMessage;
}
