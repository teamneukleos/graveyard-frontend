import { NextResponse } from "next/server";
import { resolveAssetUrl } from "@/lib/asset-url";
import { getAccessToken, requireSession } from "@/lib/auth";
import { NestApiError, nestUploadAvatar } from "@/lib/nest/client";

export async function POST(request: Request) {
  const session = await requireSession();
  const token = await getAccessToken();
  if (!session || !token) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const form = await request.formData();
  const file = form.get("file");
  if (!(file instanceof File)) {
    return NextResponse.json({ error: "Missing file." }, { status: 400 });
  }

  try {
    const updated = await nestUploadAvatar(token, file, file.name || "avatar.jpg");
    const avatarUrl = resolveAssetUrl(updated.avatarUrl);
    return NextResponse.json({
      avatarUrl,
      user: {
        id: updated.id,
        email: updated.email,
        name: updated.name,
        avatarUrl,
      },
    });
  } catch (error) {
    if (error instanceof NestApiError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }
    return NextResponse.json({ error: "Avatar upload failed." }, { status: 500 });
  }
}
