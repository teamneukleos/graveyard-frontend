import Link from "next/link";
import { YardContainer, YardHeader, YardPage } from "@/components/yard/YardPage";
import { getWeeklyLeaderboard } from "@/lib/leaderboards";

export default async function AgenciesLeaderboardPage() {
  const rows = await getWeeklyLeaderboard("agency", 50);

  return (
    <YardPage>
      <YardHeader
        narrow
        eyebrow="Weekly votes"
        title="Agency leaderboard"
        description="Weekly votes for agency submissions."
        actions={
          <Link href="/leaderboards" className="btn btn-ghost">
            All boards
          </Link>
        }
      />
      <YardContainer narrow>
        <ol className="overflow-hidden rounded-[28px] border border-line bg-white/90">
          {rows.map((row, i) => (
            <li key={row.key} className="board-row px-5">
              <span className={`rank-num text-2xl ${i < 3 ? "text-accent" : "text-ink/30"}`}>
                {String(i + 1).padStart(2, "0")}
              </span>
              <div className="min-w-0">
                <Link href={row.href} className="truncate font-semibold text-ink hover:underline">
                  {row.name}
                </Link>
                <p className="text-[12px] text-mute">
                  {row.entries} published {row.entries === 1 ? "entry" : "entries"}
                </p>
              </div>
              <div className="text-right">
                <p className="font-semibold tabular-nums text-ink">{row.votes}</p>
                <p className="text-[11px] uppercase tracking-wider text-mute">votes</p>
              </div>
            </li>
          ))}
          {rows.length === 0 ? (
            <li className="py-10 text-center text-mute">No agency votes yet this week.</li>
          ) : null}
        </ol>
      </YardContainer>
    </YardPage>
  );
}
