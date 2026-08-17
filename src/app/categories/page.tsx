import Link from "next/link";
import type { Metadata } from "next";
import { JsonLd } from "@/components/JsonLd";
import { YardContainer, YardHeader, YardPage } from "@/components/yard/YardPage";
import { getActiveCategories } from "@/lib/categories";
import { getCategoryLeaders } from "@/lib/leaderboards";
import { nestListSubmissions } from "@/lib/nest/client";
import { safeApi } from "@/lib/nest/mappers";
import { breadcrumbJsonLd, buildMetadata, itemListJsonLd, metaDescription } from "@/lib/seo";

export const metadata: Metadata = buildMetadata({
  title: "Categories",
  description: metaDescription(
    "Explore Graveyard category plots: film, campaigns, branding, motion, and more. Vote for rejected creative work that should have gone LIVE.",
  ),
  path: "/categories",
  keywords: ["creative awards categories", "Graveyard plots", "rejected advertising"],
});

export default async function CategoriesIndexPage() {
  const categories = await getActiveCategories();
  const counts = await Promise.all(
    categories.map(async (category) => {
      const page = await safeApi(
        nestListSubmissions({ category: category.slug, page: 1, limit: 1 }),
        {
          data: [],
          total: 0,
          page: 1,
          limit: 1,
        },
      );
      const leaders = await getCategoryLeaders(category.slug, 1);
      return {
        name: category.name,
        slug: category.slug,
        total: page.total,
        coverUrl: leaders[0]?.coverUrl ?? null,
      };
    }),
  );

  return (
    <YardPage>
      <JsonLd
        data={[
          breadcrumbJsonLd([
            { name: "Home", path: "/" },
            { name: "Categories", path: "/categories" },
          ]),
          itemListJsonLd(
            "Graveyard categories",
            counts.map((c, i) => ({
              name: c.name,
              path: `/categories/${encodeURIComponent(c.slug)}`,
              position: i + 1,
            })),
          ),
        ]}
      />
      <YardHeader
        tone="night"
        eyebrow="The plots"
        title="Categories"
        description="Every grave lands in a plot. Vote for what should have gone LIVE."
      />

      <YardContainer>
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {counts.map(({ name, slug, total, coverUrl }, i) => (
            <Link
              key={slug}
              href={`/categories/${encodeURIComponent(slug)}`}
              className="group overflow-hidden rounded-[28px] border border-line bg-white/90 shadow-[0_20px_60px_rgba(0,0,0,0.04)] transition hover:-translate-y-0.5"
            >
              <div className="card-media aspect-[16/10] rounded-none">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={coverUrl || `/brand/logo-on-dark.png?tone=${i}`}
                  alt={`${name} category on Graveyard`}
                  className="h-full w-full object-cover transition duration-500 group-hover:scale-[1.03]"
                />
              </div>
              <div className="flex items-center justify-between gap-3 p-5">
                <div>
                  <h2 className="font-display text-[22px] tracking-tight text-ink">{name}</h2>
                  <p className="mt-0.5 text-[12px] text-mute">{total} entries</p>
                </div>
                <span className="rounded-full bg-accent px-3 py-1.5 text-[11px] font-bold text-white">
                  Vote
                </span>
              </div>
            </Link>
          ))}
        </div>
      </YardContainer>
    </YardPage>
  );
}
