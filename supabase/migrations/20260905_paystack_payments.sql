-- ─────────────────────────────────────────────────────────────────────────────
-- Pulse Pharma — Paystack payments (orders.payment_* columns + payments table)
-- ─────────────────────────────────────────────────────────────────────────────
-- Run this ONCE in the Supabase SQL editor (Dashboard → SQL → New query).
-- It is IDEMPOTENT — safe to re-run; existing data and policies are preserved.
--
-- What this does:
--   1. Adds payment-related columns to the existing `orders` table:
--        payment_method ('paystack' | 'cod'), delivery_fee, delivery_name,
--        delivery_phone.
--   2. Creates the `payments` table — one row per Paystack transaction
--      attempt. The reference IS the order id, and a partial UNIQUE index
--      guarantees at most ONE successful payment per order (duplicate-payment
--      protection enforced by the database itself).
--   3. Enables RLS on `payments`: users may read + create their own rows, but
--      NEVER update them — status transitions (pending → success/failed) are
--      performed server-side only (webhook + verify route) with the
--      service-role key, so a customer can never self-confirm a payment.
-- ─────────────────────────────────────────────────────────────────────────────

-- ── 1. Payment columns on orders ─────────────────────────────────────────────
alter table public.orders add column if not exists payment_method text not null default 'paystack';
alter table public.orders add column if not exists delivery_fee numeric not null default 0;
alter table public.orders add column if not exists delivery_name text;
alter table public.orders add column if not exists delivery_phone text;

-- ── 2. payments table ────────────────────────────────────────────────────────
create table if not exists public.payments (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.orders(id) on delete cascade,
  user_id uuid references auth.users(id) on delete set null,
  provider text not null default 'paystack',
  -- For Paystack we use the order id itself as the gateway reference, so the
  -- mapping payment ↔ order is 1:1 and unforgeable.
  reference text not null unique,
  amount numeric not null,                 -- major units (e.g. 120.50 = GH₵ 120.50)
  currency text not null default 'GHS',
  status text not null default 'pending'
    check (status in ('pending', 'success', 'failed', 'abandoned')),
  channel text,                            -- card / mobile_money / bank_transfer …
  gateway_response text,
  paid_at timestamptz,
  raw jsonb,                               -- full webhook/verify payload for audit
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists payments_order_id_idx on public.payments (order_id);
create index if not exists payments_user_id_idx on public.payments (user_id);

-- Duplicate-payment protection at the DB level: an order can only ever have
-- ONE successful payment. A second "success" write for the same order fails.
create unique index if not exists payments_one_success_per_order
  on public.payments (order_id) where status = 'success';

-- Reuse the same updated_at maintenance trigger used by profiles.
drop trigger if exists payments_touch_updated_at on public.payments;
create trigger payments_touch_updated_at
  before update on public.payments
  for each row execute function public.touch_updated_at();

-- ── 3. Row Level Security ────────────────────────────────────────────────────
alter table public.payments enable row level security;

do $$
declare
  p record;
begin
  for p in
    select policyname from pg_policies where schemaname = 'public' and tablename = 'payments'
  loop
    execute format('drop policy if exists %I on public.payments', p.policyname);
  end loop;
end $$;

-- A user can see their own payment rows (receipts / history).
create policy "payments self read" on public.payments
  for select using (auth.uid() = user_id);

-- A user can create a payment row for their own order at checkout.
create policy "payments self insert" on public.payments
  for insert with check (auth.uid() = user_id);

-- Deliberately NO UPDATE / NO DELETE policies: only the server (service-role
-- key in the webhook + verify routes) may transition payment status. ────────
