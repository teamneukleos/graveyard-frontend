"use client";

import { FormEvent, useState } from "react";
import { AuthLink, AuthShell } from "@/components/AuthShell";

export default function ForgotPasswordPage() {
  const [error, setError] = useState("");
  const [done, setDone] = useState(false);
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setError("");
    const form = new FormData(e.currentTarget);
    const res = await fetch("/api/auth/forgot-password", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: form.get("email") }),
    });
    setLoading(false);
    if (!res.ok) {
      const data = await res.json();
      setError(data.error || "Could not send reset email.");
      return;
    }
    setDone(true);
  }

  return (
    <AuthShell
      eyebrow="Account recovery"
      title="Forgot password"
      description="We'll email a reset link if that address is registered."
      footer={
        <>
          Remembered it? <AuthLink href="/login">Log in</AuthLink>
        </>
      }
    >
      {done ? (
        <p className="rounded-2xl bg-soft px-4 py-5 text-[14px] text-ink">
          If an account exists for that email, a reset link is on its way. In local
          development, check the server console for the link.
        </p>
      ) : (
        <form onSubmit={onSubmit} className="space-y-4">
          <div>
            <label className="label" htmlFor="email">
              Email
            </label>
            <input className="field" id="email" name="email" type="email" required />
          </div>
          {error ? <p className="text-sm text-[#c45a16]">{error}</p> : null}
          <button className="btn btn-primary w-full" disabled={loading} type="submit">
            {loading ? "Sending…" : "Send reset link"}
          </button>
        </form>
      )}
    </AuthShell>
  );
}
