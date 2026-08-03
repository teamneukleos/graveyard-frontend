import Link from "next/link";
import { RequestSeatButton } from "@/components/RequestSeatButton";
import { YardCard, YardContainer, YardEmpty, YardHeader, YardPage } from "@/components/yard/YardPage";
import { getSession } from "@/lib/auth";
import { formatEventWhen, getUpcomingEvents, withEventAvailability } from "@/lib/events";

export default async function EventsPage() {
  const session = await getSession();
  const events = await withEventAvailability(await getUpcomingEvents(), session?.id);

  return (
    <YardPage>
      <YardHeader
        narrow
        tone="night"
        eyebrow="Gatherings"
        title="Nights in the yard"
        description="Salons, workshops, and meetups where buried work gets an audience."
      />

      <YardContainer narrow>
        <div className="space-y-5">
          {events.map((event, i) => (
            <YardCard
              key={event.id}
              className={`overflow-hidden p-0 ${i === 0 ? "md:grid md:grid-cols-[1.2fr_0.8fr]" : ""}`}
            >
              <article id={event.id} className="scroll-mt-24 p-6 md:p-8">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="rounded-full bg-accent px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-[0.06em] text-white">
                    {event.type}
                  </span>
                  <span className="text-[12px] capitalize text-mute">{event.format}</span>
                </div>
                <h2 className="mt-3 font-display text-[26px] tracking-tight text-ink md:text-[32px]">
                  {event.title}
                </h2>
                <p className="mt-2 text-[14px] text-mute">
                  {formatEventWhen(event.startsAt)} · {event.city} · {event.venue}
                </p>
                <p className="mt-4 max-w-2xl text-[15px] leading-relaxed text-ink/80">{event.blurb}</p>
              </article>
              <div className="flex flex-col items-center justify-center gap-2 border-t border-line bg-soft/80 px-6 py-6 md:border-l md:border-t-0">
                <RequestSeatButton
                  eventId={event.id}
                  initialSpotsLeft={event.spotsLeft}
                  initialRequested={event.requested}
                  isLoggedIn={Boolean(session)}
                />
                <p className="text-[11px] text-mute">{event.spotsLeft} of {event.capacity} seats</p>
              </div>
            </YardCard>
          ))}
        </div>

        {events.length === 0 ? (
          <YardEmpty>No upcoming events yet. Check back soon.</YardEmpty>
        ) : null}

        <p className="mt-10 text-center text-[13px] text-mute">
          Want to host a meetup?{" "}
          <Link href="/register" className="font-semibold text-ink underline underline-offset-2">
            Join Graveyard
          </Link>
        </p>
      </YardContainer>
    </YardPage>
  );
}
