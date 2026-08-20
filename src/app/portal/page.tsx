import Link from "next/link";
import { redirect } from "next/navigation";
import { AwardsHistory, toAwardEntries } from "@/components/AwardsHistory";
import { ShareLinkButton } from "@/components/ShareLinkButton";
import { StatusPill } from "@/components/StatusPill";
import {
  YardCard,
  YardContainer,
  YardEmpty,
  YardHeader,
  YardPage,
} from "@/components/yard/YardPage";
import { getAccessToken, requireSession } from "@/lib/auth";
import { nestMySubmissions } from "@/lib/nest/client";
import { coverUrlOf, mapNestStatus, safeApi } from "@/lib/nest/mappers";

export default async function PortalPage() {
  const session = await requireSession(["creator", "agency", "admin"]);
  if (!session) redirect("/login");
  if (session.role === "admin") redirect("/admin");

  const token = await getAccessToken();
  const mine = await safeApi(nestMySubmissions(token), []);

  const awards = toAwardEntries(
    mine.map((s) => ({
      id: s.slug,
      title: s.title,
      category: s.category.name,
      status: mapNestStatus(s.status),
      showcaseYear: s.publishedAt ? new Date(s.publishedAt).getFullYear() : null,
      yearCreated: s.yearCreated,
      coverUrl: coverUrlOf(s),
    })),
  );

  const profilePath =
    session.role === "agency" ? `/agencies/${session.id}` : `/creators/${session.id}`;

  return (
    <YardPage>
      <YardHeader
        eyebrow="Creator portal"
        title={`Hello, ${session.name.split(" ")[0]}`}
        description="Submit unseen work, track status, and share your public profile or published projects."
        actions={
          <div className="flex flex-wrap gap-2">
            <ShareLinkButton path={profilePath} label="Copy profile link" />
            <Link href={profilePath} className="btn btn-ghost">
              Public profile
            </Link>
            <Link href="/portal/submit" className="btn btn-primary">
              New submission
            </Link>
          </div>
        }
      />

      <YardContainer>
        <section className="mb-14">
          <h2 className="font-display text-3xl tracking-tight text-ink">Your awards</h2>
          <p className="mt-1 text-[14px] text-mute">
            Historical LIVE and shortlist recognition across showcase years.
          </p>
          <div className="mt-6">
            <AwardsHistory
              awards={awards}
              emptyLabel="No awards yet. Keep burying work that should have gone LIVE."
            />
          </div>
        </section>

        <h2 className="font-display text-3xl tracking-tight text-ink">Your submissions</h2>
        <div className="mt-6 grid gap-4 md:grid-cols-2">
          {mine.map((item) => {
            const published = item.status === "PUBLISHED";
            return (
              <YardCard key={item.id} className="overflow-hidden transition hover:-translate-y-0.5">
                <Link href={`/portal/submissions/${item.id}`} className="group block">
                  <div className="card-media aspect-[16/10] rounded-none">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={coverUrlOf(item) || "/brand/logo-on-dark.png"}
                      alt=""
                      className="h-full w-full object-cover transition duration-500 group-hover:scale-[1.03]"
                    />
                  </div>
                  <div className="flex items-start justify-between gap-3 p-5 pb-3">
                    <div className="min-w-0">
                      <h3 className="truncate font-display text-xl tracking-tight text-ink group-hover:underline">
                        {item.title}
                      </h3>
                      <p className="mt-1 text-sm text-mute">
                        {item.category.name} · {item.yearCreated} · {item.assets.length} asset
                        {item.assets.length === 1 ? "" : "s"}
                      </p>
                    </div>
                    <StatusPill status={mapNestStatus(item.status)} />
                  </div>
                </Link>
                {published ? (
                  <div className="flex flex-wrap gap-2 px-5 pb-5">
                    <Link
                      href={`/showcase/${item.slug}`}
                      className="btn btn-ghost !px-3 !py-1.5 !text-xs"
                    >
                      View public
                    </Link>
                    <ShareLinkButton
                      path={`/showcase/${item.slug}`}
                      label="Copy project link"
                      className="btn btn-outline !px-3 !py-1.5 !text-xs"
                    />
                  </div>
                ) : null}
              </YardCard>
            );
          })}
        </div>

        {mine.length === 0 ? (
          <YardEmpty
            action={
              <Link href="/portal/submit" className="btn btn-primary">
                Submit your first piece
              </Link>
            }
          >
            No submissions yet. Bring something that should have gone LIVE.
          </YardEmpty>
        ) : null}
      </YardContainer>
    </YardPage>
  );
}
