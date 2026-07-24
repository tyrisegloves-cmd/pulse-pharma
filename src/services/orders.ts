/**
 * src/services/orders.ts
 * ─────────────────────────────────────────────────────────────────────────────
 * Orders service — all order-related queries for the public website.
 *
 * Every function here:
 *   • Talks to Supabase via the shared client in `@/lib/supabase`
 *   • Selects only the columns it needs
 *   • Returns a `ServiceResult<T>` so callers handle errors uniformly
 *
 * Usage (server component / API route):
 *   import { getOrdersByUser } from "@/services/orders";
 *   const { data, error } = await getOrdersByUser(userId);
 * ─────────────────────────────────────────────────────────────────────────────
 */

import { supabase } from "@/lib/supabase";
import type { ServiceResult } from "@/services/types";
import { ok, fail } from "@/services/types";

// ── Types ────────────────────────────────────────────────────────────────────

export interface OrderItem {
  id: string;
  productId: string;
  productName: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
}

export type OrderStatus =
  | "pending"
  | "confirmed"
  | "processing"
  | "shipped"
  | "delivered"
  | "cancelled";

export interface Order {
  id: string;
  userId: string;
  status: OrderStatus;
  totalAmount: number;
  items: OrderItem[];
  createdAt: string;
  updatedAt: string;
  deliveryAddress?: string;
  notes?: string;
}

/** Raw Supabase row for the orders table. */
interface DbOrderRow {
  id: string;
  user_id: string;
  status: string;
  total_amount: number;
  delivery_address: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
  order_items?: DbOrderItemRow[];
}

/** Raw Supabase row for the order_items table. */
interface DbOrderItemRow {
  id: string;
  order_id: string;
  product_id: string;
  product_name: string;
  quantity: number;
  unit_price: number;
  total_price: number;
}

/** Friendly error surfaced to end users. */
const FRIENDLY_ERROR =
  "We couldn't load your orders right now. Please try again shortly.";

// ── Mappers ──────────────────────────────────────────────────────────────────

function mapOrderItem(row: DbOrderItemRow): OrderItem {
  return {
    id: row.id,
    productId: row.product_id,
    productName: row.product_name,
    quantity: row.quantity,
    unitPrice: Number(row.unit_price),
    totalPrice: Number(row.total_price),
  };
}

function mapOrder(row: DbOrderRow): Order {
  return {
    id: row.id,
    userId: row.user_id,
    status: row.status as OrderStatus,
    totalAmount: Number(row.total_amount),
    items: (row.order_items ?? []).map(mapOrderItem),
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    deliveryAddress: row.delivery_address ?? undefined,
    notes: row.notes ?? undefined,
  };
}

// ── Service functions ────────────────────────────────────────────────────────

/**
 * Fetch all orders for a given user, newest first.
 */
export async function getOrdersByUser(
  userId: string
): Promise<ServiceResult<Order[]>> {
  if (!userId) return fail("User ID is required.");

  const { data, error } = await supabase
    .from("orders")
    .select(
      "id, user_id, status, total_amount, delivery_address, notes, created_at, updated_at, order_items(id, order_id, product_id, product_name, quantity, unit_price, total_price)"
    )
    .eq("user_id", userId)
    .order("created_at", { ascending: false });

  if (error) {
    console.error("[orders] getOrdersByUser error:", error);
    return fail(FRIENDLY_ERROR);
  }

  return ok((data as DbOrderRow[]).map(mapOrder));
}

/**
 * Fetch a single order by ID. The caller is responsible for verifying
 * that the order belongs to the requesting user.
 */
export async function getOrderById(
  orderId: string
): Promise<ServiceResult<Order>> {
  if (!orderId) return fail("Order ID is required.");

  const { data, error } = await supabase
    .from("orders")
    .select(
      "id, user_id, status, total_amount, delivery_address, notes, created_at, updated_at, order_items(id, order_id, product_id, product_name, quantity, unit_price, total_price)"
    )
    .eq("id", orderId)
    .maybeSingle();

  if (error) {
    console.error(`[orders] getOrderById(${orderId}) error:`, error);
    return fail(FRIENDLY_ERROR);
  }

  if (!data) {
    return ok(null as unknown as Order);
  }

  return ok(mapOrder(data as DbOrderRow));
}

/**
 * Create a new order for a user.
 * Returns the newly created order's id on success.
 */
export async function createOrder(order: {
  userId: string;
  items: Array<{
    productId: string;
    productName: string;
    quantity: number;
    unitPrice: number;
  }>;
  deliveryAddress?: string;
  notes?: string;
}): Promise<ServiceResult<string>> {
  const totalAmount = order.items.reduce(
    (sum, item) => sum + item.unitPrice * item.quantity,
    0
  );

  const { data: newOrder, error: orderError } = await supabase
    .from("orders")
    .insert({
      user_id: order.userId,
      status: "pending",
      total_amount: totalAmount,
      delivery_address: order.deliveryAddress ?? null,
      notes: order.notes ?? null,
    })
    .select("id")
    .single();

  if (orderError || !newOrder) {
    console.error("[orders] createOrder insert error:", orderError);
    return fail("We couldn't place your order right now. Please try again.");
  }

  const orderId = (newOrder as { id: string }).id;

  const itemRows = order.items.map((item) => ({
    order_id: orderId,
    product_id: item.productId,
    product_name: item.productName,
    quantity: item.quantity,
    unit_price: item.unitPrice,
    total_price: item.unitPrice * item.quantity,
  }));

  const { error: itemsError } = await supabase
    .from("order_items")
    .insert(itemRows);

  if (itemsError) {
    console.error("[orders] createOrder items insert error:", itemsError);
    // The order row was created but items failed — surface the error.
    return fail("Order created but items could not be saved. Please contact support.");
  }

  return ok(orderId);
}
