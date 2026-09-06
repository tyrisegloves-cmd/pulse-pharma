/**
 * src/middleware.ts
 * ─────────────────────────────────────────────────────────────────────────────
 * Edge middleware for Supabase session refresh + protected-route enforcement.
 *
 * Responsibilities:
 *   1. Refresh the auth session cookie on every matched request so users stay
 *      logged in as the JWT approaches expiry. (`supabase.auth.getUser()`
 *      triggers a refresh internally; the updated cookies are written back via
 *      the response.)
 *   2. Protect customer-only routes (`/account`, `/cart`, `/track`). If there
 *      is no authenticated user, redirect to `/auth?next=<original path>` so the
 *      user can return to where they were heading after signing in.
 *
 * Public routes (shop, homepage, auth pages, ask, upload-prescription) are left
 * open. Auth pages are additionally guarded so an already-signed-in user is sent
 * to their account instead of seeing the login form again.
 *
 * This is SERVER-SIDE protection — it does not depend on hiding nav links.
 * ─────────────────────────────────────────────────────────────────────────────
 */

import { type NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

/** Routes that REQUIRE an authenticated user. */
const PROTECTED_PREFIXES = ["/account", "/cart", "/track", "/orders"];

/** Auth-flow routes — signed-in users are bounced away from these. */
const AUTH_PREFIX = "/auth";

export async function middleware(request: NextRequest) {
  // `let` because the cookie-set callback below rebuilds the response after
  // mutating request cookies (so the refreshed session is carried forward).
  let response = NextResponse.next({ request });

  // If env vars aren't configured we can't run auth checks — let the request
  // through so the app still renders (the supabase client will throw a clear
  // error elsewhere if the vars are truly missing).
  if (!supabaseUrl || !supabaseAnonKey) {
    return response;
  }

  const supabase = createServerClient(supabaseUrl, supabaseAnonKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet) {
        // Set on the request (so this same invocation sees the refreshed
        // session) AND on the response (so the browser persists it).
        cookiesToSet.forEach(({ name, value }) =>
          request.cookies.set(name, value)
        );
        response = NextResponse.next({ request });
        cookiesToSet.forEach(({ name, value, options }) =>
          response.cookies.set(name, value, options)
        );
      },
    },
  });

  // IMPORTANT: getUser() validates the JWT server-side and refreshes it if
  // needed. Do NOT use getSession() here — it does not refresh and is
  // susceptible to tampering on the client.
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { pathname } = request.nextUrl;

  const isProtected = PROTECTED_PREFIXES.some(
    (p) => pathname === p || pathname.startsWith(`${p}/`)
  );
  const isAuthRoute = pathname === AUTH_PREFIX || pathname.startsWith(`${AUTH_PREFIX}/`);

  // Protected route + not signed in → send to login, remember where they were going.
  if (isProtected && !user) {
    const url = request.nextUrl.clone();
    url.pathname = "/auth";
    url.searchParams.set("next", pathname + request.nextUrl.search);
    return NextResponse.redirect(url);
  }

  // Already signed in + visiting an auth page → go to account instead.
  if (isAuthRoute && user) {
    const url = request.nextUrl.clone();
    url.pathname = "/account";
    url.search = "";
    return NextResponse.redirect(url);
  }

  return response;
}

/**
 * Only run middleware where a server-side auth decision is actually needed:
 * protected routes (redirect unauthenticated users) and auth pages (bounce
 * already-signed-in users away from the login form).
 *
 * PERFORMANCE: `getUser()` validates the JWT with the Supabase auth server —
 * a network round-trip on every matched request. Running it on public pages
 * (home, shop, ask, …) added hundreds of ms to every navigation for a check
 * whose result was never used. Public routes are left untouched here; the
 * browser client refreshes tokens on its own (autoRefreshToken), and the
 * protected routes still get the full server-side check below.
 */
export const config = {
  matcher: [
    "/account",
    "/account/:path*",
    "/cart",
    "/cart/:path*",
    "/track",
    "/track/:path*",
    "/orders",
    "/orders/:path*",
    "/auth",
    "/auth/:path*",
  ],
};
