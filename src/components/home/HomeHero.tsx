import Link from "next/link";

export type HeroFeatured = {
  id: string;
  title: string;
  category: string;
  submitter: string;
  coverFilename?: string | null;
};

/** Compact Spotify-style greeting  -  product UI starts immediately below. */
export function HomeHero({ featured }: { featured: HeroFeatured | null }) {
  return (
    <section className="border-b border-line">
      <div className="mx-auto max-w-[1200px] px-5 py-8 md:px-6 md:py-10">
        <div className="flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
          <div className="min-w-0">
            <h1 className="reveal text-[clamp(1.75rem,4vw,2.5rem)] font-bold leading-tight tracking-tight text-ink">
              Welcome to the Graveyard
            </h1>
            <p className="reveal reveal-delay-1 mt-2 max-w-xl text-[15px] leading-relaxed text-mute">
              Rejected, shelved, never-produced work. Voted by the public. Judged by the industry.
            </p>
          </div>
          <div className="reveal reveal-delay-2 flex shrink-0 flex-wrap gap-2">
            <a href="#work" className="btn btn-primary !px-5 !py-2.5 !text-[13px]">
              Browse
            </a>
            <Link href="/register" className="btn btn-ghost !px-5 !py-2.5 !text-[13px]">
              Submit work
            </Link>
            {featured ? (
              <Link
                href={`/showcase/${featured.id}`}
                className="btn btn-ghost !px-5 !py-2.5 !text-[13px]"
              >
                Featured
              </Link>
            ) : null}
          </div>
        </div>
      </div>
    </section>
  );
}
