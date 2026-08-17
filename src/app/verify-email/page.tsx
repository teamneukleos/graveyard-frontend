"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useEffect, useState } from "react";
import { AuthLink, AuthShell } from "@/components/AuthShell";

function VerifyClient() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get("token") || "";
  const [status, setStatus] = useState<"loading" | "ok" | "error">("loading");
  const [message, setMessage] = useState("Verifying your email…");

  useEffect(() => {
    if (!token) {
      setStatus("error");
      setMessage("Missing verification token.");
      return;
    }

    void (async () => {
      const res = await fetch("/api/auth/verify-email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token }),
      });
      const data = await res.json();
      if (!res.ok) {
        setStatus("error");
        setMessage(data.error || "Verification failed.");
        return;
      }
      setStatus("ok");
      setMessage("Email verified. You can log in and start submitting work.");
      setTimeout(() => {
        router.push("/login");
        router.refresh();
      }, 1200);
    })();
  }, [token, router]);

  return (
    <AuthShell
      eyebrow="Email"
      title={status === "ok" ? "You're verified" : status === "error" ? "Could not verify" : "Verifying"}
      description={message}
      footer={
        <>
          Continue to <AuthLink href="/login">log in</AuthLink>
        </>
      }
    >
      <div className="rounded-2xl bg-soft px-4 py-5 text-[14px] text-ink">{message}</div>
    </AuthShell>
  );
}

export default function VerifyEmailPage() {
  return (
    <Suspense fallback={<main className="product-shell flex flex-1 items-center justify-center text-mute">Loading…</main>}>
      <VerifyClient />
    </Suspense>
  );
}
