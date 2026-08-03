import { and, count, eq } from "drizzle-orm";
import { NextResponse } from "next/server";
import { v4 as uuid } from "uuid";
import { z } from "zod";
import { db } from "@/db";
import { eventRsvps } from "@/db/schema";
import { requireSession } from "@/lib/auth";
import { getEventById } from "@/lib/events";

const bodySchema = z.object({
  eventId: z.string().min(1),
});

async function spotsLeftFor(eventId: string, capacity: number) {
  const [{ total }] = await db
    .select({ total: count() })
    .from(eventRsvps)
    .where(eq(eventRsvps.eventId, eventId));
  return Math.max(0, capacity - Number(total));
}

export async function POST(request: Request) {
  const session = await requireSession();
  if (!session) {
    return NextResponse.json({ error: "Log in to request a seat." }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { eventId } = bodySchema.parse(body);
    const event = await getEventById(eventId);
    if (!event || event.active === false) {
      return NextResponse.json({ error: "Event not found." }, { status: 404 });
    }

    const existing = await db.query.eventRsvps.findFirst({
      where: and(eq(eventRsvps.eventId, eventId), eq(eventRsvps.userId, session.id)),
    });
    if (existing) {
      const spotsLeft = await spotsLeftFor(eventId, event.capacity);
      return NextResponse.json({ requested: true, spotsLeft, eventId });
    }

    const spotsLeft = await spotsLeftFor(eventId, event.capacity);
    if (spotsLeft <= 0) {
      return NextResponse.json({ error: "This event is full." }, { status: 409 });
    }

    await db.insert(eventRsvps).values({
      id: uuid(),
      eventId,
      userId: session.id,
      createdAt: new Date().toISOString(),
    });

    return NextResponse.json({
      requested: true,
      spotsLeft: spotsLeft - 1,
      eventId,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: "Invalid request." }, { status: 400 });
    }
    return NextResponse.json({ error: "Could not request seat." }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  const session = await requireSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { eventId } = bodySchema.parse(body);
    const event = await getEventById(eventId);
    if (!event) {
      return NextResponse.json({ error: "Event not found." }, { status: 404 });
    }

    await db
      .delete(eventRsvps)
      .where(and(eq(eventRsvps.eventId, eventId), eq(eventRsvps.userId, session.id)));

    const spotsLeft = await spotsLeftFor(eventId, event.capacity);
    return NextResponse.json({ requested: false, spotsLeft, eventId });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: "Invalid request." }, { status: 400 });
    }
    return NextResponse.json({ error: "Could not cancel seat." }, { status: 500 });
  }
}
