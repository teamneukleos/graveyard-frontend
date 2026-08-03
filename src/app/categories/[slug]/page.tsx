import Link from "next/link";
import { notFound } from "next/navigation";
import { and, desc, eq } from "drizzle-orm";
import { FeedGrid, type FeedItem } from "@/components/FeedCard";
import { YardContainer, YardEmpty, YardHeader, YardPage } from "@/components/yard/YardPage";
import { db } from "@/db";
import { submissions } from "@/db/schema";
import { getSession } from "@/lib/auth";
import { findCategoryByName } from "@/lib/categories";
import {
  getCategoryLeaders,
  getUserVotesForSubmissions,
  getVoteCountsForIds,
} from "@/lib/leaderboards";

type Params = { params: Promise<{ slug: string }> };

export default async function CategoryPage({ params }: Params) {
  const { slug } = await params;
  const category = decodeURIComponent(slug);
  const known = await findCategoryByName(category);
  if (!known?.active) notFound();

  const session = await getSession();
  const leaders = await getCategoryLeaders(category, 10);

  const rows = await db.query.submissions.findMany({
    where: and(eq(submissions.published, true), eq(submissions.category, category)),
    orderBy: [desc(submissions.updatedAt)],
    with: { user: true, assets: true },
  });

  const ids = rows.map((r) => r.id);
  const voteCounts = await getVoteCountsForIds(ids);
  const userVotes = session ? await getUserVotesForSubmissions(session.id, ids) : new Set<string>();

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
      voted: userVotes.has(piece.id),
    }))
    .sort((a, b) => (b.votes ?? 0) - (a.votes ?? 0));

  return (
    <YardPage>
      <YardHeader
        tone="night"
        eyebrow="Category board"
        title={category}
        description={`Vote for the strongest unseen work in ${category}. Rankings are driven by public votes within this category only.`}
        actions={
          <Link href="/categories" className="btn btn-ghost text-ink">
            All categories
          </Link>
        }
      />

      <YardContainer>
        <div className="mb-14 overflow-hidden rounded-[28px] border border-line bg-white/90">
          <div className="flex items-end justify-between gap-3 border-b border-line px-6 py-5">
            <h2 className="font-display text-3xl tracking-tight text-ink">Leaderboard</h2>
            <span className="text-[12px] text-mute">{leaders.length} ranked</span>
          </div>
          <ol>
            {leaders.map((leader, i) => (
              <li key={leader.submissionId} className="board-row px-6">
                <span className={`rank-num text-2xl ${i < 3 ? "text-accent" : "text-ink/30"}`}>
                  {String(i + 1).padStart(2, "0")}
                </span>
                <Link
                  href={`/showcase/${leader.submissionId}`}
                  className="flex min-w-0 items-center gap-4 hover:opacity-70"
                >
                  <div className="hidden h-14 w-14 shrink-0 overflow-hidden rounded-2xl sm:block">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={`/api/uploads/${leader.coverFilename || "placeholder"}?tone=${i}`}
                      alt=""
                      className="h-full w-full object-cover"
                    />
                  </div>
                  <div className="min-w-0">
                    <p className="truncate text-[15px] font-semibold text-ink">{leader.title}</p>
                    <p className="truncate text-[12px] text-mute">{leader.submitter}</p>
                  </div>
                </Link>
                <span className="text-[13px] font-semibold tabular-nums text-ink">
                  {leader.votes} votes
                </span>
              </li>
            ))}
            {leaders.length === 0 ? (
              <li className="px-6 py-10">
                <YardEmpty>No votes yet in this category.</YardEmpty>
              </li>
            ) : null}
          </ol>
        </div>

        <h2 className="font-display text-3xl tracking-tight text-ink">All entries</h2>
        <p className="mt-1 text-[13px] text-mute">Sorted by votes in this category</p>
        <div className="mt-8">
          {items.length > 0 ? <FeedGrid items={items} /> : <YardEmpty>No entries yet.</YardEmpty>}
        </div>
      </YardContainer>
    </YardPage>
  );
}
