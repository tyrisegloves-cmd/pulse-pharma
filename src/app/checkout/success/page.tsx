"use client";

/**
 * /checkout/success?order=…
 * ─────────────────────────────────────────────────────────────────────────────
 * Confirmation page for Cash-on-Delivery orders (Paystack payments are
 * confirmed on /checkout/callback instead). Shows the order summary loaded
 * from Supabase and the "pay the courier" instruction.
 * ─────────────────────────────────────────────────────────────────────────────
 */

import { Suspense, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Banknote, Package, ShoppingBag, Loader2, AlertCircle } from "lucide-react";
import { getOrderById, type Order } from "@/services/orders";
import { LogoPulse } from "@/components/LogoPulse";

function SuccessInner() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const orderId = searchParams.get("order")?.trim();
  const [order, setOrder] = useState<Order | null>(null);
  const [loadState, setLoadState] = useState<"loading" | "ready" | "error">("loading");

  useEffect(() => {
    if (!orderId) {
      router.replace("/cart");
      return;
    }
    let cancelled = false;
    (async () => {
      const { data, error } = await getOrderById(orderId);
      if (cancelled) return;
      if (error || !data) {
        setLoadState("error");
        return;
      }
      setOrder(data);
      setLoadState("ready");
    })();
    return () => {
      cancelled = true;
    };
  }, [orderId, router]);

  if (!orderId || loadState === "error") {
    return (
      <Shell>
        <div className="mx-auto mb-5 w-20 h-20 bg-red-100 rounded-full flex items-center justify-center">
          <AlertCircle size={44} className="text-red-600" />
        </div>
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Order not found</h1>
        <p className="text-gray-600 text-sm mb-6">
          We couldn&apos;t load this order. Check your order history in My Account.
        </p>
        <Link
          href="/account"
          className="bg-red-600 hover:bg-red-700 text-white font-bold py-3 px-6 rounded-lg transition-colors inline-block"
        >
          Go to My Account
        </Link>
      </Shell>
    );
  }

  if (loadState === "loading") {
    return (
      <Shell>
        <Loader2 size={56} className="mx-auto text-red-600 animate-spin mb-5" />
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Preparing your confirmation…</h1>
      </Shell>
    );
  }

  return (
    <Shell>
      <div className="mx-auto mb-5 w-20 h-20 bg-green-100 rounded-full flex items-center justify-center">
        <Banknote size={44} className="text-green-600" />
      </div>
      <h1 className="text-2xl font-bold text-gray-900 mb-2">Order placed!</h1>
      <p className="text-gray-600 text-sm mb-6">
        Your order has been received and is awaiting pharmacist verification. Please have{" "}
        <span className="font-semibold text-gray-900">
          GH₵ {(order?.totalAmount ?? 0).toFixed(2)}
        </span>{" "}
        ready in cash when your order arrives.
      </p>

      <div className="bg-gray-50 border border-gray-100 rounded-xl p-4 text-left text-sm mb-6 space-y-2">
        <div className="flex justify-between">
          <span className="text-gray-500">Order ID</span>
          <span className="font-mono text-gray-900 break-all">{orderId}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-gray-500">Items</span>
          <span className="text-gray-900">
            {order?.items.reduce((sum, item) => sum + item.quantity, 0) ?? "—"}
          </span>
        </div>
        <div className="flex justify-between">
          <span className="text-gray-500">Total (incl. delivery)</span>
          <span className="font-semibold text-gray-900">
            GH₵ {(order?.totalAmount ?? 0).toFixed(2)}
          </span>
        </div>
        <div className="flex justify-between">
          <span className="text-gray-500">Payment method</span>
          <span className="text-gray-900">Cash on Delivery</span>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row gap-3 justify-center">
        <Link
          href={`/track/${orderId}`}
          className="bg-red-600 hover:bg-red-700 text-white font-bold py-3 px-6 rounded-lg transition-colors flex items-center justify-center gap-2"
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
    </Shell>
  );
}

function Shell({ children }: { children: React.ReactNode }) {
  return (
    <div className="bg-gray-50 min-h-screen py-12">
      <div className="max-w-lg mx-auto px-4">
        <div className="flex items-center justify-center gap-2 text-red-600 font-bold text-xl tracking-tight mb-8">
          <LogoPulse size={32} />
          Pulse Pharma
        </div>
        <div className="bg-white border border-gray-200 rounded-2xl p-8 text-center shadow-sm">
          {children}
        </div>
        <p className="text-center text-xs text-gray-400 mt-6">
          Your cart and orders are tied to your Pulse Pharma account.
        </p>
      </div>
    </div>
  );
}

export default function CheckoutSuccess() {
  return (
    <Suspense
      fallback={
        <div className="bg-white min-h-screen flex items-center justify-center">
          <div className="w-10 h-10 border-4 border-gray-200 border-t-red-600 rounded-full animate-spin" />
        </div>
      }
    >
      <SuccessInner />
    </Suspense>
  );
}
