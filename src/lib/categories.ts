import { CATEGORY_COLORS, categoryColor, type Category } from "@/lib/constants";
import { nestAdminCategories, nestCategories } from "@/lib/nest/client";
import { safeApi } from "@/lib/nest/mappers";

export type CategoryListItem = {
  id: string;
  name: string;
  slug: string;
  sortOrder: number;
  active: boolean;
  colorBg: string;
  colorFg: string;
  description: string | null;
};

export function slugifyCategory(name: string) {
  return name
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

function toListItem(row: {
  id: string;
  name: string;
  slug: string;
  sortOrder: number;
  description: string | null;
  isActive?: boolean;
}): CategoryListItem {
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

export async function getAllCategories() {
  const rows = await safeApi(nestCategories(), []);
  return rows.map(toListItem).sort((a, b) => a.sortOrder - b.sortOrder || a.name.localeCompare(b.name));
}

/** Includes inactive categories (admin). Falls back to public list. */
export async function getAdminCategories() {
  const rows = await safeApi(nestAdminCategories(), []);
  if (rows.length) {
    return rows.map(toListItem).sort((a, b) => a.sortOrder - b.sortOrder || a.name.localeCompare(b.name));
  }
  return getAllCategories();
}

export async function getActiveCategories() {
  return getAllCategories();
}

export async function getActiveCategoryNames() {
  const rows = await getActiveCategories();
  return rows.map((c) => c.name);
}

export async function isActiveCategoryName(name: string) {
  const rows = await getActiveCategories();
  return rows.some((c) => c.name === name);
}

export async function findCategoryByName(name: string) {
  const rows = await getActiveCategories();
  return rows.find((c) => c.name === name) ?? null;
}

export async function findCategoryBySlug(slug: string) {
  const rows = await getActiveCategories();
  return rows.find((c) => c.slug === slug || c.name === slug) ?? null;
}

export async function isKnownCategoryName(name: string) {
  return Boolean(await findCategoryByName(name));
}

export function categoryColorFromRow(category: string, row?: CategoryListItem | null) {
  if (row) {
    return { bg: row.colorBg, fg: row.colorFg, soft: row.colorBg };
  }
  if (category in CATEGORY_COLORS) {
    return CATEGORY_COLORS[category as Category];
  }
  return { bg: "#111111", fg: "#ffffff", soft: "#F5F5F7" };
}
