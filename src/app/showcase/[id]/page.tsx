import Link from "next/link";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { and, count, desc, eq, ne } from "drizzle-orm";
import { JsonLd } from "@/components/JsonLd";
import { ShowcaseGallery } from "@/components/ShowcaseGallery";
import { VoteButton } from "@/components/VoteButton";
import { YardCard, YardPage } from "@/components/yard/YardPage";
import { db } from "@/db";
import { submissions, votes } from "@/db/schema";
import {
  breadcrumbJsonLd,
  buildMetadata,
  creativeWorkJsonLd,
  metaDescription,
} from "@/lib/seo";
import { getCurrentVoterVotes } from "@/lib/voter";

type Params = { params: Promise<{ id: string }> };

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const { id } = await params;
  const piece = await db.query.submissions.findFirst({
    where: and(eq(submissions.id, id), eq(submissions.published, true)),
    with: { user: true, assets: true },
  });
  if (!piece) {
    return buildMetadata({
      title: "Grave not found",
      description: "This showcase entry is unavailable.",
      path: `/showcase/${id}`,
      noIndex: true,
    });
  }

  const creator = piece.user.agencyName || piece.user.name;
  const blurb = metaDescription(
    `${piece.title} by ${creator}. ${piece.category}, ${piece.yearCreated}. ${piece.concept}`,
  );

  return buildMetadata({
    title: piece.title,
    description: blurb,
    path: `/showcase/${piece.id}`,
    image: piece.assets[0]?.filename
      ? `/api/uploads/${piece.assets[0].filename}`
      : undefined,
    type: "article",
    keywords: [
      piece.category,
      piece.title,
      creator,
      "Graveyard awards",
      "should have gone live",
      "rejected creative work",
    ],
  });
}

export default async function ShowcaseDetailPage({ params }: Params) {
  const { id } = await params;
  const piece = await db.query.submissions.findFirst({
    where: and(eq(submissions.id, id), eq(submissions.published, true)),
    with: { user: true, assets: true },
  });

  if (!piece) notFound();

  const [{ total }] = await db
    .select({ total: count() })
    .from(votes)
    .where(eq(votes.submissionId, piece.id));

  const votedSet = await getCurrentVoterVotes([piece.id]);
  const voted = votedSet.has(piece.id);

  const related = await db.query.submissions.findMany({
    where: and(
      eq(submissions.published, true),
      eq(submissions.category, piece.category),
      ne(submissions.id, piece.id),
    ),
    orderBy: [desc(submissions.updatedAt)],
    limit: 4,
    with: { user: true, assets: true },
  });

  const creatorName = piece.user.agencyName || piece.user.name;
  const profileHref = piece.user.agencyName
    ? `/agencies/${encodeURIComponent(piece.user.agencySlug || piece.user.agencyName)}`
    : `/creators/${piece.user.id}`;

  const galleryAssets = piece.assets.map((a) => ({
    id: a.id,
    filename: a.filename,
    originalName: a.originalName,
    mimeType: a.mimeType,
  }));

  return (
    <YardPage>
      <JsonLd
        data={[
          creativeWorkJsonLd({
            id: piece.id,
            title: piece.title,
            description: metaDescription(piece.concept, 300),
            category: piece.category,
            yearCreated: piece.yearCreated,
            creatorName,
            image: piece.assets[0]?.filename,
            datePublished: piece.updatedAt,
          }),
          breadcrumbJsonLd([
            { name: "Home", path: "/" },
            { name: "Showcase", path: "/showcase" },
            { name: piece.category, path: `/categories/${encodeURIComponent(piece.category)}` },
            { name: piece.title, path: `/showcase/${piece.id}` },
          ]),
        ]}
      />
      <div className="mx-auto max-w-[1100px] px-4 py-8 md:px-6 md:py-12">
        <Link href="/showcase" className="text-[13px] font-medium text-mute hover:text-ink">
          ← Back to showcase
        </Link>

        <div className="mt-6">
          <ShowcaseGallery assets={galleryAssets} title={piece.title} />
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
            <span className="rounded-full bg-white/90 px-3 py-1 text-[12px] font-semibold text-mute">
              {piece.yearCreated}
            </span>
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
            {creatorName}
          </Link>
          {piece.teamMembers ? ` · ${piece.teamMembers}` : ""} · {piece.submitterType}
        </p>

        <div className="mt-10 rounded-[28px] border border-line bg-white/90 p-5 md:flex md:items-center md:justify-between md:gap-6 md:p-6">
          <div>
            <p className="plot-label">Public vote</p>
            <p className="mt-2 max-w-xl text-[14px] leading-relaxed text-mute">
              No account needed. Leave your name and email once. One vote per device and network.
            </p>
          </div>
          <div className="mt-4 flex shrink-0 items-center gap-4 md:mt-0">
            <div className="text-right">
              <p className="font-display text-3xl font-bold tabular-nums text-ink">{Number(total)}</p>
              <p className="text-[11px] uppercase tracking-wider text-mute">total votes</p>
            </div>
            <VoteButton
              submissionId={piece.id}
              initialVoted={voted}
              initialCount={Number(total)}
            />
          </div>
        </div>

        <div className="mt-12 grid gap-5 md:grid-cols-2">
          <YardCard className="p-6 md:p-8">
            <h2 className="plot-label">Creative concept</h2>
            <p className="mt-4 whitespace-pre-wrap text-[16px] leading-relaxed text-ink">
              {piece.concept}
            </p>
          </YardCard>
          <YardCard className="p-6 md:p-8">
            <h2 className="plot-label">Why it never went live</h2>
            <p className="mt-4 whitespace-pre-wrap text-[16px] leading-relaxed text-ink">
              {piece.whyNeverLive}
            </p>
          </YardCard>
        </div>

        {piece.teamMembers ? (
          <YardCard className="mt-5 p-6 md:p-8">
            <h2 className="plot-label">Credits</h2>
            <p className="mt-4 text-[16px] leading-relaxed text-ink">{piece.teamMembers}</p>
            <p className="mt-3 text-[13px] text-mute">
              Submitted as {piece.submitterType === "agency" ? "an agency" : "an individual"} ·{" "}
              {piece.yearCreated}
              {piece.showcaseYear ? ` · Showcase ${piece.showcaseYear}` : ""}
            </p>
          </YardCard>
        ) : null}

        {galleryAssets.length > 1 ? (
          <div className="mt-12">
            <h2 className="font-display text-2xl font-bold tracking-tight text-ink md:text-3xl">
              Full project gallery
            </h2>
            <p className="mt-2 text-[14px] text-mute">
              {galleryAssets.length} assets attached to this entry.
            </p>
            <div className="mt-6 grid gap-4 sm:grid-cols-2">
              {galleryAssets
                .filter((a) => a.mimeType.startsWith("image/"))
                .map((asset) => (
                  <div key={asset.id} className="card-media aspect-[4/5] overflow-hidden rounded-[24px]">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={`/api/uploads/${asset.filename}`}
                      alt={`${piece.title}: ${asset.originalName}`}
                      className="h-full w-full object-cover"
                    />
                  </div>
                ))}
            </div>
          </div>
        ) : null}

        {related.length > 0 ? (
          <div className="mt-16 border-t border-line pt-12">
            <div className="flex items-end justify-between gap-3">
              <div>
                <p className="plot-label">More from {piece.category}</p>
                <h2 className="mt-2 font-display text-3xl font-bold tracking-tight text-ink">
                  Related graves
                </h2>
              </div>
              <Link
                href={`/categories/${encodeURIComponent(piece.category)}`}
                className="text-[13px] font-semibold text-mute hover:text-ink"
              >
                See all
              </Link>
            </div>
            <div className="mt-8 grid grid-cols-2 gap-4 md:grid-cols-4">
              {related.map((item, i) => (
                <Link key={item.id} href={`/showcase/${item.id}`} className="group block">
                  <div className="card-media aspect-[4/5] overflow-hidden rounded-[20px]">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={`/api/uploads/${item.assets[0]?.filename || "placeholder"}?tone=${i}`}
                      alt={`${item.title} by ${item.user.agencyName || item.user.name}`}
                      className="h-full w-full object-cover transition duration-500 group-hover:scale-[1.03]"
                    />
                  </div>
                  <p className="mt-3 truncate font-display text-[15px] font-bold text-ink group-hover:underline">
                    {item.title}
                  </p>
                  <p className="truncate text-[12px] text-mute">
                    {item.user.agencyName || item.user.name}
                  </p>
                </Link>
              ))}
            </div>
          </div>
        ) : null}
      </div>
    </YardPage>
  );
}
