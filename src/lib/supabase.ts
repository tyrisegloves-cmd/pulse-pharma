/**
 * src/lib/supabase.ts
 * ─────────────────────────────────────────────────────────────────────────────
 * Cookie-based Supabase browser client for the Pulse Pharma Next.js app.
 *
 * WHY COOKIES (not localStorage):
 *   Next.js middleware runs in the Edge runtime and CANNOT read localStorage.
 *   Server-side route protection and authenticated server reads therefore
 *   require the auth session to live in cookies. `@supabase/ssr`'s
 *   `createBrowserClient` stores the session in cookies, which both the
 *   browser and the server (via `createServerClient` in `./supabase/server.ts`)
 *   can read. This is Supabase's officially recommended approach for the
 *   Next.js App Router.
 *
 * Same Supabase project & env vars as before — no new project.
 *
 * LAZY INITIALIZATION:
 *   The client is created on first access, not at module-evaluation time.
 *   This means the module can be imported safely even when env vars are not
 *   set (e.g. during a Vercel build before env vars are configured), and the
 *   error only surfaces when code actually tries to use the client.
 *
 * Usage — import this wherever you need to talk to Supabase:
 *   import { supabase } from '@/lib/supabase'
 *
 * Environment variables required in .env.local:
 *   NEXT_PUBLIC_SUPABASE_URL      — your project URL
 *   NEXT_PUBLIC_SUPABASE_ANON_KEY — your project's anon/public key
 * ─────────────────────────────────────────────────────────────────────────────
 */

import { createBrowserClient } from "@supabase/ssr";
import type { SupabaseClient } from "@supabase/supabase-js";

/** Cached singleton — created once on first access. */
let _client: SupabaseClient | null = null;

/**
 * Build the env-var error message. Kept as a function so it's only called
 * when the client is actually accessed (not at import time).
 */
function envError(name: string): Error {
  return new Error(
    `[Supabase] Missing env var: ${name}\n` +
      "Add it to your .env.local file (and in Vercel → Settings → Environment Variables) and restart."
  );
}

/**
 * Lazy-initialized, cookie-based Supabase browser client.
 *
 * The `get()` accessor defers `createBrowserClient` (and the env-var checks)
 * until something actually reads `.supabase`. This prevents the module from
 * crashing the build when env vars are not yet configured on the deploy
 * platform — the error only surfaces at runtime when the client is used.
 */
export const supabase: SupabaseClient = new Proxy({} as SupabaseClient, {
  get(_target, prop, receiver) {
    if (!_client) {
      const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
      const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
      if (!url) throw envError("NEXT_PUBLIC_SUPABASE_URL");
      if (!key) throw envError("NEXT_PUBLIC_SUPABASE_ANON_KEY");
      _client = createBrowserClient(url, key, {
        auth: {
          autoRefreshToken: true,
          persistSession: true,
          detectSessionInUrl: true,
        },
      });
    }
    const value = Reflect.get(_client, prop, receiver);
    // Bind methods so `supabase.auth.getUser()` works without manual binding.
    if (typeof value === "function") return value.bind(_client);
    return value;
  },
});

/**
 * Named helper — verify the connection is alive.
 *
 * Call this once on app start (e.g. in a server action or API route) to confirm
 * that the credentials are correct and the project is reachable.
 */
export async function verifySupabaseConnection(): Promise<void> {
  const { error } = await supabase.auth.getSession();
  if (error) {
    console.error("[Supabase] Connection check failed:", error.message);
    throw new Error(`Supabase connection error: ${error.message}`);
  }
  console.log("[Supabase] ✅ Connected successfully");
}
