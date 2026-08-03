import Link from "next/link";
import { and, count, desc, eq } from "drizzle-orm";
import { FeedGrid, type FeedItem } from "@/components/FeedCard";
import { Pagination } from "@/components/Pagination";
import { YardContainer, YardEmpty, YardHeader, YardPage } from "@/components/yard/YardPage";
import { db } from "@/db";
import { submissions } from "@/db/schema";
import { getActiveCategoryNames } from "@/lib/categories";

const PAGE_SIZE = 24;

type SearchParams = Promise<{ page?: string; category?: string; year?: string }>;

export default async function ShowcasePage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const params = await searchParams;
  const page = Math.max(1, Number(params.page) || 1);
  const category = params.category;
  const year = params.year ? Number(params.year) : undefined;
  const activeCategories = await getActiveCategoryNames();

  const conditions = [eq(submissions.published, true)];
  if (category && activeCategories.includes(category)) {
    conditions.push(eq(submissions.category, category));
  }
  if (year) {
    conditions.push(eq(submissions.showcaseYear, year));
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

  const yearsRows = await db.query.submissions.findMany({
    where: eq(submissions.published, true),
    columns: { showcaseYear: true },
  });
  const years = Array.from(
    new Set(yearsRows.map((r) => r.showcaseYear).filter(Boolean) as number[]),
  ).sort((a, b) => b - a);

  const items: FeedItem[] = rows.map((piece) => ({
    id: piece.id,
    title: piece.title,
    category: piece.category,
    status: piece.status,
    yearCreated: piece.yearCreated,
    coverFilename: piece.assets[0]?.filename,
    submitter: piece.user.agencyName || piece.user.name,
  }));

  return (
    <YardPage>
      <YardHeader
        eyebrow="Published work"
        title="Showcase"
        description="Shortlisted and winning work from across the yard — the pieces that should have gone LIVE."
        actions={
          <span className="rounded-full bg-accent px-3 py-1.5 text-[12px] font-bold text-white">
            {total} live
          </span>
        }
      />

      <YardContainer>
        <div className="flex flex-wrap gap-2">
          <Chip href="/showcase" active={!category}>
            All
          </Chip>
          {activeCategories.map((cat) => (
            <Chip
              key={cat}
              href={`/showcase?category=${encodeURIComponent(cat)}${year ? `&year=${year}` : ""}`}
              active={category === cat}
            >
              {cat}
            </Chip>
          ))}
        </div>

        {years.length > 0 ? (
          <div className="mt-3 flex flex-wrap gap-2">
            {years.map((y) => (
              <Chip
                key={y}
                href={`/showcase?year=${y}${category ? `&category=${encodeURIComponent(category)}` : ""}`}
                active={year === y}
              >
                {y}
              </Chip>
            ))}
          </div>
        ) : null}

        <div className="mt-8">
          {items.length > 0 ? (
            <FeedGrid items={items} startIndex={offset} />
          ) : (
            <YardEmpty>No published entries match these filters.</YardEmpty>
          )}
        </div>

        <Pagination
          page={currentPage}
          totalPages={totalPages}
          basePath="/showcase"
          query={{
            category,
            year: year ? String(year) : undefined,
          }}
        />
      </YardContainer>
    </YardPage>
  );
}

function Chip({
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
      className={`rounded-full px-3.5 py-1.5 text-[13px] font-semibold transition-colors ${
        active ? "bg-accent text-white" : "bg-white/90 text-ink hover:bg-canvas"
      }`}
    >
      {children}
    </Link>
  );
}
