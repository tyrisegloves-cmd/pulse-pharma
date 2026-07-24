-- ─────────────────────────────────────────────────────────────────────────────
-- Pulse Pharma — profiles table + signup trigger + Row Level Security
-- ─────────────────────────────────────────────────────────────────────────────
-- Run this ONCE in the Supabase SQL editor (Dashboard → SQL → New query).
-- It is IDEMPOTENT — safe to re-run; existing rows/policies are preserved.
--
-- What this does:
--   1. Creates the `profiles` table linked 1:1 to auth.users.
--   2. Adds a trigger that auto-creates a profile row on signup, copying the
--      full_name/phone from the user's metadata and defaulting role='customer'.
--   3. Enables RLS so a user can read + update ONLY their own row, and can
--      never change their own role (admins are assigned only at the DB level).
--
-- No changes to auth.users schema. No service-role keys needed to apply.
-- ─────────────────────────────────────────────────────────────────────────────


-- ── 1. Table ─────────────────────────────────────────────────────────────────
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text,
  email text,
  phone text,
  role text not null default 'customer' check (role in ('customer','admin')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Keep the denormalized email column in sync with auth.users on signup.
comment on table public.profiles is
  'Public-facing profile for each auth user. role is customer/admin; customers cannot self-promote.';


-- ── 2. updated_at maintenance function ───────────────────────────────────────
-- Bumps updated_at automatically on every UPDATE.
create or replace function public.touch_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end; $$;

drop trigger if exists profiles_touch_updated_at on public.profiles;
create trigger profiles_touch_updated_at
  before update on public.profiles
  for each row execute function public.touch_updated_at();


-- ── 3. Auto-create profile on signup ─────────────────────────────────────────
-- SECURITY DEFINER so the insert runs with the function owner's privileges
-- (the anon/authenticated roles have NO insert policy — see RLS below — so this
-- trigger is the ONLY way a profile row gets created).
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, full_name, email, phone)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'full_name', ''),
    new.email,
    coalesce(new.raw_user_meta_data->>'phone', '')
  )
  on conflict (id) do nothing;
  return new;
end; $$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();


-- ── 4. Row Level Security ────────────────────────────────────────────────────
alter table public.profiles enable row level security;

-- A user can read only their own profile.
drop policy if exists "profiles self read" on public.profiles;
create policy "profiles self read" on public.profiles
  for select using (auth.uid() = id);

-- A user can update only their own profile, and only while they remain a
-- customer (the WITH CHECK clause blocks any attempt to set role='admin').
drop policy if exists "profiles self update no role" on public.profiles;
create policy "profiles self update no role" on public.profiles
  for update
  using (auth.uid() = id)
  with check (auth.uid() = id and role = 'customer');

-- Deliberately NO INSERT and NO DELETE policies:
--   • INSERT happens only through the SECURITY DEFINER trigger above.
--   • DELETE cascades automatically when the auth.users row is deleted.
-- This means a customer can never create extra rows or delete their own.
-- ─────────────────────────────────────────────────────────────────────────────


-- ── 5. (Optional) Backfill existing users ────────────────────────────────────
-- If users signed up BEFORE this script was applied, they won't have a profile
-- row yet. Uncomment the block below and run once to create them retroactively.
-- (Safe to re-run; the ON CONFLICT skips rows that already exist.)
--
-- insert into public.profiles (id, email)
-- select id, email
-- from auth.users u
-- where not exists (select 1 from public.profiles p where p.id = u.id)
-- on conflict (id) do nothing;
-- ─────────────────────────────────────────────────────────────────────────────
