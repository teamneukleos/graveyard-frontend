"use client";

import { useCallback, useEffect, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { AuthPromptModal } from "@/components/AuthPromptModal";

export function FollowButton({
  userId,
  initialFollowing,
  initialFollowerCount,
  className = "",
}: {
  userId: string;
  initialFollowing: boolean;
  initialFollowerCount: number;
  className?: string;
}) {
  const router = useRouter();
  const [following, setFollowing] = useState(initialFollowing);
  const [error, setError] = useState("");
  const [authOpen, setAuthOpen] = useState(false);
  const [returnPath, setReturnPath] = useState("/");
  const [pending, startTransition] = useTransition();

  const closeAuth = useCallback(() => setAuthOpen(false), []);

  useEffect(() => {
    setFollowing(initialFollowing);
  }, [initialFollowing, userId]);

  async function toggle() {
    setError("");
    const res = await fetch("/api/follows", {
      method: following ? "DELETE" : "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId }),
    });
    const data = await res.json().catch(() => ({}));

    if (res.status === 401) {
      setReturnPath(window.location.pathname + window.location.search);
      setAuthOpen(true);
      return;
    }

    if (!res.ok) {
      setError(data.error || "Could not update follow.");
      return;
    }

    setFollowing(Boolean(data.following));
    startTransition(() => router.refresh());
  }

  return (
    <div className={`relative ${className}`}>
      <button
        type="button"
        onClick={toggle}
        disabled={pending}
        className={`btn disabled:opacity-60 ${
          following
            ? "border border-white/45 bg-white/10 text-white hover:bg-white/18"
            : "btn-primary"
        }`}
        aria-pressed={following}
      >
        {following ? "Following" : "Follow"}
      </button>
      {error ? (
        <p className="absolute left-0 top-full z-10 mt-1 whitespace-nowrap text-[11px] text-ember">
          {error}
        </p>
      ) : null}

      <AuthPromptModal
        open={authOpen}
        onClose={closeAuth}
        action="follow"
        nextPath={returnPath}
      />
    </div>
  );
}
