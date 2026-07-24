/**
 * src/services/categories.ts
 * ─────────────────────────────────────────────────────────────────────────────
 * Category service — the single source of truth for shop categories on the
 * public website.
 *
 * Strategy:
 *   1. Try a dedicated `categories` table first (preferred if it exists).
 *   2. If the table is missing or empty, fall back to deriving categories
 *      from the distinct `category` values in the `products` table.
 *
 * Either way the caller gets a consistent `Category[]` with normalized
 * display names (legacy aliases handled via normalizeCategory).
 * ─────────────────────────────────────────────────────────────────────────────
 */

import { supabase } from "@/lib/supabase";
import { normalizeCategory } from "@/lib/data";
import type {
  Category,
  DbCategoryRow,
  ServiceResult,
} from "@/services/types";
import { ok, fail } from "@/services/types";

/**
 * Fetch all categories shown on the public website.
 *
 * Tries the `categories` table first. If that table doesn't exist (Postgres
 * error code 42P01 — undefined_table) or returns no rows, derives categories
 * from the `products` table instead.
 */
export async function getCategories(): Promise<ServiceResult<Category[]>> {
  // ── 1. Try the dedicated categories table ──────────────────────────────
  try {
    const { data, error } = await supabase
      .from("categories")
      .select("name, slug, image_url")
      .order("name", { ascending: true });

    if (!error && data && data.length > 0) {
      const categories = (data as DbCategoryRow[])
        .map((row) => mapDbCategory(row))
        // De-dupe by normalized name in case the table has legacy + current
        // spellings of the same category.
        .filter(
          (cat, idx, self) =>
            self.findIndex((c) => c.name === cat.name) === idx
        );
      return ok(categories);
    }

    // If the error is anything other than "table missing", surface it.
    if (error && error.code !== "42P01" && error.code !== "PGRST205") {
      console.error("[categories] Error fetching from categories table:", error);
      // Fall through to products-derived fallback below.
    }
  } catch (err) {
    // Network/runtime error — log and fall through to fallback.
    console.error("[categories] categories table query threw:", err);
  }

  // ── 2. Fall back to distinct categories from products ──────────────────
  return getCategoriesFromProducts();
}

/**
 * Derive categories from the distinct `category` values on the products
 * table. Used when there is no dedicated categories table (or it is empty).
 */
async function getCategoriesFromProducts(): Promise<ServiceResult<Category[]>> {
  // Supabase's PostgREST supports `select(category)` to fetch just the
  // column, and the special header `Range` / `.limit()` for paging.
  // For distinct values we read the column and de-dupe in JS — simplest
  // approach that works on every PostgREST version.
  const { data, error } = await supabase
    .from("products")
    .select("category")
    .order("category", { ascending: true });

  if (error) {
    console.error("[categories] Error fetching categories from products:", error);
    return fail("We couldn't load the category list. Please try again shortly.");
  }

  if (!data || data.length === 0) {
    return ok([]);
  }

  const seen = new Set<string>();
  const categories: Category[] = [];
  for (const row of data as { category: string }[]) {
    const name = normalizeCategory(row.category);
    if (!name || seen.has(name)) continue;
    seen.add(name);
    categories.push({ name });
  }

  return ok(categories);
}

/**
 * Map a raw categories-table row to the public `Category` shape.
 */
function mapDbCategory(row: DbCategoryRow): Category {
  return {
    name: normalizeCategory(row.name),
    slug: row.slug ?? undefined,
    imageUrl: row.image_url ?? undefined,
  };
}
