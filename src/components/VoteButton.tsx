"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";

export function VoteButton({
  submissionId,
  initialVoted,
  initialCount,
  compact = false,
}: {
  submissionId: string;
  initialVoted: boolean;
  initialCount: number;
  compact?: boolean;
}) {
  const router = useRouter();
  const [voted, setVoted] = useState(initialVoted);
  const [count, setCount] = useState(initialCount);
  const [error, setError] = useState("");
  const [pending, startTransition] = useTransition();

  async function toggle(e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
    setError("");

    const res = await fetch("/api/votes", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ submissionId }),
    });
    const data = await res.json();

    if (res.status === 401) {
      window.location.href = `/login?next=${encodeURIComponent(window.location.pathname + window.location.search)}`;
      return;
    }

    if (!res.ok) {
      setError(data.error || "Vote failed.");
      return;
    }

    setVoted(data.voted);
    setCount((c) => Math.max(0, c + (data.voted ? 1 : -1)));
    startTransition(() => router.refresh());
  }

  return (
    <div className="relative" onClick={(e) => e.stopPropagation()}>
      <button
        type="button"
        onClick={toggle}
        disabled={pending}
        className={`inline-flex items-center gap-1 rounded-full text-[12px] font-semibold transition-colors ${
          compact ? "px-2.5 py-1" : "px-3 py-1.5"
        } ${
          voted
            ? "bg-ink text-white"
            : "bg-soft text-ink hover:bg-[#ebebeb]"
        } disabled:opacity-60`}
        aria-pressed={voted}
        aria-label={voted ? "Remove vote" : "Cast vote"}
      >
        <span aria-hidden="true">{voted ? "▲" : "△"}</span>
        <span className="tabular-nums">{count}</span>
      </button>
      {error ? (
        <p className="absolute left-0 top-full z-10 mt-1 whitespace-nowrap text-[11px] text-ember">
          {error}
        </p>
      ) : null}
    </div>
  );
}
