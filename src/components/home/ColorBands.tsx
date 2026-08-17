import Link from "next/link";
import {
  formatEventType,
  formatEventWhen,
  type EventWithAvailability,
} from "@/lib/events";
import type { EntityLeader } from "@/lib/leaderboards";

const TombMark = ({ className }: { className?: string }) => (
  <svg
    className={className}
    viewBox="0 0 64 80"
    fill="none"
    aria-hidden="true"
  >
    <path d="M20 28 h24 v40 h-24z M20 28 a12 12 0 0 1 24 0" fill="currentColor" />
    <path d="M30 18 h4 v12 h-4z M26 22 h12 v3.5 h-12z" fill="currentColor" />
  </svg>
);

function eventDayParts(iso: string) {
  const d = new Date(iso);
  return {
    day: new Intl.DateTimeFormat("en-GB", { day: "numeric" }).format(d),
    mon: new Intl.DateTimeFormat("en-GB", { month: "short" }).format(d).toUpperCase(),
    when: formatEventWhen(iso),
  };
}

/** Events  -  narrative panel + story strip (no identical cards) */
export function EventsColorBand({ events }: { events: EventWithAvailability[] }) {
  if (!events.length) return null;
  const list = events.slice(0, 3);

  return (
    <section className="px-4 py-10 md:px-6 md:py-14">
      <div className="mx-auto grid max-w-[1440px] gap-0 overflow-hidden rounded-[32px] md:grid-cols-[0.95fr_1.35fr]">
        <div
          className="relative flex flex-col justify-between px-7 py-12 text-white md:px-10 md:py-16"
          style={{
            background:
              "linear-gradient(160deg, #ff6a00 0%, #e85d04 42%, #7c2d9e 100%)",
          }}
        >
          <div>
            <p className="text-[12px] font-semibold uppercase tracking-[0.16em] text-white/45">
              Gatherings
            </p>
            <h2 className="mt-3 font-display text-[34px] font-bold leading-[1.05] tracking-[-0.04em] md:text-[48px]">
              Meet in
              <br />
              the yard.
            </h2>
            <p className="mt-4 max-w-sm text-[16px] leading-relaxed text-white/55">
              Salons, workshops, and nights where shelved work gets an audience and a second chance.
            </p>
          </div>
          <Link
            href="/events"
            className="mt-10 inline-flex w-fit rounded-full bg-accent px-5 py-2.5 text-[14px] font-bold text-white hover:brightness-95"
          >
            All events
          </Link>
          <TombMark className="pointer-events-none absolute -right-4 bottom-6 h-36 w-36 text-white/[0.06]" />
        </div>

        <div
          className="divide-y divide-black/10"
          style={{
            background: "linear-gradient(180deg, #fff6ee 0%, #ffe4cc 55%, #ffd2a8 100%)",
          }}
        >
          {list.map((event) => {
            const parts = eventDayParts(event.startsAt);
            return (
              <Link
                key={event.id}
                href={`/events#${event.id}`}
                className="group flex flex-col gap-3 px-6 py-7 transition hover:bg-white/50 sm:flex-row sm:items-start sm:gap-8 sm:px-8"
              >
                <div className="shrink-0 sm:w-20">
                  <p className="font-display text-[40px] font-bold leading-none tracking-tight text-ink">
                    {parts.day}
                  </p>
                  <p className="mt-1 text-[11px] font-bold uppercase tracking-[0.14em] text-mute">
                    {parts.mon}
                  </p>
                </div>
                <div className="min-w-0 flex-1 border-l border-black/10 pl-0 sm:pl-8 sm:border-l">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-[11px] font-bold uppercase tracking-[0.12em] text-[#e85d04]">
                      {formatEventType(event.type)}
                    </span>
                    <span className="text-[12px] text-mute">{event.spotsLeft} left</span>
                  </div>
                  <h3 className="mt-2 font-display text-[22px] font-bold tracking-tight text-ink group-hover:underline md:text-[26px]">
                    {event.title}
                  </h3>
                  <p className="mt-1 text-[13px] text-mute">
                    {parts.when} · {event.city}
                  </p>
                  <p className="mt-2 line-clamp-2 text-[14px] leading-relaxed text-ink/65">
                    {event.blurb}
                  </p>
                </div>
              </Link>
            );
          })}
        </div>
      </div>
    </section>
  );
}

type CategoryBandItem = { name: string; slug?: string; count?: number };

/** Categories  -  Apple-style asymmetric feature grid */
export function CategoriesColorBand({
  categories,
}: {
  categories: CategoryBandItem[];
}) {
  const items = categories.slice(0, 6);
  if (!items.length) return null;

  const palettes = [
    {
      gradient: "linear-gradient(145deg, #ff8c1a 0%, #ff6a00 55%, #e85d04 100%)",
      fg: "#fff",
      muted: "rgba(255,255,255,0.75)",
      mark: "rgba(255,255,255,0.18)",
    },
    {
      gradient: "linear-gradient(155deg, #faf6f2 0%, #efe4d8 50%, #e2d0c0 100%)",
      fg: "#0a0a0a",
      muted: "rgba(10,10,10,0.5)",
      mark: "rgba(10,10,10,0.07)",
    },
    {
      gradient: "linear-gradient(150deg, #fff8f0 0%, #ffd9b8 45%, #ffb87a 100%)",
      fg: "#0a0a0a",
      muted: "rgba(10,10,10,0.5)",
      mark: "rgba(10,10,10,0.08)",
    },
    {
      gradient: "linear-gradient(145deg, #ff6a00 0%, #ff8c1a 40%, #e85d04 100%)",
      fg: "#fff",
      muted: "rgba(255,255,255,0.75)",
      mark: "rgba(255,255,255,0.15)",
    },
    {
      gradient: "linear-gradient(155deg, #9b2f8a 0%, #6b21a8 50%, #ff6a00 100%)",
      fg: "#fff",
      muted: "rgba(255,255,255,0.7)",
      mark: "rgba(255,255,255,0.14)",
    },
    {
      gradient: "linear-gradient(150deg, #ff7a14 0%, #ff9f4d 45%, #e85d04 100%)",
      fg: "#fff",
      muted: "rgba(255,255,255,0.75)",
      mark: "rgba(255,255,255,0.14)",
    },
  ];

  const [hero, a, b, ...rest] = items;
  const side = [a, b].filter(Boolean) as CategoryBandItem[];
  const row = rest.slice(0, 3);

  function PlotCard({
    cat,
    toneIndex,
    className,
    large,
  }: {
    cat: CategoryBandItem;
    toneIndex: number;
    className?: string;
    large?: boolean;
  }) {
    const tone = palettes[toneIndex % palettes.length];
    const href = `/categories/${encodeURIComponent(cat.slug || cat.name)}`;
    return (
      <Link
        href={href}
        className={`group relative flex flex-col justify-between overflow-hidden rounded-[28px] p-7 transition duration-300 hover:-translate-y-0.5 hover:shadow-[0_16px_48px_rgba(10,10,10,0.12)] ${className ?? ""}`}
        style={{ background: tone.gradient, color: tone.fg }}
      >
        <span style={{ color: tone.mark }}>
          <TombMark
            className={`pointer-events-none absolute -right-2 -bottom-1 ${large ? "h-40 w-40" : "h-24 w-24"}`}
          />
        </span>
        <p
          className="relative text-[11px] font-bold uppercase tracking-[0.16em]"
          style={{ color: tone.muted }}
        >
          Category
        </p>
        <div className="relative mt-auto pt-10">
          <h3
            className={`font-display font-bold tracking-[-0.03em] ${
              large ? "text-[40px] md:text-[56px]" : "text-[26px] md:text-[32px]"
            }`}
          >
            {cat.name}
          </h3>
          <p
            className="mt-2 text-[14px] font-semibold group-hover:underline"
            style={{ color: tone.muted }}
          >
            Vote here →
          </p>
        </div>
      </Link>
    );
  }

  return (
    <section className="px-4 py-10 md:px-6 md:py-14">
      <div className="mx-auto max-w-[1440px]">
        <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
          <div className="max-w-xl">
            <p className="text-[12px] font-semibold uppercase tracking-[0.16em] text-mute">
              Categories
            </p>
            <h2 className="mt-2 font-display text-[34px] font-bold leading-[1.05] tracking-[-0.04em] text-ink md:text-[52px]">
              Pick a plot. Cast a vote.
            </h2>
          </div>
          <Link
            href="/categories"
            className="text-[14px] font-bold text-ink underline underline-offset-4"
          >
            All categories
          </Link>
        </div>

        <div className="grid gap-3 lg:grid-cols-3 lg:grid-rows-2">
          {hero ? (
            <PlotCard
              cat={hero}
              toneIndex={0}
              large
              className="min-h-[280px] lg:col-span-2 lg:row-span-2 lg:min-h-[420px]"
            />
          ) : null}
          {side.map((cat, i) => (
            <PlotCard
              key={cat.slug || cat.name}
              cat={cat}
              toneIndex={i + 1}
              className="min-h-[200px]"
            />
          ))}
        </div>

        {row.length > 0 ? (
          <div className="mt-3 grid gap-3 sm:grid-cols-3">
            {row.map((cat, i) => (
              <PlotCard
                key={cat.slug || cat.name}
                cat={cat}
                toneIndex={i + 3}
                className="min-h-[180px]"
              />
            ))}
          </div>
        ) : null}
      </div>
    </section>
  );
}

/** Agencies  -  typographic numbered runway */
export function AgenciesColorBand({ rows }: { rows: EntityLeader[] }) {
  return (
    <section className="relative overflow-hidden px-4 py-12 md:px-6 md:py-16">
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            "linear-gradient(120deg, rgba(255, 232, 214, 0.88) 0%, rgba(250,250,250,0.75) 42%, rgba(255, 214, 170, 0.82) 100%)",
        }}
      />
      <div className="relative mx-auto max-w-[1440px]">
        <div className="flex flex-wrap items-end justify-between gap-6">
          <div>
            <p className="text-[12px] font-semibold uppercase tracking-[0.16em] text-mute">
              This week
            </p>
            <h2 className="mt-2 font-display text-[34px] font-bold leading-[1.05] tracking-[-0.04em] text-ink md:text-[52px]">
              Studios rising from the plots.
            </h2>
            <p className="mt-3 max-w-md text-[16px] leading-relaxed text-mute">
              Agencies pulling the most votes for work the client never let live.
            </p>
          </div>
          <Link
            href="/leaderboards/agencies"
            className="rounded-full bg-accent px-5 py-2.5 text-[14px] font-bold text-white hover:brightness-95"
          >
            Full leaderboard
          </Link>
        </div>

        <ol className="mt-12">
          {rows.slice(0, 9).map((row, i) => (
            <li
              key={row.key}
              className="group relative flex items-center gap-4 border-b border-ink/10 py-5 last:border-b-0 md:gap-8 md:py-6"
            >
              <span className="font-display text-[48px] font-bold leading-none tracking-[-0.06em] text-ink/12 md:w-28 md:text-[64px]">
                {String(i + 1).padStart(2, "0")}
              </span>
              <span className="relative flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-full bg-white text-[14px] font-bold text-ink ring-1 ring-black/5 md:h-14 md:w-14">
                {row.avatarUrl || row.avatarFilename ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={row.avatarUrl || row.avatarFilename || ""}
                    alt={`${row.name} avatar`}
                    className="h-full w-full object-cover"
                  />
                ) : (
                  row.name.slice(0, 1).toUpperCase()
                )}
              </span>
              <div className="min-w-0 flex-1">
                <Link
                  href={row.href}
                  className="block truncate font-display text-[20px] font-bold tracking-tight text-ink hover:underline md:text-[28px]"
                >
                  {row.name}
                </Link>
                <p className="truncate text-[12px] text-mute md:text-[13px]">
                  {row.entries} {row.entries === 1 ? "grave" : "graves"}
                </p>
              </div>
              <div className="flex shrink-0 items-center gap-2">
                <span className="hidden h-2 w-2 rounded-full bg-accent sm:inline-block" />
                <span className="hidden h-2 w-2 rounded-full bg-accent/70 sm:inline-block" />
                <span className="hidden h-2 w-2 rounded-full bg-accent/40 sm:inline-block" />
                <div className="board-votes min-w-[3rem]">
                  <p className="text-[18px] font-bold tabular-nums text-ink md:text-[24px]">
                    {row.votes}
                  </p>
                  <p className="text-[10px] font-semibold uppercase tracking-wider text-mute">
                    votes
                  </p>
                </div>
              </div>
            </li>
          ))}
          {rows.length === 0 ? (
            <li className="py-12 text-[14px] text-mute">No agency votes yet.</li>
          ) : null}
        </ol>
      </div>
    </section>
  );
}

/** LIVE  -  Halloween orange field, white type, eclipse drama */
export function LiveColorBand() {
  return (
    <section className="px-4 py-6 md:px-6 md:py-8">
      <div className="live-eclipse relative mx-auto overflow-hidden rounded-[32px] px-7 py-16 md:px-14 md:py-24">
        <div className="live-eclipse-glow" aria-hidden="true" />
        <div className="live-eclipse-shadow" aria-hidden="true" />
        <div className="relative grid gap-12 md:grid-cols-[1.2fr_0.8fr] md:items-end">
          <div className="max-w-2xl text-white">
            <p className="text-[12px] font-semibold uppercase tracking-[0.2em] text-white/70">
              Should have gone LIVE
            </p>
            <h2 className="mt-4 font-display text-[48px] font-bold leading-[0.95] tracking-[-0.045em] md:text-[72px]">
              Declared LIVE.
              <br />
              <span className="text-white/90">Not next year.</span>
            </h2>
            <p className="mt-6 max-w-md text-[17px] leading-relaxed text-white/75 md:text-[18px]">
              Public votes and industry review. Recognition for work the brief killed, awarded anytime.
            </p>
          </div>
          <div className="flex flex-col gap-3 sm:flex-row md:flex-col md:items-stretch lg:flex-row">
            <Link
              href="/?status=winner"
              className="rounded-full bg-white px-6 py-3 text-center text-[14px] font-bold text-ink hover:bg-white/90"
            >
              See LIVE work
            </Link>
            <Link
              href="/register"
              className="rounded-full border border-white/40 bg-transparent px-6 py-3 text-center text-[14px] font-bold text-white hover:bg-white/10"
            >
              Submit yours
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}

/** How it works  -  connected plot path */
export function HowItWorksBand() {
  const steps = [
    {
      n: "01",
      title: "Bury it",
      body: "Upload rejected, shelved, or never-produced work, and the reason it never went live.",
    },
    {
      n: "02",
      title: "Haunt the vote",
      body: "The public backs what should have shipped. Each plot stays its own fight.",
    },
    {
      n: "03",
      title: "Go LIVE",
      body: "Judges shortlist and crown. Awards without waiting for an annual ceremony.",
    },
  ];

  return (
    <section className="px-4 py-12 md:px-6 md:py-16">
      <div className="mx-auto max-w-[1440px]">
        <p className="text-[12px] font-semibold uppercase tracking-[0.16em] text-mute">How it works</p>
        <h2 className="mt-2 max-w-2xl font-display text-[34px] font-bold leading-[1.05] tracking-[-0.04em] text-ink md:text-[52px]">
          Three steps out of the ground.
        </h2>

        <div className="relative mt-14">
          {/* Connecting plot line */}
          <div
            className="pointer-events-none absolute left-6 top-8 hidden h-[2px] w-[calc(100%-3rem)] md:block"
            style={{
              background:
                "repeating-linear-gradient(90deg, #0a0a0a 0 10px, transparent 10px 18px)",
              opacity: 0.18,
            }}
            aria-hidden="true"
          />

          <ol className="grid gap-10 md:grid-cols-3 md:gap-8">
            {steps.map((step) => (
              <li key={step.n} className="relative pl-0 md:pt-2">
                <div className="mb-5 flex items-center gap-3">
                  <span className="flex h-12 w-12 items-center justify-center rounded-full bg-ink font-display text-[15px] font-bold text-accent">
                    {step.n}
                  </span>
                  <span className="h-px flex-1 bg-ink/15 md:hidden" />
                </div>
                <h3 className="font-display text-[28px] font-bold tracking-tight text-ink">
                  {step.title}
                </h3>
                <p className="mt-3 max-w-sm text-[15px] leading-relaxed text-mute">{step.body}</p>
              </li>
            ))}
          </ol>
        </div>
      </div>
    </section>
  );
}
