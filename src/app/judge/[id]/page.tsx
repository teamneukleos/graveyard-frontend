import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { JudgeReviewForm } from "@/components/JudgeReviewForm";
import { StatusPill } from "@/components/StatusPill";
import { YardCard, YardContainer, YardHeader, YardPage } from "@/components/yard/YardPage";
import { resolveAssetUrl } from "@/lib/asset-url";
import { getAccessToken, requireSession } from "@/lib/auth";
import { NestApiError, nestAwardCycles, nestAwardQueue, nestSubmissionBySlug } from "@/lib/nest/client";
import { coverUrlOf, safeApi } from "@/lib/nest/mappers";

type Params = {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ slug?: string }>;
};

export default async function JudgeDetailPage({ params, searchParams }: Params) {
  const session = await requireSession(["judge", "admin"]);
  if (!session) redirect("/login");

  const { id } = await params;
  const { slug: slugParam } = await searchParams;
  const token = await getAccessToken();

  const cycles = await safeApi(nestAwardCycles(), []);
  const active =
    cycles.find((c) => c.status === "JUDGING") ||
    cycles.find((c) => c.status === "UPCOMING") ||
    cycles[0];

  const queue =
    active && token ? await safeApi(nestAwardQueue(active.id, token), []) : [];
  const queueItem = queue.find((item) => item.submissionId === id);

  const slug = slugParam || queueItem?.slug;
  if (!slug) notFound();

  let submission;
  try {
    submission = await nestSubmissionBySlug(slug);
  } catch (error) {
    if (error instanceof NestApiError && error.status === 404) notFound();
    notFound();
  }

  const cover = coverUrlOf(submission);

  return (
    <YardPage>
      <YardHeader
        narrow
        eyebrow="Review"
        title={submission.title}
        description={`${submission.category.name} · ${submission.creator.agencyName || submission.creator.name} · ${submission.yearCreated}`}
        actions={
          <>
            <StatusPill status={queueItem?.scoredByMe ? "under_review" : "submitted"} />
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
            <img src={cover} alt="" className="h-full w-full object-cover" />
          </div>
        ) : null}

        <div className="grid gap-5 md:grid-cols-2">
          <YardCard className="p-6">
            <h2 className="plot-label">Creative concept</h2>
            <p className="mt-3 leading-relaxed text-ink">{submission.concept}</p>
          </YardCard>
          <YardCard className="p-6">
            <h2 className="plot-label">Why it never went live</h2>
            <p className="mt-3 leading-relaxed text-ink">{submission.whyNeverLived}</p>
          </YardCard>
        </div>

        <YardCard className="mt-5 p-6">
          <h2 className="plot-label">Assets</h2>
          <ul className="mt-3 space-y-2">
            {submission.assets.map((asset) => (
              <li key={asset.id}>
                <a
                  className="font-semibold text-accent underline underline-offset-4"
                  href={resolveAssetUrl(asset.url) || asset.url}
                  target="_blank"
                  rel="noreferrer"
                >
                  {asset.fileName || "asset"}
                </a>
              </li>
            ))}
            {submission.assets.length === 0 ? (
              <li className="text-mute">No assets uploaded.</li>
            ) : null}
          </ul>
          <p className="mt-3 text-sm text-mute">
            Team:{" "}
            {submission.teamMembers.map((m) => m.name).join(", ") || "None listed"}
          </p>
        </YardCard>

        <YardCard className="mt-5 p-6 md:p-8">
          <h2 className="font-display text-2xl tracking-tight text-ink">Your review</h2>
          {queueItem?.scoredByMe && queueItem.myTotal != null ? (
            <p className="mt-2 text-sm text-mute">
              Previously recorded total: {queueItem.myTotal} (sum of rubric scores).
            </p>
          ) : null}
          <JudgeReviewForm
            submissionId={submission.id}
            cycleId={active?.id}
            initial={{
              score:
                queueItem?.myTotal != null
                  ? Math.max(1, Math.min(10, Math.round(queueItem.myTotal / 4)))
                  : 7,
              comment: "",
              shortlisted: false,
            }}
          />
        </YardCard>
      </YardContainer>
    </YardPage>
  );
}
