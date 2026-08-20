"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { prefersReducedMotion } from "@/lib/haunt-audio";

const STORAGE_KEY = "graveyard-entered";

/** Cut sequence: yard → eyes → flash → out. */
const FRAMES: (string | null)[] = [
  "/loader/01-yard.png",
  null,
  "/loader/03-stone.png",
  "/loader/02-eyes.png",
  "/loader/04-flash.png",
  "/loader/02-eyes.png",
  null,
  "/loader/04-flash.png",
  "/loader/01-yard.png",
];

const STEP_MS = 400;
const HOLD_EXTRA = 280;

type Phase = "checking" | "playing" | "done";

export function ScareIntro() {
  const [phase, setPhase] = useState<Phase>("checking");
  const [frame, setFrame] = useState(0);
  const [fading, setFading] = useState(false);
  const timers = useRef<number[]>([]);

  const clearTimers = useCallback(() => {
    for (const id of timers.current) window.clearTimeout(id);
    timers.current = [];
  }, []);

  const finish = useCallback(() => {
    clearTimers();
    try {
      sessionStorage.setItem(STORAGE_KEY, "1");
    } catch {
      /* ignore */
    }
    setFading(true);
    const id = window.setTimeout(() => setPhase("done"), 700);
    timers.current.push(id);
  }, [clearTimers]);

  const startSequence = useCallback(() => {
    const reduced = prefersReducedMotion();

    if (reduced) {
      setPhase("playing");
      setFrame(0);
      const id = window.setTimeout(finish, 900);
      timers.current.push(id);
      return;
    }

    setPhase("playing");
    setFrame(0);

    FRAMES.forEach((_, i) => {
      if (i === 0) return;
      const id = window.setTimeout(() => setFrame(i), i * STEP_MS);
      timers.current.push(id);
    });
    const endId = window.setTimeout(finish, FRAMES.length * STEP_MS + HOLD_EXTRA);
    timers.current.push(endId);
  }, [finish]);

  useEffect(() => {
    try {
      if (sessionStorage.getItem(STORAGE_KEY) === "1") {
        setPhase("done");
        return;
      }
    } catch {
      /* ignore */
    }
    startSequence();
  }, [startSequence]);

  useEffect(() => {
    if (phase !== "playing") return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [phase]);

  useEffect(() => {
    return () => {
      clearTimers();
    };
  }, [clearTimers]);

  if (phase === "checking" || phase === "done") return null;

  const src = FRAMES[frame];

  return (
    <div
      className={`scare-intro fixed inset-0 z-[100] flex items-center justify-center bg-black text-white ${
        fading ? "scare-intro-out" : ""
      }`}
      role="dialog"
      aria-modal="true"
      aria-label="Entering the Graveyard"
    >
      <div className="absolute inset-0 overflow-hidden bg-black">
        {src ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            key={`${src}-${frame}`}
            src={src}
            alt=""
            className="scare-frame h-full w-full object-cover"
          />
        ) : (
          <div key={`black-${frame}`} className="scare-blackout absolute inset-0 bg-black" />
        )}
        <div className="pointer-events-none absolute inset-0 bg-black/30" />
        <div className="scare-glitch pointer-events-none absolute inset-0" />
        <div className="scare-vignette pointer-events-none absolute inset-0" />
      </div>
      <button
        type="button"
        onClick={finish}
        className="absolute right-4 top-4 z-10 rounded-full bg-white/10 px-3 py-1.5 text-[12px] font-semibold text-white/70 backdrop-blur-sm hover:bg-white/20 hover:text-white"
      >
        Skip
      </button>
    </div>
  );
}
