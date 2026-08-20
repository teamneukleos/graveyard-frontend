import Link from "next/link";
import { resolveAssetUrl } from "@/lib/asset-url";

export type AwardEntry = {
  id: string;
  title: string;
  category: string;
  status: "winner" | "shortlisted";
  year: number;
  coverUrl?: string | null;
};

export function toAwardEntries(
  pieces: {
    id: string;
    title: string;
    category: string;
    status: string;
    showcaseYear: number | null;
    yearCreated: number;
    coverUrl?: string | null;
    assets?: { filename?: string; url?: string }[];
  }[],
): AwardEntry[] {
  return pieces
    .filter((p) => p.status === "winner" || p.status === "shortlisted")
    .map((p) => ({
      id: p.id,
      title: p.title,
      category: p.category,
      status: p.status as "winner" | "shortlisted",
      year: p.showcaseYear || p.yearCreated,
      coverUrl: resolveAssetUrl(p.coverUrl ?? p.assets?.[0]?.url ?? null),
    }))
    .sort((a, b) => b.year - a.year || a.title.localeCompare(b.title));
}

export function groupAwardsByYear(awards: AwardEntry[]) {
  const map = new Map<number, AwardEntry[]>();
  for (const award of awards) {
    const list = map.get(award.year) || [];
    list.push(award);
    map.set(award.year, list);
  }
  return Array.from(map.entries()).sort((a, b) => b[0] - a[0]);
}

export function AwardsHistory({
  awards,
  emptyLabel = "No awards yet.",
}: {
  awards: AwardEntry[];
  emptyLabel?: string;
}) {
  const years = groupAwardsByYear(awards);
  const liveCount = awards.filter((a) => a.status === "winner").length;
  const shortlistCount = awards.filter((a) => a.status === "shortlisted").length;

  if (awards.length === 0) {
    return (
      <div className="rounded-[24px] border border-dashed border-line bg-white/70 px-6 py-12 text-center text-[14px] text-mute">
        {emptyLabel}
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap gap-2">
        <span className="rounded-full bg-accent px-3 py-1 text-[12px] font-bold text-white">
          {liveCount} LIVE
        </span>
        <span className="rounded-full bg-ink px-3 py-1 text-[12px] font-bold text-white">
          {shortlistCount} Shortlist
        </span>
      </div>

      {years.map(([year, rows]) => (
        <section key={year}>
          <div className="mb-4 flex items-end justify-between border-b border-ink pb-3">
            <h3 className="font-display text-3xl tracking-tight text-ink">{year}</h3>
            <p className="text-[12px] font-semibold uppercase tracking-[0.12em] text-mute">
              {rows.length} award{rows.length === 1 ? "" : "s"}
            </p>
          </div>
          <ul className="space-y-3">
            {rows.map((award) => (
              <li key={award.id}>
                <Link
                  href={`/showcase/${award.id}`}
                  className="group flex items-center gap-4 rounded-[20px] border border-line bg-white/90 p-3 transition hover:border-accent/40 md:p-4"
                >
                  <div className="h-16 w-16 shrink-0 overflow-hidden rounded-2xl bg-canvas md:h-20 md:w-20">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={award.coverUrl || "/brand/logo-on-dark.png"}
                      alt=""
                      className="h-full w-full object-cover transition duration-500 group-hover:scale-[1.04]"
                    />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      {award.status === "winner" ? (
                        <span className="rounded-full bg-accent px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wide text-white">
                          Should have gone LIVE
                        </span>
                      ) : (
                        <span className="rounded-full bg-ink px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wide text-white">
                          Shortlist
                        </span>
                      )}
                      <span className="text-[12px] text-mute">{award.category}</span>
                    </div>
                    <p className="mt-1 truncate font-display text-xl tracking-tight text-ink group-hover:underline md:text-2xl">
                      {award.title}
                    </p>
                  </div>
                  <span className="hidden shrink-0 text-[13px] font-semibold text-mute sm:inline">
                    {year}
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        </section>
      ))}
    </div>
  );
}
