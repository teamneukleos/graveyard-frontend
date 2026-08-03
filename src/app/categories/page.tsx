import Link from "next/link";
import { and, count, eq } from "drizzle-orm";
import { YardContainer, YardHeader, YardPage } from "@/components/yard/YardPage";
import { db } from "@/db";
import { submissions } from "@/db/schema";
import { getActiveCategoryNames } from "@/lib/categories";
import { getCategoryLeaders } from "@/lib/leaderboards";

export default async function CategoriesIndexPage() {
  const names = await getActiveCategoryNames();
  const counts = await Promise.all(
    names.map(async (category) => {
      const [{ total }] = await db
        .select({ total: count() })
        .from(submissions)
        .where(and(eq(submissions.category, category), eq(submissions.published, true)));
      const leaders = await getCategoryLeaders(category, 1);
      return { category, total: Number(total), cover: leaders[0]?.coverFilename };
    }),
  );

  return (
    <YardPage>
      <YardHeader
        tone="night"
        eyebrow="The plots"
        title="Categories"
        description="Every grave lands in a plot. Vote for what should have gone LIVE."
      />

      <YardContainer>
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {counts.map(({ category, total, cover }, i) => (
            <Link
              key={category}
              href={`/categories/${encodeURIComponent(category)}`}
              className="group overflow-hidden rounded-[28px] border border-line bg-white/90 shadow-[0_20px_60px_rgba(0,0,0,0.04)] transition hover:-translate-y-0.5"
            >
              <div className="card-media aspect-[16/10] rounded-none">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={`/api/uploads/${cover || "placeholder"}?tone=${i}`}
                  alt=""
                  className="h-full w-full object-cover transition duration-500 group-hover:scale-[1.03]"
                />
              </div>
              <div className="flex items-center justify-between gap-3 p-5">
                <div>
                  <h2 className="font-display text-[22px] tracking-tight text-ink">{category}</h2>
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
