/**
 * src/lib/receipt.ts
 * ─────────────────────────────────────────────────────────────────────────────
 * SERVER-ONLY receipt data loader shared by the receipt page
 * (/orders/[id]/receipt) and the PDF download route (/api/orders/[id]/receipt).
 *
 * Ownership is enforced twice: the query filters by user_id AND the Supabase
 * RLS policies restrict reads to the owner. A null result means "not found
 * or not yours" — callers respond with a single 404 either way.
 * ─────────────────────────────────────────────────────────────────────────────
 */

import type { SupabaseClient } from "@supabase/supabase-js";

export interface ReceiptItem {
  productName: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
}

export interface ReceiptPayment {
  reference: string;
  status: string;
  channel: string | null;
  paidAt: string | null;
  amount: number;
  currency: string;
}

export interface ReceiptData {
  orderId: string;
  status: string;
  /** 'paystack' | 'cod' */
  paymentMethod: string;
  totalAmount: number;
  deliveryFee: number;
  deliveryName: string | null;
  deliveryPhone: string | null;
  deliveryAddress: string | null;
  createdAt: string;
  items: ReceiptItem[];
  /** Present for Paystack orders; null for Cash on Delivery. */
  payment: ReceiptPayment | null;
}

interface ReceiptRow {
  id: string;
  status: string;
  payment_method: string | null;
  total_amount: number | null;
  delivery_fee: number | null;
  delivery_name: string | null;
  delivery_phone: string | null;
  delivery_address: string | null;
  created_at: string;
  order_items?: Array<{
    product_name: string | null;
    quantity: number | null;
    unit_price: number | null;
    total_price: number | null;
  }> | null;
  payments?: Array<{
    reference: string;
    status: string;
    channel: string | null;
    paid_at: string | null;
    amount: number | null;
    currency: string | null;
  }> | null;
}

/** Human label for an order status on receipts. */
export function statusLabel(status: string, paymentMethod: string): string {
  if (status === "confirmed") return "Paid & Confirmed";
  if (status === "pending" && paymentMethod === "cod")
    return "Pending — Pay on Delivery";
  return status.charAt(0).toUpperCase() + status.slice(1);
}

/** Load one order (with items + payment) for a specific user. */
export async function loadReceipt(
  supabase: SupabaseClient,
  orderId: string,
  userId: string
): Promise<ReceiptData | null> {
  const { data } = await supabase
    .from("orders")
    .select(
      "id, status, payment_method, total_amount, delivery_fee, delivery_name, delivery_phone, delivery_address, created_at, order_items(product_name, quantity, unit_price, total_price), payments(reference, status, channel, paid_at, amount, currency)"
    )
    .eq("id", orderId)
    .eq("user_id", userId)
    .maybeSingle();

  if (!data) return null;
  const row = data as ReceiptRow;

  // Prefer the successful payment record; fall back to the newest row.
  const payments = row.payments ?? [];
  const paymentRow =
    payments.find((p) => p.status === "success") ?? payments[0] ?? null;

  return {
    orderId: row.id,
    status: row.status,
    paymentMethod: row.payment_method ?? "paystack",
    totalAmount: Number(row.total_amount ?? 0),
    deliveryFee: Number(row.delivery_fee ?? 0),
    deliveryName: row.delivery_name,
    deliveryPhone: row.delivery_phone,
    deliveryAddress: row.delivery_address,
    createdAt: row.created_at,
    items: (row.order_items ?? []).map((item) => ({
      productName: item.product_name ?? "Item",
      quantity: item.quantity ?? 0,
      unitPrice: Number(item.unit_price ?? 0),
      totalPrice: Number(item.total_price ?? 0),
    })),
    payment: paymentRow
      ? {
          reference: paymentRow.reference,
          status: paymentRow.status,
          channel: paymentRow.channel,
          paidAt: paymentRow.paid_at,
          amount: Number(paymentRow.amount ?? 0),
          currency: paymentRow.currency ?? "GHS",
        }
      : null,
  };
}

/** "DD Mon YYYY, HH:MM" — deterministic across server/client. */
export function formatDateTime(iso: string | null | undefined): string {
  if (!iso) return "—";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "—";
  const months = [
    "Jan", "Feb", "Mar", "Apr", "May", "Jun",
    "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
  ];
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${pad(d.getDate())} ${months[d.getMonth()]} ${d.getFullYear()}, ${pad(
    d.getHours()
  )}:${pad(d.getMinutes())}`;
}

/** GH₵ formatter for the HTML receipt. */
export function formatCedis(amount: number): string {
  return `GH₵ ${amount.toFixed(2)}`;
}
