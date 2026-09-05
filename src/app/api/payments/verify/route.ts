/**
 * GET /api/payments/verify?reference=…
 * ─────────────────────────────────────────────────────────────────────────────
 * SERVER-ONLY. Called by the /checkout/callback page after Paystack redirects
 * the customer back. The redirect parameters alone are NEVER trusted — this
 * route re-checks the transaction against Paystack's verify API, which is the
 * source of truth.
 *
 * Flow:
 *   1. Authenticate the caller (session cookies) and confirm the payment's
 *      order belongs to them.
 *   2. Short-circuit if the payment is already marked successful (idempotent —
 *      the webhook may have beaten us to it).
 *   3. Verify with Paystack, checking amount + currency match what we asked
 *      for (tamper protection).
 *   4. Persist the result with the SERVICE-ROLE key (bypasses RLS — customers
 *      must never be able to update payment rows themselves):
 *        payments: pending → success / failed / abandoned
 *        orders:   pending → confirmed  (only from pending, so later
 *                  fulfillment stages are never clobbered by a late webhook)
 * ─────────────────────────────────────────────────────────────────────────────
 */

import { NextRequest } from "next/server";
import { createServerClient } from "@/lib/supabase/server";
import { createServiceClient } from "@/lib/payments/service";
import { verifyTransaction, DELIVERY_FEE_GHS } from "@/lib/payments/paystack";

export const dynamic = "force-dynamic";

interface DbPaymentRow {
  id: string;
  order_id: string;
  user_id: string | null;
  reference: string;
  amount: number;
  currency: string;
  status: string;
}

export async function GET(request: NextRequest) {
  const reference = request.nextUrl.searchParams.get("reference")?.trim();
  if (!reference) {
    return Response.json({ error: "Payment reference is required." }, { status: 400 });
  }

  // 1. Auth + ownership.
  const supabase = await createServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return Response.json({ error: "Please sign in to view this payment." }, { status: 401 });
  }

  const { data: payment } = await supabase
    .from("payments")
    .select("id, order_id, user_id, reference, amount, currency, status")
    .eq("reference", reference)
    .maybeSingle();

  if (!payment) {
    return Response.json({ error: "Payment not found." }, { status: 404 });
  }
  const paymentRow = payment as DbPaymentRow;
  if (paymentRow.user_id !== user.id) {
    return Response.json({ error: "This payment belongs to another account." }, { status: 403 });
  }

  // 2. Already verified (e.g. the webhook got here first) — report and stop.
  if (paymentRow.status === "success") {
    return Response.json({
      status: "success",
      orderId: paymentRow.order_id,
      amount: Number(paymentRow.amount),
      currency: paymentRow.currency,
    });
  }

  // 3. Ask Paystack for the truth.
  let verified;
  try {
    verified = await verifyTransaction(reference);
  } catch (error) {
    console.error("[payments/verify] paystack verify failed:", error);
    return Response.json(
      { error: "We couldn't confirm your payment right now. Please refresh in a moment." },
      { status: 502 }
    );
  }

  const service = createServiceClient();
  const nowIso = new Date().toISOString();

  if (verified.status === "success") {
    // 4a. Tamper check: the paid amount/currency must match the order.
    const expectedAmount = Number(paymentRow.amount);
    const amountMatches =
      verified.currency === paymentRow.currency &&
      Math.abs(verified.amount - expectedAmount) < 0.01;

    if (!amountMatches) {
      console.error(
        `[payments/verify] AMOUNT MISMATCH ref=${reference}: expected ${expectedAmount} ${paymentRow.currency}, got ${verified.amount} ${verified.currency}`
      );
      await service
        .from("payments")
        .update({
          status: "failed",
          gateway_response: "Amount mismatch — payment flagged for review",
          raw: verified.raw,
          updated_at: nowIso,
        })
        .eq("reference", reference)
        .neq("status", "success");

      return Response.json(
        { error: "Payment amount did not match your order. Please contact support." },
        { status: 409 }
      );
    }

    // 4b. Mark payment success (idempotent) + confirm the order (only from pending).
    const { error: paymentUpdateError } = await service
      .from("payments")
      .update({
        status: "success",
        channel: verified.channel,
        gateway_response: verified.gatewayResponse,
        paid_at: verified.paidAt ?? nowIso,
        raw: verified.raw,
        updated_at: nowIso,
      })
      .eq("reference", reference)
      .neq("status", "success");

    // A unique partial index allows only one successful payment per order —
    // losing a race here means another writer (webhook) already succeeded.
    if (paymentUpdateError) {
      console.warn("[payments/verify] payment update race (likely webhook won):", paymentUpdateError);
    }

    const { error: orderUpdateError } = await service
      .from("orders")
      .update({ status: "confirmed", updated_at: nowIso })
      .eq("id", paymentRow.order_id)
      .eq("status", "pending");

    if (orderUpdateError) {
      // Never silent: a blocked status flip leaves a paid order stuck in
      // pending (e.g. a legacy status check constraint rejecting 'confirmed').
      console.error(
        "[payments/verify] order status update failed:",
        orderUpdateError
      );
    }

    return Response.json({
      status: "success",
      orderId: paymentRow.order_id,
      amount: expectedAmount,
      currency: paymentRow.currency,
      channel: verified.channel,
      deliveryFee: DELIVERY_FEE_GHS,
    });
  }

  // 4c. Not successful — record the failure/abandonment, order stays pending.
  await service
    .from("payments")
    .update({
      status: verified.status === "abandoned" ? "abandoned" : "failed",
      gateway_response: verified.gatewayResponse,
      raw: verified.raw,
      updated_at: nowIso,
    })
    .eq("reference", reference)
    .eq("status", "pending");

  return Response.json({
    status: verified.status,
    orderId: paymentRow.order_id,
    gatewayResponse: verified.gatewayResponse,
  });
}
