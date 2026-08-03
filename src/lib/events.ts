import { and, asc, count, eq, gte, inArray } from "drizzle-orm";
import { db } from "@/db";
import { eventRsvps, events, type EventRow } from "@/db/schema";

export type CreatorEvent = {
  id: string;
  title: string;
  type: "meetup" | "salon" | "screening" | "workshop";
  city: string;
  venue: string;
  startsAt: string;
  format: "in-person" | "online" | "hybrid";
  capacity: number;
  blurb: string;
  active?: boolean;
};

export type EventWithAvailability = CreatorEvent & {
  spotsLeft: number;
  requested: boolean;
};

function toCreatorEvent(row: EventRow): CreatorEvent {
  return {
    id: row.id,
    title: row.title,
    type: row.type as CreatorEvent["type"],
    city: row.city,
    venue: row.venue,
    startsAt: row.startsAt,
    format: row.format as CreatorEvent["format"],
    capacity: row.capacity,
    blurb: row.blurb,
    active: row.active,
  };
}

export async function getEventById(eventId: string) {
  const row = await db.query.events.findFirst({
    where: eq(events.id, eventId),
  });
  return row ? toCreatorEvent(row) : null;
}

export async function getUpcomingEvents(limit?: number) {
  const cutoff = new Date(Date.now() - 1000 * 60 * 60 * 12).toISOString();
  const rows = await db.query.events.findMany({
    where: and(eq(events.active, true), gte(events.startsAt, cutoff)),
    orderBy: [asc(events.startsAt)],
    limit,
  });
  return rows.map(toCreatorEvent);
}

export async function getAllEventsAdmin() {
  const rows = await db.query.events.findMany({
    orderBy: [asc(events.startsAt)],
  });
  return rows.map(toCreatorEvent);
}

export async function getRsvpCounts(eventIds: string[]) {
  const map = new Map<string, number>();
  if (!eventIds.length) return map;

  const rows = await db
    .select({
      eventId: eventRsvps.eventId,
      total: count(),
    })
    .from(eventRsvps)
    .where(inArray(eventRsvps.eventId, eventIds))
    .groupBy(eventRsvps.eventId);

  for (const row of rows) {
    map.set(row.eventId, Number(row.total));
  }
  return map;
}

export async function getUserRsvps(userId: string, eventIds: string[]) {
  const set = new Set<string>();
  if (!eventIds.length) return set;

  const rows = await db.query.eventRsvps.findMany({
    where: and(eq(eventRsvps.userId, userId), inArray(eventRsvps.eventId, eventIds)),
  });
  for (const row of rows) set.add(row.eventId);
  return set;
}

export async function withEventAvailability(
  eventList: CreatorEvent[],
  userId?: string | null,
): Promise<EventWithAvailability[]> {
  const ids = eventList.map((e) => e.id);
  const [counts, mine] = await Promise.all([
    getRsvpCounts(ids),
    userId ? getUserRsvps(userId, ids) : Promise.resolve(new Set<string>()),
  ]);

  return eventList.map((event) => {
    const taken = counts.get(event.id) ?? 0;
    return {
      ...event,
      spotsLeft: Math.max(0, event.capacity - taken),
      requested: mine.has(event.id),
    };
  });
}

export function formatEventWhen(iso: string) {
  const d = new Date(iso);
  return new Intl.DateTimeFormat("en-GB", {
    weekday: "short",
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  }).format(d);
}

export function formatEventType(type: CreatorEvent["type"]) {
  return type.charAt(0).toUpperCase() + type.slice(1);
}

export function slugifyAgency(name: string) {
  return name
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}
