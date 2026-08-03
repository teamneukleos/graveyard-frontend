import { eq } from "drizzle-orm";
import fs from "fs/promises";
import path from "path";
import { NextResponse } from "next/server";
import { v4 as uuid } from "uuid";
import { db } from "@/db";
import { assets, submissions } from "@/db/schema";
import { requireSession } from "@/lib/auth";

const UPLOAD_DIR = path.join(process.cwd(), "data", "uploads");
const ALLOWED = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
  "image/svg+xml",
  "video/mp4",
  "video/webm",
  "application/pdf",
  "application/vnd.ms-powerpoint",
  "application/vnd.openxmlformats-officedocument.presentationml.presentation",
  "application/zip",
]);

export async function POST(request: Request) {
  const session = await requireSession(["creator", "admin"]);
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const form = await request.formData();
  const submissionId = String(form.get("submissionId") || "");
  const file = form.get("file");

  if (!submissionId || !(file instanceof File)) {
    return NextResponse.json({ error: "Missing file or submission." }, { status: 400 });
  }

  const submission = await db.query.submissions.findFirst({
    where: eq(submissions.id, submissionId),
  });

  if (!submission) {
    return NextResponse.json({ error: "Submission not found." }, { status: 404 });
  }

  if (submission.userId !== session.id && session.role !== "admin") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  if (!ALLOWED.has(file.type) && file.type !== "") {
    return NextResponse.json(
      { error: "Unsupported file type. Upload images, video, PDF, or presentation decks." },
      { status: 400 },
    );
  }

  await fs.mkdir(UPLOAD_DIR, { recursive: true });

  const ext = path.extname(file.name) || "";
  const filename = `${uuid()}${ext}`;
  const buffer = Buffer.from(await file.arrayBuffer());
  await fs.writeFile(path.join(UPLOAD_DIR, filename), buffer);

  const asset = {
    id: uuid(),
    submissionId,
    filename,
    originalName: file.name,
    mimeType: file.type || "application/octet-stream",
    size: buffer.length,
    createdAt: new Date().toISOString(),
  };

  await db.insert(assets).values(asset);
  return NextResponse.json({ asset }, { status: 201 });
}
