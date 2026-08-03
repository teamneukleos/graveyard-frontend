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
        eyebrow="Rankings"
        title="Who's rising this week."
        description="Creators and agencies ranked by public votes — fuel for the LIVE award, anytime."
      />

      <YardContainer>
        <div className="grid gap-8 md:grid-cols-2 md:gap-10">
          <Board
            title="Creators"
            href="/leaderboards/creators"
            rows={creators.map((r) => ({
              name: r.name,
              meta: `${r.entries} entries`,
              votes: r.votes,
              href: r.href,
            }))}
          />
          <Board
            title="Agencies"
            href="/leaderboards/agencies"
            rows={agencies.map((r) => ({
              name: r.name,
              meta: `${r.entries} entries`,
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
}: {
  title: string;
  href: string;
  rows: { name: string; meta: string; votes: number; href: string }[];
}) {
  return (
    <section className="overflow-hidden rounded-[28px] border border-line bg-white/90">
      <div className="flex items-end justify-between border-b border-line px-6 py-5">
        <h2 className="font-display text-3xl tracking-tight text-ink">{title}</h2>
        <Link href={href} className="text-[13px] font-semibold text-accent underline underline-offset-4">
          View all
        </Link>
      </div>
      <ol>
        {rows.map((row, i) => (
          <li key={row.name} className="board-row px-6">
            <span className={`rank-num text-2xl ${i < 3 ? "text-accent" : "text-ink/30"}`}>
              {String(i + 1).padStart(2, "0")}
            </span>
            <div className="min-w-0">
              <Link href={row.href} className="truncate font-semibold text-ink hover:underline">
                {row.name}
              </Link>
              <p className="text-[12px] text-mute">{row.meta}</p>
            </div>
            <div className="text-right">
              <p className="font-semibold tabular-nums text-ink">{row.votes}</p>
              <p className="text-[11px] uppercase tracking-wider text-mute">votes</p>
            </div>
          </li>
        ))}
        {rows.length === 0 ? (
          <li className="px-6 py-8 text-[13px] text-mute">No votes yet this week.</li>
        ) : null}
      </ol>
    </section>
  );
}
