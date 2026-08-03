import Link from "next/link";
import type { CategoryLeader, EntityLeader } from "@/lib/leaderboards";

export function LeaderboardPreview({
  title,
  subtitle,
  href,
  rows,
  dark = false,
}: {
  title: string;
  subtitle: string;
  href: string;
  rows: EntityLeader[];
  dark?: boolean;
}) {
  return (
    <section>
      <div
        className={`flex items-end justify-between gap-3 border-b pb-4 ${
          dark ? "border-white/20" : "border-ink"
        }`}
      >
        <div>
          <h3 className={`text-2xl font-bold tracking-tight ${dark ? "text-white" : "text-ink"}`}>
            {title}
          </h3>
          <p className={`mt-1 text-[13px] ${dark ? "text-white/50" : "text-mute"}`}>{subtitle}</p>
        </div>
        <Link
          href={href}
          className={`text-[13px] font-semibold underline underline-offset-4 ${
            dark ? "text-white" : "text-ink"
          }`}
        >
          View all
        </Link>
      </div>
      <ol>
        {rows.slice(0, 5).map((row, i) => (
          <li
            key={row.key}
            className={`board-row !grid-cols-[3.5rem_2.5rem_1fr_auto] ${dark ? "!border-white/12" : ""}`}
          >
            <span className={`rank-num text-2xl ${dark ? "text-white/30" : "text-ink/30"}`}>
              {String(i + 1).padStart(2, "0")}
            </span>
            <span className="relative h-10 w-10 overflow-hidden rounded-full bg-ink">
              {row.avatarFilename ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={`/api/uploads/${row.avatarFilename}`}
                  alt=""
                  className="h-full w-full object-cover"
                />
              ) : (
                <span
                  className={`flex h-full w-full items-center justify-center text-[12px] font-bold ${
                    dark ? "text-white" : "text-paper"
                  }`}
                >
                  {row.name.slice(0, 1).toUpperCase()}
                </span>
              )}
            </span>
            <div className="min-w-0">
              <Link
                href={row.href}
                className={`truncate text-[15px] font-semibold hover:underline ${
                  dark ? "text-white" : "text-ink"
                }`}
              >
                {row.name}
              </Link>
              <p className={`text-[12px] ${dark ? "text-white/45" : "text-mute"}`}>
                {row.entries} {row.entries === 1 ? "entry" : "entries"}
              </p>
            </div>
            <div className="text-right">
              <p
                className={`text-[15px] font-semibold tabular-nums ${
                  dark ? "text-white" : "text-ink"
                }`}
              >
                {row.votes}
              </p>
              <p
                className={`text-[11px] uppercase tracking-wider ${
                  dark ? "text-white/40" : "text-mute"
                }`}
              >
                votes
              </p>
            </div>
          </li>
        ))}
        {rows.length === 0 ? (
          <li className={`py-8 text-[13px] ${dark ? "text-white/45" : "text-mute"}`}>
            No votes yet this week.
          </li>
        ) : null}
      </ol>
    </section>
  );
}

export function CategoryRail({
  category,
  leaders,
}: {
  category: string;
  leaders: CategoryLeader[];
}) {
  return (
    <section className="min-w-0">
      <div className="mb-5 flex items-end justify-between gap-3">
        <div>
          <h3 className="text-2xl font-bold tracking-tight text-ink">{category}</h3>
          <p className="mt-1 text-[13px] text-mute">Top voted · cast yours</p>
        </div>
        <Link
          href={`/categories/${encodeURIComponent(category)}`}
          className="btn btn-ghost !py-2 !text-[12px]"
        >
          Vote & view
        </Link>
      </div>
      <div className="category-scroll">
        {leaders.map((leader, i) => (
          <Link
            key={leader.submissionId}
            href={`/showcase/${leader.submissionId}`}
            className="category-tile group"
          >
            <div className="card-media aspect-[4/5]">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={`/api/uploads/${leader.coverFilename || "placeholder"}?tone=${i}`}
                alt=""
              />
            </div>
            <div className="mt-2">
              <p className="text-[11px] font-semibold text-mute">#{i + 1}</p>
              <p className="truncate text-[14px] font-semibold text-ink">{leader.title}</p>
              <div className="mt-0.5 flex items-center justify-between gap-2">
                <p className="truncate text-[12px] text-mute">{leader.submitter}</p>
                <span className="shrink-0 text-[12px] font-semibold tabular-nums text-ink">
                  {leader.votes}
                </span>
              </div>
            </div>
          </Link>
        ))}
        {leaders.length === 0 ? (
          <p className="text-[13px] text-mute">No published entries yet.</p>
        ) : null}
      </div>
    </section>
  );
}
