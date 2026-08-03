"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { FormEvent, Suspense, useState } from "react";
import { AuthLink, AuthShell, GoogleAuthButton } from "@/components/AuthShell";

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const next = searchParams.get("next");
  const [error, setError] = useState("");
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
      const role = data.user.role;
      router.push(role === "admin" ? "/admin" : role === "judge" ? "/judge" : "/portal");
    }
    router.refresh();
  }

  return (
    <AuthShell
      eyebrow="Welcome back"
      title="Log in"
      description="Sign in to vote, submit work, or manage your entries."
      footer={
        <>
          No account? <AuthLink href="/register">Register</AuthLink>
          <span className="mx-2 text-line">·</span>
          <AuthLink href="/forgot-password">Forgot password</AuthLink>
          <p className="mt-3 text-xs text-mute/80">Demo: creator@example.com / password123</p>
        </>
      }
    >
      <form onSubmit={onSubmit} className="space-y-4">
        <div>
          <label className="label" htmlFor="email">
            Email
          </label>
          <input className="field" id="email" name="email" type="email" required />
        </div>
        <div>
          <label className="label" htmlFor="password">
            Password
          </label>
          <input className="field" id="password" name="password" type="password" required />
        </div>
        {error ? <p className="text-sm text-[#c45a16]">{error}</p> : null}
        <button className="btn btn-primary w-full" disabled={loading} type="submit">
          {loading ? "Signing in…" : "Sign in"}
        </button>
      </form>
      <div className="my-5 flex items-center gap-3 text-[12px] uppercase tracking-wider text-mute">
        <span className="h-px flex-1 bg-line" />
        or
        <span className="h-px flex-1 bg-line" />
      </div>
      <GoogleAuthButton />
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
