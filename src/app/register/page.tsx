"use client";

import { useRouter } from "next/navigation";
import { FormEvent, useState } from "react";
import { AuthLink, AuthShell, GoogleAuthButton } from "@/components/AuthShell";

export default function RegisterPage() {
  const router = useRouter();
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

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

    router.push("/portal");
    router.refresh();
  }

  return (
    <AuthShell
      eyebrow="Join Graveyard"
      title="Create account"
      description="Submit shelved work, vote publicly, and chase the LIVE award."
      footer={
        <>
          Already registered? <AuthLink href="/login">Log in</AuthLink>
        </>
      }
    >
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
        <div>
          <label className="label" htmlFor="password">
            Password
          </label>
          <input className="field" id="password" name="password" type="password" minLength={8} required />
        </div>
        {error ? <p className="text-sm text-[#c45a16]">{error}</p> : null}
        <button className="btn btn-primary w-full" disabled={loading} type="submit">
          {loading ? "Creating…" : "Create account"}
        </button>
      </form>
      <div className="my-5 flex items-center gap-3 text-[12px] uppercase tracking-wider text-mute">
        <span className="h-px flex-1 bg-line" />
        or
        <span className="h-px flex-1 bg-line" />
      </div>
      <GoogleAuthButton label="Sign up with Google" />
    </AuthShell>
  );
}
