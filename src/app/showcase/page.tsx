import Link from "next/link";
import type { Metadata } from "next";
import { FeedGrid, type FeedItem } from "@/components/FeedCard";
import { JsonLd } from "@/components/JsonLd";
import { Pagination } from "@/components/Pagination";
import { YardContainer, YardEmpty, YardHeader, YardPage } from "@/components/yard/YardPage";
import {
  findCategoryByName,
  findCategoryBySlug,
  getActiveCategories,
} from "@/lib/categories";
import { listShowcaseItems, showcaseItemToFeedFields } from "@/lib/nest/queries";
import { breadcrumbJsonLd, buildMetadata, metaDescription } from "@/lib/seo";

const PAGE_SIZE = 24;

type SearchParams = Promise<{ page?: string; category?: string; year?: string }>;

export async function generateMetadata({
  searchParams,
}: {
  searchParams: SearchParams;
}): Promise<Metadata> {
  const params = await searchParams;
  const categoryParam = params.category;
  const year = params.year ? Number(params.year) : undefined;
  const categoryRow = categoryParam
    ? (await findCategoryBySlug(categoryParam)) || (await findCategoryByName(categoryParam))
    : null;
  const categoryLabel = categoryRow?.name || categoryParam;

  if (categoryLabel) {
    const pathCategory = categoryRow?.slug || categoryParam!;
    return buildMetadata({
      title: `${categoryLabel} showcase`,
      description: metaDescription(
        `Shortlisted and LIVE ${categoryLabel} awards on Graveyard. Vote for rejected work that earned recognition.`,
      ),
      path: `/showcase?category=${encodeURIComponent(pathCategory)}${year ? `&year=${year}` : ""}`,
      keywords: [categoryLabel, "Graveyard showcase", "should have gone live"],
    });
  }
  if (year) {
    return buildMetadata({
      title: `Showcase ${year}`,
      description: metaDescription(
        `Graveyard showcase ${year}. Shortlisted and LIVE awards for rejected and shelved creative work.`,
      ),
      path: `/showcase?year=${year}`,
    });
  }

  return buildMetadata({
    title: "Showcase",
    description: metaDescription(
      "Browse shortlisted and LIVE awards on Graveyard. Vote for rejected campaigns, film, motion, and branding that should have gone live.",
    ),
    path: "/showcase",
  });
}

export default async function ShowcasePage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const params = await searchParams;
  const page = Math.max(1, Number(params.page) || 1);
  const categoryParam = params.category;
  const year = params.year ? Number(params.year) : undefined;
  const activeCategories = await getActiveCategories();

  const categoryRow = categoryParam
    ? (await findCategoryBySlug(categoryParam)) || (await findCategoryByName(categoryParam))
    : null;

  const showcase = await listShowcaseItems({
    category: categoryRow?.slug,
    year: year || undefined,
  });

  const total = showcase.length;
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const currentPage = Math.min(page, totalPages);
  const offset = (currentPage - 1) * PAGE_SIZE;

  const years = Array.from(
    new Set(
      showcase
        .map((r) => r.cycleYear)
        .concat(year ? [year] : [])
        .filter(Boolean),
    ),
  ).sort((a, b) => b - a);

  const items: FeedItem[] = showcase
    .slice(offset, offset + PAGE_SIZE)
    .map(showcaseItemToFeedFields);

  const categoryQuery = categoryRow?.slug || categoryParam;

  return (
    <YardPage>
      <JsonLd
        data={breadcrumbJsonLd([
          { name: "Home", path: "/" },
          { name: "Showcase", path: "/showcase" },
        ])}
      />
      <YardHeader
        eyebrow="Award results"
        title="Showcase"
        description="Shortlisted and LIVE awards from Nest. Vote for work that should have gone LIVE."
        actions={
          <span className="rounded-full bg-accent px-3 py-1.5 text-[12px] font-bold text-white">
            {total} awards
          </span>
        }
      />

      <YardContainer>
        <div className="flex flex-wrap gap-2">
          <Chip href="/showcase" active={!categoryParam}>
            All
          </Chip>
          {activeCategories.map((cat) => (
            <Chip
              key={cat.id}
              href={`/showcase?category=${encodeURIComponent(cat.slug)}${year ? `&year=${year}` : ""}`}
              active={categoryRow?.slug === cat.slug || categoryParam === cat.name}
            >
              {cat.name}
            </Chip>
          ))}
        </div>

        {years.length > 0 ? (
          <div className="mt-3 flex flex-wrap gap-2">
            {years.map((y) => (
              <Chip
                key={y}
                href={`/showcase?year=${y}${categoryQuery ? `&category=${encodeURIComponent(categoryQuery)}` : ""}`}
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
            <YardEmpty>No shortlisted or LIVE awards match these filters.</YardEmpty>
          )}
        </div>

        <Pagination
          page={currentPage}
          totalPages={totalPages}
          basePath="/showcase"
          query={{
            category: categoryQuery,
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
