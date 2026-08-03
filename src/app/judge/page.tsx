import Link from "next/link";
import { redirect } from "next/navigation";
import { desc } from "drizzle-orm";
import { StatusPill } from "@/components/StatusPill";
import {
  YardCard,
  YardContainer,
  YardEmpty,
  YardHeader,
  YardPage,
} from "@/components/yard/YardPage";
import { db } from "@/db";
import { submissions } from "@/db/schema";
import { requireSession } from "@/lib/auth";

export default async function JudgePage() {
  const session = await requireSession(["judge", "admin"]);
  if (!session) redirect("/login");

  const queue = await db.query.submissions.findMany({
    orderBy: [desc(submissions.updatedAt)],
    with: { user: true, reviews: true, assets: true },
  });

  const visible = queue.filter((s) =>
    ["submitted", "under_review", "shortlisted", "winner"].includes(s.status),
  );

  return (
    <YardPage>
      <YardHeader
        eyebrow="Judge portal"
        title="Review submissions"
        description="Score entries, leave comments, and shortlist finalists."
      />

      <YardContainer>
        <div className="space-y-3">
          {visible.map((item) => {
            const mine = item.reviews.find((r) => r.judgeId === session.id);
            return (
              <Link key={item.id} href={`/judge/${item.id}`}>
                <YardCard className="mb-3 flex flex-wrap items-center gap-4 p-4 transition hover:border-accent/40 md:p-5">
                  <div className="h-16 w-16 shrink-0 overflow-hidden rounded-2xl bg-canvas">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={`/api/uploads/${item.assets[0]?.filename || "placeholder"}`}
                      alt=""
                      className="h-full w-full object-cover"
                    />
                  </div>
                  <div className="min-w-0 flex-1">
                    <h2 className="font-display text-xl tracking-tight text-ink">{item.title}</h2>
                    <p className="mt-1 text-sm text-mute">
                      {item.category} · {item.user.agencyName || item.user.name}
                      {mine ? ` · Your score ${mine.score}` : " · Awaiting your score"}
                    </p>
                  </div>
                  <StatusPill status={item.status} />
                </YardCard>
              </Link>
            );
          })}
          {visible.length === 0 ? (
            <YardEmpty>No submissions in the review queue yet.</YardEmpty>
          ) : null}
        </div>
      </YardContainer>
    </YardPage>
  );
}
