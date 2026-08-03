import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { eq } from "drizzle-orm";
import { JudgeReviewForm } from "@/components/JudgeReviewForm";
import { StatusPill } from "@/components/StatusPill";
import { YardCard, YardContainer, YardHeader, YardPage } from "@/components/yard/YardPage";
import { db } from "@/db";
import { submissions } from "@/db/schema";
import { requireSession } from "@/lib/auth";

type Params = { params: Promise<{ id: string }> };

export default async function JudgeDetailPage({ params }: Params) {
  const session = await requireSession(["judge", "admin"]);
  if (!session) redirect("/login");

  const { id } = await params;
  const submission = await db.query.submissions.findFirst({
    where: eq(submissions.id, id),
    with: {
      user: true,
      assets: true,
      reviews: { with: { judge: true } },
    },
  });

  if (!submission || submission.status === "draft") notFound();

  const myReview = submission.reviews.find((r) => r.judgeId === session.id);
  const cover = submission.assets[0];

  return (
    <YardPage>
      <YardHeader
        narrow
        eyebrow="Review"
        title={submission.title}
        description={`${submission.category} · ${submission.user.agencyName || submission.user.name} · ${submission.yearCreated}`}
        actions={
          <>
            <StatusPill status={submission.status} />
            <Link href="/judge" className="btn btn-ghost">
              Queue
            </Link>
          </>
        }
      />

      <YardContainer narrow>
        {cover ? (
          <div className="card-media mb-8 aspect-[16/10] rounded-[28px]">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={`/api/uploads/${cover.filename}`}
              alt=""
              className="h-full w-full object-cover"
            />
          </div>
        ) : null}

        <div className="grid gap-5 md:grid-cols-2">
          <YardCard className="p-6">
            <h2 className="plot-label">Creative concept</h2>
            <p className="mt-3 leading-relaxed text-ink">{submission.concept}</p>
          </YardCard>
          <YardCard className="p-6">
            <h2 className="plot-label">Why it never went live</h2>
            <p className="mt-3 leading-relaxed text-ink">{submission.whyNeverLive}</p>
          </YardCard>
        </div>

        <YardCard className="mt-5 p-6">
          <h2 className="plot-label">Assets</h2>
          <ul className="mt-3 space-y-2">
            {submission.assets.map((asset) => (
              <li key={asset.id}>
                <a
                  className="font-semibold text-accent underline underline-offset-4"
                  href={`/api/uploads/${asset.filename}`}
                  target="_blank"
                  rel="noreferrer"
                >
                  {asset.originalName}
                </a>
              </li>
            ))}
            {submission.assets.length === 0 ? (
              <li className="text-mute">No assets uploaded.</li>
            ) : null}
          </ul>
          <p className="mt-3 text-sm text-mute">Team: {submission.teamMembers || "None listed"}</p>
        </YardCard>

        <YardCard className="mt-5 p-6 md:p-8">
          <h2 className="font-display text-2xl tracking-tight text-ink">Your review</h2>
          <div className="mt-4">
            <JudgeReviewForm
              submissionId={submission.id}
              initial={{
                score: myReview?.score ?? 7,
                comment: myReview?.comment ?? "",
                shortlisted: myReview?.shortlisted ?? false,
              }}
            />
          </div>
        </YardCard>
      </YardContainer>
    </YardPage>
  );
}
