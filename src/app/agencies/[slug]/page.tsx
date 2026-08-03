import Link from "next/link";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { and, eq, or } from "drizzle-orm";
import { AwardsHistory, toAwardEntries } from "@/components/AwardsHistory";
import { FeedGrid, type FeedItem } from "@/components/FeedCard";
import { JsonLd } from "@/components/JsonLd";
import { YardContainer, YardEmpty, YardHeader, YardPage, YardStat } from "@/components/yard/YardPage";
import { db } from "@/db";
import { submissions, users } from "@/db/schema";
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
  const roster = await db.query.users.findMany({
    where: or(eq(users.agencySlug, decoded), eq(users.agencyName, decoded)),
    limit: 1,
  });
  if (roster.length === 0) {
    return buildMetadata({
      title: "Agency not found",
      description: "This agency profile is unavailable.",
      path: `/agencies/${encodeURIComponent(decoded)}`,
      noIndex: true,
    });
  }

  const agencyName = roster[0].agencyName || decoded;
  const avatar = roster[0].avatarFilename;
  const bio = roster[0].bio || `${agencyName} on Graveyard. Shelved campaigns and unpublished work.`;

  return buildMetadata({
    title: agencyName,
    description: metaDescription(bio),
    path: `/agencies/${encodeURIComponent(roster[0].agencySlug || agencyName)}`,
    image: avatar ? `/api/uploads/${avatar}` : undefined,
    type: "profile",
    keywords: [agencyName, "creative agency", "Graveyard", "should have gone live"],
  });
}

export default async function AgencyProfilePage({ params }: Params) {
  const { slug } = await params;
  const decoded = decodeURIComponent(slug);

  const roster = await db.query.users.findMany({
    where: or(eq(users.agencySlug, decoded), eq(users.agencyName, decoded)),
  });

  if (roster.length === 0) notFound();

  const agencyName = roster[0].agencyName || decoded;
  const agencyPath = `/agencies/${encodeURIComponent(roster[0].agencySlug || agencyName)}`;
  const avatar = roster.find((u) => u.avatarFilename)?.avatarFilename;
  const bio = roster.find((u) => u.bio)?.bio || `${agencyName} on Graveyard.`;

  const published = await db.query.submissions.findMany({
    where: and(eq(submissions.published, true), eq(submissions.submitterType, "agency")),
    with: { user: true, assets: true, votes: true },
  });

  const agencyWork = published.filter(
    (s) =>
      s.user.agencySlug === decoded ||
      s.user.agencyName === decoded ||
      s.user.agencyName === agencyName,
  );

  const awards = toAwardEntries(agencyWork);
  const liveCount = awards.filter((a) => a.status === "winner").length;

  const items: FeedItem[] = agencyWork.map((piece) => ({
    id: piece.id,
    title: piece.title,
    category: piece.category,
    status: piece.status,
    yearCreated: piece.yearCreated,
    coverFilename: piece.assets[0]?.filename,
    submitter: agencyName,
  }));

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
      <YardHeader tone="night" eyebrow="Agency" title={agencyName} description={bio} />

      <YardContainer>
        <div className="mb-10 flex flex-wrap items-center gap-6">
          <div className="h-24 w-24 overflow-hidden rounded-full bg-accent">
            {avatar ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={`/api/uploads/${avatar}`}
                alt={`${agencyName} logo`}
                className="h-full w-full object-cover"
              />
            ) : (
              <span className="flex h-full w-full items-center justify-center text-2xl font-bold text-white">
                {agencyName.slice(0, 1).toUpperCase()}
              </span>
            )}
          </div>
          <div className="grid flex-1 gap-3 sm:grid-cols-3">
            <YardStat label="LIVE awards" value={liveCount} accent />
            <YardStat label="Published" value={agencyWork.length} />
            <YardStat label="People" value={roster.length} />
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
          {roster.map((member) => (
            <li key={member.id}>
              <Link
                href={`/creators/${member.id}`}
                className="rounded-full bg-white px-3.5 py-1.5 text-[13px] font-semibold text-ink hover:bg-accent hover:text-white"
              >
                {member.name}
              </Link>
            </li>
          ))}
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
