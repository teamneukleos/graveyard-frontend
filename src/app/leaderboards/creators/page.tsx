import Link from "next/link";
import type { Metadata } from "next";
import { JsonLd } from "@/components/JsonLd";
import { YardContainer, YardHeader, YardPage } from "@/components/yard/YardPage";
import { getWeeklyLeaderboard } from "@/lib/leaderboards";
import { breadcrumbJsonLd, buildMetadata, metaDescription } from "@/lib/seo";

export const metadata: Metadata = buildMetadata({
  title: "Creator leaderboard",
  description: metaDescription(
    "Weekly creator leaderboard on Graveyard. Ranked by public votes on rejected and shelved work.",
  ),
  path: "/leaderboards/creators",
});

export default async function CreatorsLeaderboardPage() {
  const rows = await getWeeklyLeaderboard("creator", 50);

  return (
    <YardPage>
      <JsonLd
        data={breadcrumbJsonLd([
          { name: "Home", path: "/" },
          { name: "Leaderboards", path: "/leaderboards" },
          { name: "Creators", path: "/leaderboards/creators" },
        ])}
      />
      <YardHeader
        narrow
        eyebrow="Weekly graves"
        title="Creator board"
        description="Ranked by public votes this week. No login needed to cast yours."
        actions={
          <Link href="/leaderboards" className="btn btn-ghost">
            All boards
          </Link>
        }
      />
      <YardContainer narrow>
        <ol className="min-w-0 overflow-hidden rounded-[28px] border border-line bg-white/90">
          {rows.map((row, i) => (
            <li
              key={row.key}
              className="board-row !grid-cols-[2.5rem_2.25rem_minmax(0,1fr)_auto] sm:!grid-cols-[3.25rem_2.5rem_minmax(0,1fr)_auto]"
            >
              <span className={`rank-num text-xl sm:text-2xl ${i < 3 ? "text-accent" : "text-ink/30"}`}>
                {String(i + 1).padStart(2, "0")}
              </span>
              <span className="relative h-9 w-9 shrink-0 overflow-hidden rounded-full bg-ink sm:h-10 sm:w-10">
                {row.avatarUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={row.avatarUrl}
                    alt={`${row.name} avatar`}
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <span className="flex h-full w-full items-center justify-center text-[12px] font-bold text-paper">
                    {row.name.slice(0, 1).toUpperCase()}
                  </span>
                )}
              </span>
              <div className="min-w-0">
                <Link
                  href={row.href}
                  className="block truncate text-[14px] font-semibold text-ink hover:underline sm:text-[15px]"
                >
                  {row.name}
                </Link>
                <p className="truncate text-[11px] text-mute sm:text-[12px]">
                  {row.entries} published {row.entries === 1 ? "grave" : "graves"}
                </p>
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
            <li className="px-4 py-10 text-center text-[13px] text-mute sm:px-6">
              No votes yet this week.
            </li>
          ) : null}
        </ol>
      </YardContainer>
    </YardPage>
  );
}
