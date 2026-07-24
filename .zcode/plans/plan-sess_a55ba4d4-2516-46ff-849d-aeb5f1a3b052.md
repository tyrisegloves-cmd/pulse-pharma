## Supabase Authentication — Implementation Plan

### Architectural decision (forced by requirement #6)
Migrate from `@supabase/supabase-js` localStorage sessions to **cookie-based sessions via `@supabase/ssr`** (same project, same `NEXT_PUBLIC_SUPABASE_URL` / `NEXT_PUBLIC_SUPABASE_ANON_KEY`). This is the only way middleware (Edge runtime) can read the session to enforce server-side route protection, and it makes RLS work correctly for authenticated server queries. No new Supabase project.

### New dependency
- `@supabase/ssr` (reuses existing env vars)

### Files to CREATE
1. **`src/lib/supabase/server.ts`** — `createServerClient` reading `next/headers` cookies; used by middleware + server-side authed reads.
2. **`src/services/profiles.ts`** — `getProfile(userId)`, `updateMyProfile(...)`, role helper `getUserRole()`; reads/writes `profiles` table. No `any`.
3. **`src/app/auth/forgot-password/page.tsx`** — email field → `supabase.auth.resetPasswordForEmail(email, { redirectTo: '<site>/auth/reset-password' })`; loading/error/success states; reuses the auth card styling.
4. **`src/app/auth/reset-password/page.tsx`** — new password + confirm → `supabase.auth.updateUser({ password })`; validates match + strength; redirects to `/account` on success.
5. **`src/middleware.ts`** — refreshes the session cookie and **protects** `/account`, `/cart`, `/track` (unauthed → redirect to `/auth?next=<original>`). Public routes (`/`, `/shop`, `/auth/*`, `/upload-prescription`, `/ask`) remain open.
6. **`supabase/profiles-and-rls.sql`** — idempotent SQL for the `profiles` table, the auto-create-on-signup trigger (role default `customer`), and RLS policies (see "SQL" below). Provided as a file; **you run it once** in the Supabase SQL editor (I can't reach your remote DB).

### Files to MODIFY
7. **`src/lib/supabase.ts`** — rewrite the singleton to use `createBrowserClient` from `@supabase/ssr` (cookie-based). Keeps `import { supabase } from "@/lib/supabase"` working everywhere (services + AuthContext), so existing public reads (medicines/categories) and client-side authed reads (orders) keep working — now backed by cookies. Keep `verifySupabaseConnection()`.
8. **`src/components/AuthContext.tsx`** — switch to cookie-based client (automatic via #7); add `resetPassword(email)` and `updatePassword(newPassword)`; expose `role` (from profile) alongside `user`. Keep `signIn/signUp/signOut` signatures; deprecations stay for back-compat.
9. **`src/app/auth/page.tsx`** (keep UI/styles intact) — add **Confirm Password** field to signup; enforce password match + secure-password rules (≥8 chars, upper, lower, digit); wire the "Forgot password?" link to `/auth/forgot-password`; show the "check your email" confirmation message when Supabase indicates email confirmation is pending; disable submit while loading (already partial). Preserve `?next=` redirect.
10. **`src/app/account/page.tsx`** — read profile name/role via the new profiles service; keep existing order-history UI. Middleware now guarantees auth server-side, so the client gate stays as a friendly fallback.
11. **`src/app/auth/layout.tsx`** — no change (already renders bare content).
12. **`src/app/layout.tsx`** — no change (AuthProvider already wraps everything).

### SQL (provided, not auto-applied)
```sql
-- profiles table linked to auth.users
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text,
  email text,
  phone text,
  role text not null default 'customer' check (role in ('customer','admin')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- auto-create profile on signup with role='customer'
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, full_name, email, phone)
  values (new.id,
    coalesce(new.raw_user_meta_data->>'full_name',''),
    new.email,
    coalesce(new.raw_user_meta_data->>'phone',''))
  on conflict (id) do nothing;
  return new;
end; $$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- RLS
alter table public.profiles enable row level security;
drop policy if exists "profiles self read" on public.profiles;
create policy "profiles self read" on public.profiles
  for select using (auth.uid() = id);
drop policy if exists "profiles self update no role" on public.profiles;
create policy "profiles self update no role" on public.profiles
  for update using (auth.uid() = id)
  with check (auth.uid() = id and role = 'customer');
-- (no INSERT policy -> only the security-definer trigger can create rows)
-- (no role change: customers cannot promote themselves)
```

### Role-based access
- `role` lives only in `profiles`; public signup never sends/touches it (the trigger sets `customer`).
- No admin controls are rendered on the public site; admin assignment is DB-only.
- RLS (above) prevents customers from reading others' profiles and from changing their own role.

### Validation helpers (reusable)
A small `src/lib/auth-validation.ts` (pure functions, no `any`): `validateEmail`, `validatePassword` (returns specific messages), `passwordsMatch`. Used by signup, reset-password.

### Supabase dashboard steps (I'll list in final summary)
- Email auth provider: enabled (it is by default).
- **Redirect URLs** allow-list: add `http://localhost:3000/auth/reset-password` (and your prod URL) so the reset email deep-link works.
- Optionally enable/disable "Confirm email" — code handles both paths.

### What I will NOT do
- No new Supabase project, no schema changes to admin portal.
- No changes to the Admin Portal repo.
- Will not disable RLS anywhere.
- Will keep all existing UI designs and features intact.

### Verification
- Run `npx tsc --noEmit` and `npm run build` to confirm zero TypeScript/build errors.
- Provide a manual testing checklist mapping to requirement #13.

### Trade-off note
The home page (`page.tsx`, a server component) imports `getAllMedicines` → the browser client singleton. For anon public reads this works on the server (anon key, no auth needed). The dedicated server client (`src/lib/supabase/server.ts`) is used by middleware and available for any future server-side authenticated reads, keeping things correct without a large refactor of every service signature.