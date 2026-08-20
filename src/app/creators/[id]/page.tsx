import Link from "next/link";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { AwardsHistory, toAwardEntries } from "@/components/AwardsHistory";
import { FeedGrid, type FeedItem } from "@/components/FeedCard";
import { FollowButton } from "@/components/FollowButton";
import { JsonLd } from "@/components/JsonLd";
import { ShareLinkButton } from "@/components/ShareLinkButton";
import { YardContainer, YardEmpty, YardHeader, YardPage, YardStat } from "@/components/yard/YardPage";
import { getSession } from "@/lib/auth";
import { nestPublicProfile } from "@/lib/nest/client";
import { coverUrlOf, mapNestStatus, safeApi, submissionToFeedItem } from "@/lib/nest/mappers";
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
  const profile = await safeApi(nestPublicProfile(id), null);
  if (!profile || profile.role !== "CREATOR") {
    return buildMetadata({
      title: "Creator not found",
      description: "This creator profile is unavailable.",
      path: `/creators/${id}`,
      noIndex: true,
    });
  }

  return buildMetadata({
    title: profile.name,
    description: metaDescription(
      `${profile.name} on Graveyard. Rejected and shelved creative work that should have gone LIVE.`,
    ),
    path: `/creators/${profile.id}`,
    image: profile.avatarUrl || undefined,
    type: "profile",
    keywords: [profile.name, profile.agencyName || "", "Graveyard creator", "creative awards"].filter(
      Boolean,
    ),
  });
}

export default async function CreatorProfilePage({ params }: Params) {
  const { id } = await params;
  const [profile, published, session] = await Promise.all([
    safeApi(nestPublicProfile(id), null),
    findSubmissionsByCreator(id),
    getSession(),
  ]);

  if (!profile || profile.role !== "CREATOR") notFound();

  const memberOfAgency = published[0]?.creator.memberOfAgency ?? null;
  const voteTotal = published.reduce((sum, s) => sum + (s.voteScore ?? s.likeCount), 0);
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
  const isSelf = session?.id === profile.id;

  return (
    <YardPage>
      <JsonLd
        data={[
          profileJsonLd({
            name: profile.name,
            path: `/creators/${profile.id}`,
            image: profile.avatarUrl,
            type: "Person",
          }),
          breadcrumbJsonLd([
            { name: "Home", path: "/" },
            { name: profile.name, path: `/creators/${profile.id}` },
          ]),
        ]}
      />
      <YardHeader
        tone="night"
        eyebrow="Creator"
        title={profile.name}
        description={
          memberOfAgency
            ? `Member of ${memberOfAgency.agencyName || memberOfAgency.name}. Work that should have gone LIVE.`
            : profile.bio || "Work that should have gone LIVE."
        }
        actions={
          <div className="flex flex-wrap gap-2">
            <ShareLinkButton
              path={`/creators/${profile.id}`}
              label="Share profile"
              className="btn border border-white/45 bg-white/10 text-white hover:bg-white/18"
            />
            {!isSelf ? (
              <FollowButton
                userId={profile.id}
                initialFollowing={profile.viewerFollowing}
                initialFollowerCount={profile.followerCount}
              />
            ) : null}
            {memberOfAgency ? (
              <Link href={`/agencies/${memberOfAgency.id}`} className="btn btn-outline">
                Member of {memberOfAgency.agencyName || memberOfAgency.name}
              </Link>
            ) : null}
          </div>
        }
      />

      <YardContainer>
        <div className="mb-10 flex flex-wrap items-center gap-6">
          <div className="h-24 w-24 overflow-hidden rounded-full bg-ink">
            {profile.avatarUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={profile.avatarUrl}
                alt={`${profile.name} avatar`}
                className="h-full w-full object-cover"
              />
            ) : (
              <span className="flex h-full w-full items-center justify-center text-2xl font-bold text-white">
                {profile.name.slice(0, 1).toUpperCase()}
              </span>
            )}
          </div>
          <div className="grid flex-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <YardStat label="LIVE awards" value={liveCount} accent />
            <YardStat label="Published" value={published.length} />
            <YardStat label="Votes" value={voteTotal} />
            <YardStat label="Followers" value={profile.followerCount} />
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
