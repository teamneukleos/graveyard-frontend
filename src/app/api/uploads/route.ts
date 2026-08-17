import { NextResponse } from "next/server";
import { getAccessToken, requireSession } from "@/lib/auth";
import { NestApiError, nestUploadAsset } from "@/lib/nest/client";

export async function POST(request: Request) {
  const session = await requireSession(["creator", "admin"]);
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const token = await getAccessToken();
  if (!token) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const form = await request.formData();
  const submissionId = String(form.get("submissionId") || "");
  const file = form.get("file");

  if (!submissionId || !(file instanceof File)) {
    return NextResponse.json({ error: "Missing file or submission." }, { status: 400 });
  }

  const name = file.name.toLowerCase();
  const mime = file.type.toLowerCase();
  if (
    name.endsWith(".ppt") ||
    name.endsWith(".pptx") ||
    name.endsWith(".zip") ||
    mime.includes("presentation") ||
    mime.includes("zip")
  ) {
    return NextResponse.json(
      {
        error:
          "PowerPoint and ZIP uploads are not supported yet. Upload an image, video, or PDF (or link a deck in the API).",
      },
      { status: 400 },
    );
  }

  try {
    const asset = (await nestUploadAsset(submissionId, file, file.name, token)) as {
      id?: string;
      url?: string;
      fileName?: string | null;
      mimeType?: string | null;
    };

    return NextResponse.json(
      {
        asset: {
          id: asset.id ?? crypto.randomUUID(),
          originalName: file.name,
          filename: asset.fileName || file.name,
          url: asset.url ?? null,
          mimeType: asset.mimeType || file.type || "application/octet-stream",
        },
      },
      { status: 201 },
    );
  } catch (error) {
    if (error instanceof NestApiError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }
    return NextResponse.json({ error: "Upload failed." }, { status: 500 });
  }
}
