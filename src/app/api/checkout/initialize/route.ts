/**
 * POST /api/checkout/initialize
 * ─────────────────────────────────────────────────────────────────────────────
 * SERVER-ONLY. The single entry point the cart's "Place Order" button calls.
 *
 * Flow:
 *   1. Authenticate the caller via the Supabase session cookie (the cart is
 *      tied to the account — guests never reach this route with items).
 *   2. Validate + re-price the cart SERVER-SIDE from the `products` table.
 *      Prices sent by the browser are never trusted.
 *   3. Create the order (status 'pending') + order_items rows.
 *   4. For Paystack: insert a `payments` row (reference = order id) and call
 *      Paystack's initialize endpoint with the SECRET key.
 *      For Cash on Delivery: no gateway — the order starts as pending.
 *   5. Return either the Paystack authorization URL to redirect to, or the
 *      COD order id.
 *
 * Duplicate-payment protection: the Paystack reference IS the order id and
 * the DB enforces "at most one successful payment per order" (unique partial
 * index) — see supabase/migrations/20260905_paystack_payments.sql.
 * ─────────────────────────────────────────────────────────────────────────────
 */

import { NextRequest } from "next/server";
import { createServerClient } from "@/lib/supabase/server";
import {
  initializeTransaction,
  DELIVERY_FEE_GHS,
  PAYSTACK_CURRENCY,
} from "@/lib/payments/paystack";

export const dynamic = "force-dynamic";

interface CheckoutItemPayload {
  productId?: unknown;
  quantity?: unknown;
}

interface CheckoutBody {
  items?: CheckoutItemPayload[];
  delivery?: {
    fullName?: unknown;
    phone?: unknown;
    address?: unknown;
  };
  paymentMethod?: unknown;
}

function badRequest(message: string) {
  return Response.json({ error: message }, { status: 400 });
}

export async function POST(request: NextRequest) {
  // 1. Auth — via the request's session cookies.
  const supabase = await createServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return Response.json(
      { error: "Please sign in to place an order." },
      { status: 401 }
    );
  }

  // 2. Validate the payload.
  let body: CheckoutBody;
  try {
    body = (await request.json()) as CheckoutBody;
  } catch {
    return badRequest("Invalid request body.");
  }

  const paymentMethod = body.paymentMethod === "cod" ? "cod" : "paystack";

  const fullName = typeof body.delivery?.fullName === "string" ? body.delivery.fullName.trim() : "";
  const phone = typeof body.delivery?.phone === "string" ? body.delivery.phone.trim() : "";
  const address = typeof body.delivery?.address === "string" ? body.delivery.address.trim() : "";

  if (!fullName || !phone || !address) {
    return badRequest("Delivery name, phone and address are required.");
  }
  if (phone.replace(/\D/g, "").length < 9) {
    return badRequest("Please enter a valid phone number.");
  }
  if (fullName.length > 120 || phone.length > 30 || address.length > 500) {
    return badRequest("Delivery details are too long.");
  }

  const rawItems = Array.isArray(body.items) ? body.items : [];
  if (rawItems.length === 0 || rawItems.length > 50) {
    return badRequest("Your cart is empty or too large.");
  }

  // Normalize quantities (integers 1–99) and collect product ids.
  const quantityById = new Map<string, number>();
  for (const item of rawItems) {
    const productId = typeof item.productId === "string" ? item.productId : "";
    const quantity = Number(item.quantity);
    if (!productId || !Number.isInteger(quantity) || quantity < 1 || quantity > 99) {
      return badRequest("One of the cart items is invalid. Please refresh your cart.");
    }
    quantityById.set(productId, (quantityById.get(productId) ?? 0) + quantity);
  }

  // 3. Re-price from the database — never trust client-sent prices.
  const productIds = [...quantityById.keys()];
  const { data: products, error: productsError } = await supabase
    .from("products")
    .select("id, name, price, in_stock")
    .in("id", productIds);

  if (productsError || !products || products.length !== productIds.length) {
    console.error("[checkout] product fetch error:", productsError);
    return Response.json(
      { error: "Some items in your cart are no longer available. Please refresh your cart." },
      { status: 409 }
    );
  }

  type DbProduct = {
    id: string;
    name: string;
    price: number;
    in_stock: boolean;
  };

  const productById = new Map<string, DbProduct>(
    (products as DbProduct[]).map((p) => [p.id, p])
  );

  /** Local control-flow error for out-of-stock items. */
  class StockError extends Error {}

  let lineItems: Array<{
    productId: string;
    productName: string;
    quantity: number;
    unitPrice: number;
  }>;

  try {
    lineItems = productIds.map((productId) => {
      const product = productById.get(productId)!;
      const quantity = quantityById.get(productId)!;
      if (!product.in_stock) {
        throw new StockError(`"${product.name}" is currently out of stock.`);
      }
      return {
        productId,
        productName: product.name,
        quantity,
        unitPrice: Number(product.price),
      };
    });
  } catch (pricingError) {
    if (pricingError instanceof StockError) {
      return Response.json({ error: pricingError.message }, { status: 409 });
    }
    throw pricingError;
  }

  const subtotal = lineItems.reduce(
    (sum, item) => sum + item.unitPrice * item.quantity,
    0
  );
  const totalAmount = subtotal + DELIVERY_FEE_GHS;

  if (totalAmount <= 0) {
    return badRequest("Cart total must be greater than zero.");
  }

  // 4. Create the order + items with the caller's identity (RLS applies).
  const { data: newOrder, error: orderError } = await supabase
    .from("orders")
    .insert({
      user_id: user.id,
      status: "pending",
      total_amount: totalAmount,
      delivery_address: address,
      payment_method: paymentMethod,
      delivery_fee: DELIVERY_FEE_GHS,
      delivery_name: fullName,
      delivery_phone: phone,
    })
    .select("id")
    .single();

  if (orderError || !newOrder) {
    console.error("[checkout] order insert error:", orderError);
    return Response.json(
      { error: "We couldn't place your order. Please try again." },
      { status: 500 }
    );
  }
  const orderId = (newOrder as { id: string }).id;

  const { error: itemsError } = await supabase.from("order_items").insert(
    lineItems.map((item) => ({
      order_id: orderId,
      product_id: item.productId,
      product_name: item.productName,
      quantity: item.quantity,
      unit_price: item.unitPrice,
      total_price: item.unitPrice * item.quantity,
    }))
  );

  if (itemsError) {
    console.error("[checkout] order items insert error:", itemsError);
    return Response.json(
      { error: "Order created but items could not be saved. Please contact support." },
      { status: 500 }
    );
  }

  // 5a. Cash on delivery — no gateway, the order stays 'pending'.
  if (paymentMethod === "cod") {
    return Response.json({ mode: "cod", orderId });
  }

  // 5b. Paystack — record the pending payment, then initialize the gateway.
  const reference = orderId; // 1:1 order ↔ payment mapping
  const email =
    user.email ?? `customer+${orderId}@pulsepharma.com.gh`;

  const { error: paymentInsertError } = await supabase.from("payments").insert({
    order_id: orderId,
    user_id: user.id,
    provider: "paystack",
    reference,
    amount: totalAmount,
    currency: PAYSTACK_CURRENCY,
    status: "pending",
  });

  if (paymentInsertError) {
    // Most likely cause: this order already has a successful payment (the
    // partial unique index) — i.e. a duplicate submit. Never re-charge.
    console.error("[checkout] payment insert error:", paymentInsertError);
    return Response.json(
      { error: "This order has already been processed. Please check your order history." },
      { status: 409 }
    );
  }

  try {
    const init = await initializeTransaction({
      email,
      amountMajor: totalAmount,
      reference,
      metadata: {
        order_id: orderId,
        user_id: user.id,
        payment_method: "paystack",
        delivery_phone: phone,
      },
    });

    return Response.json({
      mode: "redirect",
      orderId,
      reference,
      authorizationUrl: init.authorizationUrl,
    });
  } catch (paystackError) {
    console.error("[checkout] paystack initialize failed:", paystackError);
    return Response.json(
      { error: "We couldn't start your payment. Please try again in a moment." },
      { status: 502 }
    );
  }
}
