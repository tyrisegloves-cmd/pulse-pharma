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
 * Usage — import this wherever you need to talk to Supabase from the browser
 * or from a server component doing an anon (public) read:
 *   import { supabase } from '@/lib/supabase'
 *
 * Environment variables required in .env.local:
 *   NEXT_PUBLIC_SUPABASE_URL      — your project URL
 *   NEXT_PUBLIC_SUPABASE_ANON_KEY — your project's anon/public key
 * ─────────────────────────────────────────────────────────────────────────────
 */

import { createBrowserClient } from "@supabase/ssr";
import type { SupabaseClient } from "@supabase/supabase-js";

// ── 1. Read & validate environment variables ──────────────────────────────────

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl) {
  throw new Error(
    "[Supabase] Missing env var: NEXT_PUBLIC_SUPABASE_URL\n" +
      "Add it to your .env.local file and restart the dev server."
  );
}

if (!supabaseAnonKey) {
  throw new Error(
    "[Supabase] Missing env var: NEXT_PUBLIC_SUPABASE_ANON_KEY\n" +
      "Add it to your .env.local file and restart the dev server."
  );
}

// ── 2. Create the singleton browser client ────────────────────────────────────
//
// `createBrowserClient` wires up cookie storage automatically. The session is
// persisted in cookies (readable by middleware) instead of localStorage, and
// tokens are auto-refreshed. `detectSessionInUrl` is handled by @supabase/ssr
// for OAuth / magic-link / password-reset redirects.

export const supabase: SupabaseClient = createBrowserClient(
  supabaseUrl,
  supabaseAnonKey,
  {
    auth: {
      // Persist in cookies so the server (middleware) can read the session.
      // @supabase/ssr manages this internally — these flags keep the behavior
      // equivalent to the old localStorage client (stay logged in + refresh).
      autoRefreshToken: true,
      persistSession: true,
      detectSessionInUrl: true,
    },
  }
);

// ── 3. Named helper — verify the connection is alive ─────────────────────────
//
// Call this once on app start (e.g. in a server action or API route) to confirm
// that the credentials are correct and the project is reachable.
//
// Example:
//   import { verifySupabaseConnection } from '@/lib/supabase'
//   await verifySupabaseConnection()

export async function verifySupabaseConnection(): Promise<void> {
  // `getSession` is a lightweight auth-only call — it does not hit your DB tables
  // and works even if you have no tables yet.
  const { error } = await supabase.auth.getSession();

  if (error) {
    console.error("[Supabase] Connection check failed:", error.message);
    throw new Error(`Supabase connection error: ${error.message}`);
  }

  console.log("[Supabase] ✅ Connected successfully to", supabaseUrl);
}
