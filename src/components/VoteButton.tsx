"use client";

import { useCallback, useEffect, useRef, useState } from "react";
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

export type VoteChange = {
  voted: boolean;
  count: number;
};

export function VoteButton({
  submissionId,
  initialVoted,
  initialCount,
  compact = false,
  className = "",
  onChange,
}: {
  submissionId: string;
  initialVoted: boolean;
  initialCount: number;
  compact?: boolean;
  className?: string;
  onChange?: (next: VoteChange) => void;
}) {
  const [voted, setVoted] = useState(initialVoted);
  const [count, setCount] = useState(initialCount);
  const [error, setError] = useState("");
  const [authOpen, setAuthOpen] = useState(false);
  const [returnPath, setReturnPath] = useState("/");
  const [pop, setPop] = useState(false);
  const inFlight = useRef(false);
  const popTimer = useRef<number | null>(null);

  const closeAuth = useCallback(() => setAuthOpen(false), []);

  // Re-seed only when the submission identity changes so optimistic likes are not wiped.
  useEffect(() => {
    setVoted(initialVoted);
    setCount(initialCount);
    setError("");
    // eslint-disable-next-line react-hooks/exhaustive-deps -- intentional: ignore later prop drift
  }, [submissionId]);

  useEffect(() => {
    return () => {
      if (popTimer.current != null) window.clearTimeout(popTimer.current);
    };
  }, []);

  function applyLocal(nextVoted: boolean, nextCount: number) {
    setVoted(nextVoted);
    setCount(nextCount);
    onChange?.({ voted: nextVoted, count: nextCount });
  }

  async function toggle(e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
    if (inFlight.current) return;

    setError("");

    const prevVoted = voted;
    const prevCount = count;
    const nextVoted = !voted;
    const nextCount = Math.max(0, count + (nextVoted ? 1 : -1));

    inFlight.current = true;
    applyLocal(nextVoted, nextCount);

    if (nextVoted) {
      setPop(true);
      if (popTimer.current != null) window.clearTimeout(popTimer.current);
      popTimer.current = window.setTimeout(() => setPop(false), 420);
    }

    try {
      const res = await fetch("/api/votes", {
        method: prevVoted ? "DELETE" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ submissionId }),
      });
      const data = await res.json().catch(() => ({}));

      if (res.status === 401) {
        applyLocal(prevVoted, prevCount);
        setReturnPath(window.location.pathname + window.location.search);
        setAuthOpen(true);
        return;
      }

      if (res.status === 403) {
        applyLocal(prevVoted, prevCount);
        setError(data.error || "Verify your email to vote.");
        return;
      }

      if (!res.ok) {
        applyLocal(prevVoted, prevCount);
        setError(data.error || "Could not update like.");
        return;
      }

      const confirmedVoted =
        typeof data.voted === "boolean" ? data.voted : nextVoted;
      const confirmedCount =
        typeof data.count === "number" ? data.count : nextCount;
      applyLocal(confirmedVoted, confirmedCount);
    } catch {
      applyLocal(prevVoted, prevCount);
      setError("Could not update like.");
    } finally {
      inFlight.current = false;
    }
  }

  return (
    <div className={`relative ${className}`} onClick={(e) => e.stopPropagation()}>
      <button
        type="button"
        onClick={toggle}
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
