"use client";

import { useCallback, useEffect, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { AuthPromptModal } from "@/components/AuthPromptModal";

export function VoteButton({
  submissionId,
  initialVoted,
  initialCount,
  compact = false,
  className = "",
}: {
  submissionId: string;
  initialVoted: boolean;
  initialCount: number;
  compact?: boolean;
  className?: string;
}) {
  const router = useRouter();
  const [voted, setVoted] = useState(initialVoted);
  const [count, setCount] = useState(initialCount);
  const [error, setError] = useState("");
  const [authOpen, setAuthOpen] = useState(false);
  const [returnPath, setReturnPath] = useState("/");
  const [pending, startTransition] = useTransition();

  const closeAuth = useCallback(() => setAuthOpen(false), []);

  useEffect(() => {
    setVoted(initialVoted);
    setCount(initialCount);
  }, [initialVoted, initialCount, submissionId]);

  async function toggle(e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
    setError("");

    const res = await fetch("/api/votes", {
      method: voted ? "DELETE" : "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ submissionId }),
    });
    const data = await res.json();

    if (res.status === 401) {
      setReturnPath(window.location.pathname + window.location.search);
      setAuthOpen(true);
      return;
    }

    if (res.status === 403) {
      setError(data.error || "Verify your email to vote.");
      return;
    }

    if (!res.ok) {
      setError(data.error || "Could not update like.");
      return;
    }

    setVoted(Boolean(data.voted));
    if (typeof data.count === "number") setCount(data.count);
    startTransition(() => router.refresh());
  }

  return (
    <div className={`relative ${className}`} onClick={(e) => e.stopPropagation()}>
      <button
        type="button"
        onClick={toggle}
        disabled={pending}
        className={`inline-flex items-center gap-1 rounded-full text-[12px] font-semibold transition-colors ${
          compact ? "px-2.5 py-1" : "px-3.5 py-1.5"
        } ${
          voted ? "bg-ink text-white" : "bg-soft text-ink hover:bg-[#ebebeb]"
        } disabled:opacity-60`}
        aria-pressed={voted}
        aria-label={voted ? "Remove like" : "Like"}
      >
        <span aria-hidden="true">{voted ? "▲" : "△"}</span>
        <span className="tabular-nums">{count}</span>
        {!compact ? <span className="ml-0.5">{voted ? "Liked" : "Like"}</span> : null}
      </button>

      {error ? (
        <p className="absolute left-0 top-full z-10 mt-1 whitespace-nowrap text-[11px] text-ember">
          {error}
        </p>
      ) : null}

      <AuthPromptModal open={authOpen} onClose={closeAuth} action="like" nextPath={returnPath} />
    </div>
  );
}
