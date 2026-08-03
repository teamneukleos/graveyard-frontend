"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState, useTransition } from "react";

const GUEST_KEY = "graveyard-voter-profile";

type GuestProfile = { name: string; email: string };

function readGuest(): GuestProfile | null {
  try {
    const raw = localStorage.getItem(GUEST_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as GuestProfile;
    if (parsed?.name && parsed?.email) return parsed;
  } catch {
    /* ignore */
  }
  return null;
}

function writeGuest(profile: GuestProfile) {
  try {
    localStorage.setItem(GUEST_KEY, JSON.stringify(profile));
  } catch {
    /* ignore */
  }
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
  const [pending, startTransition] = useTransition();
  const [askGuest, setAskGuest] = useState(false);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");

  useEffect(() => {
    const guest = readGuest();
    if (guest) {
      setName(guest.name);
      setEmail(guest.email);
    }
  }, []);

  useEffect(() => {
    setVoted(initialVoted);
    setCount(initialCount);
  }, [initialVoted, initialCount, submissionId]);

  async function cast(profile?: GuestProfile) {
    setError("");
    const payload: { submissionId: string; name?: string; email?: string } = { submissionId };
    const guest = profile || readGuest();
    if (guest) {
      payload.name = guest.name;
      payload.email = guest.email;
    }

    const res = await fetch("/api/votes", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    const data = await res.json();

    if (res.status === 400 && data.code === "guest_required") {
      setAskGuest(true);
      return;
    }

    if (!res.ok) {
      setError(data.error || "Vote failed.");
      return;
    }

    setAskGuest(false);
    setVoted(data.voted);
    if (typeof data.count === "number") setCount(data.count);
    else setCount((c) => Math.max(0, c + (data.voted ? 1 : -1)));
    startTransition(() => router.refresh());
  }

  async function toggle(e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
    await cast();
  }

  async function submitGuest(e: React.FormEvent) {
    e.preventDefault();
    e.stopPropagation();
    const profile = { name: name.trim(), email: email.trim() };
    if (!profile.name || !profile.email) {
      setError("Name and email are required.");
      return;
    }
    writeGuest(profile);
    await cast(profile);
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
        aria-label={voted ? "Remove vote" : "Cast vote"}
      >
        <span aria-hidden="true">{voted ? "▲" : "△"}</span>
        <span className="tabular-nums">{count}</span>
        {!compact ? <span className="ml-0.5">{voted ? "Voted" : "Vote"}</span> : null}
      </button>

      {askGuest ? (
        <div
          className="absolute right-0 top-full z-30 mt-2 w-[min(18rem,calc(100vw-2rem))] rounded-2xl border border-line bg-white p-4 shadow-[0_18px_50px_rgba(0,0,0,0.18)]"
          role="dialog"
          aria-label="Vote as guest"
        >
          <p className="font-display text-[15px] font-bold tracking-tight text-ink">
            Vote without an account
          </p>
          <p className="mt-1 text-[12px] leading-relaxed text-mute">
            Just your name and email. One vote per device.
          </p>
          <form className="mt-3 space-y-2" onSubmit={submitGuest}>
            <input
              className="field !py-2 !text-[13px]"
              name="name"
              placeholder="Your name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              autoComplete="name"
              required
            />
            <input
              className="field !py-2 !text-[13px]"
              name="email"
              type="email"
              placeholder="Email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              autoComplete="email"
              required
            />
            <div className="flex gap-2 pt-1">
              <button className="btn btn-primary !px-3 !py-1.5 !text-[12px]" type="submit" disabled={pending}>
                Vote
              </button>
              <button
                className="btn btn-ghost !px-3 !py-1.5 !text-[12px]"
                type="button"
                onClick={() => setAskGuest(false)}
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      ) : null}

      {error ? (
        <p className="absolute left-0 top-full z-10 mt-1 whitespace-nowrap text-[11px] text-ember">
          {error}
        </p>
      ) : null}
    </div>
  );
}
