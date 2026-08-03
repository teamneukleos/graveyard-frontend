import Link from "next/link";
import { notFound } from "next/navigation";
import { and, count, eq } from "drizzle-orm";
import { VoteButton } from "@/components/VoteButton";
import { YardCard, YardPage } from "@/components/yard/YardPage";
import { db } from "@/db";
import { submissions, votes } from "@/db/schema";
import { getSession } from "@/lib/auth";

type Params = { params: Promise<{ id: string }> };

export default async function ShowcaseDetailPage({ params }: Params) {
  const { id } = await params;
  const session = await getSession();
  const piece = await db.query.submissions.findFirst({
    where: and(eq(submissions.id, id), eq(submissions.published, true)),
    with: { user: true, assets: true },
  });

  if (!piece) notFound();

  const cover = piece.assets[0];
  const [{ total }] = await db
    .select({ total: count() })
    .from(votes)
    .where(eq(votes.submissionId, piece.id));

  const voted = session
    ? Boolean(
        await db.query.votes.findFirst({
          where: and(eq(votes.submissionId, piece.id), eq(votes.userId, session.id)),
        }),
      )
    : false;

  const profileHref = piece.user.agencyName
    ? `/agencies/${encodeURIComponent(piece.user.agencySlug || piece.user.agencyName)}`
    : `/creators/${piece.user.id}`;

  return (
    <YardPage>
      <div className="mx-auto max-w-[1100px] px-4 py-8 md:px-6 md:py-12">
        <Link href="/showcase" className="text-[13px] font-medium text-mute hover:text-ink">
          ← Back to showcase
        </Link>

        <div className="card-media mt-6 aspect-[16/10] rounded-[28px]">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={`/api/uploads/${cover?.filename || "placeholder"}`}
            alt=""
            className="h-full w-full object-cover"
          />
        </div>

        <div className="mt-8 flex flex-wrap items-center justify-between gap-4">
          <div className="flex flex-wrap items-center gap-2">
            <Link
              href={`/categories/${encodeURIComponent(piece.category)}`}
              className="rounded-full bg-canvas px-3 py-1 text-[12px] font-semibold text-ink hover:bg-accent hover:text-white"
            >
              {piece.category}
            </Link>
            {piece.status === "winner" ? (
              <span className="rounded-full bg-accent px-3 py-1 text-[12px] font-bold text-white">
                Should have gone LIVE
              </span>
            ) : null}
            {piece.status === "shortlisted" ? (
              <span className="rounded-full bg-ink px-3 py-1 text-[12px] font-bold text-white">
                Shortlist
              </span>
            ) : null}
          </div>
          <VoteButton
            submissionId={piece.id}
            initialVoted={voted}
            initialCount={Number(total)}
          />
        </div>

        <h1 className="mt-6 font-display text-[clamp(2.6rem,7vw,5rem)] leading-[0.95] tracking-tight text-ink">
          {piece.title}
        </h1>
        <p className="mt-4 text-[15px] text-mute">
          <Link href={profileHref} className="font-semibold text-ink underline underline-offset-4">
            {piece.user.agencyName || piece.user.name}
          </Link>
          {piece.teamMembers ? ` · ${piece.teamMembers}` : ""} · {piece.yearCreated}
        </p>

        <div className="mt-12 grid gap-5 md:grid-cols-2">
          <YardCard className="p-6 md:p-8">
            <h2 className="plot-label">Creative concept</h2>
            <p className="mt-4 text-[16px] leading-relaxed text-ink">{piece.concept}</p>
          </YardCard>
          <YardCard className="p-6 md:p-8">
            <h2 className="plot-label">Why it never went live</h2>
            <p className="mt-4 text-[16px] leading-relaxed text-ink">{piece.whyNeverLive}</p>
          </YardCard>
        </div>
      </div>
    </YardPage>
  );
}
