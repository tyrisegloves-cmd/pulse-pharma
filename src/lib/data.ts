/**
 * src/lib/data.ts
 * ─────────────────────────────────────────────────────────────────────────────
 * Shared type aliases and backward-compatibility helpers.
 *
 * All database queries live in `src/services/`. This file only keeps:
 *   • The `Product` type alias (for component compatibility)
 *   • The `CATEGORY_ALIASES` map and `normalizeCategory()` helper
 *
 * NOTE: `CATEGORIES` and `MOCK_PRODUCTS` have been removed. Categories now
 * come from Supabase via `getCategories()` in `src/services/categories.ts`.
 * Products come from Supabase via `getAllMedicines()` in `src/services/medicines.ts`.
 * ─────────────────────────────────────────────────────────────────────────────
 */

/** Public product type used by components (re-exported from services for convenience). */
export type { Product } from "@/services/types";

/**
 * Backward-compatibility map for product categories stored in the database
 * under legacy names. When a product is fetched, its category is normalized
 * via this map so it matches the current display names. Add entries here
 * whenever a category is renamed without migrating the DB rows.
 */
export const CATEGORY_ALIASES: Record<string, string> = {
  "Baby & Mother": "Mother & Baby Care",
  Wellness: "Wellness & Supplements",
};

export function normalizeCategory(category: string): string {
  return CATEGORY_ALIASES[category] ?? category;
}