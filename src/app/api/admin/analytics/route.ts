import { NextResponse } from "next/server";
import { requireSession } from "@/lib/auth";
import { getAdminAnalytics } from "@/lib/analytics";

export async function GET() {
  const session = await requireSession(["admin"]);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  return NextResponse.json(await getAdminAnalytics());
}
