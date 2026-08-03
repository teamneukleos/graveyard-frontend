"use client";

import { useState } from "react";

export function ResendVerificationButton() {
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  async function resend() {
    setLoading(true);
    setMessage("");
    const res = await fetch("/api/auth/resend-verification", { method: "POST" });
    const data = await res.json();
    setLoading(false);
    if (!res.ok) {
      setMessage(data.error || "Could not resend.");
      return;
    }
    setMessage("Verification email sent. Check inbox or server console.");
  }

  return (
    <div>
      <button type="button" className="btn btn-accent text-[13px]" disabled={loading} onClick={resend}>
        {loading ? "Sending…" : "Resend verification"}
      </button>
      {message ? <p className="mt-2 text-[13px] text-mute">{message}</p> : null}
    </div>
  );
}
