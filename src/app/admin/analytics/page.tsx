import { redirect } from "next/navigation";
import {
  YardCard,
  YardContainer,
  YardHeader,
  YardPage,
  YardStat,
} from "@/components/yard/YardPage";
import { requireSession } from "@/lib/auth";
import { getAdminAnalytics } from "@/lib/analytics";

export default async function AdminAnalyticsPage() {
  const session = await requireSession(["admin"]);
  if (!session) redirect("/login");

  const data = await getAdminAnalytics();
  const maxVotes = Math.max(1, ...data.votesOverTime.map((d) => d.total));
  const maxCat = Math.max(1, ...data.byCategory.map((c) => c.total));

  return (
    <YardPage>
      <YardHeader
        eyebrow="Admin"
        title="Analytics"
        description="Funnel health, vote momentum, category mix, RSVP fill, and judge coverage."
      />

      <YardContainer>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <YardStat label="Submissions" value={data.funnel.total} />
          <YardStat label="Published" value={data.funnel.published} accent />
          <YardStat label="Votes" value={data.totals.votes} />
          <YardStat label="RSVPs" value={data.totals.rsvps} />
        </div>

        <div className="mt-8 grid gap-5 lg:grid-cols-2">
          <YardCard className="p-6">
            <h2 className="font-display text-2xl tracking-tight text-ink">Status funnel</h2>
            <ul className="mt-5 space-y-3">
              {Object.entries(data.funnel.byStatus).map(([status, total]) => (
                <li key={status} className="flex items-center justify-between text-sm">
                  <span className="capitalize text-mute">{status.replace(/_/g, " ")}</span>
                  <span className="font-semibold tabular-nums text-ink">{total}</span>
                </li>
              ))}
            </ul>
            <p className="mt-5 text-[13px] text-mute">
              Judge coverage: {data.judgeCoverage.covered}/{data.judgeCoverage.reviewable} (
              {data.judgeCoverage.percent}%)
            </p>
          </YardCard>

          <YardCard className="p-6">
            <h2 className="font-display text-2xl tracking-tight text-ink">Votes over time</h2>
            <div className="mt-6 flex h-40 items-end gap-1">
              {data.votesOverTime.length === 0 ? (
                <p className="text-sm text-mute">No votes yet.</p>
              ) : (
                data.votesOverTime.slice(-28).map((d) => (
                  <div key={d.day} className="group relative flex-1">
                    <div
                      className="w-full rounded-t bg-accent"
                      style={{ height: `${Math.max(8, (d.total / maxVotes) * 100)}%` }}
                      title={`${d.day}: ${d.total}`}
                    />
                  </div>
                ))
              )}
            </div>
          </YardCard>

          <YardCard className="p-6">
            <h2 className="font-display text-2xl tracking-tight text-ink">Top categories</h2>
            <ul className="mt-5 space-y-3">
              {data.byCategory.slice(0, 8).map((c) => (
                <li key={c.category}>
                  <div className="mb-1 flex justify-between text-sm">
                    <span className="text-ink">{c.category}</span>
                    <span className="tabular-nums text-mute">{c.total}</span>
                  </div>
                  <div className="h-2 overflow-hidden rounded-full bg-canvas">
                    <div
                      className="h-full rounded-full bg-accent"
                      style={{ width: `${(c.total / maxCat) * 100}%` }}
                    />
                  </div>
                </li>
              ))}
            </ul>
          </YardCard>

          <YardCard className="p-6">
            <h2 className="font-display text-2xl tracking-tight text-ink">Event fill</h2>
            <ul className="mt-5 space-y-4">
              {data.eventFill.map((e) => (
                <li key={e.id}>
                  <div className="mb-1 flex justify-between gap-3 text-sm">
                    <span className="truncate text-ink">{e.title}</span>
                    <span className="shrink-0 tabular-nums text-mute">
                      {e.rsvps}/{e.capacity}
                    </span>
                  </div>
                  <div className="h-2 overflow-hidden rounded-full bg-canvas">
                    <div
                      className="h-full rounded-full bg-ink"
                      style={{ width: `${Math.min(100, e.fill)}%` }}
                    />
                  </div>
                </li>
              ))}
              {data.eventFill.length === 0 ? (
                <li className="text-sm text-mute">No events yet.</li>
              ) : null}
            </ul>
          </YardCard>
        </div>
      </YardContainer>
    </YardPage>
  );
}
