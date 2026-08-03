import Link from "next/link";
import type { Metadata } from "next";
import { and, count, desc, eq, like, or } from "drizzle-orm";
import { FeedGrid, type FeedItem } from "@/components/FeedCard";
import {
  AgenciesColorBand,
  CategoriesColorBand,
  EventsColorBand,
  HowItWorksBand,
  LiveColorBand,
} from "@/components/home/ColorBands";
import { Pagination } from "@/components/Pagination";
import { ScareIntro } from "@/components/ScareIntro";
import { SkyDrama } from "@/components/SkyDrama";
import { TrendingRail } from "@/components/TrendingRail";
import { db } from "@/db";
import { submissions } from "@/db/schema";
import { getActiveCategoryNames } from "@/lib/categories";
import { getUpcomingEvents, withEventAvailability } from "@/lib/events";
import { getCategoryLeaders, getVoteCountsForIds, getWeeklyLeaderboard } from "@/lib/leaderboards";
import {
  buildMetadata,
  metaDescription,
  SITE_DESCRIPTION,
  SITE_NAME,
  SITE_TAGLINE,
} from "@/lib/seo";
import { getCurrentVoterVotes } from "@/lib/voter";

const PAGE_SIZE = 24;

type SearchParams = Promise<{
  page?: string;
  category?: string;
  status?: string;
  q?: string;
}>;

export async function generateMetadata({
  searchParams,
}: {
  searchParams: SearchParams;
}): Promise<Metadata> {
  const params = await searchParams;
  const category = params.category;
  const statusFilter = params.status;
  const q = params.q?.trim();

  if (q) {
    return buildMetadata({
      title: `Search “${q}”`,
      description: metaDescription(
        `Results for “${q}” on Graveyard. Buried campaigns, film, and branding that never went live.`,
      ),
      path: `/?q=${encodeURIComponent(q)}`,
    });
  }
  if (category) {
    return buildMetadata({
      title: `${category} graves`,
      description: metaDescription(
        `Browse rejected and shelved ${category} work on Graveyard. Vote for what should have gone LIVE.`,
      ),
      path: `/?category=${encodeURIComponent(category)}`,
      keywords: [category, "Graveyard awards", "rejected creative work"],
    });
  }
  if (statusFilter === "winner") {
    return buildMetadata({
      title: "Should have gone LIVE",
      description: metaDescription(
        "Award-winning rejected work that judges say should have gone LIVE. Public votes and industry review on Graveyard.",
      ),
      path: "/?status=winner",
    });
  }
  if (statusFilter === "shortlisted") {
    return buildMetadata({
      title: "Shortlist",
      description: metaDescription(
        "Shortlisted graves on Graveyard. Shelved campaigns and unpublished creative work in the running for LIVE.",
      ),
      path: "/?status=shortlisted",
    });
  }

  return {
    ...buildMetadata({
      title: `${SITE_NAME} | ${SITE_TAGLINE}`,
      description: SITE_DESCRIPTION,
      path: "/",
    }),
    title: {
      absolute: `${SITE_NAME} | ${SITE_TAGLINE}`,
    },
  };
}

export default async function HomePage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const params = await searchParams;
  const page = Math.max(1, Number(params.page) || 1);
  const category = params.category;
  const statusFilter = params.status;
  const q = params.q?.trim();
  const activeCategories = await getActiveCategoryNames();

  const conditions = [eq(submissions.published, true)];
  if (category && activeCategories.includes(category)) {
    conditions.push(eq(submissions.category, category));
  }
  if (statusFilter === "winner") {
    conditions.push(eq(submissions.status, "winner"));
  } else if (statusFilter === "shortlisted") {
    conditions.push(eq(submissions.status, "shortlisted"));
  }
  if (q) {
    conditions.push(
      or(
        like(submissions.title, `%${q}%`),
        like(submissions.concept, `%${q}%`),
        like(submissions.category, `%${q}%`),
      )!,
    );
  }

  const where = and(...conditions);

  const [{ total }] = await db.select({ total: count() }).from(submissions).where(where);
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const currentPage = Math.min(page, totalPages);
  const offset = (currentPage - 1) * PAGE_SIZE;

  const rows = await db.query.submissions.findMany({
    where,
    orderBy: [desc(submissions.updatedAt)],
    limit: PAGE_SIZE,
    offset,
    with: { user: true, assets: true },
  });

  const showDiscovery = !q && !category && !statusFilter && currentPage === 1;

  const [featured, trending, weeklyCreators, weeklyAgencies, upcomingEvents] = showDiscovery
    ? await Promise.all([
        db.query.submissions.findFirst({
          where: and(eq(submissions.published, true), eq(submissions.status, "winner")),
          orderBy: [desc(submissions.updatedAt)],
          with: { user: true, assets: true },
        }),
        getCategoryLeaders(undefined, 12),
        getWeeklyLeaderboard("creator", 6),
        getWeeklyLeaderboard("agency", 9),
        withEventAvailability(await getUpcomingEvents(3)),
      ])
    : [undefined, [], [], [], []];

  const ids = rows.map((r) => r.id);
  const [voteCounts, voterVotes] = await Promise.all([
    getVoteCountsForIds(ids),
    getCurrentVoterVotes(ids),
  ]);

  const items: FeedItem[] = rows.map((piece) => ({
    id: piece.id,
    title: piece.title,
    category: piece.category,
    status: piece.status,
    yearCreated: piece.yearCreated,
    coverFilename: piece.assets[0]?.filename,
    submitter: piece.user.agencyName || piece.user.name,
    concept: piece.concept,
    votes: voteCounts.get(piece.id) ?? 0,
    voted: voterVotes.has(piece.id),
  }));

  const query = { category, status: statusFilter, q };
  const showHero = showDiscovery && (Boolean(featured) || weeklyCreators.length > 0);
  const feedTitle =
    category ||
    (statusFilter === "winner"
      ? "Should have gone LIVE"
      : statusFilter === "shortlisted"
        ? "Shortlist"
        : q
          ? `“${q}”`
          : "Latest in the yard");
  const brandHome = showDiscovery;

  return (
    <main className="product-shell flex-1">
      <ScareIntro />
      <SkyDrama />
      {brandHome && trending.length === 0 ? (
        <header className="mx-auto max-w-[1440px] px-4 pt-8 md:px-6 md:pt-10">
          <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-mute">
            Digital repository
          </p>
          <h1 className="mt-2 font-display text-[clamp(2.4rem,6vw,3.75rem)] font-bold leading-[0.95] tracking-tight text-ink">
            {SITE_NAME}
          </h1>
          <p className="mt-3 max-w-xl text-[16px] leading-relaxed text-mute md:text-[17px]">
            {SITE_TAGLINE}. Rejected, shelved, and never-produced creative work. Public votes and
            industry review. Awarded anytime.
          </p>
        </header>
      ) : null}
      {showDiscovery && trending.length > 0 ? (
        <TrendingRail
          items={trending}
          title="Trending now"
          brand={{
            eyebrow: "Digital repository",
            name: SITE_NAME,
            description: `${SITE_TAGLINE}. Rejected, shelved, and never-produced creative work. Public votes and industry review. Awarded anytime.`,
          }}
        />
      ) : null}

      {showHero ? (
        <section className="hero-soft">
          <div
            className={`mx-auto grid max-w-[1440px] gap-5 px-4 py-8 md:gap-6 md:px-6 md:py-10 ${
              featured ? "md:grid-cols-[1.35fr_0.85fr] md:items-stretch" : "md:grid-cols-1 md:max-w-md"
            }`}
          >
            {featured ? (
              <Link href={`/showcase/${featured.id}`} className="group block h-full min-h-[320px]">
                <div className="card-media relative h-full min-h-[320px] overflow-hidden md:min-h-full">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={`/api/uploads/${featured.assets[0]?.filename || "placeholder"}`}
                    alt={`${featured.title} by ${featured.user.agencyName || featured.user.name}`}
                    className="absolute inset-0 h-full w-full object-cover transition duration-700 group-hover:scale-[1.03]"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-[#c44500]/90 via-[#ff6a00]/25 to-transparent" />
                  <div className="absolute inset-x-0 bottom-0 p-5 md:p-8">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="rounded-full bg-accent px-3 py-1 text-[11px] font-bold uppercase tracking-wide text-white">
                        LIVE
                      </span>
                      <span className="rounded-full bg-white/15 px-3 py-1 text-[11px] font-bold uppercase tracking-wide text-white backdrop-blur-sm">
                        {featured.category}
                      </span>
                    </div>
                    <h2 className="mt-4 font-display text-[28px] font-bold leading-[1.05] tracking-tight text-white md:text-[44px]">
                      {featured.title}
                    </h2>
                    <p className="mt-2 text-[15px] font-medium text-white/75">
                      {featured.user.agencyName || featured.user.name}
                    </p>
                  </div>
                </div>
              </Link>
            ) : null}

            <div className="flex h-full flex-col rounded-[24px] bg-gradient-to-br from-[#ff6a00] via-[#e85d04] to-[#9b2f8a] p-5 text-white md:p-6">
              <div className="flex shrink-0 items-baseline justify-between gap-3">
                <div>
                  <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-accent">
                    This week
                  </p>
                  <h2 className="mt-1 font-display text-[1.4rem] font-bold tracking-tight md:text-[1.55rem]">
                    Rising creators
                  </h2>
                </div>
                <Link
                  href="/leaderboards/creators"
                  className="shrink-0 text-[12px] font-bold text-white/45 hover:text-white"
                >
                  Board
                </Link>
              </div>

              <ol className="mt-3 flex min-h-0 flex-1 flex-col justify-between">
                {weeklyCreators.map((row, i) => (
                  <li
                    key={row.key}
                    className="flex min-w-0 items-center gap-2 border-b border-white/10 py-1.5 last:border-b-0 md:gap-2.5 md:py-2"
                  >
                    <span className="w-5 shrink-0 text-[11px] font-bold tabular-nums text-white/35">
                      {String(i + 1).padStart(2, "0")}
                    </span>
                    <span className="relative h-8 w-8 shrink-0 overflow-hidden rounded-full bg-white/15 ring-1 ring-white/20 md:h-9 md:w-9">
                      {row.avatarFilename ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={`/api/uploads/${row.avatarFilename}`}
                          alt={`${row.name} avatar`}
                          className="h-full w-full object-cover"
                        />
                      ) : (
                        <span className="flex h-full w-full items-center justify-center text-[11px] font-bold text-white">
                          {row.name.slice(0, 1).toUpperCase()}
                        </span>
                      )}
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-[13px] font-semibold text-white">{row.name}</p>
                      <p className="truncate text-[10px] text-white/45">
                        {row.entries} {row.entries === 1 ? "grave" : "graves"}
                      </p>
                    </div>
                    <div className="shrink-0 pl-1 text-right">
                      <p className="text-[13px] font-bold tabular-nums text-white">{row.votes}</p>
                      <p className="text-[9px] uppercase tracking-wider text-white/40">votes</p>
                    </div>
                  </li>
                ))}
              </ol>

              {weeklyCreators.length === 0 ? (
                <p className="mt-6 text-[13px] text-white/45">Quiet plots. Be the first vote.</p>
              ) : null}
            </div>
          </div>
        </section>
      ) : null}

      <div className="section-blend">
        <div className="mx-auto max-w-[1440px] px-4 py-10 md:px-6 md:py-14">
          <div className="flex flex-wrap items-center gap-2 overflow-x-auto pb-1">
            <FilterChip href="/" active={!category && !statusFilter}>
              All
            </FilterChip>
            <FilterChip href="/?status=winner" active={statusFilter === "winner" && !category}>
              LIVE
            </FilterChip>
            <FilterChip
              href="/?status=shortlisted"
              active={statusFilter === "shortlisted" && !category}
            >
              Shortlist
            </FilterChip>
            {activeCategories.map((cat) => (
              <FilterChip
                key={cat}
                href={`/?category=${encodeURIComponent(cat)}`}
                active={category === cat}
              >
                {cat}
              </FilterChip>
            ))}
          </div>

          <div className="mt-10 flex flex-wrap items-end justify-between gap-4">
            <div>
              <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-mute">Feed</p>
              <div className="mt-2 flex flex-wrap items-baseline gap-2">
                {brandHome ? (
                  <h2 className="font-display text-[36px] font-bold tracking-[-0.04em] text-ink md:text-[52px]">
                    {feedTitle}
                  </h2>
                ) : (
                  <h1 className="font-display text-[36px] font-bold tracking-[-0.04em] text-ink md:text-[52px]">
                    {feedTitle}
                  </h1>
                )}
                <span className="rounded-full bg-canvas px-2.5 py-0.5 text-[12px] font-bold text-mute">
                  {total}
                </span>
              </div>
            </div>
            <p className="max-w-sm text-[15px] leading-relaxed text-mute">
              Fresh graves still waiting to go LIVE.
            </p>
          </div>

          <div className="mt-8">
            {items.length > 0 ? (
              <FeedGrid items={items} startIndex={offset} />
            ) : (
              <p className="rounded-[24px] bg-canvas py-20 text-center text-[14px] text-mute">
                Nothing in this plot yet.
              </p>
            )}
          </div>

          <Pagination page={currentPage} totalPages={totalPages} basePath="/" query={query} />
        </div>
      </div>

      {showDiscovery ? (
        <>
          <EventsColorBand events={upcomingEvents} />
          <CategoriesColorBand categories={activeCategories.map((name) => ({ name }))} />
          <AgenciesColorBand rows={weeklyAgencies} />
          <LiveColorBand />
          <HowItWorksBand />
        </>
      ) : null}
    </main>
  );
}

function FilterChip({
  href,
  active,
  children,
}: {
  href: string;
  active?: boolean;
  children: React.ReactNode;
}) {
  return (
    <Link
      href={href}
      className={`shrink-0 rounded-full px-4 py-2 text-[14px] font-medium transition-colors ${
        active ? "bg-accent text-white" : "bg-canvas text-ink hover:bg-[#e8e8e8]"
      }`}
    >
      {children}
    </Link>
  );
}
