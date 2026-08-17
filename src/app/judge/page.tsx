import Link from "next/link";
import { redirect } from "next/navigation";
import { StatusPill } from "@/components/StatusPill";
import {
  YardCard,
  YardContainer,
  YardEmpty,
  YardHeader,
  YardPage,
} from "@/components/yard/YardPage";
import { getAccessToken, requireSession } from "@/lib/auth";
import { nestAwardCycles, nestAwardQueue } from "@/lib/nest/client";
import { safeApi } from "@/lib/nest/mappers";

export default async function JudgePage() {
  const session = await requireSession(["judge", "admin"]);
  if (!session) redirect("/login");

  const token = await getAccessToken();
  const cycles = await safeApi(nestAwardCycles(), []);
  const active =
    cycles.find((c) => c.status === "JUDGING") ||
    cycles.find((c) => c.status === "UPCOMING") ||
    cycles[0];

  const queue =
    active && token
      ? await safeApi(nestAwardQueue(active.id, token), [])
      : [];

  return (
    <YardPage>
      <YardHeader
        eyebrow="Judge portal"
        title="Review submissions"
        description={
          active
            ? `Queue for ${active.name} (${active.year}). Score entries via Nest award cycles.`
            : "No award cycles are available yet."
        }
      />

      <YardContainer>
        <div className="space-y-3">
          {queue.map((item) => (
            <Link key={item.submissionId} href={`/judge/${item.submissionId}?slug=${encodeURIComponent(item.slug)}`}>
              <YardCard className="mb-3 flex flex-wrap items-center gap-4 p-4 transition hover:border-accent/40 md:p-5">
                <div className="h-16 w-16 shrink-0 overflow-hidden rounded-2xl bg-canvas">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={item.coverUrl || "/brand/logo-on-dark.png"}
                    alt=""
                    className="h-full w-full object-cover"
                  />
                </div>
                <div className="min-w-0 flex-1">
                  <h2 className="font-display text-xl tracking-tight text-ink">{item.title}</h2>
                  <p className="mt-1 text-sm text-mute">
                    {item.categorySlug} · {item.creatorName}
                    {item.scoredByMe
                      ? ` · Your score ${item.myTotal ?? "—"}`
                      : " · Awaiting your score"}
                  </p>
                </div>
                <StatusPill status={item.scoredByMe ? "under_review" : "submitted"} />
              </YardCard>
            </Link>
          ))}
          {queue.length === 0 ? (
            <YardEmpty>No submissions in the review queue yet.</YardEmpty>
          ) : null}
        </div>
      </YardContainer>
    </YardPage>
  );
}
