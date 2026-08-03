import Link from "next/link";
import type { Metadata } from "next";
import { JsonLd } from "@/components/JsonLd";
import { YardContainer, YardHeader, YardPage } from "@/components/yard/YardPage";
import { getWeeklyLeaderboard } from "@/lib/leaderboards";
import { breadcrumbJsonLd, buildMetadata, metaDescription } from "@/lib/seo";

export const metadata: Metadata = buildMetadata({
  title: "Agency leaderboard",
  description: metaDescription(
    "Weekly agency leaderboard on Graveyard. Studios ranked by public votes on work that never shipped.",
  ),
  path: "/leaderboards/agencies",
});

export default async function AgenciesLeaderboardPage() {
  const rows = await getWeeklyLeaderboard("agency", 50);

  return (
    <YardPage>
      <JsonLd
        data={breadcrumbJsonLd([
          { name: "Home", path: "/" },
          { name: "Leaderboards", path: "/leaderboards" },
          { name: "Agencies", path: "/leaderboards/agencies" },
        ])}
      />
      <YardHeader
        narrow
        eyebrow="Weekly graves"
        title="Agency board"
        description="Studios ranked by public votes on work that never shipped."
        actions={
          <Link href="/leaderboards" className="btn btn-ghost">
            All boards
          </Link>
        }
      />
      <YardContainer narrow>
        <ol className="min-w-0 overflow-hidden rounded-[28px] border border-line bg-white/90">
          {rows.map((row, i) => (
            <li key={row.key} className="board-row">
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
              No agency votes yet this week.
            </li>
          ) : null}
        </ol>
      </YardContainer>
    </YardPage>
  );
}
