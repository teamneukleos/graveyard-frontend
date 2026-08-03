/** Shared Web Audio haunt helpers (browser only). */

let sharedCtx: AudioContext | null = null;

export function getSharedAudioContext(): AudioContext | null {
  if (typeof window === "undefined") return null;
  if (sharedCtx && sharedCtx.state !== "closed") return sharedCtx;
  const Ctx =
    window.AudioContext ||
    (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
  try {
    sharedCtx = new Ctx();
    return sharedCtx;
  } catch {
    return null;
  }
}

export async function unlockHauntAudio() {
  const ctx = getSharedAudioContext();
  if (!ctx) return null;
  try {
    if (ctx.state === "suspended") await ctx.resume();
  } catch {
    /* ignore */
  }
  return ctx;
}

export function prefersReducedMotion() {
  if (typeof window === "undefined") return false;
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

/** Scare bed for the homepage loader (~4.5s). */
export function playLoaderScare(ctx: AudioContext) {
  const now = ctx.currentTime;
  const master = ctx.createGain();
  master.gain.setValueAtTime(0.0001, now);
  master.gain.exponentialRampToValueAtTime(0.28, now + 0.15);
  master.gain.setValueAtTime(0.26, now + 3.6);
  master.gain.exponentialRampToValueAtTime(0.0001, now + 4.6);
  master.connect(ctx.destination);

  const rumble = ctx.createOscillator();
  const rumbleGain = ctx.createGain();
  rumble.type = "sawtooth";
  rumble.frequency.setValueAtTime(32, now);
  rumble.frequency.linearRampToValueAtTime(22, now + 4.2);
  rumbleGain.gain.setValueAtTime(0.22, now);
  rumbleGain.gain.linearRampToValueAtTime(0.3, now + 2);
  rumbleGain.gain.linearRampToValueAtTime(0.12, now + 4);
  rumble.connect(rumbleGain);
  rumbleGain.connect(master);
  rumble.start(now);
  rumble.stop(now + 4.4);

  for (const [freq, amp, dur] of [
    [86, 0.09, 4],
    [91.5, 0.07, 3.8],
    [129, 0.05, 3.5],
  ] as const) {
    const osc = ctx.createOscillator();
    const g = ctx.createGain();
    osc.type = "triangle";
    osc.frequency.setValueAtTime(freq, now);
    osc.frequency.linearRampToValueAtTime(freq * 0.78, now + dur);
    g.gain.setValueAtTime(amp, now);
    osc.connect(g);
    g.connect(master);
    osc.start(now);
    osc.stop(now + dur);
  }

  const beats = [0.55, 1.15, 1.85, 2.65, 3.4];
  for (const t of beats) {
    const osc = ctx.createOscillator();
    const g = ctx.createGain();
    osc.type = "sine";
    osc.frequency.setValueAtTime(48, now + t);
    osc.frequency.exponentialRampToValueAtTime(28, now + t + 0.18);
    g.gain.setValueAtTime(0.0001, now + t);
    g.gain.exponentialRampToValueAtTime(0.2, now + t + 0.02);
    g.gain.exponentialRampToValueAtTime(0.0001, now + t + 0.22);
    osc.connect(g);
    g.connect(master);
    osc.start(now + t);
    osc.stop(now + t + 0.25);
  }

  const hits = [0.9, 2.1, 3.35];
  for (const t of hits) {
    const osc = ctx.createOscillator();
    const g = ctx.createGain();
    osc.type = "square";
    osc.frequency.setValueAtTime(210, now + t);
    osc.frequency.exponentialRampToValueAtTime(42, now + t + 0.4);
    g.gain.setValueAtTime(0.0001, now + t);
    g.gain.exponentialRampToValueAtTime(0.2, now + t + 0.015);
    g.gain.exponentialRampToValueAtTime(0.0001, now + t + 0.45);
    osc.connect(g);
    g.connect(master);
    osc.start(now + t);
    osc.stop(now + t + 0.5);
  }

  const whisperAt = [0.35, 1.6, 2.9];
  for (const t of whisperAt) {
    const len = Math.floor(ctx.sampleRate * 0.4);
    const buf = ctx.createBuffer(1, len, ctx.sampleRate);
    const data = buf.getChannelData(0);
    for (let i = 0; i < len; i++) {
      data[i] = (Math.random() * 2 - 1) * (1 - i / len);
    }
    const src = ctx.createBufferSource();
    const filter = ctx.createBiquadFilter();
    const g = ctx.createGain();
    filter.type = "bandpass";
    filter.frequency.value = 700 + Math.random() * 900;
    filter.Q.value = 4;
    src.buffer = buf;
    g.gain.setValueAtTime(0.0001, now + t);
    g.gain.exponentialRampToValueAtTime(0.1, now + t + 0.05);
    g.gain.exponentialRampToValueAtTime(0.0001, now + t + 0.4);
    src.connect(filter);
    filter.connect(g);
    g.connect(master);
    src.start(now + t);
    src.stop(now + t + 0.45);
  }

  const burstLen = Math.floor(ctx.sampleRate * 0.4);
  const burstBuf = ctx.createBuffer(1, burstLen, ctx.sampleRate);
  const burstData = burstBuf.getChannelData(0);
  for (let i = 0; i < burstLen; i++) burstData[i] = Math.random() * 2 - 1;
  const burst = ctx.createBufferSource();
  const burstFilter = ctx.createBiquadFilter();
  const burstGain = ctx.createGain();
  burstFilter.type = "highpass";
  burstFilter.frequency.value = 400;
  burst.buffer = burstBuf;
  burstGain.gain.setValueAtTime(0.0001, now + 3.5);
  burstGain.gain.exponentialRampToValueAtTime(0.18, now + 3.55);
  burstGain.gain.exponentialRampToValueAtTime(0.0001, now + 3.95);
  burst.connect(burstFilter);
  burstFilter.connect(burstGain);
  burstGain.connect(master);
  burst.start(now + 3.5);
  burst.stop(now + 4);

  return () => {
    try {
      master.disconnect();
    } catch {
      /* ignore */
    }
  };
}

/** Short whoosh + moan for a ghost crossing the yard. */
export function playGhostPass(ctx: AudioContext) {
  const now = ctx.currentTime;
  const master = ctx.createGain();
  master.gain.setValueAtTime(0.0001, now);
  master.gain.exponentialRampToValueAtTime(0.16, now + 0.12);
  master.gain.exponentialRampToValueAtTime(0.0001, now + 3.4);
  master.connect(ctx.destination);

  const len = Math.floor(ctx.sampleRate * 2.2);
  const buf = ctx.createBuffer(1, len, ctx.sampleRate);
  const data = buf.getChannelData(0);
  for (let i = 0; i < len; i++) {
    const env = Math.sin((Math.PI * i) / len);
    data[i] = (Math.random() * 2 - 1) * env;
  }
  const noise = ctx.createBufferSource();
  const filter = ctx.createBiquadFilter();
  const g = ctx.createGain();
  filter.type = "bandpass";
  filter.frequency.setValueAtTime(400, now);
  filter.frequency.exponentialRampToValueAtTime(1800, now + 1.1);
  filter.frequency.exponentialRampToValueAtTime(280, now + 2.2);
  filter.Q.value = 1.2;
  noise.buffer = buf;
  g.gain.value = 0.14;
  noise.connect(filter);
  filter.connect(g);
  g.connect(master);
  noise.start(now);
  noise.stop(now + 2.2);

  const moan = ctx.createOscillator();
  const moanGain = ctx.createGain();
  moan.type = "sine";
  moan.frequency.setValueAtTime(110, now + 0.2);
  moan.frequency.linearRampToValueAtTime(62, now + 2.6);
  moanGain.gain.setValueAtTime(0.0001, now + 0.2);
  moanGain.gain.exponentialRampToValueAtTime(0.12, now + 0.45);
  moanGain.gain.exponentialRampToValueAtTime(0.0001, now + 2.8);
  moan.connect(moanGain);
  moanGain.connect(master);
  moan.start(now + 0.2);
  moan.stop(now + 2.9);

  const sting = ctx.createOscillator();
  const stingGain = ctx.createGain();
  sting.type = "sawtooth";
  sting.frequency.setValueAtTime(160, now + 1.4);
  sting.frequency.exponentialRampToValueAtTime(48, now + 2.1);
  stingGain.gain.setValueAtTime(0.0001, now + 1.4);
  stingGain.gain.exponentialRampToValueAtTime(0.1, now + 1.42);
  stingGain.gain.exponentialRampToValueAtTime(0.0001, now + 2.15);
  sting.connect(stingGain);
  stingGain.connect(master);
  sting.start(now + 1.4);
  sting.stop(now + 2.2);

  return () => {
    try {
      master.disconnect();
    } catch {
      /* ignore */
    }
  };
}
