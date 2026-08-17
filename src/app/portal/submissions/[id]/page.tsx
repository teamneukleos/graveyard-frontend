import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { StatusPill } from "@/components/StatusPill";
import { SubmissionEditor } from "@/components/SubmissionEditor";
import { YardCard, YardContainer, YardHeader, YardPage } from "@/components/yard/YardPage";
import { getAccessToken, requireSession } from "@/lib/auth";
import { getActiveCategoryNames } from "@/lib/categories";
import { NestApiError, nestMySubmission } from "@/lib/nest/client";
import { isDraftEditable, mapNestStatus } from "@/lib/nest/mappers";

type Params = {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ uploadError?: string }>;
};

export default async function SubmissionDetailPage({ params, searchParams }: Params) {
  const session = await requireSession(["creator", "admin"]);
  if (!session) redirect("/login");

  const { id } = await params;
  const { uploadError } = await searchParams;
  const token = await getAccessToken();
  if (!token) redirect("/login");

  let submission;
  try {
    submission = await nestMySubmission(id, token);
  } catch (error) {
    if (error instanceof NestApiError && error.status === 404) notFound();
    notFound();
  }

  const status = mapNestStatus(submission.status);
  const editable = isDraftEditable(submission.status);
  const activeCategories = await getActiveCategoryNames();
  const categories = activeCategories.includes(submission.category.name)
    ? activeCategories
    : [submission.category.name, ...activeCategories];

  return (
    <YardPage>
      <YardHeader
        narrow
        eyebrow="Submission"
        title={submission.title}
        description={`${submission.category.name} · Created ${submission.yearCreated}`}
        actions={
          <>
            <StatusPill status={status} />
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
                category: submission.category.name,
                submitterType: submission.submitterType.toLowerCase(),
                teamMembers: submission.teamMembers.map((m) => m.name).join(", "),
                yearCreated: submission.yearCreated,
                concept: submission.concept,
                whyNeverLived: submission.whyNeverLived,
                status,
                assets: submission.assets.map((a) => ({
                  id: a.id,
                  originalName: a.fileName || "asset",
                  filename: a.fileName || a.url,
                  url: a.url,
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
              <p className="mt-3 leading-relaxed text-ink">{submission.whyNeverLived}</p>
            </YardCard>
            <YardCard className="p-6">
              <h2 className="plot-label">Assets</h2>
              <ul className="mt-3 space-y-2">
                {submission.assets.map((asset) => (
                  <li key={asset.id}>
                    <a
                      className="font-semibold text-accent underline underline-offset-4"
                      href={asset.url}
                      target="_blank"
                      rel="noreferrer"
                    >
                      {asset.fileName || "asset"}
                    </a>
                  </li>
                ))}
              </ul>
            </YardCard>
          </div>
        )}
      </YardContainer>
    </YardPage>
  );
}
