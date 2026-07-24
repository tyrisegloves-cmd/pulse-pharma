/**
 * src/lib/products.ts
 * ─────────────────────────────────────────────────────────────────────────────
 * Backward-compatibility shim.
 *
 * All actual database logic now lives in `src/services/medicines.ts`.
 * This file re-exports the same function signatures so that any older
 * import paths continue to work without changes.
 *
 * Prefer importing directly from `@/services/medicines` in new code.
 * ─────────────────────────────────────────────────────────────────────────────
 */

import {
  getAllMedicines,
  getMedicineById,
  getRelatedMedicines,
} from "@/services/medicines";
import type { Medicine } from "@/services/types";
import type { DbProductRow } from "@/services/types";

/** Re-exported for backward compatibility. */
export type DbProduct = DbProductRow;

/**
 * Fetch all products from Supabase, ordered by name.
 * @deprecated Use `getAllMedicines()` from `@/services/medicines` instead.
 */
export async function getProducts(): Promise<Medicine[]> {
  const { data } = await getAllMedicines({ sortBy: "name-asc" });
  return data ?? [];
}

/**
 * Fetch a single product by ID.
 * @deprecated Use `getMedicineById()` from `@/services/medicines` instead.
 */
export async function getProductById(id: string): Promise<Medicine | null> {
  const { data } = await getMedicineById(id);
  return data ?? null;
}

/**
 * Fetch related products in the same category, excluding current product ID.
 * @deprecated Use `getRelatedMedicines()` from `@/services/medicines` instead.
 */
export async function getRelatedProducts(
  category: string,
  excludeId: string,
  limit = 4
): Promise<Medicine[]> {
  const { data } = await getRelatedMedicines(category, excludeId, limit);
  return data ?? [];
}
