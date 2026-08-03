"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { FormEvent, Suspense, useState } from "react";
import { AuthLink, AuthShell } from "@/components/AuthShell";

function ResetForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get("token") || "";
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setError("");
    const form = new FormData(e.currentTarget);
    const res = await fetch("/api/auth/reset-password", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        token,
        password: form.get("password"),
      }),
    });
    const data = await res.json();
    setLoading(false);
    if (!res.ok) {
      setError(data.error || "Could not reset password.");
      return;
    }
    router.push("/login");
    router.refresh();
  }

  if (!token) {
    return (
      <AuthShell eyebrow="Reset" title="Invalid link" description="This reset link is missing a token.">
        <AuthLink href="/forgot-password">Request a new link</AuthLink>
      </AuthShell>
    );
  }

  return (
    <AuthShell
      eyebrow="Reset"
      title="Choose a new password"
      description="Pick something memorable — at least 8 characters."
      footer={
        <>
          Back to <AuthLink href="/login">log in</AuthLink>
        </>
      }
    >
      <form onSubmit={onSubmit} className="space-y-4">
        <div>
          <label className="label" htmlFor="password">
            New password
          </label>
          <input className="field" id="password" name="password" type="password" minLength={8} required />
        </div>
        {error ? <p className="text-sm text-[#c45a16]">{error}</p> : null}
        <button className="btn btn-primary w-full" disabled={loading} type="submit">
          {loading ? "Saving…" : "Update password"}
        </button>
      </form>
    </AuthShell>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={<main className="product-shell flex flex-1 items-center justify-center text-mute">Loading…</main>}>
      <ResetForm />
    </Suspense>
  );
}
