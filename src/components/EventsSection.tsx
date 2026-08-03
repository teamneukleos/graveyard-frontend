import Link from "next/link";
import { formatEventWhen, type EventWithAvailability } from "@/lib/events";

export function EventsSection({
  events,
  showViewAll = true,
}: {
  events: EventWithAvailability[];
  showViewAll?: boolean;
}) {
  if (!events.length) return null;

  return (
    <section className="border-t border-line">
      <div className="mx-auto max-w-[1200px] px-5 py-12 md:px-6">
        <div className="mb-6 flex items-end justify-between gap-4">
          <h2 className="text-[22px] font-bold tracking-tight text-ink">Events</h2>
          {showViewAll ? (
            <Link href="/events" className="text-[13px] font-semibold text-mute hover:text-ink">
              View all
            </Link>
          ) : null}
        </div>

        <ul className="divide-y divide-line border-y border-line">
          {events.map((event) => (
            <li key={event.id}>
              <Link
                href={`/events#${event.id}`}
                className="flex flex-col gap-1 py-4 transition-colors hover:bg-soft/60 sm:flex-row sm:items-baseline sm:justify-between sm:gap-6 sm:px-1"
              >
                <div className="min-w-0">
                  <p className="text-[15px] font-semibold tracking-tight text-ink">{event.title}</p>
                  <p className="mt-0.5 line-clamp-1 text-[13px] text-mute">{event.blurb}</p>
                </div>
                <p className="shrink-0 text-[13px] text-mute">
                  {formatEventWhen(event.startsAt)} · {event.city}
                </p>
              </Link>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}

export function EventCard({
  event,
}: {
  event: EventWithAvailability;
  dark?: boolean;
  className?: string;
}) {
  return (
    <article className="rounded-lg border border-line bg-white p-4">
      <h3 className="text-[15px] font-semibold text-ink">{event.title}</h3>
      <p className="mt-1 text-[12px] text-mute">
        {formatEventWhen(event.startsAt)} · {event.city}
      </p>
    </article>
  );
}
