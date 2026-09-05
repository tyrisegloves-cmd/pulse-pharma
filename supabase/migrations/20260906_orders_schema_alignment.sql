-- ─────────────────────────────────────────────────────────────────────────────
-- Pulse Pharma — orders/order_items schema alignment
-- ─────────────────────────────────────────────────────────────────────────────
-- Run this ONCE in the Supabase SQL editor (Dashboard → SQL → New query).
-- IDEMPOTENT — safe to re-run.
--
-- WHY THIS EXISTS:
--   The live orders/order_items tables were created with different column
--   names than the application code expects, which broke both checkout
--   (order insert) and the account page order list:
--     orders.total_price        → the app reads/writes total_amount
--     order_items.price_at_purchase → the app reads/writes unit_price
--   and several columns the app needs were missing entirely.
--
-- What this does (all data-preserving):
--   1. Renames  orders.total_price         → total_amount   (data kept)
--   2. Renames  order_items.price_at_purchase → unit_price  (data kept)
--   3. Adds missing columns (if not exists):
--        orders.delivery_address, orders.notes, orders.updated_at
--        order_items.product_name, order_items.total_price
--   4. Adds the updated_at maintenance trigger on orders.
--   5. Enables RLS with self-ownership policies on orders + order_items:
--        users read and create only their OWN orders. Updates/deletes are
--        never allowed from the client — payment verification and the
--        Paystack webhook use the service-role key.
-- ─────────────────────────────────────────────────────────────────────────────

-- ── 1–2. Renames (only when needed, so re-runs don't fail) ──────────────────
do $$
begin
  if exists (select 1 from information_schema.columns
             where table_schema = 'public' and table_name = 'orders'
               and column_name = 'total_price')
     and not exists (select 1 from information_schema.columns
             where table_schema = 'public' and table_name = 'orders'
               and column_name = 'total_amount') then
    execute 'alter table public.orders rename column total_price to total_amount';
  end if;

  if exists (select 1 from information_schema.columns
             where table_schema = 'public' and table_name = 'order_items'
               and column_name = 'price_at_purchase')
     and not exists (select 1 from information_schema.columns
             where table_schema = 'public' and table_name = 'order_items'
               and column_name = 'unit_price') then
    execute 'alter table public.order_items rename column price_at_purchase to unit_price';
  end if;
end $$;

-- ── 3. Missing columns ───────────────────────────────────────────────────────
alter table public.orders     add column if not exists delivery_address text;
alter table public.orders     add column if not exists notes text;
alter table public.orders     add column if not exists updated_at timestamptz not null default now();
alter table public.order_items add column if not exists product_name text;
alter table public.order_items add column if not exists total_price numeric;

-- ── 4. updated_at trigger on orders ─────────────────────────────────────────
-- Self-contained: (re)creates the shared bump function if this file is run on
-- a project where the profiles script hasn't been applied.
create or replace function public.touch_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end; $$;

drop trigger if exists orders_touch_updated_at on public.orders;
create trigger orders_touch_updated_at
  before update on public.orders
  for each row execute function public.touch_updated_at();

-- ── 5. Row Level Security ────────────────────────────────────────────────────
alter table public.orders     enable row level security;
alter table public.order_items enable row level security;

-- Purge any existing policies first (same pattern as the profiles script) so
-- re-runs and stray dashboard policies can't conflict.
do $$
declare
  p record;
begin
  for p in
    select policyname, tablename from pg_policies
    where schemaname = 'public' and tablename in ('orders', 'order_items')
  loop
    execute format('drop policy if exists %I on public.%I', p.policyname, p.tablename);
  end loop;
end $$;

-- Orders: read + create your own. No update/delete from clients.
create policy "orders self read" on public.orders
  for select using (auth.uid() = user_id);

create policy "orders self insert" on public.orders
  for insert with check (auth.uid() = user_id);

-- Order items: read + create only rows attached to your own orders.
create policy "order_items self read" on public.order_items
  for select using (
    exists (
      select 1 from public.orders o
      where o.id = order_items.order_id and o.user_id = auth.uid()
    )
  );

create policy "order_items self insert" on public.order_items
  for insert with check (
    exists (
      select 1 from public.orders o
      where o.id = order_items.order_id and o.user_id = auth.uid()
    )
  );
