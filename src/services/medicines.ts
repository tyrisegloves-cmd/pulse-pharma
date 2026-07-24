/**
 * src/services/medicines.ts
 * ─────────────────────────────────────────────────────────────────────────────
 * Medicine service — all product/medicine queries for the public website.
 *
 * Every function here:
 *   • Talks to Supabase via the shared client in `@/lib/supabase`
 *   • Selects only the columns it needs (no `select("*")`)
 *   • Returns a `ServiceResult<T>` so callers handle errors uniformly
 *   • Normalizes legacy category names via `normalizeCategory()`
 *
 * Usage (server component):
 *   import { getAllMedicines } from "@/services/medicines";
 *   const { data, error } = await getAllMedicines({ limit: 4 });
 * ─────────────────────────────────────────────────────────────────────────────
 */

import { supabase } from "@/lib/supabase";
import { normalizeCategory, CATEGORY_ALIASES } from "@/lib/data";
import type {
  Medicine,
  DbProductRow,
  ServiceResult,
  MedicineQueryOptions,
} from "@/services/types";
import { ok, fail } from "@/services/types";

/**
 * Columns we select whenever we fetch a product. Centralized so we never
 * accidentally pull a column we don't render (and so adding a new column
 * to the SELECT is a one-line change).
 */
const PRODUCT_COLUMNS =
  "id, name, description, price, category, is_prescription_required, in_stock, image_url, brand, dosage";

/** Generic "something went wrong" message surfaced to end users. */
const FRIENDLY_ERROR =
  "We couldn't load the products right now. Please try again shortly.";

/**
 * Map a raw Supabase row (snake_case) to the public Medicine shape.
 */
function mapRow(row: DbProductRow): Medicine {
  return {
    id: row.id,
    name: row.name,
    description: row.description ?? "",
    price: Number(row.price),
    category: normalizeCategory(row.category),
    isPrescriptionRequired: row.is_prescription_required,
    inStock: row.in_stock,
    imageUrl: row.image_url ?? "",
    brand: row.brand ?? "",
    dosage: row.dosage ?? "",
  };
}

/**
 * Apply the sort option from `MedicineQueryOptions` to a Supabase query.
 * Returns the query builder for chaining.
 */
function applySort<T extends { order: (column: string, options: { ascending: boolean }) => T }>(
  query: T,
  sortBy: MedicineQueryOptions["sortBy"]
): T {
  switch (sortBy) {
    case "name-desc":
      return query.order("name", { ascending: false });
    case "price-asc":
      return query.order("price", { ascending: true });
    case "price-desc":
      return query.order("price", { ascending: false });
    case "newest":
      return query.order("created_at", { ascending: false });
    case "name-asc":
    default:
      return query.order("name", { ascending: true });
  }
}

/**
 * The primary medicines query. Supports filtering, searching, sorting,
 * and pagination.
 *
 * @example
 *   // Featured products on the home page
 *   const { data } = await getAllMedicines({ limit: 4 });
 *
 *   // A category page
 *   const { data } = await getAllMedicines({ category: "Pain Relief" });
 *
 *   // Search results
 *   const { data } = await getAllMedicines({ search: "paracetamol" });
 */
export async function getAllMedicines(
  options: MedicineQueryOptions = {}
): Promise<ServiceResult<Medicine[]>> {
  const {
    category,
    search,
    sortBy = "name-asc",
    limit,
    offset,
    inStockOnly = false,
    prescriptionOnly = false,
  } = options;

  // Supabase's `.from()` returns a typed query builder; chain filters from here.
  // We cast through the build chain because PostgREST typing on `.or()` is loose.
  let query = supabase.from("products").select(PRODUCT_COLUMNS);

  // ── Category filter ────────────────────────────────────────────────────
  // Match BOTH the normalized name AND any legacy aliases that may still be
  // stored in the DB. e.g. selecting "Wellness & Supplements" should also
  // match legacy rows where category = "Wellness".
  if (category) {
    const aliases = Object.entries(CATEGORY_ALIASES)
      .filter(([, current]) => current === category)
      .map(([legacy]) => legacy);
    const candidates = [category, ...aliases];
    const orClause = candidates
      .map((c) => `category.eq.${c}`)
      .join(",");
    query = query.or(orClause);
  }

  // Search filter (case-insensitive by medicine name).
  if (search && search.trim()) {
    const term = search.trim();
    query = query.ilike("name", `%${term}%`);
  }

  // ── Stock + Rx filters ─────────────────────────────────────────────────
  if (inStockOnly) {
    query = query.eq("in_stock", true);
  }
  if (prescriptionOnly) {
    query = query.eq("is_prescription_required", true);
  }

  // ── Sort ───────────────────────────────────────────────────────────────
  query = applySort(query, sortBy);

  // ── Pagination ─────────────────────────────────────────────────────────
  if (typeof limit === "number" && limit > 0) {
    query = query.limit(limit);
  }
  if (typeof offset === "number" && offset > 0) {
    query = query.range(offset, offset + (limit ?? 50) - 1);
  }

  const { data, error } = await query;

  if (error) {
    console.error("[medicines] getAllMedicines error:", error);
    return fail(FRIENDLY_ERROR);
  }

  return ok((data as DbProductRow[]).map(mapRow));
}

/**
 * Fetch a single medicine by id.
 *
 * @returns `{ data: null, error: null }` if the id doesn't match anything
 *          (so the caller can distinguish "not found" from "request failed").
 */
export async function getMedicineById(
  id: string
): Promise<ServiceResult<Medicine>> {
  if (!id) {
    return fail("Invalid product id.");
  }

  const { data, error } = await supabase
    .from("products")
    .select(PRODUCT_COLUMNS)
    .eq("id", id)
    .maybeSingle();

  if (error) {
    console.error(`[medicines] getMedicineById(${id}) error:`, error);
    return fail(FRIENDLY_ERROR);
  }

  if (!data) {
    // Not found — no error, just empty data.
    return ok(null as unknown as Medicine);
  }

  return ok(mapRow(data as DbProductRow));
}

/**
 * Search medicines by free-text query. Convenience wrapper around
 * `getAllMedicines({ search })`.
 */
export async function searchMedicines(
  query: string,
  limit = 20
): Promise<ServiceResult<Medicine[]>> {
  return getAllMedicines({ search: query, limit });
}

/**
 * Fetch all medicines in a given category.
 */
export async function getMedicinesByCategory(
  category: string,
  limit?: number
): Promise<ServiceResult<Medicine[]>> {
  return getAllMedicines({ category, limit });
}

/**
 * Fetch medicines related to a given product — same category, excluding the
 * product itself. Used by the product detail page's "Related Products" rail.
 */
export async function getRelatedMedicines(
  category: string,
  excludeId: string,
  limit = 4
): Promise<ServiceResult<Medicine[]>> {
  // Reuse getAllMedicines for the heavy lifting (category + alias matching),
  // then strip the excluded id in JS. The exclusion could be done in SQL with
  // `.neq("id", excludeId)` but building that into the options API would
  // couple it to this one use case; keeping it simple here.
  const { data, error } = await getAllMedicines({ category, limit: limit + 1 });

  if (error || !data) {
    return { data: null, error };
  }

  return ok(data.filter((m) => m.id !== excludeId).slice(0, limit));
}

/**
 * Fetch a batch of medicines by id (used by the cart to hydrate line items).
 *
 * Returns the medicines in the same order as the input ids.
 */
export async function getMedicinesByIds(
  ids: string[]
): Promise<ServiceResult<Medicine[]>> {
  if (ids.length === 0) return ok([]);

  const { data, error } = await supabase
    .from("products")
    .select(PRODUCT_COLUMNS)
    .in("id", ids);

  if (error) {
    console.error("[medicines] getMedicinesByIds error:", error);
    return fail(FRIENDLY_ERROR);
  }

  const rows = (data as DbProductRow[]).map(mapRow);
  // Preserve input order.
  const byId = new Map(rows.map((m) => [m.id, m]));
  return ok(ids.map((id) => byId.get(id)).filter(Boolean) as Medicine[]);
}
