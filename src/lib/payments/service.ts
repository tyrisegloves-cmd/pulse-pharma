/**
 * src/lib/payments/service.ts
 * ─────────────────────────────────────────────────────────────────────────────
 * SERVER-ONLY Supabase client using the service-role key. Bypasses RLS —
 * used exclusively by trusted server code (payment verification route +
 * Paystack webhook) to transition payment/order statuses.
 *
 * The service-role key must NEVER be exposed to the browser:
 *   .env.local / hosting env vars only — not NEXT_PUBLIC_*.
 * ─────────────────────────────────────────────────────────────────────────────
 */

import { createClient, type SupabaseClient } from "@supabase/supabase-js";

let _serviceClient: SupabaseClient | null = null;

export function createServiceClient(): SupabaseClient {
  if (_serviceClient) return _serviceClient;

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url) {
    throw new Error(
      "[Supabase] Missing env var: NEXT_PUBLIC_SUPABASE_URL — add it to .env.local and restart."
    );
  }
  if (!serviceKey) {
    throw new Error(
      "[Supabase] Missing env var: SUPABASE_SERVICE_ROLE_KEY\n" +
        "Find it in Supabase → Settings → API → service_role (secret). " +
        "It is required for payment status updates and must live only in .env.local."
    );
  }

  _serviceClient = createClient(url, serviceKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });

  return _serviceClient;
}
