"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export function RequestSeatButton({
  eventId,
  initialSpotsLeft,
  initialRequested,
  isLoggedIn,
}: {
  eventId: string;
  initialSpotsLeft: number;
  initialRequested: boolean;
  isLoggedIn: boolean;
}) {
  const router = useRouter();
  const [spotsLeft, setSpotsLeft] = useState(initialSpotsLeft);
  const [requested, setRequested] = useState(initialRequested);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function toggle() {
    if (!isLoggedIn) {
      router.push(`/login?next=${encodeURIComponent(`/events#${eventId}`)}`);
      return;
    }

    setLoading(true);
    setError("");
    const res = await fetch("/api/events/rsvp", {
      method: requested ? "DELETE" : "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ eventId }),
    });
    const data = await res.json();
    setLoading(false);

    if (!res.ok) {
      setError(data.error || "Could not update seat request.");
      return;
    }

    setRequested(Boolean(data.requested));
    if (typeof data.spotsLeft === "number") setSpotsLeft(data.spotsLeft);
    router.refresh();
  }

  const full = spotsLeft <= 0 && !requested;

  return (
    <div className="text-right">
      <p className="text-[12px] text-mute">Spots left</p>
      <p className="text-[22px] font-bold tabular-nums tracking-tight text-ink">{spotsLeft}</p>
      <button
        type="button"
        className="btn btn-primary mt-3 !w-full !px-3 !py-1.5 !text-[12px]"
        disabled={loading || full}
        onClick={() => void toggle()}
      >
        {loading
          ? "Saving…"
          : requested
            ? "Cancel seat"
            : full
              ? "Full"
              : isLoggedIn
                ? "Request seat"
                : "Log in to request"}
      </button>
      {error ? <p className="mt-2 text-[11px] text-ember">{error}</p> : null}
    </div>
  );
}
