/**
 * src/services/profiles.ts
 * ─────────────────────────────────────────────────────────────────────────────
 * Profile service — reads/updates the user's `profiles` row.
 *
 * Design notes:
 *   • Uses the shared cookie-based browser client from `@/lib/supabase` so the
 *     caller's auth session (cookie) is sent with every request — this is what
 *     makes the RLS policies in `supabase/profiles-and-rls.sql` enforce
 *     "read/update only your own row".
 *   • The `role` column is NEVER accepted from a client payload. New users get
 *     `customer` via the database trigger; admins are assigned only at the DB.
 *   • Returns the standard `ServiceResult<T>` used across the services layer.
 * ─────────────────────────────────────────────────────────────────────────────
 */

import { supabase } from "@/lib/supabase";
import type {
  Profile,
  DbProfileRow,
  UserRole,
  ServiceResult,
} from "@/services/types";
import { ok, fail } from "@/services/types";

/** Friendly error surfaced to end users. */
const FRIENDLY_ERROR =
  "We couldn't load your profile right now. Please try again shortly.";

/** Coerce a raw role string into the safe union, defaulting to `customer`. */
function toRole(value: string | null | undefined): UserRole {
  return value === "admin" ? "admin" : "customer";
}

/** Map a raw Supabase row (snake_case) → public Profile shape. */
function mapProfile(row: DbProfileRow): Profile {
  return {
    id: row.id,
    fullName: row.full_name ?? "",
    email: row.email ?? "",
    phone: row.phone ?? "",
    role: toRole(row.role),
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

/**
 * Fetch the current authenticated user's profile.
 *
 * Requires that the caller is signed in (RLS restricts to `auth.uid() = id`).
 * If no session is present Supabase returns no rows, which we surface as a
 * "not signed in" error rather than a generic failure.
 */
export async function getMyProfile(): Promise<ServiceResult<Profile>> {
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return fail("You must be signed in to view your profile.");
  }

  const { data, error } = await supabase
    .from("profiles")
    .select("id, full_name, email, phone, role, created_at, updated_at")
    .eq("id", user.id)
    .maybeSingle();

  if (error) {
    console.error("[profiles] getMyProfile error:", error);
    return fail(FRIENDLY_ERROR);
  }

  if (!data) {
    // The signup trigger should have created a row. If it's missing (e.g. the
    // SQL hasn't been applied yet), fail clearly so the user knows to retry.
    return fail("Your profile hasn't been created yet. Please try signing out and back in.");
  }

  return ok(mapProfile(data as DbProfileRow));
}

/**
 * Fetch the role for the current user. Convenience wrapper for UI gating.
 */
export async function getUserRole(): Promise<ServiceResult<UserRole>> {
  const { data, error } = await getMyProfile();
  if (error || !data) return { data: null, error };
  return ok(data.role);
}

/**
 * Fields a customer is allowed to edit on their own profile.
 *
 * Deliberately EXCLUDES `role`, `email`, and `id` — those can never be changed
 * from the public site by a customer.
 */
export interface ProfileUpdate {
  fullName?: string;
  phone?: string;
}

/**
 * Update the current user's own profile (full name and/or phone only).
 *
 * RLS guarantees a customer cannot touch anyone else's row or change their role
 * (the `with check` clause requires `role = 'customer'`).
 */
export async function updateMyProfile(
  updates: ProfileUpdate
): Promise<ServiceResult<Profile>> {
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return fail("You must be signed in to update your profile.");
  }

  // Build the patch with ONLY whitelisted columns. Never spread caller input.
  const patch: Record<string, string> = {};
  if (typeof updates.fullName === "string") patch.full_name = updates.fullName;
  if (typeof updates.phone === "string") patch.phone = updates.phone;

  if (Object.keys(patch).length === 0) {
    return fail("Nothing to update.");
  }

  const { data, error } = await supabase
    .from("profiles")
    .update(patch)
    .eq("id", user.id)
    .select("id, full_name, email, phone, role, created_at, updated_at")
    .maybeSingle();

  if (error) {
    console.error("[profiles] updateMyProfile error:", error);
    return fail(FRIENDLY_ERROR);
  }

  if (!data) {
    return fail("Your profile couldn't be found. Please try signing in again.");
  }

  return ok(mapProfile(data as DbProfileRow));
}
