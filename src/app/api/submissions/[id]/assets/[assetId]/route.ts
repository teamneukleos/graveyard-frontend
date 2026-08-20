import { NextResponse } from "next/server";
import { getAccessToken, requireSession } from "@/lib/auth";
import { NestApiError, nestDeleteAsset } from "@/lib/nest/client";

type Params = { params: Promise<{ id: string; assetId: string }> };

export async function DELETE(_request: Request, { params }: Params) {
  const session = await requireSession(["creator", "agency", "admin"]);
  const token = await getAccessToken();
  if (!session || !token) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id, assetId } = await params;

  try {
    await nestDeleteAsset(id, assetId, token);
    return NextResponse.json({ ok: true });
  } catch (error) {
    if (error instanceof NestApiError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }
    return NextResponse.json({ error: "Could not remove asset." }, { status: 500 });
  }
}
