import { asc, eq } from "drizzle-orm";
import { NextResponse } from "next/server";
import { v4 as uuid } from "uuid";
import { z } from "zod";
import { db } from "@/db";
import { events } from "@/db/schema";
import { requireSession } from "@/lib/auth";

const createSchema = z.object({
  title: z.string().min(2),
  type: z.enum(["meetup", "salon", "screening", "workshop"]),
  city: z.string().min(1),
  venue: z.string().min(1),
  startsAt: z.string().min(4),
  format: z.enum(["in-person", "online", "hybrid"]),
  capacity: z.number().int().min(1).max(10000),
  blurb: z.string().min(1),
});

const patchSchema = z.object({
  id: z.string().min(1),
  title: z.string().min(2).optional(),
  type: z.enum(["meetup", "salon", "screening", "workshop"]).optional(),
  city: z.string().min(1).optional(),
  venue: z.string().min(1).optional(),
  startsAt: z.string().min(4).optional(),
  format: z.enum(["in-person", "online", "hybrid"]).optional(),
  capacity: z.number().int().min(1).max(10000).optional(),
  blurb: z.string().min(1).optional(),
  active: z.boolean().optional(),
});

function serialize(row: typeof events.$inferSelect) {
  return {
    id: row.id,
    title: row.title,
    type: row.type,
    city: row.city,
    venue: row.venue,
    startsAt: row.startsAt,
    format: row.format,
    capacity: row.capacity,
    blurb: row.blurb,
    active: row.active,
  };
}

export async function GET() {
  const session = await requireSession(["admin"]);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const rows = await db.query.events.findMany({ orderBy: [asc(events.startsAt)] });
  return NextResponse.json({ events: rows.map(serialize) });
}

export async function POST(request: Request) {
  const session = await requireSession(["admin"]);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const body = await request.json();
    const data = createSchema.parse(body);
    const now = new Date().toISOString();
    const row = {
      id: uuid(),
      ...data,
      active: true,
      createdAt: now,
      updatedAt: now,
    };
    await db.insert(events).values(row);
    return NextResponse.json({ event: serialize(row) }, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: "Invalid event data." }, { status: 400 });
    }
    return NextResponse.json({ error: "Could not create event." }, { status: 500 });
  }
}

export async function PATCH(request: Request) {
  const session = await requireSession(["admin"]);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const body = await request.json();
    const data = patchSchema.parse(body);
    const existing = await db.query.events.findFirst({ where: eq(events.id, data.id) });
    if (!existing) return NextResponse.json({ error: "Event not found." }, { status: 404 });

    const { id, ...patch } = data;
    await db
      .update(events)
      .set({ ...patch, updatedAt: new Date().toISOString() })
      .where(eq(events.id, id));

    const updated = await db.query.events.findFirst({ where: eq(events.id, id) });
    return NextResponse.json({ event: updated ? serialize(updated) : null });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: "Invalid event data." }, { status: 400 });
    }
    return NextResponse.json({ error: "Could not update event." }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  const session = await requireSession(["admin"]);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const id = new URL(request.url).searchParams.get("id");
  if (!id) return NextResponse.json({ error: "Missing id." }, { status: 400 });

  await db.delete(events).where(eq(events.id, id));
  return NextResponse.json({ ok: true });
}
