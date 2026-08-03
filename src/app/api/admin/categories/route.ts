import { and, asc, eq, ne } from "drizzle-orm";
import { NextResponse } from "next/server";
import { v4 as uuid } from "uuid";
import { z } from "zod";
import { db } from "@/db";
import { categories, submissions } from "@/db/schema";
import { requireSession } from "@/lib/auth";
import { getAllCategories, slugifyCategory } from "@/lib/categories";
import { CATEGORY_COLORS, type Category } from "@/lib/constants";

const createSchema = z.object({
  name: z.string().min(2).max(80),
});

const patchSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(2).max(80).optional(),
  active: z.boolean().optional(),
  sortOrder: z.number().int().optional(),
  direction: z.enum(["up", "down"]).optional(),
});

export async function GET() {
  const session = await requireSession(["admin"]);
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  return NextResponse.json({ categories: await getAllCategories() });
}

export async function POST(request: Request) {
  const session = await requireSession(["admin"]);
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const data = createSchema.parse(body);
    const name = data.name.trim();
    const slug = slugifyCategory(name);

    if (!slug) {
      return NextResponse.json({ error: "Invalid category name." }, { status: 400 });
    }

    const existingName = await db.query.categories.findFirst({
      where: eq(categories.name, name),
    });
    if (existingName) {
      return NextResponse.json({ error: "Category already exists." }, { status: 409 });
    }

    const existingSlug = await db.query.categories.findFirst({
      where: eq(categories.slug, slug),
    });
    if (existingSlug) {
      return NextResponse.json({ error: "Category slug already exists." }, { status: 409 });
    }

    const all = await db.query.categories.findMany({
      orderBy: [asc(categories.sortOrder)],
    });
    const maxOrder = all.reduce((max, c) => Math.max(max, c.sortOrder), -1);
    const colors =
      name in CATEGORY_COLORS
        ? CATEGORY_COLORS[name as Category]
        : { bg: "#111111", fg: "#ffffff" };

    const row = {
      id: uuid(),
      name,
      slug,
      sortOrder: maxOrder + 1,
      active: true,
      colorBg: colors.bg,
      colorFg: colors.fg,
      createdAt: new Date().toISOString(),
    };

    await db.insert(categories).values(row);

    return NextResponse.json(
      {
        category: {
          id: row.id,
          name: row.name,
          slug: row.slug,
          sortOrder: row.sortOrder,
          active: row.active,
          colorBg: row.colorBg,
          colorFg: row.colorFg,
        },
      },
      { status: 201 },
    );
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: "Invalid category data." }, { status: 400 });
    }
    return NextResponse.json({ error: "Could not create category." }, { status: 500 });
  }
}

export async function PATCH(request: Request) {
  const session = await requireSession(["admin"]);
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const data = patchSchema.parse(body);

    const current = await db.query.categories.findFirst({
      where: eq(categories.id, data.id),
    });
    if (!current) {
      return NextResponse.json({ error: "Category not found." }, { status: 404 });
    }

    if (data.direction) {
      const all = await db.query.categories.findMany({
        orderBy: [asc(categories.sortOrder), asc(categories.name)],
      });
      const index = all.findIndex((c) => c.id === current.id);
      const swapWith = data.direction === "up" ? index - 1 : index + 1;
      if (index < 0 || swapWith < 0 || swapWith >= all.length) {
        return NextResponse.json({ categories: await getAllCategories() });
      }

      const other = all[swapWith];
      await db
        .update(categories)
        .set({ sortOrder: other.sortOrder })
        .where(eq(categories.id, current.id));
      await db
        .update(categories)
        .set({ sortOrder: current.sortOrder })
        .where(eq(categories.id, other.id));

      return NextResponse.json({ categories: await getAllCategories() });
    }

    const updates: Partial<typeof categories.$inferInsert> = {};

    if (typeof data.active === "boolean") {
      updates.active = data.active;
    }

    if (typeof data.sortOrder === "number") {
      updates.sortOrder = data.sortOrder;
    }

    if (data.name && data.name.trim() !== current.name) {
      const name = data.name.trim();
      const slug = slugifyCategory(name);
      if (!slug) {
        return NextResponse.json({ error: "Invalid category name." }, { status: 400 });
      }

      const clash = await db.query.categories.findFirst({
        where: and(eq(categories.name, name), ne(categories.id, current.id)),
      });
      if (clash) {
        return NextResponse.json({ error: "Category already exists." }, { status: 409 });
      }

      const slugClash = await db.query.categories.findFirst({
        where: and(eq(categories.slug, slug), ne(categories.id, current.id)),
      });
      if (slugClash) {
        return NextResponse.json({ error: "Category slug already exists." }, { status: 409 });
      }

      updates.name = name;
      updates.slug = slug;

      await db
        .update(submissions)
        .set({ category: name })
        .where(eq(submissions.category, current.name));
    }

    if (Object.keys(updates).length > 0) {
      await db.update(categories).set(updates).where(eq(categories.id, current.id));
    }

    const updated = await db.query.categories.findFirst({
      where: eq(categories.id, current.id),
    });

    return NextResponse.json({
      category: updated
        ? {
            id: updated.id,
            name: updated.name,
            slug: updated.slug,
            sortOrder: updated.sortOrder,
            active: updated.active,
            colorBg: updated.colorBg,
            colorFg: updated.colorFg,
          }
        : null,
      categories: await getAllCategories(),
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: "Invalid category data." }, { status: 400 });
    }
    return NextResponse.json({ error: "Could not update category." }, { status: 500 });
  }
}
