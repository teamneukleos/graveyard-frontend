import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { AwardsHistory, toAwardEntries } from "@/components/AwardsHistory";
import { FeedGrid, type FeedItem } from "@/components/FeedCard";
import { FollowButton } from "@/components/FollowButton";
import { JsonLd } from "@/components/JsonLd";
import { ShareLinkButton } from "@/components/ShareLinkButton";
import { YardContainer, YardEmpty, YardHeader, YardPage, YardStat } from "@/components/yard/YardPage";
import { resolveAssetUrl } from "@/lib/asset-url";
import { getSession } from "@/lib/auth";
import { nestPublicProfile } from "@/lib/nest/client";
import { coverUrlOf, mapNestStatus, safeApi, submissionToFeedItem } from "@/lib/nest/mappers";
import { findSubmissionsByAgency } from "@/lib/nest/queries";
import {
  breadcrumbJsonLd,
  buildMetadata,
  metaDescription,
  profileJsonLd,
} from "@/lib/seo";

type Params = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const { slug } = await params;
  const decoded = decodeURIComponent(slug);
  const profile = await safeApi(nestPublicProfile(decoded), null);
  if (profile?.role === "AGENCY") {
    const agencyName = profile.agencyName || profile.name;
    return buildMetadata({
      title: agencyName,
      description: metaDescription(
        `${agencyName} on Graveyard. Shelved campaigns and unpublished work.`,
      ),
      path: `/agencies/${profile.id}`,
      image: profile.avatarUrl || undefined,
      type: "profile",
      keywords: [agencyName, "creative agency", "Graveyard", "should have gone live"],
    });
  }

  const agencyWork = await findSubmissionsByAgency(slug);
  if (agencyWork.length === 0) {
    return buildMetadata({
      title: "Agency not found",
      description: "This agency profile is unavailable.",
      path: `/agencies/${encodeURIComponent(decoded)}`,
      noIndex: true,
    });
  }

  const agencyName = agencyWork[0].creator.agencyName || decoded;
  return buildMetadata({
    title: agencyName,
    description: metaDescription(
      `${agencyName} on Graveyard. Shelved campaigns and unpublished work.`,
    ),
    path: `/agencies/${encodeURIComponent(agencyName)}`,
    image: agencyWork[0].creator.avatarUrl || undefined,
    type: "profile",
    keywords: [agencyName, "creative agency", "Graveyard", "should have gone live"],
  });
}

export default async function AgencyProfilePage({ params }: Params) {
  const { slug } = await params;
  const decoded = decodeURIComponent(slug);
  const session = await getSession();

  let profile = await safeApi(nestPublicProfile(decoded), null);
  let agencyWork = await findSubmissionsByAgency(slug);

  if ((!profile || profile.role !== "AGENCY") && agencyWork.length > 0) {
    profile = await safeApi(nestPublicProfile(agencyWork[0].creator.id), null);
  }

  if ((!profile || profile.role !== "AGENCY") && agencyWork.length === 0) {
    notFound();
  }

  // Prefer work owned by the agency user id when we have a profile.
  if (profile?.role === "AGENCY") {
    const byId = await findSubmissionsByAgency(profile.id);
    if (byId.length > 0) agencyWork = byId;
  }

  const agencyName =
    profile?.agencyName || profile?.name || agencyWork[0]?.creator.agencyName || decoded;
  const agencyId = profile?.id || agencyWork[0]?.creator.id;
  if (!agencyId) notFound();

  const agencyPath = `/agencies/${agencyId}`;
  const avatar =
    resolveAssetUrl(
      profile?.avatarUrl ||
        agencyWork.find((s) => s.creator.avatarUrl)?.creator.avatarUrl ||
        null,
    );
  const bio = profile?.bio || `${agencyName} on Graveyard.`;

  const awards = toAwardEntries(
    agencyWork.map((s) => ({
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
  const people = Array.from(
    new Map(agencyWork.map((s) => [s.creator.id, s.creator])).values(),
  );
  const items: FeedItem[] = agencyWork.map((piece) => submissionToFeedItem(piece));
  const isSelf = session?.id === agencyId;
  const followerCount = profile?.followerCount ?? 0;

  return (
    <YardPage>
      <JsonLd
        data={[
          profileJsonLd({
            name: agencyName,
            description: bio,
            path: agencyPath,
            image: avatar,
            type: "Organization",
          }),
          breadcrumbJsonLd([
            { name: "Home", path: "/" },
            { name: agencyName, path: agencyPath },
          ]),
        ]}
      />
      <YardHeader
        tone="night"
        eyebrow="Agency"
        title={agencyName}
        description={bio}
        actions={
          <div className="flex flex-wrap gap-2">
            <ShareLinkButton
              path={agencyPath}
              label="Share profile"
              className="btn border border-white/45 bg-white/10 text-white hover:bg-white/18"
            />
            {!isSelf && profile ? (
              <FollowButton
                userId={agencyId}
                initialFollowing={profile.viewerFollowing}
                initialFollowerCount={followerCount}
              />
            ) : null}
          </div>
        }
      />

      <YardContainer>
        <div className="mb-10 flex flex-wrap items-center gap-6">
          <div className="h-24 w-24 overflow-hidden rounded-full bg-accent">
            {avatar ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={avatar}
                alt={`${agencyName} logo`}
                className="h-full w-full object-cover"
              />
            ) : (
              <span className="flex h-full w-full items-center justify-center text-2xl font-bold text-white">
                {agencyName.slice(0, 1).toUpperCase()}
              </span>
            )}
          </div>
          <div className="grid flex-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <YardStat label="LIVE awards" value={liveCount} accent />
            <YardStat label="Published" value={agencyWork.length} />
            <YardStat label="People" value={people.length} />
            <YardStat label="Followers" value={followerCount} />
          </div>
        </div>

        <h2 className="font-display text-3xl tracking-tight text-ink">Award history</h2>
        <p className="mt-1 text-[14px] text-mute">
          LIVE winners and shortlists for {agencyName}, by showcase year.
        </p>
        <div className="mt-6">
          <AwardsHistory
            awards={awards}
            emptyLabel="No LIVE or shortlist awards yet for this agency."
          />
        </div>

        <h2 className="mt-14 font-display text-3xl tracking-tight text-ink">Team</h2>
        <ul className="mt-4 flex flex-wrap gap-2">
          {people.map((member) => (
            <li key={member.id}>
              <a
                href={`/creators/${member.id}`}
                className="rounded-full bg-white px-3.5 py-1.5 text-[13px] font-semibold text-ink hover:bg-accent hover:text-white"
              >
                {member.name}
              </a>
            </li>
          ))}
          {people.length === 0 ? (
            <li className="text-sm text-mute">No public team members yet.</li>
          ) : null}
        </ul>

        <h2 className="mt-12 font-display text-3xl tracking-tight text-ink">Published work</h2>
        <div className="mt-6">
          {items.length > 0 ? (
            <FeedGrid items={items} />
          ) : (
            <YardEmpty>No published agency work yet.</YardEmpty>
          )}
        </div>
      </YardContainer>
    </YardPage>
  );
}
