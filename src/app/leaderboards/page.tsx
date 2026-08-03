import Link from "next/link";
import { YardContainer, YardHeader, YardPage } from "@/components/yard/YardPage";
import { getWeeklyLeaderboard } from "@/lib/leaderboards";

export default async function LeaderboardsIndexPage() {
  const [creators, agencies] = await Promise.all([
    getWeeklyLeaderboard("creator", 5),
    getWeeklyLeaderboard("agency", 5),
  ]);

  return (
    <YardPage>
      <YardHeader
        eyebrow="The yard this week"
        title="Who's haunting the boards."
        description="Public votes decide who rises from the plots. Creators and agencies, ranked by what the crowd wants LIVE."
      />

      <YardContainer>
        <div className="grid gap-6 md:grid-cols-2 md:gap-8">
          <Board
            title="Creators"
            href="/leaderboards/creators"
            empty="The plots are quiet. Cast a vote."
            rows={creators.map((r) => ({
              name: r.name,
              meta: `${r.entries} ${r.entries === 1 ? "grave" : "graves"}`,
              votes: r.votes,
              href: r.href,
            }))}
          />
          <Board
            title="Agencies"
            href="/leaderboards/agencies"
            empty="No studio heat yet. Vote a deck out of the dark."
            rows={agencies.map((r) => ({
              name: r.name,
              meta: `${r.entries} ${r.entries === 1 ? "grave" : "graves"}`,
              votes: r.votes,
              href: r.href,
            }))}
          />
        </div>
      </YardContainer>
    </YardPage>
  );
}

function Board({
  title,
  href,
  rows,
  empty,
}: {
  title: string;
  href: string;
  empty: string;
  rows: { name: string; meta: string; votes: number; href: string }[];
}) {
  return (
    <section className="min-w-0 overflow-hidden rounded-[28px] border border-line bg-white/90">
      <div className="flex items-end justify-between gap-3 border-b border-line px-4 py-4 sm:px-6 sm:py-5">
        <h2 className="min-w-0 font-display text-[26px] tracking-tight text-ink sm:text-3xl">
          {title}
        </h2>
        <Link
          href={href}
          className="shrink-0 text-[12px] font-semibold text-accent underline underline-offset-4 sm:text-[13px]"
        >
          See full board
        </Link>
      </div>
      <ol className="min-w-0">
        {rows.map((row, i) => (
          <li key={row.name} className="board-row">
            <span className={`rank-num text-xl sm:text-2xl ${i < 3 ? "text-accent" : "text-ink/30"}`}>
              {String(i + 1).padStart(2, "0")}
            </span>
            <div className="min-w-0">
              <Link
                href={row.href}
                className="block truncate text-[14px] font-semibold text-ink hover:underline sm:text-[15px]"
              >
                {row.name}
              </Link>
              <p className="truncate text-[11px] text-mute sm:text-[12px]">{row.meta}</p>
            </div>
            <div className="board-votes shrink-0">
              <p className="text-[14px] font-semibold tabular-nums text-ink sm:text-[15px]">
                {row.votes}
              </p>
              <p className="text-[10px] uppercase tracking-wider text-mute sm:text-[11px]">votes</p>
            </div>
          </li>
        ))}
        {rows.length === 0 ? (
          <li className="px-4 py-8 text-[13px] text-mute sm:px-6">{empty}</li>
        ) : null}
      </ol>
    </section>
  );
}
