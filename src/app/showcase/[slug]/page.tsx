import Link from "next/link";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { JsonLd } from "@/components/JsonLd";
import { ShowcaseGallery } from "@/components/ShowcaseGallery";
import { ShareLinkButton } from "@/components/ShareLinkButton";
import { VoteButton } from "@/components/VoteButton";
import { YardCard, YardPage } from "@/components/yard/YardPage";
import { NestApiError, nestListSubmissions, nestSubmissionBySlug } from "@/lib/nest/client";
import { coverUrlOf, mapNestStatus, safeApi } from "@/lib/nest/mappers";
import {
  breadcrumbJsonLd,
  buildMetadata,
  creativeWorkJsonLd,
  metaDescription,
} from "@/lib/seo";

type Params = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const { slug } = await params;
  try {
    const piece = await nestSubmissionBySlug(slug);
    const creator = piece.creator.agencyName || piece.creator.name;
    const blurb = metaDescription(
      `${piece.title} by ${creator}. ${piece.category.name}, ${piece.yearCreated}. ${piece.concept}`,
    );

    return buildMetadata({
      title: piece.title,
      description: blurb,
      path: `/showcase/${piece.slug}`,
      image: coverUrlOf(piece) || undefined,
      type: "article",
      keywords: [
        piece.category.name,
        piece.title,
        creator,
        "Graveyard awards",
        "should have gone live",
        "rejected creative work",
      ],
    });
  } catch {
    return buildMetadata({
      title: "Grave not found",
      description: "This showcase entry is unavailable.",
      path: `/showcase/${slug}`,
      noIndex: true,
    });
  }
}

export default async function ShowcaseDetailPage({ params }: Params) {
  const { slug } = await params;

  const piece = await nestSubmissionBySlug(slug).catch((error: unknown) => {
    if (error instanceof NestApiError && error.status !== 404) {
      console.error("[showcase]", error);
    }
    return null;
  });
  if (!piece) notFound();

  const status = mapNestStatus(piece.status);
  const relatedPage = await safeApi(
    nestListSubmissions({ category: piece.category.slug, page: 1, limit: 8 }),
    { data: [], total: 0, page: 1, limit: 8 },
  );
  const related = relatedPage.data.filter((item) => item.id !== piece.id).slice(0, 4);

  const creatorName = piece.creator.agencyName || piece.creator.name;
  const profileHref = piece.creator.agencyName
    ? `/agencies/${encodeURIComponent(piece.creator.agencyName)}`
    : `/creators/${piece.creator.id}`;

  const galleryAssets = piece.assets.map((a) => ({
    id: a.id,
    url: a.url,
    originalName: a.fileName || "asset",
    mimeType: a.mimeType || "application/octet-stream",
  }));

  const teamCredits = piece.teamMembers.map((m) => m.name).join(", ");
  const cover = coverUrlOf(piece);

  return (
    <YardPage>
      <JsonLd
        data={[
          creativeWorkJsonLd({
            id: piece.slug,
            title: piece.title,
            description: metaDescription(piece.concept, 300),
            category: piece.category.name,
            yearCreated: piece.yearCreated,
            creatorName,
            image: cover,
            datePublished: piece.publishedAt || piece.updatedAt,
          }),
          breadcrumbJsonLd([
            { name: "Home", path: "/" },
            { name: "Showcase", path: "/showcase" },
            {
              name: piece.category.name,
              path: `/categories/${encodeURIComponent(piece.category.name)}`,
            },
            { name: piece.title, path: `/showcase/${piece.slug}` },
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
              href={`/categories/${encodeURIComponent(piece.category.name)}`}
              className="rounded-full bg-canvas px-3 py-1 text-[12px] font-semibold text-ink hover:bg-accent hover:text-white"
            >
              {piece.category.name}
            </Link>
            {status === "winner" ? (
              <span className="rounded-full bg-accent px-3 py-1 text-[12px] font-bold text-white">
                Should have gone LIVE
              </span>
            ) : null}
            {status === "shortlisted" ? (
              <span className="rounded-full bg-ink px-3 py-1 text-[12px] font-bold text-white">
                Shortlist
              </span>
            ) : null}
            <span className="rounded-full bg-white/90 px-3 py-1 text-[12px] font-semibold text-mute">
              {piece.yearCreated}
            </span>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <ShareLinkButton path={`/showcase/${piece.slug}`} label="Share project" />
            <VoteButton
              submissionId={piece.id}
              initialVoted={false}
              initialCount={piece.likeCount}
            />
          </div>
        </div>

        <h1 className="mt-6 font-display text-[clamp(2.6rem,7vw,5rem)] leading-[0.95] tracking-tight text-ink">
          {piece.title}
        </h1>
        <p className="mt-4 text-[15px] text-mute">
          <Link href={profileHref} className="font-semibold text-ink underline underline-offset-4">
            {creatorName}
          </Link>
          {teamCredits ? ` · ${teamCredits}` : ""} · {piece.submitterType.toLowerCase()}
        </p>

        <div className="mt-10 rounded-[28px] border border-line bg-white/90 p-5 md:flex md:items-center md:justify-between md:gap-6 md:p-6">
          <div>
            <p className="plot-label">Public like</p>
            <p className="mt-2 max-w-xl text-[14px] leading-relaxed text-mute">
              Like work that should have gone LIVE. Visitors who aren’t signed in will be asked to
              create an account or sign in first.
            </p>
          </div>
          <div className="mt-4 flex shrink-0 items-center gap-4 md:mt-0">
            <div className="text-right">
              <p className="font-display text-3xl font-bold tabular-nums text-ink">{piece.likeCount}</p>
              <p className="text-[11px] uppercase tracking-wider text-mute">total likes</p>
            </div>
            <VoteButton
              submissionId={piece.id}
              initialVoted={false}
              initialCount={piece.likeCount}
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
              {piece.whyNeverLived}
            </p>
          </YardCard>
        </div>

        {teamCredits ? (
          <YardCard className="mt-5 p-6 md:p-8">
            <h2 className="plot-label">Credits</h2>
            <p className="mt-4 text-[16px] leading-relaxed text-ink">{teamCredits}</p>
            <p className="mt-3 text-[13px] text-mute">
              Submitted as {piece.submitterType === "AGENCY" ? "an agency" : "an individual"} ·{" "}
              {piece.yearCreated}
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
                      src={asset.url}
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
                <p className="plot-label">More from {piece.category.name}</p>
                <h2 className="mt-2 font-display text-3xl font-bold tracking-tight text-ink">
                  Related graves
                </h2>
              </div>
              <Link
                href={`/categories/${encodeURIComponent(piece.category.name)}`}
                className="text-[13px] font-semibold text-mute hover:text-ink"
              >
                See all
              </Link>
            </div>
            <div className="mt-8 grid grid-cols-2 gap-4 md:grid-cols-4">
              {related.map((item, i) => (
                <Link key={item.id} href={`/showcase/${item.slug}`} className="group block">
                  <div className="card-media aspect-[4/5] overflow-hidden rounded-[20px]">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={coverUrlOf(item) || `/brand/logo-on-dark.png?tone=${i}`}
                      alt={`${item.title} by ${item.creator.agencyName || item.creator.name}`}
                      className="h-full w-full object-cover transition duration-500 group-hover:scale-[1.03]"
                    />
                  </div>
                  <p className="mt-3 truncate font-display text-[15px] font-bold text-ink group-hover:underline">
                    {item.title}
                  </p>
                  <p className="truncate text-[12px] text-mute">
                    {item.creator.agencyName || item.creator.name}
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
