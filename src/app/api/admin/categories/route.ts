import { NextResponse } from "next/server";
import { z } from "zod";
import { getAccessToken, requireSession } from "@/lib/auth";
import { categoryColor } from "@/lib/constants";
import {
  NestApiError,
  nestAdminCategories,
  nestCreateCategory,
  nestUpdateCategory,
} from "@/lib/nest/client";

function serializeCategory(row: {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  sortOrder: number;
  isActive?: boolean;
}) {
  const colors = categoryColor(row.name);
  return {
    id: row.id,
    name: row.name,
    slug: row.slug,
    sortOrder: row.sortOrder,
    active: row.isActive ?? true,
    colorBg: colors.bg,
    colorFg: colors.fg,
    description: row.description,
  };
}

export async function GET() {
  const session = await requireSession(["admin"]);
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const token = await getAccessToken();
  if (!token) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const categories = await nestAdminCategories(token);
    return NextResponse.json({ categories: categories.map(serializeCategory) });
  } catch (error) {
    if (error instanceof NestApiError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }
    return NextResponse.json({ error: "Could not load categories." }, { status: 500 });
  }
}

export async function POST(request: Request) {
  const session = await requireSession(["admin"]);
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const token = await getAccessToken();
  if (!token) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = z.object({ name: z.string().min(2) }).parse(await request.json());
    const category = await nestCreateCategory({ name: body.name.trim() }, token);
    return NextResponse.json({ category: serializeCategory(category) }, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: "Invalid category data." }, { status: 400 });
    }
    if (error instanceof NestApiError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }
    return NextResponse.json({ error: "Could not create category." }, { status: 500 });
  }
}

export async function PATCH(request: Request) {
  const session = await requireSession(["admin"]);
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const token = await getAccessToken();
  if (!token) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = z
      .object({
        id: z.string().min(1),
        name: z.string().min(2).optional(),
        active: z.boolean().optional(),
        direction: z.enum(["up", "down"]).optional(),
      })
      .parse(await request.json());

    const categories = await nestUpdateCategory(
      body.id,
      {
        name: body.name,
        isActive: body.active,
        direction: body.direction,
      },
      token,
    );

    return NextResponse.json({ categories: categories.map(serializeCategory) });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: "Invalid category update." }, { status: 400 });
    }
    if (error instanceof NestApiError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }
    return NextResponse.json({ error: "Could not update category." }, { status: 500 });
  }
}
