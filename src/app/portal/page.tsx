import Link from "next/link";
import { redirect } from "next/navigation";
import { desc, eq } from "drizzle-orm";
import { AwardsHistory, toAwardEntries } from "@/components/AwardsHistory";
import { ResendVerificationButton } from "@/components/ResendVerificationButton";
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

export default async function PortalPage() {
  const session = await requireSession(["creator", "admin"]);
  if (!session) redirect("/login");
  if (session.role === "admin") redirect("/admin");

  const mine = await db.query.submissions.findMany({
    where: eq(submissions.userId, session.id),
    orderBy: [desc(submissions.updatedAt)],
    with: { assets: true },
  });

  const awards = toAwardEntries(mine.filter((s) => s.published));

  return (
    <YardPage>
      <YardHeader
        eyebrow="Creator portal"
        title={`Hello, ${session.name.split(" ")[0]}`}
        description="Submit unseen work, track status, and revisit awards you've won."
        actions={
          <div className="flex flex-wrap gap-2">
            <Link href={`/creators/${session.id}`} className="btn btn-ghost">
              Public profile
            </Link>
            <Link href="/portal/submit" className="btn btn-primary">
              New submission
            </Link>
          </div>
        }
      />

      <YardContainer>
        {!session.emailVerified ? (
          <YardCard className="mb-6 border-accent/40 bg-accent/5 p-5">
            <p className="font-semibold text-ink">Verify your email to submit work</p>
            <p className="mt-1 text-[14px] text-mute">
              Check your inbox (or the server console in development) for a verification link.
            </p>
            <div className="mt-3">
              <ResendVerificationButton />
            </div>
          </YardCard>
        ) : null}

        <section className="mb-14">
          <h2 className="font-display text-3xl tracking-tight text-ink">Your awards</h2>
          <p className="mt-1 text-[14px] text-mute">
            Historical LIVE and shortlist recognition across showcase years.
          </p>
          <div className="mt-6">
            <AwardsHistory
              awards={awards}
              emptyLabel="No awards yet — keep submitting work that should have gone LIVE."
            />
          </div>
        </section>

        <h2 className="font-display text-3xl tracking-tight text-ink">Your submissions</h2>
        <div className="mt-6 grid gap-4 md:grid-cols-2">
          {mine.map((item) => (
            <Link key={item.id} href={`/portal/submissions/${item.id}`} className="group">
              <YardCard className="overflow-hidden transition hover:-translate-y-0.5">
                <div className="card-media aspect-[16/10] rounded-none">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={`/api/uploads/${item.assets[0]?.filename || "placeholder"}`}
                    alt=""
                    className="h-full w-full object-cover transition duration-500 group-hover:scale-[1.03]"
                  />
                </div>
                <div className="flex items-start justify-between gap-3 p-5">
                  <div className="min-w-0">
                    <h3 className="truncate font-display text-xl tracking-tight text-ink">
                      {item.title}
                    </h3>
                    <p className="mt-1 text-sm text-mute">
                      {item.category} · {item.yearCreated} · {item.assets.length} asset
                      {item.assets.length === 1 ? "" : "s"}
                    </p>
                  </div>
                  <StatusPill status={item.status} />
                </div>
              </YardCard>
            </Link>
          ))}
        </div>

        {mine.length === 0 ? (
          <YardEmpty
            action={
              <Link href="/portal/submit" className="btn btn-primary">
                Submit your first piece
              </Link>
            }
          >
            No submissions yet. Bring something that should have gone LIVE.
          </YardEmpty>
        ) : null}
      </YardContainer>
    </YardPage>
  );
}
