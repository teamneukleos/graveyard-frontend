"use client";

import { useEffect, useId } from "react";
import Link from "next/link";
import { GoogleAuthButton } from "@/components/AuthShell";

export function AuthPromptModal({
  open,
  onClose,
  action = "like",
  nextPath,
}: {
  open: boolean;
  onClose: () => void;
  action?: "like" | "follow";
  nextPath?: string;
}) {
  const titleId = useId();
  const path =
    nextPath && nextPath.startsWith("/") && !nextPath.startsWith("//")
      ? nextPath
      : "/";
  const nextQuery = `?next=${encodeURIComponent(path)}`;

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = prev;
      window.removeEventListener("keydown", onKey);
    };
  }, [open, onClose]);

  if (!open) return null;

  const verb = action === "follow" ? "follow" : "like";

  return (
    <div className="fixed inset-0 z-[80]">
      <button
        type="button"
        aria-label="Close"
        className="fixed inset-0 bg-ink/50 backdrop-blur-[2px]"
        onClick={onClose}
      />
      <div className="pointer-events-none fixed inset-0 z-10 flex items-center justify-center p-4">
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby={titleId}
          className="pointer-events-auto w-full max-w-md rounded-[24px] border border-line bg-white p-6 shadow-xl md:p-8"
        >
          <p className="plot-label">Account needed</p>
          <h2 id={titleId} className="mt-2 font-display text-3xl tracking-tight text-ink">
            Sign in to {verb}
          </h2>
          <p className="mt-2 text-[14px] leading-relaxed text-mute">
            {action === "follow"
              ? "Create a free account or sign in to follow. You’ll return here afterward."
              : "Create a free account or sign in to like this work. You’ll return here afterward."}
          </p>

          <div className="mt-6 space-y-3">
            <Link href={`/login${nextQuery}`} className="btn btn-primary w-full">
              Sign in
            </Link>
            <Link href={`/register${nextQuery}`} className="btn btn-outline w-full">
              Create account
            </Link>
            <GoogleAuthButton nextPath={path} label="Continue with Google" />
          </div>

          <button type="button" className="btn btn-ghost mt-4 w-full" onClick={onClose}>
            Not now
          </button>
        </div>
      </div>
    </div>
  );
}
