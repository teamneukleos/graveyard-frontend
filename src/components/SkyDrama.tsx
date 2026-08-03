"use client";

import { useEffect, useRef } from "react";

const THUNDER_KEY = "graveyard-thunder";
const ENTERED_KEY = "graveyard-entered";

function prefersReducedMotion() {
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

function playThunder(ctx: AudioContext) {
  const now = ctx.currentTime;
  const master = ctx.createGain();
  master.gain.setValueAtTime(0.0001, now);
  master.gain.exponentialRampToValueAtTime(0.28, now + 0.05);
  master.gain.exponentialRampToValueAtTime(0.12, now + 0.8);
  master.gain.exponentialRampToValueAtTime(0.0001, now + 2.8);
  master.connect(ctx.destination);

  const rumble = ctx.createOscillator();
  const rumbleGain = ctx.createGain();
  rumble.type = "sawtooth";
  rumble.frequency.setValueAtTime(42, now);
  rumble.frequency.linearRampToValueAtTime(22, now + 2.4);
  rumbleGain.gain.value = 0.22;
  rumble.connect(rumbleGain);
  rumbleGain.connect(master);
  rumble.start(now);
  rumble.stop(now + 2.6);

  const crack = ctx.createOscillator();
  const crackGain = ctx.createGain();
  crack.type = "square";
  crack.frequency.setValueAtTime(160, now);
  crack.frequency.exponentialRampToValueAtTime(40, now + 0.35);
  crackGain.gain.setValueAtTime(0.0001, now);
  crackGain.gain.exponentialRampToValueAtTime(0.14, now + 0.02);
  crackGain.gain.exponentialRampToValueAtTime(0.0001, now + 0.4);
  crack.connect(crackGain);
  crackGain.connect(master);
  crack.start(now);
  crack.stop(now + 0.45);

  const bufferSize = ctx.sampleRate * 0.5;
  const noiseBuffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
  const data = noiseBuffer.getChannelData(0);
  for (let i = 0; i < bufferSize; i++) data[i] = (Math.random() * 2 - 1) * (1 - i / bufferSize);
  const noise = ctx.createBufferSource();
  const noiseGain = ctx.createGain();
  const filter = ctx.createBiquadFilter();
  filter.type = "lowpass";
  filter.frequency.value = 600;
  noise.buffer = noiseBuffer;
  noiseGain.gain.setValueAtTime(0.0001, now + 0.08);
  noiseGain.gain.exponentialRampToValueAtTime(0.18, now + 0.12);
  noiseGain.gain.exponentialRampToValueAtTime(0.0001, now + 1.6);
  noise.connect(filter);
  filter.connect(noiseGain);
  noiseGain.connect(master);
  noise.start(now + 0.08);
  noise.stop(now + 1.7);
}

function flashLightning() {
  const el = document.querySelector(".ga-lightning");
  if (!el) return;
  el.classList.remove("is-flash");
  void (el as HTMLElement).offsetWidth;
  el.classList.add("is-flash");
}

/**
 * Eclipse is CSS on the atmosphere layer.
 * Thunder + lightning once per session after scare intro (or immediately if already entered).
 */
export function SkyDrama() {
  const ran = useRef(false);

  useEffect(() => {
    if (ran.current) return;

    try {
      if (sessionStorage.getItem(THUNDER_KEY) === "1") return;
    } catch {
      /* ignore */
    }

    if (prefersReducedMotion()) {
      try {
        sessionStorage.setItem(THUNDER_KEY, "1");
      } catch {
        /* ignore */
      }
      return;
    }

    let cancelled = false;
    const timeouts: number[] = [];
    let pollId: number | null = null;

    const runStorm = () => {
      if (cancelled || ran.current) return;
      ran.current = true;

      try {
        sessionStorage.setItem(THUNDER_KEY, "1");
      } catch {
        /* ignore */
      }

      let ctx: AudioContext | null = null;
      try {
        const Ctx =
          window.AudioContext ||
          (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
        ctx = new Ctx();
        void ctx.resume();
      } catch {
        /* audio optional */
      }

      const strikes = [400, 1400, 2600];
      strikes.forEach((delay, i) => {
        timeouts.push(
          window.setTimeout(() => {
            flashLightning();
            if (ctx && (i === 0 || i === 2)) {
              try {
                playThunder(ctx);
              } catch {
                /* ignore */
              }
            }
          }, delay),
        );
      });

      timeouts.push(
        window.setTimeout(() => {
          try {
            ctx?.close();
          } catch {
            /* ignore */
          }
        }, 4500),
      );
    };

    const scheduleStorm = (ms: number) => {
      timeouts.push(window.setTimeout(runStorm, ms));
    };

    try {
      if (sessionStorage.getItem(ENTERED_KEY) === "1") {
        scheduleStorm(600);
      } else {
        let tries = 0;
        pollId = window.setInterval(() => {
          tries += 1;
          try {
            if (sessionStorage.getItem(ENTERED_KEY) === "1" || tries > 120) {
              if (pollId) window.clearInterval(pollId);
              pollId = null;
              scheduleStorm(500);
            }
          } catch {
            if (pollId) window.clearInterval(pollId);
            pollId = null;
            runStorm();
          }
        }, 250);
      }
    } catch {
      scheduleStorm(600);
    }

    return () => {
      cancelled = true;
      for (const id of timeouts) window.clearTimeout(id);
      if (pollId) window.clearInterval(pollId);
    };
  }, []);

  return null;
}
