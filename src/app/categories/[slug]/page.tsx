import Link from "next/link";
import { notFound } from "next/navigation";
import { and, desc, eq } from "drizzle-orm";
import { FeedGrid, type FeedItem } from "@/components/FeedCard";
import { YardContainer, YardEmpty, YardHeader, YardPage } from "@/components/yard/YardPage";
import { db } from "@/db";
import { submissions } from "@/db/schema";
import { findCategoryByName } from "@/lib/categories";
import { getCategoryLeaders, getVoteCountsForIds } from "@/lib/leaderboards";
import { getCurrentVoterVotes } from "@/lib/voter";

type Params = { params: Promise<{ slug: string }> };

export default async function CategoryPage({ params }: Params) {
  const { slug } = await params;
  const category = decodeURIComponent(slug);
  const known = await findCategoryByName(category);
  if (!known?.active) notFound();

  const leaders = await getCategoryLeaders(category, 10);

  const rows = await db.query.submissions.findMany({
    where: and(eq(submissions.published, true), eq(submissions.category, category)),
    orderBy: [desc(submissions.updatedAt)],
    with: { user: true, assets: true },
  });

  const ids = rows.map((r) => r.id);
  const [voteCounts, voterVotes] = await Promise.all([
    getVoteCountsForIds(ids),
    getCurrentVoterVotes(ids),
  ]);

  const items: FeedItem[] = rows
    .map((piece) => ({
      id: piece.id,
      title: piece.title,
      category: piece.category,
      status: piece.status,
      yearCreated: piece.yearCreated,
      coverFilename: piece.assets[0]?.filename,
      submitter: piece.user.agencyName || piece.user.name,
      votes: voteCounts.get(piece.id) ?? 0,
      voted: voterVotes.has(piece.id),
    }))
    .sort((a, b) => (b.votes ?? 0) - (a.votes ?? 0));

  return (
    <YardPage>
      <YardHeader
        tone="night"
        eyebrow="Category plot"
        title={category}
        description={`Vote the strongest unseen work in ${category}. Only votes in this plot count.`}
        actions={
          <Link href="/categories" className="btn btn-ghost text-ink">
            All plots
          </Link>
        }
      />

      <YardContainer>
        <div className="mb-14 min-w-0 overflow-hidden rounded-[28px] border border-line bg-white/90">
          <div className="flex items-end justify-between gap-3 border-b border-line px-4 py-4 sm:px-6 sm:py-5">
            <h2 className="font-display text-[26px] tracking-tight text-ink sm:text-3xl">
              Rising now
            </h2>
            <span className="shrink-0 text-[12px] text-mute">{leaders.length} ranked</span>
          </div>
          <ol className="min-w-0">
            {leaders.map((leader, i) => (
              <li key={leader.submissionId} className="board-row">
                <span className={`rank-num text-xl sm:text-2xl ${i < 3 ? "text-accent" : "text-ink/30"}`}>
                  {String(i + 1).padStart(2, "0")}
                </span>
                <Link
                  href={`/showcase/${leader.submissionId}`}
                  className="flex min-w-0 items-center gap-3 hover:opacity-70 sm:gap-4"
                >
                  <div className="hidden h-12 w-12 shrink-0 overflow-hidden rounded-2xl sm:block sm:h-14 sm:w-14">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={`/api/uploads/${leader.coverFilename || "placeholder"}?tone=${i}`}
                      alt=""
                      className="h-full w-full object-cover"
                    />
                  </div>
                  <div className="min-w-0">
                    <p className="truncate text-[14px] font-semibold text-ink sm:text-[15px]">
                      {leader.title}
                    </p>
                    <p className="truncate text-[11px] text-mute sm:text-[12px]">{leader.submitter}</p>
                  </div>
                </Link>
                <span className="board-votes shrink-0 text-[12px] font-semibold tabular-nums text-ink sm:text-[13px]">
                  {leader.votes}
                  <span className="mt-0.5 block text-[10px] font-semibold uppercase tracking-wider text-mute">
                    votes
                  </span>
                </span>
              </li>
            ))}
            {leaders.length === 0 ? (
              <li className="px-4 py-10 sm:px-6">
                <YardEmpty>No votes yet in this plot.</YardEmpty>
              </li>
            ) : null}
          </ol>
        </div>

        <h2 className="font-display text-[26px] tracking-tight text-ink sm:text-3xl">All graves</h2>
        <p className="mt-1 text-[13px] text-mute">Sorted by votes in this plot</p>
        <div className="mt-8">
          {items.length > 0 ? <FeedGrid items={items} /> : <YardEmpty>No entries yet.</YardEmpty>}
        </div>
      </YardContainer>
    </YardPage>
  );
}
