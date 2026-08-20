"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { AuthShell } from "@/components/AuthShell";

export function AgencyOnboardingForm() {
  const router = useRouter();
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setError("");
    const form = new FormData(e.currentTarget);
    const agencyName = String(form.get("agencyName") || "").trim();

    if (!agencyName) {
      setLoading(false);
      setError("Agency name is required.");
      return;
    }

    const res = await fetch("/api/profile", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ agencyName }),
    });
    const data = await res.json().catch(() => ({}));
    setLoading(false);

    if (!res.ok) {
      setError(data.error || "Could not save agency name.");
      return;
    }

    router.replace("/portal");
    router.refresh();
  }

  return (
    <AuthShell
      eyebrow="Agency setup"
      title="Name your agency"
      description="You’re signed in as an agency. Add the public name that will appear on your profile, submissions, and leaderboards."
    >
      <form onSubmit={onSubmit} className="space-y-4">
        <div>
          <label className="label" htmlFor="agencyName">
            Agency name
          </label>
          <input
            className="field"
            id="agencyName"
            name="agencyName"
            required
            autoFocus
            placeholder="Night Market Studio"
          />
        </div>
        {error ? <p className="text-sm text-[#c45a16]">{error}</p> : null}
        <button className="btn btn-primary w-full" disabled={loading} type="submit">
          {loading ? "Saving…" : "Continue to portal"}
        </button>
      </form>
    </AuthShell>
  );
}
