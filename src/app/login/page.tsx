"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { FormEvent, Suspense, useState } from "react";
import { AuthLink, AuthShell, GoogleAuthButton } from "@/components/AuthShell";
import { PasswordField } from "@/components/PasswordField";

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const next = searchParams.get("next");
  const oauthError = searchParams.get("error");
  const oauthMessage = searchParams.get("message");
  const [error, setError] = useState(
    oauthError === "google"
      ? oauthMessage || "Google sign-in failed."
      : oauthError === "google_unavailable"
        ? "Google sign-in is not configured yet."
        : "",
  );
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setError("");
    const form = new FormData(e.currentTarget);

    const res = await fetch("/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email: form.get("email"),
        password: form.get("password"),
      }),
    });

    const data = await res.json();
    setLoading(false);

    if (!res.ok) {
      setError(data.error || "Login failed.");
      return;
    }

    if (next && next.startsWith("/") && !next.startsWith("//")) {
      router.push(next);
    } else {
      router.push(data.redirectTo || "/portal");
    }
    router.refresh();
  }

  return (
    <AuthShell
      eyebrow="Welcome back"
      title="Log in"
      description="Sign in to submit work, judge, or manage the yard."
      footer={
        <>
          No account? <AuthLink href="/register">Register</AuthLink>
          <p className="mt-3 text-xs text-mute/80">
            API seed admin: admin@graveyard.local / ChangeMeAdmin1!
          </p>
        </>
      }
    >
      <div className="space-y-4">
        <form onSubmit={onSubmit} className="space-y-4">
          <div>
            <label className="label" htmlFor="email">
              Email
            </label>
            <input className="field" id="email" name="email" type="email" required />
          </div>
          <PasswordField
            id="password"
            name="password"
            label="Password"
            minLength={8}
            required
            labelRight={<AuthLink href="/forgot-password">Forgot password?</AuthLink>}
          />
          {error ? <p className="text-sm text-[#c45a16]">{error}</p> : null}
          <button className="btn btn-primary w-full" disabled={loading} type="submit">
            {loading ? "Signing in…" : "Sign in"}
          </button>
        </form>
        <div className="flex items-center gap-3 text-[12px] uppercase tracking-[0.12em] text-mute">
          <span className="h-px flex-1 bg-line" />
          or
          <span className="h-px flex-1 bg-line" />
        </div>
        <GoogleAuthButton nextPath={next} />
      </div>
    </AuthShell>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<main className="product-shell flex flex-1 items-center justify-center text-mute">Loading…</main>}>
      <LoginForm />
    </Suspense>
  );
}
