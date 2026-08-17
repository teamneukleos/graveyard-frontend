import type { Metadata } from "next";
import { JsonLd } from "@/components/JsonLd";
import { RequestSeatButton } from "@/components/RequestSeatButton";
import { YardContainer, YardHeader, YardPage } from "@/components/yard/YardPage";
import { getSession } from "@/lib/auth";
import {
  formatEventType,
  formatEventWhen,
  getUpcomingEventsWithAvailability,
} from "@/lib/events";
import { breadcrumbJsonLd, buildMetadata, metaDescription } from "@/lib/seo";

export const metadata: Metadata = buildMetadata({
  title: "Events",
  description: metaDescription(
    "Graveyard salons, meetups, workshops, and screenings. Request a seat for nights where shelved work gets a second chance.",
  ),
  path: "/events",
  keywords: ["creative events", "Graveyard salon", "advertising meetup"],
});

export default async function EventsPage() {
  const [session, events] = await Promise.all([
    getSession(),
    getUpcomingEventsWithAvailability(50),
  ]);

  return (
    <YardPage>
      <JsonLd
        data={breadcrumbJsonLd([
          { name: "Home", path: "/" },
          { name: "Events", path: "/events" },
        ])}
      />
      <YardHeader
        narrow
        tone="night"
        eyebrow="Gatherings"
        title="Events"
        description="Salons, workshops, and nights where shelved work gets an audience."
      />

      <YardContainer narrow>
        {events.length === 0 ? (
          <div className="rounded-[28px] border border-line bg-white/90 px-6 py-12 text-center md:px-10">
            <p className="font-display text-[28px] tracking-tight text-ink md:text-[34px]">
              No upcoming events
            </p>
            <p className="mx-auto mt-3 max-w-md text-[15px] leading-relaxed text-mute">
              Check back soon — new yard nights land here as they are scheduled.
            </p>
          </div>
        ) : (
          <ul className="space-y-4">
            {events.map((event) => (
              <li
                key={event.id}
                id={event.id}
                className="scroll-mt-28 rounded-[24px] border border-line bg-white/90 p-5 md:p-6"
              >
                <div className="flex flex-col gap-5 sm:flex-row sm:items-start sm:justify-between">
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2 text-[11px] font-bold uppercase tracking-[0.12em] text-mute">
                      <span>{formatEventType(event.type)}</span>
                      <span>·</span>
                      <span>{event.format}</span>
                    </div>
                    <h2 className="mt-2 font-display text-[26px] tracking-tight text-ink md:text-[30px]">
                      {event.title}
                    </h2>
                    <p className="mt-2 text-[14px] text-mute">
                      {formatEventWhen(event.startsAt)} · {event.venue}, {event.city}
                    </p>
                    <p className="mt-3 max-w-xl text-[15px] leading-relaxed text-ink/80">
                      {event.blurb}
                    </p>
                  </div>
                  <div className="shrink-0 sm:w-40">
                    <RequestSeatButton
                      eventId={event.id}
                      initialSpotsLeft={event.spotsLeft}
                      initialRequested={event.requested}
                      isLoggedIn={Boolean(session)}
                    />
                  </div>
                </div>
              </li>
            ))}
          </ul>
        )}
      </YardContainer>
    </YardPage>
  );
}
