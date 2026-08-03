import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { eq } from "drizzle-orm";
import { StatusPill } from "@/components/StatusPill";
import { SubmissionEditor } from "@/components/SubmissionEditor";
import { YardCard, YardContainer, YardHeader, YardPage } from "@/components/yard/YardPage";
import { db } from "@/db";
import { submissions } from "@/db/schema";
import { requireSession } from "@/lib/auth";
import { getActiveCategoryNames } from "@/lib/categories";

type Params = {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ uploadError?: string }>;
};

export default async function SubmissionDetailPage({ params, searchParams }: Params) {
  const session = await requireSession(["creator", "admin"]);
  if (!session) redirect("/login");

  const { id } = await params;
  const { uploadError } = await searchParams;
  const submission = await db.query.submissions.findFirst({
    where: eq(submissions.id, id),
    with: { assets: true, reviews: { with: { judge: true } } },
  });

  if (!submission) notFound();
  if (submission.userId !== session.id && session.role !== "admin") redirect("/portal");

  const editable = submission.status === "draft" || submission.status === "submitted";
  const activeCategories = await getActiveCategoryNames();
  const categories = activeCategories.includes(submission.category)
    ? activeCategories
    : [submission.category, ...activeCategories];

  return (
    <YardPage>
      <YardHeader
        narrow
        eyebrow="Submission"
        title={submission.title}
        description={`${submission.category} · Created ${submission.yearCreated}`}
        actions={
          <>
            <StatusPill status={submission.status} />
            <Link href="/portal" className="btn btn-ghost">
              Portal
            </Link>
          </>
        }
      />

      <YardContainer narrow>
        {editable ? (
          <YardCard className="p-6 md:p-8">
            <SubmissionEditor
              categories={categories}
              initialUploadError={uploadError || ""}
              submission={{
                id: submission.id,
                title: submission.title,
                category: submission.category,
                submitterType: submission.submitterType,
                teamMembers: submission.teamMembers,
                yearCreated: submission.yearCreated,
                concept: submission.concept,
                whyNeverLive: submission.whyNeverLive,
                status: submission.status,
                assets: submission.assets.map((a) => ({
                  id: a.id,
                  originalName: a.originalName,
                  filename: a.filename,
                })),
              }}
            />
          </YardCard>
        ) : (
          <div className="space-y-5">
            <YardCard className="p-6">
              <h2 className="plot-label">Creative concept</h2>
              <p className="mt-3 leading-relaxed text-ink">{submission.concept}</p>
            </YardCard>
            <YardCard className="p-6">
              <h2 className="plot-label">Why it never went live</h2>
              <p className="mt-3 leading-relaxed text-ink">{submission.whyNeverLive}</p>
            </YardCard>
            <YardCard className="p-6">
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
              </ul>
            </YardCard>
            {submission.reviews.length > 0 ? (
              <YardCard className="p-6">
                <h2 className="plot-label">Judge feedback</h2>
                <div className="mt-4 space-y-3">
                  {submission.reviews.map((review) => (
                    <div key={review.id} className="rounded-2xl bg-soft p-4">
                      <p className="text-sm font-semibold text-ink">
                        Score {review.score}/10
                        {review.shortlisted ? " · Shortlisted" : ""}
                      </p>
                      <p className="mt-2 text-ink">{review.comment || "No comment."}</p>
                    </div>
                  ))}
                </div>
              </YardCard>
            ) : null}
          </div>
        )}
      </YardContainer>
    </YardPage>
  );
}
