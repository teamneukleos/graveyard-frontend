import Link from "next/link";
import { notFound } from "next/navigation";
import { and, eq } from "drizzle-orm";
import { AwardsHistory, toAwardEntries } from "@/components/AwardsHistory";
import { FeedGrid, type FeedItem } from "@/components/FeedCard";
import { YardContainer, YardEmpty, YardHeader, YardPage, YardStat } from "@/components/yard/YardPage";
import { db } from "@/db";
import { submissions, users } from "@/db/schema";

type Params = { params: Promise<{ id: string }> };

export default async function CreatorProfilePage({ params }: Params) {
  const { id } = await params;
  const user = await db.query.users.findFirst({ where: eq(users.id, id) });
  if (!user || !user.active) notFound();

  const published = await db.query.submissions.findMany({
    where: and(eq(submissions.userId, user.id), eq(submissions.published, true)),
    with: { assets: true, votes: true },
  });

  const voteTotal = published.reduce((sum, s) => sum + s.votes.length, 0);
  const awards = toAwardEntries(published);
  const liveCount = awards.filter((a) => a.status === "winner").length;

  const items: FeedItem[] = published.map((piece) => ({
    id: piece.id,
    title: piece.title,
    category: piece.category,
    status: piece.status,
    yearCreated: piece.yearCreated,
    coverFilename: piece.assets[0]?.filename,
    submitter: user.agencyName || user.name,
  }));

  return (
    <YardPage>
      <YardHeader
        tone="night"
        eyebrow="Creator"
        title={user.name}
        description={user.bio || "Work that should have gone LIVE."}
        actions={
          user.agencyName ? (
            <Link
              href={`/agencies/${encodeURIComponent(user.agencySlug || user.agencyName)}`}
              className="btn btn-primary"
            >
              {user.agencyName}
            </Link>
          ) : undefined
        }
      />

      <YardContainer>
        <div className="mb-10 flex flex-wrap items-center gap-6">
          <div className="h-24 w-24 overflow-hidden rounded-full bg-ink">
            {user.avatarFilename ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={`/api/uploads/${user.avatarFilename}`}
                alt=""
                className="h-full w-full object-cover"
              />
            ) : (
              <span className="flex h-full w-full items-center justify-center text-2xl font-bold text-white">
                {user.name.slice(0, 1).toUpperCase()}
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
          <AwardsHistory
            awards={awards}
            emptyLabel="No LIVE or shortlist awards yet."
          />
        </div>

        <h2 className="mt-14 font-display text-3xl tracking-tight text-ink">Published work</h2>
        <div className="mt-6">
          {items.length > 0 ? <FeedGrid items={items} /> : <YardEmpty>No published work yet.</YardEmpty>}
        </div>
      </YardContainer>
    </YardPage>
  );
}
