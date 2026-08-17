import { NextResponse } from "next/server";
import { z } from "zod";
import { getAccessToken, requireSession } from "@/lib/auth";
import {
  NestApiError,
  nestCancelEventRsvp,
  nestEventRsvp,
} from "@/lib/nest/client";

const schema = z.object({
  eventId: z.string().min(1),
});

export async function POST(request: Request) {
  const session = await requireSession();
  const token = await getAccessToken();
  if (!session || !token) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = schema.parse(await request.json());
    const result = await nestEventRsvp(body.eventId, token);
    return NextResponse.json({
      requested: result.requested,
      spotsLeft: result.spotsLeft,
      status: result.status,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: "Invalid RSVP request." }, { status: 400 });
    }
    if (error instanceof NestApiError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }
    return NextResponse.json({ error: "Could not request seat." }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  const session = await requireSession();
  const token = await getAccessToken();
  if (!session || !token) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = schema.parse(await request.json());
    const result = await nestCancelEventRsvp(body.eventId, token);
    return NextResponse.json({
      requested: result.requested,
      spotsLeft: result.spotsLeft,
      status: result.status,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: "Invalid RSVP request." }, { status: 400 });
    }
    if (error instanceof NestApiError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }
    return NextResponse.json({ error: "Could not cancel seat." }, { status: 500 });
  }
}
