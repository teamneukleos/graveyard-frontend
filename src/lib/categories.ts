import { asc, eq } from "drizzle-orm";
import { db } from "@/db";
import { categories, type CategoryRow } from "@/db/schema";
import { CATEGORY_COLORS, type Category } from "@/lib/constants";

export type CategoryListItem = {
  id: string;
  name: string;
  slug: string;
  sortOrder: number;
  active: boolean;
  colorBg: string;
  colorFg: string;
};

export function slugifyCategory(name: string) {
  return name
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

function toListItem(row: CategoryRow): CategoryListItem {
  return {
    id: row.id,
    name: row.name,
    slug: row.slug,
    sortOrder: row.sortOrder,
    active: row.active,
    colorBg: row.colorBg,
    colorFg: row.colorFg,
  };
}

export async function getAllCategories() {
  const rows = await db.query.categories.findMany({
    orderBy: [asc(categories.sortOrder), asc(categories.name)],
  });
  return rows.map(toListItem);
}

export async function getActiveCategories() {
  const rows = await db.query.categories.findMany({
    where: eq(categories.active, true),
    orderBy: [asc(categories.sortOrder), asc(categories.name)],
  });
  return rows.map(toListItem);
}

export async function getActiveCategoryNames() {
  const rows = await getActiveCategories();
  return rows.map((c) => c.name);
}

export async function isActiveCategoryName(name: string) {
  const row = await db.query.categories.findFirst({
    where: eq(categories.name, name),
  });
  return Boolean(row?.active);
}

export async function findCategoryByName(name: string) {
  return db.query.categories.findFirst({
    where: eq(categories.name, name),
  });
}

export async function isKnownCategoryName(name: string) {
  const row = await findCategoryByName(name);
  return Boolean(row);
}

/** Resolve display colors from DB row or seeded constants fallback. */
export function categoryColorFromRow(category: string, row?: CategoryListItem | null) {
  if (row) {
    return { bg: row.colorBg, fg: row.colorFg, soft: row.colorBg };
  }
  if (category in CATEGORY_COLORS) {
    return CATEGORY_COLORS[category as Category];
  }
  return { bg: "#111111", fg: "#ffffff", soft: "#F5F5F7" };
}
