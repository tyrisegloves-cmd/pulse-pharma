/**
 * src/lib/supabase/server.ts
 * ─────────────────────────────────────────────────────────────────────────────
 * Cookie-based Supabase CLIENT-SIDE-RUNTIME client for Server Components,
 * Route Handlers, Server Actions, and middleware.
 *
 * Unlike the browser singleton in `@/lib/supabase`, this client reads its
 * session from the request cookies (via `next/headers`) and writes refreshed
 * cookies back to the response. That is what lets server code — including
 * middleware in the Edge runtime — read the authenticated session.
 *
 * Same Supabase project & env vars as the browser client. No new project.
 *
 * Usage (Server Component / Route Handler / Server Action):
 *   import { createServerClient } from "@/lib/supabase/server";
 *   const supabase = await createServerClient();
 *   const { data: { user } } = await supabase.auth.getUser();
 *
 * NOTE: callers must `await` because `cookies()` from `next/headers` is async
 * in Next.js 15+/16 (the version this project uses).
 * ─────────────────────────────────────────────────────────────────────────────
 */

import { cookies } from "next/headers";
import { createServerClient as createSSRClient } from "@supabase/ssr";
import type { SupabaseClient } from "@supabase/supabase-js";

/**
 * Read a required env var, throwing a clear, actionable error if it is missing.
 * Returns a real `string` (never undefined) so downstream code — including code
 * inside async closures, where `process.env` narrowing would otherwise be lost —
 * type-checks without non-null assertions.
 */
function requireEnv(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(
      `[Supabase] Missing env var: ${name}\n` +
        "Add it to your .env.local file and restart the dev server."
    );
  }
  return value;
}

const supabaseUrl = requireEnv("NEXT_PUBLIC_SUPABASE_URL");
const supabaseAnonKey = requireEnv("NEXT_PUBLIC_SUPABASE_ANON_KEY");

/**
 * Build a Supabase client bound to the current request's cookies.
 *
 * Whenever the client refreshes the session (or the user signs in/out), the
 * `setAll` callback persists the updated auth cookies onto the response so the
 * browser and the next server request stay in sync.
 */
export async function createServerClient(): Promise<SupabaseClient> {
  const cookieStore = await cookies();

  return createSSRClient(supabaseUrl, supabaseAnonKey, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet) {
        try {
          cookiesToSet.forEach(({ name, value, options }) =>
            cookieStore.set(name, value, options)
          );
        } catch {
          // The `setAll` call can throw when invoked from a Server Component
          // (read-only cookie context). That is safe to ignore — middleware
          // will refresh the session on the next request. Any genuine write
          // path (Route Handler / Server Action / middleware) has a writable
          // cookie context.
        }
      },
    },
  });
}
