import { getAccessToken } from "@/lib/auth";
import {
  nestAdminEvents,
  nestUpcomingEvents,
} from "@/lib/nest/client";
import { safeApi } from "@/lib/nest/mappers";
import type { NestEvent, NestEventFormat, NestEventType } from "@/lib/nest/types";

export type CreatorEvent = {
  id: string;
  slug: string;
  title: string;
  type: string;
  city: string;
  venue: string;
  startsAt: string;
  format: string;
  capacity: number;
  blurb: string;
  active: boolean;
};

export type EventWithAvailability = CreatorEvent & {
  seatsLeft: number;
  spotsLeft: number;
  rsvpCount: number;
  hasRsvp: boolean;
  requested: boolean;
};

const UI_TO_NEST_TYPE: Record<string, NestEventType> = {
  meetup: "MEETUP",
  salon: "SALON",
  screening: "SCREENING",
  workshop: "WORKSHOP",
};

const UI_TO_NEST_FORMAT: Record<string, NestEventFormat> = {
  "in-person": "IN_PERSON",
  online: "ONLINE",
  hybrid: "HYBRID",
};

export function toNestEventType(value: string): NestEventType | null {
  return UI_TO_NEST_TYPE[value.toLowerCase()] ?? null;
}

export function toNestEventFormat(value: string): NestEventFormat | null {
  return UI_TO_NEST_FORMAT[value.toLowerCase()] ?? null;
}

export function mapNestEvent(event: NestEvent): CreatorEvent {
  return {
    id: event.id,
    slug: event.slug,
    title: event.title,
    type: event.type.toLowerCase(),
    city: event.city,
    venue: event.venue,
    startsAt:
      typeof event.startsAt === "string"
        ? event.startsAt
        : new Date(event.startsAt).toISOString(),
    format: event.format === "IN_PERSON" ? "in-person" : event.format.toLowerCase(),
    capacity: event.capacity,
    blurb: event.blurb,
    active: event.isActive,
  };
}

export function mapNestEventWithAvailability(event: NestEvent): EventWithAvailability {
  const base = mapNestEvent(event);
  return {
    ...base,
    seatsLeft: event.spotsLeft,
    spotsLeft: event.spotsLeft,
    rsvpCount: event.rsvpCount,
    hasRsvp: event.hasRsvp,
    requested: event.requested,
  };
}

export function slugifyAgency(name: string) {
  return name
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

export function formatEventWhen(startsAt: string) {
  try {
    return new Intl.DateTimeFormat("en-GB", {
      weekday: "short",
      day: "numeric",
      month: "short",
      hour: "2-digit",
      minute: "2-digit",
    }).format(new Date(startsAt));
  } catch {
    return startsAt;
  }
}

export function formatEventType(type: string) {
  return type.replace(/_/g, " ").replace(/-/g, " ");
}

export async function getUpcomingEvents(limit = 10): Promise<CreatorEvent[]> {
  const token = await getAccessToken();
  const events = await safeApi(nestUpcomingEvents(limit, token), []);
  return events.map(mapNestEvent);
}

export async function getUpcomingEventsWithAvailability(
  limit = 10,
): Promise<EventWithAvailability[]> {
  const token = await getAccessToken();
  const events = await safeApi(nestUpcomingEvents(limit, token), []);
  return events.map(mapNestEventWithAvailability);
}

export async function getAllEventsAdmin(): Promise<CreatorEvent[]> {
  const token = await getAccessToken();
  if (!token) return [];
  const events = await safeApi(nestAdminEvents(token), []);
  return events.map(mapNestEvent);
}

export async function getEventById(id: string): Promise<CreatorEvent | null> {
  const events = await getUpcomingEvents(100);
  return events.find((event) => event.id === id || event.slug === id) ?? null;
}

export async function withEventAvailability(
  events: CreatorEvent[],
  _userId?: string | null,
): Promise<EventWithAvailability[]> {
  // Prefer Nest-enriched payloads from getUpcomingEventsWithAvailability.
  return events.map((event) => ({
    ...event,
    seatsLeft: event.capacity,
    spotsLeft: event.capacity,
    rsvpCount: 0,
    hasRsvp: false,
    requested: false,
  }));
}
