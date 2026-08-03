"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { BrandLogo } from "./BrandLogo";

const STORAGE_KEY = "graveyard-entered";
const FRAMES = [
  "/loader/01-yard.png",
  "/loader/03-stone.png",
  "/loader/02-eyes.png",
  "/loader/04-flash.png",
  "/loader/02-eyes.png",
  "/loader/01-yard.png",
  "/loader/04-flash.png",
];

type Phase = "checking" | "gate" | "playing" | "done";

function prefersReducedMotion() {
  if (typeof window === "undefined") return false;
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

function playScareAudio(ctx: AudioContext) {
  const now = ctx.currentTime;
  const master = ctx.createGain();
  master.gain.setValueAtTime(0.0001, now);
  master.gain.exponentialRampToValueAtTime(0.22, now + 0.15);
  master.gain.exponentialRampToValueAtTime(0.0001, now + 3.6);
  master.connect(ctx.destination);

  // Low rumble
  const rumble = ctx.createOscillator();
  const rumbleGain = ctx.createGain();
  rumble.type = "sawtooth";
  rumble.frequency.setValueAtTime(38, now);
  rumble.frequency.linearRampToValueAtTime(28, now + 3.2);
  rumbleGain.gain.setValueAtTime(0.18, now);
  rumble.connect(rumbleGain);
  rumbleGain.connect(master);
  rumble.start(now);
  rumble.stop(now + 3.4);

  // Dissonant drone
  const drone = ctx.createOscillator();
  const droneGain = ctx.createGain();
  drone.type = "triangle";
  drone.frequency.setValueAtTime(92, now);
  drone.frequency.linearRampToValueAtTime(74, now + 3);
  droneGain.gain.setValueAtTime(0.08, now);
  drone.connect(droneGain);
  droneGain.connect(master);
  drone.start(now);
  drone.stop(now + 3.3);

  // Stinger hits
  const hits = [0.55, 1.35, 2.15, 2.85];
  for (const t of hits) {
    const osc = ctx.createOscillator();
    const g = ctx.createGain();
    osc.type = "square";
    osc.frequency.setValueAtTime(180, now + t);
    osc.frequency.exponentialRampToValueAtTime(55, now + t + 0.35);
    g.gain.setValueAtTime(0.0001, now + t);
    g.gain.exponentialRampToValueAtTime(0.16, now + t + 0.02);
    g.gain.exponentialRampToValueAtTime(0.0001, now + t + 0.4);
    osc.connect(g);
    g.connect(master);
    osc.start(now + t);
    osc.stop(now + t + 0.45);
  }

  // Noise burst at peak scare
  const bufferSize = ctx.sampleRate * 0.35;
  const noiseBuffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
  const data = noiseBuffer.getChannelData(0);
  for (let i = 0; i < bufferSize; i++) data[i] = Math.random() * 2 - 1;
  const noise = ctx.createBufferSource();
  const noiseGain = ctx.createGain();
  const filter = ctx.createBiquadFilter();
  filter.type = "bandpass";
  filter.frequency.value = 900;
  noise.buffer = noiseBuffer;
  noiseGain.gain.setValueAtTime(0.0001, now + 2.7);
  noiseGain.gain.exponentialRampToValueAtTime(0.12, now + 2.75);
  noiseGain.gain.exponentialRampToValueAtTime(0.0001, now + 3.1);
  noise.connect(filter);
  filter.connect(noiseGain);
  noiseGain.connect(master);
  noise.start(now + 2.7);
  noise.stop(now + 3.15);

  return () => {
    try {
      master.disconnect();
    } catch {
      /* ignore */
    }
  };
}

export function ScareIntro() {
  const [phase, setPhase] = useState<Phase>("checking");
  const [frame, setFrame] = useState(0);
  const [fading, setFading] = useState(false);
  const audioCtx = useRef<AudioContext | null>(null);
  const timers = useRef<number[]>([]);
  const cleanupAudio = useRef<(() => void) | null>(null);

  const clearTimers = useCallback(() => {
    for (const id of timers.current) window.clearTimeout(id);
    timers.current = [];
  }, []);

  const finish = useCallback(() => {
    clearTimers();
    cleanupAudio.current?.();
    cleanupAudio.current = null;
    try {
      audioCtx.current?.close();
    } catch {
      /* ignore */
    }
    audioCtx.current = null;
    try {
      sessionStorage.setItem(STORAGE_KEY, "1");
    } catch {
      /* ignore */
    }
    setFading(true);
    const id = window.setTimeout(() => setPhase("done"), 480);
    timers.current.push(id);
  }, [clearTimers]);

  useEffect(() => {
    try {
      if (sessionStorage.getItem(STORAGE_KEY) === "1") {
        setPhase("done");
        return;
      }
    } catch {
      /* ignore */
    }
    setPhase("gate");
  }, []);

  useEffect(() => {
    if (phase !== "gate" && phase !== "playing") return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [phase]);

  useEffect(() => {
    return () => {
      clearTimers();
      cleanupAudio.current?.();
      try {
        audioCtx.current?.close();
      } catch {
        /* ignore */
      }
    };
  }, [clearTimers]);

  const startSequence = useCallback(() => {
    const reduced = prefersReducedMotion();

    if (reduced) {
      setPhase("playing");
      setFrame(0);
      const id = window.setTimeout(finish, 700);
      timers.current.push(id);
      return;
    }

    try {
      const Ctx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      const ctx = new Ctx();
      audioCtx.current = ctx;
      void ctx.resume();
      cleanupAudio.current = playScareAudio(ctx);
    } catch {
      /* audio optional */
    }

    setPhase("playing");
    setFrame(0);

    const stepMs = 420;
    FRAMES.forEach((_, i) => {
      if (i === 0) return;
      const id = window.setTimeout(() => setFrame(i), i * stepMs);
      timers.current.push(id);
    });
    const endId = window.setTimeout(finish, FRAMES.length * stepMs + 200);
    timers.current.push(endId);
  }, [finish]);

  if (phase === "checking" || phase === "done") return null;

  return (
    <div
      className={`scare-intro fixed inset-0 z-[100] flex items-center justify-center bg-black text-white ${
        fading ? "scare-intro-out" : ""
      }`}
      role="dialog"
      aria-modal="true"
      aria-label="Enter the Graveyard"
    >
      {phase === "gate" ? (
        <button
          type="button"
          onClick={startSequence}
          className="group flex w-full max-w-[72rem] flex-col items-center gap-8 px-4 text-center md:gap-10"
        >
          <BrandLogo href={null} size="hero" tone="dark" priority />
          <span className="font-display text-[28px] font-bold leading-none tracking-[-0.04em] md:text-[44px]">
            Enter the yard
          </span>
          <span className="max-w-xs text-[14px] leading-relaxed text-white/50">
            Tap to open. Sound on.
          </span>
          <span className="rounded-full bg-accent px-6 py-2.5 text-[14px] font-bold text-white transition group-hover:brightness-95">
            Enter
          </span>
        </button>
      ) : null}

      {phase === "playing" ? (
        <>
          <div className="absolute inset-0 overflow-hidden">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              key={FRAMES[frame]}
              src={FRAMES[frame]}
              alt=""
              className="scare-frame h-full w-full object-cover"
            />
            <div className="pointer-events-none absolute inset-0 bg-black/25" />
            <div className="scare-glitch pointer-events-none absolute inset-0" />
          </div>
          <p className="pointer-events-none absolute bottom-10 left-0 right-0 text-center font-display text-[13px] font-bold uppercase tracking-[0.2em] text-accent">
            Should have gone LIVE
          </p>
          <button
            type="button"
            onClick={finish}
            className="absolute right-4 top-4 z-10 rounded-full bg-white/10 px-3 py-1.5 text-[12px] font-semibold text-white/70 backdrop-blur-sm hover:bg-white/20 hover:text-white"
          >
            Skip
          </button>
        </>
      ) : null}
    </div>
  );
}
