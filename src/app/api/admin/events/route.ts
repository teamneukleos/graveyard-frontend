import { NextResponse } from "next/server";
import { z } from "zod";
import { getAccessToken, requireSession } from "@/lib/auth";
import { mapNestEvent, toNestEventFormat, toNestEventType } from "@/lib/events";
import {
  NestApiError,
  nestCreateEvent,
  nestDeleteEvent,
  nestAdminEvents,
  nestUpdateEvent,
} from "@/lib/nest/client";

const createSchema = z.object({
  title: z.string().min(2),
  type: z.string().min(1),
  city: z.string().min(1),
  venue: z.string().min(1),
  startsAt: z.string().min(1),
  format: z.string().min(1),
  capacity: z.number().int().min(1),
  blurb: z.string().min(4),
});

const patchSchema = z.object({
  id: z.string().min(1),
  active: z.boolean().optional(),
  title: z.string().min(2).optional(),
  type: z.string().optional(),
  city: z.string().optional(),
  venue: z.string().optional(),
  startsAt: z.string().optional(),
  format: z.string().optional(),
  capacity: z.number().int().min(1).optional(),
  blurb: z.string().min(4).optional(),
});

export async function GET() {
  const session = await requireSession(["admin"]);
  const token = await getAccessToken();
  if (!session || !token) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const events = await nestAdminEvents(token);
    return NextResponse.json({ events: events.map(mapNestEvent) });
  } catch (error) {
    if (error instanceof NestApiError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }
    return NextResponse.json({ error: "Could not load events." }, { status: 500 });
  }
}

export async function POST(request: Request) {
  const session = await requireSession(["admin"]);
  const token = await getAccessToken();
  if (!session || !token) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = createSchema.parse(await request.json());
    const type = toNestEventType(body.type);
    const format = toNestEventFormat(body.format);
    if (!type || !format) {
      return NextResponse.json({ error: "Invalid event type or format." }, { status: 400 });
    }

    const event = await nestCreateEvent(
      {
        title: body.title.trim(),
        type,
        format,
        city: body.city.trim(),
        venue: body.venue.trim(),
        startsAt: body.startsAt,
        capacity: body.capacity,
        blurb: body.blurb.trim(),
      },
      token,
    );
    return NextResponse.json({ event: mapNestEvent(event) }, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: "Invalid event data." }, { status: 400 });
    }
    if (error instanceof NestApiError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }
    return NextResponse.json({ error: "Could not create event." }, { status: 500 });
  }
}

export async function PATCH(request: Request) {
  const session = await requireSession(["admin"]);
  const token = await getAccessToken();
  if (!session || !token) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = patchSchema.parse(await request.json());
    const patch: Record<string, unknown> = {};
    if (body.active !== undefined) patch.isActive = body.active;
    if (body.title !== undefined) patch.title = body.title.trim();
    if (body.city !== undefined) patch.city = body.city.trim();
    if (body.venue !== undefined) patch.venue = body.venue.trim();
    if (body.startsAt !== undefined) patch.startsAt = body.startsAt;
    if (body.capacity !== undefined) patch.capacity = body.capacity;
    if (body.blurb !== undefined) patch.blurb = body.blurb.trim();
    if (body.type !== undefined) {
      const type = toNestEventType(body.type);
      if (!type) {
        return NextResponse.json({ error: "Invalid event type." }, { status: 400 });
      }
      patch.type = type;
    }
    if (body.format !== undefined) {
      const format = toNestEventFormat(body.format);
      if (!format) {
        return NextResponse.json({ error: "Invalid event format." }, { status: 400 });
      }
      patch.format = format;
    }

    const event = await nestUpdateEvent(body.id, patch, token);
    return NextResponse.json({ event: mapNestEvent(event) });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: "Invalid event update." }, { status: 400 });
    }
    if (error instanceof NestApiError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }
    return NextResponse.json({ error: "Could not update event." }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  const session = await requireSession(["admin"]);
  const token = await getAccessToken();
  if (!session || !token) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const id = new URL(request.url).searchParams.get("id");
  if (!id) {
    return NextResponse.json({ error: "Missing event id." }, { status: 400 });
  }

  try {
    await nestDeleteEvent(id, token);
    return NextResponse.json({ ok: true });
  } catch (error) {
    if (error instanceof NestApiError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }
    return NextResponse.json({ error: "Could not delete event." }, { status: 500 });
  }
}
