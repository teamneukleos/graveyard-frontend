"use client";

import { FormEvent, Suspense, useState } from "react";
import { useSearchParams } from "next/navigation";
import { AuthLink, AuthShell, GoogleAuthButton } from "@/components/AuthShell";
import { PasswordField } from "@/components/PasswordField";

type AccountKind = "CREATOR" | "AGENCY";

function RegisterForm() {
  const searchParams = useSearchParams();
  const next = searchParams.get("next");
  const nextQuery =
    next && next.startsWith("/") && !next.startsWith("//")
      ? `?next=${encodeURIComponent(next)}`
      : "";
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [sentTo, setSentTo] = useState<string | null>(null);
  const [accountKind, setAccountKind] = useState<AccountKind>("CREATOR");

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setError("");
    const form = new FormData(e.currentTarget);
    const agencyName =
      accountKind === "AGENCY"
        ? String(form.get("agencyName") || "").trim()
        : undefined;

    if (accountKind === "AGENCY" && !agencyName) {
      setLoading(false);
      setError("Agency name is required.");
      return;
    }

    const res = await fetch("/api/auth/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: form.get("name"),
        email: form.get("email"),
        password: form.get("password"),
        role: accountKind,
        agencyName,
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
            Already verified? <AuthLink href={`/login${nextQuery}`}>Log in</AuthLink>
          </>
        }
      >
        <div className="space-y-4 rounded-2xl bg-soft px-4 py-5 text-[14px] leading-relaxed text-ink">
          <p>
            If you don’t see the email, check spam or promotions. The link expires in 48 hours.
          </p>
          <AuthLink href={`/login${nextQuery}`}>Go to log in</AuthLink>
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
          Already registered? <AuthLink href={`/login${nextQuery}`}>Log in</AuthLink>
        </>
      }
    >
      <div className="space-y-4">
        <fieldset className="space-y-2">
          <legend className="label">Account type</legend>
          <div className="grid grid-cols-2 gap-2">
            <label
              className={`cursor-pointer rounded-xl border px-3 py-3 text-center text-[13px] font-semibold transition-colors ${
                accountKind === "CREATOR"
                  ? "border-ink bg-ink text-white"
                  : "border-line bg-soft text-ink"
              }`}
            >
              <input
                type="radio"
                name="accountKind"
                className="sr-only"
                checked={accountKind === "CREATOR"}
                onChange={() => setAccountKind("CREATOR")}
              />
              Creator
            </label>
            <label
              className={`cursor-pointer rounded-xl border px-3 py-3 text-center text-[13px] font-semibold transition-colors ${
                accountKind === "AGENCY"
                  ? "border-ink bg-ink text-white"
                  : "border-line bg-soft text-ink"
              }`}
            >
              <input
                type="radio"
                name="accountKind"
                className="sr-only"
                checked={accountKind === "AGENCY"}
                onChange={() => setAccountKind("AGENCY")}
              />
              Agency
            </label>
          </div>
        </fieldset>

        <GoogleAuthButton
          label={
            accountKind === "AGENCY"
              ? "Continue with Google as agency"
              : "Continue with Google"
          }
          role={accountKind}
          nextPath={next}
        />
        <div className="flex items-center gap-3 text-[12px] uppercase tracking-[0.12em] text-mute">
          <span className="h-px flex-1 bg-line" />
          or email
          <span className="h-px flex-1 bg-line" />
        </div>
        <form onSubmit={onSubmit} className="space-y-4">
          {accountKind === "AGENCY" ? (
            <div>
              <label className="label" htmlFor="agencyName">
                Agency name
              </label>
              <input className="field" id="agencyName" name="agencyName" required />
            </div>
          ) : (
            <div>
              <label className="label" htmlFor="name">
                Name
              </label>
              <input className="field" id="name" name="name" required />
            </div>
          )}

          {accountKind === "AGENCY" ? (
            <input type="hidden" name="name" value="Agency" />
          ) : null}

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

export default function RegisterPage() {
  return (
    <Suspense fallback={null}>
      <RegisterForm />
    </Suspense>
  );
}
