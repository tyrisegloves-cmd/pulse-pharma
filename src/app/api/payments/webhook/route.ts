/**
 * POST /api/payments/webhook
 * ─────────────────────────────────────────────────────────────────────────────
 * SERVER-ONLY Paystack webhook receiver.
 *
 * Security: the raw request body is verified with HMAC-SHA512 against the
 * x-paystack-signature header, keyed with PAYSTACK_SECRET_KEY. Requests with
 * a missing/invalid signature are rejected with 401. The signature covers the
 * EXACT raw bytes, so the body must be read as text (no prior JSON parsing).
 *
 * Idempotency: Paystack retries deliveries and may send duplicates. Status
 * transitions are guarded (.neq/.eq on status) and the DB-level "one success
 * per order" index makes double-deliveries harmless.
 *
 * Always answers 200 quickly for valid signatures — non-200 responses make
 * Paystack retry for up to 72 hours.
 *
 * Configure the endpoint in Paystack → Settings → API Keys & Webhooks:
 *   https://<your-domain>/api/payments/webhook
 * ─────────────────────────────────────────────────────────────────────────────
 */

import { createHmac, timingSafeEqual } from "node:crypto";
import { NextRequest } from "next/server";
import { createServiceClient } from "@/lib/payments/service";
import { getPaystackSecretKey } from "@/lib/payments/paystack";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

interface PaystackEvent {
  event: string;
  data: {
    reference?: string;
    amount?: number; // pesewas
    currency?: string;
    channel?: string | null;
    gateway_response?: string | null;
    status?: string;
    paid_at?: string | null;
    metadata?: { order_id?: string } | null;
    [key: string]: unknown;
  };
}

function signaturesMatch(rawBody: string, header: string | null): boolean {
  if (!header) return false;
  const expected = createHmac("sha512", getPaystackSecretKey())
    .update(rawBody)
    .digest("hex");
  const a = Buffer.from(expected, "utf8");
  const b = Buffer.from(header, "utf8");
  if (a.length !== b.length) return false;
  return timingSafeEqual(a, b);
}

export async function POST(request: NextRequest) {
  const rawBody = await request.text();
  const signature = request.headers.get("x-paystack-signature");

  if (!signaturesMatch(rawBody, signature)) {
    return Response.json({ error: "Invalid signature." }, { status: 401 });
  }

  let event: PaystackEvent;
  try {
    event = JSON.parse(rawBody) as PaystackEvent;
  } catch {
    return Response.json({ error: "Invalid payload." }, { status: 400 });
  }

  const reference = event.data?.reference;
  if (!reference) {
    return Response.json({ received: true });
  }

  const service = createServiceClient();
  const nowIso = new Date().toISOString();

  if (event.event === "charge.success") {
    const { error: paymentError } = await service
      .from("payments")
      .update({
        status: "success",
        channel: event.data.channel ?? null,
        gateway_response: event.data.gateway_response ?? null,
        paid_at: event.data.paid_at ?? nowIso,
        raw: event.data,
        updated_at: nowIso,
      })
      .eq("reference", reference)
      .neq("status", "success");

    if (paymentError) {
      // Partial unique index race (verify route already recorded success) is
      // benign; anything else needs to be visible in the logs.
      console.warn("[payments/webhook] payment update warning:", paymentError);
    }

    // Confirm the order, but ONLY from 'pending' — never clobber a later
    // fulfillment stage (processing/shipped/delivered) if we're late.
    const orderId = event.data.metadata?.order_id;
    if (orderId) {
      const { error: orderUpdateError } = await service
        .from("orders")
        .update({ status: "confirmed", updated_at: nowIso })
        .eq("id", orderId)
        .eq("status", "pending");

      if (orderUpdateError) {
        console.error(
          "[payments/webhook] order status update failed:",
          orderUpdateError
        );
      }
    } else {
      console.error(`[payments/webhook] charge.success without order_id metadata: ref=${reference}`);
    }

    return Response.json({ received: true });
  }

  if (event.event === "charge.failed") {
    await service
      .from("payments")
      .update({
        status: "failed",
        gateway_response: event.data.gateway_response ?? null,
        raw: event.data,
        updated_at: nowIso,
      })
      .eq("reference", reference)
      .eq("status", "pending");

    return Response.json({ received: true });
  }

  // Other events (transfer.*, refund.*, …) are acknowledged but ignored.
  return Response.json({ received: true });
}
