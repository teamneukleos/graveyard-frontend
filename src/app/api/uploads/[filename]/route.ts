import { NextResponse } from "next/server";

type Params = { params: Promise<{ filename: string }> };

/** Local upload serving removed — use absolute Nest asset URLs. */
export async function GET(_request: Request, { params }: Params) {
  await params;
  return NextResponse.json(
    { error: "Uploads are served from the Nest API. Use the asset URL directly." },
    { status: 404 },
  );
}
