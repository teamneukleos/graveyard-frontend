import { eq } from "drizzle-orm";
import fs from "fs/promises";
import path from "path";
import { NextResponse } from "next/server";
import { v4 as uuid } from "uuid";
import { db } from "@/db";
import { users } from "@/db/schema";
import { createSession, requireSession } from "@/lib/auth";

const UPLOAD_DIR = path.join(process.cwd(), "data", "uploads");
const ALLOWED = new Set(["image/jpeg", "image/png", "image/webp", "image/gif"]);

export async function POST(request: Request) {
  const session = await requireSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const form = await request.formData();
  const file = form.get("file");
  if (!(file instanceof File)) {
    return NextResponse.json({ error: "Missing file." }, { status: 400 });
  }
  if (!ALLOWED.has(file.type)) {
    return NextResponse.json({ error: "Upload a JPEG, PNG, WebP, or GIF." }, { status: 400 });
  }

  await fs.mkdir(UPLOAD_DIR, { recursive: true });
  const ext = path.extname(file.name) || ".jpg";
  const filename = `avatar-${uuid()}${ext}`;
  const buffer = Buffer.from(await file.arrayBuffer());
  await fs.writeFile(path.join(UPLOAD_DIR, filename), buffer);

  await db.update(users).set({ avatarFilename: filename }).where(eq(users.id, session.id));
  const updated = await db.query.users.findFirst({ where: eq(users.id, session.id) });
  if (updated) await createSession(updated);

  return NextResponse.json({ avatarFilename: filename });
}
