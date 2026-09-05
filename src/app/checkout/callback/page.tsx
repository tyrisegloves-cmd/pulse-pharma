"use client";

/**
 * /checkout/callback
 * ─────────────────────────────────────────────────────────────────────────────
 * Paystack redirects the customer here after checkout (callback_url =
 * NEXT_PUBLIC_SITE_URL + /checkout/callback?reference=…).
 *
 * The redirect parameters are NEVER trusted as proof of payment — this page
 * asks our server (/api/payments/verify) to confirm the transaction with
 * Paystack's verify API, and only then shows the success experience. The
 * cart is cleared only after verification succeeds.
 * ─────────────────────────────────────────────────────────────────────────────
 */

import { Suspense, useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import {
  CheckCircle2,
  XCircle,
  AlertCircle,
  Loader2,
  Package,
  ShoppingBag,
  RotateCcw,
  LogIn,
  FileText,
} from "lucide-react";
import { useCart } from "@/components/CartContext";
import { LogoPulse } from "@/components/LogoPulse";

type Outcome =
  | { kind: "verifying" }
  | { kind: "success"; orderId: string; amount?: number; channel?: string }
  | { kind: "failed"; message?: string }
  | { kind: "error"; message: string; canRetry: boolean };

function formatCedis(amount?: number) {
  return amount !== undefined ? `GH₵ ${amount.toFixed(2)}` : "";
}

function channelLabel(channel?: string) {
  switch (channel) {
    case "mobile_money":
      return "Mobile Money";
    case "card":
      return "Card";
    case "bank_transfer":
      return "Bank Transfer";
    default:
      return channel ?? "Paystack";
  }
}

function CallbackInner() {
  const searchParams = useSearchParams();
  const reference = searchParams.get("reference")?.trim();
  const { clearCart } = useCart();
  const [outcome, setOutcome] = useState<Outcome>(() =>
    reference
      ? { kind: "verifying" }
      : { kind: "error", message: "This payment link is missing its reference.", canRetry: false }
  );
  // Guard so the cart is cleared exactly once even if the effect re-runs.
  const cartClearedRef = useRef(false);

  const verify = useCallback(async () => {
    if (!reference) return;
    try {
      const res = await fetch(`/api/payments/verify?reference=${encodeURIComponent(reference)}`);
      const data = (await res.json()) as {
        status?: string;
        orderId?: string;
        amount?: number;
        channel?: string;
        error?: string;
      };

      if (res.ok && data.status === "success" && data.orderId) {
        if (!cartClearedRef.current) {
          cartClearedRef.current = true;
          clearCart();
        }
        setOutcome({
          kind: "success",
          orderId: data.orderId,
          amount: data.amount,
          channel: data.channel,
        });
        return;
      }

      if (res.status === 401) {
        setOutcome({
          kind: "error",
          message: "Your session expired. Please sign in to confirm your payment.",
          canRetry: false,
        });
        return;
      }

      if (data.status === "failed" || data.status === "abandoned") {
        setOutcome({ kind: "failed", message: data.error });
        return;
      }

      // Verification temporarily unavailable (network / Paystack hiccup) —
      // the payment may still have gone through; offer a retry.
      setOutcome({
        kind: "error",
        message: data.error ?? "We couldn't confirm your payment right now.",
        canRetry: true,
      });
    } catch {
      setOutcome({
        kind: "error",
        message: "Network problem while confirming your payment. Please retry.",
        canRetry: true,
      });
    }
  }, [reference, clearCart]);

  const retry = () => {
    setOutcome({ kind: "verifying" });
    void verify();
  };

  useEffect(() => {
    // Fetch-on-mount: verify() only calls setState after its first await
    // (network boundary), so this is the standard data-fetching effect.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void verify();
  }, [verify]);

  return (
    <div className="bg-gray-50 min-h-screen py-12">
      <div className="max-w-lg mx-auto px-4">
        <div className="flex items-center justify-center gap-2 text-red-600 font-bold text-xl tracking-tight mb-8">
          <LogoPulse size={32} />
          Pulse Pharma
        </div>

        <div className="bg-white border border-gray-200 rounded-2xl p-8 text-center shadow-sm">
          {outcome.kind === "verifying" && (
            <>
              <Loader2 size={56} className="mx-auto text-red-600 animate-spin mb-5" />
              <h1 className="text-2xl font-bold text-gray-900 mb-2">Verifying your payment…</h1>
              <p className="text-gray-500 text-sm">
                Please don&apos;t close this page — this only takes a few seconds.
              </p>
            </>
          )}

          {outcome.kind === "success" && (
            <>
              <div className="mx-auto mb-5 w-20 h-20 bg-green-100 rounded-full flex items-center justify-center">
                <CheckCircle2 size={44} className="text-green-600" />
              </div>
              <h1 className="text-2xl font-bold text-gray-900 mb-2">Payment successful!</h1>
              <p className="text-gray-600 text-sm mb-6">
                Thank you — your payment has been confirmed
                {outcome.amount !== undefined && (
                  <> and <span className="font-semibold text-gray-900">{formatCedis(outcome.amount)}</span> charged</>
                )}
                {outcome.channel && <> via {channelLabel(outcome.channel)}</>}. Your order is now
                awaiting pharmacist verification.
              </p>

              <div className="bg-gray-50 border border-gray-100 rounded-xl p-4 text-left text-sm mb-6 space-y-2">
                <div className="flex justify-between">
                  <span className="text-gray-500">Order ID</span>
                  <span className="font-mono text-gray-900 break-all">{outcome.orderId}</span>
                </div>
                {outcome.amount !== undefined && (
                  <div className="flex justify-between">
                    <span className="text-gray-500">Amount paid</span>
                    <span className="font-semibold text-gray-900">{formatCedis(outcome.amount)}</span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span className="text-gray-500">Payment method</span>
                  <span className="text-gray-900">Paystack · {channelLabel(outcome.channel)}</span>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row gap-3 justify-center">
                <Link
                  href={`/orders/${outcome.orderId}/receipt`}
                  className="bg-red-600 hover:bg-red-700 text-white font-bold py-3 px-6 rounded-lg transition-colors flex items-center justify-center gap-2"
                >
                  <FileText size={18} /> View Receipt
                </Link>
                <Link
                  href={`/track/${outcome.orderId}`}
                  className="bg-gray-900 hover:bg-gray-800 text-white font-bold py-3 px-6 rounded-lg transition-colors flex items-center justify-center gap-2"
                >
                  <Package size={18} /> Track Order
                </Link>
                <Link
                  href="/shop"
                  className="bg-white border border-gray-200 hover:border-gray-300 text-gray-700 font-bold py-3 px-6 rounded-lg transition-colors flex items-center justify-center gap-2"
                >
                  <ShoppingBag size={18} /> Continue Shopping
                </Link>
              </div>
            </>
          )}

          {outcome.kind === "failed" && (
            <>
              <div className="mx-auto mb-5 w-20 h-20 bg-red-100 rounded-full flex items-center justify-center">
                <XCircle size={44} className="text-red-600" />
              </div>
              <h1 className="text-2xl font-bold text-gray-900 mb-2">Payment not completed</h1>
              <p className="text-gray-600 text-sm mb-6">
                {outcome.message ??
                  "The payment wasn't completed, so you have not been charged. Your order is saved and pending."}
              </p>
              <div className="flex flex-col sm:flex-row gap-3 justify-center">
                <Link
                  href="/cart"
                  className="bg-red-600 hover:bg-red-700 text-white font-bold py-3 px-6 rounded-lg transition-colors flex items-center justify-center gap-2"
                >
                  <RotateCcw size={18} /> Return to Cart
                </Link>
                <Link
                  href="/ask"
                  className="bg-white border border-gray-200 hover:border-gray-300 text-gray-700 font-bold py-3 px-6 rounded-lg transition-colors"
                >
                  Contact Support
                </Link>
              </div>
            </>
          )}

          {outcome.kind === "error" && (
            <>
              <div className="mx-auto mb-5 w-20 h-20 bg-yellow-100 rounded-full flex items-center justify-center">
                <AlertCircle size={44} className="text-yellow-600" />
              </div>
              <h1 className="text-2xl font-bold text-gray-900 mb-2">
                We couldn&apos;t confirm your payment
              </h1>
              <p className="text-gray-600 text-sm mb-6">{outcome.message}</p>
              <div className="flex flex-col sm:flex-row gap-3 justify-center">
                {outcome.canRetry && (
                  <button
                    onClick={retry}
                    className="bg-red-600 hover:bg-red-700 text-white font-bold py-3 px-6 rounded-lg transition-colors flex items-center justify-center gap-2"
                  >
                    <RotateCcw size={18} /> Retry Verification
                  </button>
                )}
                <Link
                  href="/auth"
                  className="bg-white border border-gray-200 hover:border-gray-300 text-gray-700 font-bold py-3 px-6 rounded-lg transition-colors flex items-center justify-center gap-2"
                >
                  <LogIn size={18} /> Sign In & View Orders
                </Link>
              </div>
            </>
          )}
        </div>

        <p className="text-center text-xs text-gray-400 mt-6">
          Payments are processed securely by Paystack. We never see or store your card or Mobile
          Money credentials.
        </p>
      </div>
    </div>
  );
}

export default function CheckoutCallback() {
  return (
    <Suspense
      fallback={
        <div className="bg-white min-h-screen flex items-center justify-center">
          <div className="w-10 h-10 border-4 border-gray-200 border-t-red-600 rounded-full animate-spin" />
        </div>
      }
    >
      <CallbackInner />
    </Suspense>
  );
}
