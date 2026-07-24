/**
 * src/services/types.ts
 * ─────────────────────────────────────────────────────────────────────────────
 * Centralized types for the services layer.
 *
 * These types describe the data as the PUBLIC WEBSITE consumes it — already
 * mapped from the raw Supabase snake_case schema into the camelCase shape
 * that React components expect.
 * ─────────────────────────────────────────────────────────────────────────────
 */

/**
 * A medicine / product sold on Pulse Pharma.
 *
 * The shape mirrors the existing `Product` interface from `src/lib/data.ts`
 * so existing components continue to work unchanged.
 */
export interface Medicine {
  id: string;
  name: string;
  description: string;
  price: number;
  category: string;
  isPrescriptionRequired: boolean;
  inStock: boolean;
  imageUrl: string;
  brand: string;
  dosage: string;
}

/**
 * Alias kept for backward-compatibility with components that import
 * `Product` from `@/lib/data`. Functionally identical to `Medicine`.
 */
export type Product = Medicine;

/**
 * A shop category.
 * `slug` is optional because categories derived from the products table
 * (via DISTINCT) do not have slugs — only a dedicated categories table does.
 */
export interface Category {
  name: string;
  slug?: string;
  imageUrl?: string;
}

/**
 * Standardized result wrapper used across the services layer.
 *
 * Every service function returns one of these so callers can handle
 * success/error uniformly without try/catch everywhere:
 *
 *   const { data, error } = await getAllMedicines();
 *   if (error) return <ErrorBanner message={error} />;
 *   return <ProductGrid products={data} />;
 */
export interface ServiceResult<T> {
  data: T | null;
  error: string | null;
}

/** Convenience helper: build a successful result. */
export function ok<T>(data: T): ServiceResult<T> {
  return { data, error: null };
}

/** Convenience helper: build an error result. */
export function fail<T>(error: string): ServiceResult<T> {
  return { data: null, error };
}

/**
 * Raw Supabase row shape for the `products` table (snake_case).
 * Used internally by the services layer to map rows → Medicine.
 */
export interface DbProductRow {
  id: string;
  name: string;
  description: string | null;
  price: number;
  category: string;
  is_prescription_required: boolean;
  in_stock: boolean;
  stock_quantity: number;
  image_url: string | null;
  brand: string | null;
  dosage: string | null;
  created_at: string;
}

/**
 * Raw Supabase row shape for the `categories` table (snake_case).
 * All fields except `name` are optional because the table may not exist
 * or may have a minimal schema.
 */
export interface DbCategoryRow {
  id?: string;
  name: string;
  slug?: string | null;
  image_url?: string | null;
}

/**
 * The two roles supported by the app.
 * - `customer` is the default assigned to every newly signed-up user.
 * - `admin` can only be granted at the database level (never self-assigned).
 */
export type UserRole = "customer" | "admin";

/**
 * A user's profile row, linked 1:1 to `auth.users.id`.
 *
 * Created automatically by a database trigger on signup (see
 * `supabase/profiles-and-rls.sql`). `role` always defaults to `customer`.
 */
export interface Profile {
  id: string;
  fullName: string;
  email: string;
  phone: string;
  role: UserRole;
  createdAt: string;
  updatedAt: string;
}

/** Raw snake_case row shape for the `profiles` table. */
export interface DbProfileRow {
  id: string;
  full_name: string | null;
  email: string | null;
  phone: string | null;
  role: string | null;
  created_at: string;
  updated_at: string;
}

/**
 * Query options accepted by `getAllMedicines`.
 */
export interface MedicineQueryOptions {
  /** Filter to a single category (already normalized display name). */
  category?: string;
  /** Case-insensitive search across name + description. */
  search?: string;
  /** Sort strategy. Defaults to alphabetical by name. */
  sortBy?: "name-asc" | "name-desc" | "price-asc" | "price-desc" | "newest";
  /** Cap the number of results. */
  limit?: number;
  /** Pagination offset. */
  offset?: number;
  /** Only include in-stock items. */
  inStockOnly?: boolean;
  /** Only include prescription-required items. */
  prescriptionOnly?: boolean;
}
