"use client";

import { useCallback, useEffect, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { AuthPromptModal } from "@/components/AuthPromptModal";

function HeartIcon({ filled, className = "" }: { filled: boolean; className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      width="1em"
      height="1em"
      aria-hidden="true"
      fill={filled ? "currentColor" : "none"}
      stroke="currentColor"
      strokeWidth={filled ? 0 : 2}
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M19.5 12.57 12 20l-7.5-7.43A5 5 0 0 1 12 5.1a5 5 0 0 1 7.5 7.47Z" />
    </svg>
  );
}

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
  const [pop, setPop] = useState(false);

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

    const nextVoted = Boolean(data.voted);
    setVoted(nextVoted);
    if (typeof data.count === "number") setCount(data.count);
    if (nextVoted) {
      setPop(true);
      window.setTimeout(() => setPop(false), 420);
    }
    startTransition(() => router.refresh());
  }

  return (
    <div className={`relative ${className}`} onClick={(e) => e.stopPropagation()}>
      <button
        type="button"
        onClick={toggle}
        disabled={pending}
        className={`vote-btn ${compact ? "vote-btn--compact" : "vote-btn--full"} ${
          voted ? "vote-btn--on" : "vote-btn--off"
        } ${pop ? "vote-btn--pop" : ""}`}
        aria-pressed={voted}
        aria-label={voted ? "Remove like" : "Like"}
      >
        <span className={`vote-btn__icon ${pop ? "vote-btn__icon--pop" : ""}`}>
          <HeartIcon filled={voted} />
        </span>
        <span className="vote-btn__count tabular-nums">{count}</span>
        {!compact ? (
          <span className="vote-btn__label">{voted ? "Liked" : "Like"}</span>
        ) : null}
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
