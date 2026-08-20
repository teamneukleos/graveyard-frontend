import { NextResponse } from "next/server";
import { z } from "zod";
import { getAccessToken, requireSession } from "@/lib/auth";
import {
  NestApiError,
  nestEnterAwardCycle,
  nestWithdrawAwardEntry,
} from "@/lib/nest/client";

const bodySchema = z.object({
  cycleId: z.string().min(1),
  submissionId: z.string().min(1),
});

export async function POST(request: Request) {
  const session = await requireSession(["creator", "agency", "admin"]);
  const token = await getAccessToken();
  if (!session || !token) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = bodySchema.parse(await request.json());
    const entry = await nestEnterAwardCycle(body.cycleId, body.submissionId, token);
    return NextResponse.json(entry);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: "Invalid request." }, { status: 400 });
    }
    if (error instanceof NestApiError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }
    console.error("[awards/entries]", error);
    return NextResponse.json({ error: "Could not enter award cycle." }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  const session = await requireSession(["creator", "agency", "admin"]);
  const token = await getAccessToken();
  if (!session || !token) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = bodySchema.parse(await request.json());
    const result = await nestWithdrawAwardEntry(
      body.cycleId,
      body.submissionId,
      token,
    );
    return NextResponse.json(result);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: "Invalid request." }, { status: 400 });
    }
    if (error instanceof NestApiError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }
    console.error("[awards/entries]", error);
    return NextResponse.json({ error: "Could not withdraw entry." }, { status: 500 });
  }
}
