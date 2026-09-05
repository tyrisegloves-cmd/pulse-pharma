-- ─────────────────────────────────────────────────────────────────────────────
-- Pulse Pharma — widen the orders.status check constraint
-- ─────────────────────────────────────────────────────────────────────────────
-- Run this ONCE in the Supabase SQL editor (Dashboard → SQL → New query).
-- IDEMPOTENT — safe to re-run.
--
-- WHY THIS EXISTS:
--   The live orders table carries a legacy check constraint
--   ("orders_status_check") that does not allow 'confirmed'. Paystack
--   verification therefore could never move an order from 'pending' to
--   'confirmed' (Postgres error 23514), leaving paid orders stuck.
--
-- This replaces the constraint with the application's canonical status set
-- (src/services/orders.ts → OrderStatus):
--   pending | confirmed | processing | shipped | delivered | cancelled
-- No data is changed; only the rule is widened.
-- ─────────────────────────────────────────────────────────────────────────────

do $$
declare
  constraint_exists boolean;
begin
  select exists (
    select 1 from pg_constraint
    where conrelid = 'public.orders'::regclass
      and conname = 'orders_status_check'
  ) into constraint_exists;

  if constraint_exists then
    execute 'alter table public.orders drop constraint orders_status_check';
  end if;

  -- (Re)create with the canonical set — safe to re-run.
  execute 'alter table public.orders add constraint orders_status_check
           check (status in (''pending'', ''confirmed'', ''processing'', ''shipped'', ''delivered'', ''cancelled''))';
end $$;
