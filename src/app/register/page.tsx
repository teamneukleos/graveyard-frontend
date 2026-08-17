"use client";

import { FormEvent, useState } from "react";
import { AuthLink, AuthShell, GoogleAuthButton } from "@/components/AuthShell";
import { PasswordField } from "@/components/PasswordField";

export default function RegisterPage() {
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [sentTo, setSentTo] = useState<string | null>(null);

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setError("");
    const form = new FormData(e.currentTarget);

    const res = await fetch("/api/auth/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: form.get("name"),
        email: form.get("email"),
        password: form.get("password"),
        agencyName: form.get("agencyName") || undefined,
      }),
    });

    const data = await res.json();
    setLoading(false);

    if (!res.ok) {
      setError(data.error || "Registration failed.");
      return;
    }

    setSentTo(typeof data.email === "string" ? data.email : "your email");
  }

  if (sentTo) {
    return (
      <AuthShell
        eyebrow="Check your inbox"
        title="Verify your email"
        description={`We sent a verification link to ${sentTo}. Open it to verify your account, then log in.`}
        footer={
          <>
            Already verified? <AuthLink href="/login">Log in</AuthLink>
          </>
        }
      >
        <div className="space-y-4 rounded-2xl bg-soft px-4 py-5 text-[14px] leading-relaxed text-ink">
          <p>
            If you don’t see the email, check spam or promotions. The link expires in 48 hours.
          </p>
          <AuthLink href="/login">Go to log in</AuthLink>
        </div>
      </AuthShell>
    );
  }

  return (
    <AuthShell
      eyebrow="Join Graveyard"
      title="Create account"
      description="Submit shelved work and chase the LIVE award."
      footer={
        <>
          Already registered? <AuthLink href="/login">Log in</AuthLink>
        </>
      }
    >
      <div className="space-y-4">
        <GoogleAuthButton label="Continue with Google" />
        <div className="flex items-center gap-3 text-[12px] uppercase tracking-[0.12em] text-mute">
          <span className="h-px flex-1 bg-line" />
          or
          <span className="h-px flex-1 bg-line" />
        </div>
        <form onSubmit={onSubmit} className="space-y-4">
          <div>
            <label className="label" htmlFor="name">
              Name
            </label>
            <input className="field" id="name" name="name" required />
          </div>
          <div>
            <label className="label" htmlFor="agencyName">
              Agency (optional)
            </label>
            <input className="field" id="agencyName" name="agencyName" />
          </div>
          <div>
            <label className="label" htmlFor="email">
              Email
            </label>
            <input className="field" id="email" name="email" type="email" required />
          </div>
          <PasswordField id="password" name="password" label="Password" minLength={8} required />
          {error ? <p className="text-sm text-[#c45a16]">{error}</p> : null}
          <button className="btn btn-primary w-full" disabled={loading} type="submit">
            {loading ? "Creating…" : "Create account"}
          </button>
        </form>
      </div>
    </AuthShell>
  );
}
