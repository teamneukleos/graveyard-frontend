import Link from "next/link";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { FeedGrid, type FeedItem } from "@/components/FeedCard";
import { JsonLd } from "@/components/JsonLd";
import { YardContainer, YardEmpty, YardHeader, YardPage } from "@/components/yard/YardPage";
import { findCategoryByName, findCategoryBySlug } from "@/lib/categories";
import { getCategoryLeaders } from "@/lib/leaderboards";
import { nestListSubmissions } from "@/lib/nest/client";
import { safeApi, submissionToFeedItem } from "@/lib/nest/mappers";
import { breadcrumbJsonLd, buildMetadata, itemListJsonLd, metaDescription } from "@/lib/seo";

type Params = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const { slug } = await params;
  const category = decodeURIComponent(slug);
  const known =
    (await findCategoryBySlug(category)) || (await findCategoryByName(category));
  if (!known) {
    return buildMetadata({
      title: "Category not found",
      description: "This Graveyard category is unavailable.",
      path: `/categories/${encodeURIComponent(slug)}`,
      noIndex: true,
    });
  }

  return buildMetadata({
    title: `${known.name} awards`,
    description: metaDescription(
      `Vote for the strongest unseen ${known.name} work on Graveyard. Rejected and shelved entries ranked by public votes.`,
    ),
    path: `/categories/${encodeURIComponent(known.slug)}`,
    keywords: [known.name, "Graveyard", "creative awards", "should have gone live"],
  });
}

export default async function CategoryPage({ params }: Params) {
  const { slug } = await params;
  const decoded = decodeURIComponent(slug);
  const known =
    (await findCategoryBySlug(decoded)) || (await findCategoryByName(decoded));
  if (!known) notFound();

  const category = known.name;
  const categoryPath = `/categories/${encodeURIComponent(known.slug)}`;
  const leaders = await getCategoryLeaders(known.slug, 10);

  const listed = await safeApi(
    nestListSubmissions({ category: known.slug, page: 1, limit: 100 }),
    { data: [], total: 0, page: 1, limit: 100 },
  );

  const items: FeedItem[] = listed.data
    .map((piece) => submissionToFeedItem(piece))
    .sort((a, b) => (b.votes ?? 0) - (a.votes ?? 0));

  return (
    <YardPage>
      <JsonLd
        data={[
          breadcrumbJsonLd([
            { name: "Home", path: "/" },
            { name: "Categories", path: "/categories" },
            { name: category, path: categoryPath },
          ]),
          itemListJsonLd(
            `${category} on Graveyard`,
            items.slice(0, 20).map((item, i) => ({
              name: item.title,
              path: `/showcase/${item.id}`,
              position: i + 1,
            })),
          ),
        ]}
      />
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
                  href={`/showcase/${leader.slug}`}
                  className="flex min-w-0 items-center gap-3 hover:opacity-70 sm:gap-4"
                >
                  <div className="hidden h-12 w-12 shrink-0 overflow-hidden rounded-2xl sm:block sm:h-14 sm:w-14">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={leader.coverUrl || `/brand/logo-on-dark.png?tone=${i}`}
                      alt={`${leader.title} by ${leader.submitter}`}
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
