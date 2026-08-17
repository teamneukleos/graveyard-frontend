import Link from "next/link";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { AwardsHistory, toAwardEntries } from "@/components/AwardsHistory";
import { FeedGrid, type FeedItem } from "@/components/FeedCard";
import { JsonLd } from "@/components/JsonLd";
import { YardContainer, YardEmpty, YardHeader, YardPage, YardStat } from "@/components/yard/YardPage";
import { coverUrlOf, mapNestStatus, submissionToFeedItem } from "@/lib/nest/mappers";
import { findSubmissionsByCreator } from "@/lib/nest/queries";
import {
  breadcrumbJsonLd,
  buildMetadata,
  metaDescription,
  profileJsonLd,
} from "@/lib/seo";

type Params = { params: Promise<{ id: string }> };

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const { id } = await params;
  const published = await findSubmissionsByCreator(id);
  const creator = published[0]?.creator;
  if (!creator) {
    return buildMetadata({
      title: "Creator not found",
      description: "This creator profile is unavailable.",
      path: `/creators/${id}`,
      noIndex: true,
    });
  }

  return buildMetadata({
    title: creator.name,
    description: metaDescription(
      `${creator.name} on Graveyard. Rejected and shelved creative work that should have gone LIVE.`,
    ),
    path: `/creators/${creator.id}`,
    image: creator.avatarUrl || undefined,
    type: "profile",
    keywords: [creator.name, creator.agencyName || "", "Graveyard creator", "creative awards"].filter(
      Boolean,
    ),
  });
}

export default async function CreatorProfilePage({ params }: Params) {
  const { id } = await params;
  const published = await findSubmissionsByCreator(id);
  const creator = published[0]?.creator;
  if (!creator) notFound();

  const voteTotal = published.reduce((sum, s) => sum + s.likeCount, 0);
  const awards = toAwardEntries(
    published.map((s) => ({
      id: s.slug,
      title: s.title,
      category: s.category.name,
      status: mapNestStatus(s.status),
      showcaseYear: s.publishedAt ? new Date(s.publishedAt).getFullYear() : null,
      yearCreated: s.yearCreated,
      coverUrl: coverUrlOf(s),
    })),
  );
  const liveCount = awards.filter((a) => a.status === "winner").length;

  const items: FeedItem[] = published.map((piece) => submissionToFeedItem(piece));

  return (
    <YardPage>
      <JsonLd
        data={[
          profileJsonLd({
            name: creator.name,
            path: `/creators/${creator.id}`,
            image: creator.avatarUrl,
            type: "Person",
          }),
          breadcrumbJsonLd([
            { name: "Home", path: "/" },
            { name: creator.name, path: `/creators/${creator.id}` },
          ]),
        ]}
      />
      <YardHeader
        tone="night"
        eyebrow="Creator"
        title={creator.name}
        description="Work that should have gone LIVE."
        actions={
          creator.agencyName ? (
            <Link
              href={`/agencies/${encodeURIComponent(creator.agencyName)}`}
              className="btn btn-primary"
            >
              {creator.agencyName}
            </Link>
          ) : undefined
        }
      />

      <YardContainer>
        <div className="mb-10 flex flex-wrap items-center gap-6">
          <div className="h-24 w-24 overflow-hidden rounded-full bg-ink">
            {creator.avatarUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={creator.avatarUrl}
                alt={`${creator.name} avatar`}
                className="h-full w-full object-cover"
              />
            ) : (
              <span className="flex h-full w-full items-center justify-center text-2xl font-bold text-white">
                {creator.name.slice(0, 1).toUpperCase()}
              </span>
            )}
          </div>
          <div className="grid flex-1 gap-3 sm:grid-cols-3">
            <YardStat label="LIVE awards" value={liveCount} accent />
            <YardStat label="Published" value={published.length} />
            <YardStat label="Votes" value={voteTotal} />
          </div>
        </div>

        <h2 className="font-display text-3xl tracking-tight text-ink">Award history</h2>
        <p className="mt-1 text-[14px] text-mute">
          LIVE winners and shortlists, by showcase year.
        </p>
        <div className="mt-6">
          <AwardsHistory awards={awards} emptyLabel="No LIVE or shortlist awards yet." />
        </div>

        <h2 className="mt-14 font-display text-3xl tracking-tight text-ink">Published work</h2>
        <div className="mt-6">
          {items.length > 0 ? <FeedGrid items={items} /> : <YardEmpty>No published work yet.</YardEmpty>}
        </div>
      </YardContainer>
    </YardPage>
  );
}
