"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Bell,
  AlertCircle,
  RefreshCw,
  ShoppingBag,
  Pill,
  CheckCircle,
} from "lucide-react";
import { AccountSidebar, AuthGate } from "@/components/AccountSidebar";
import { useAuth } from "@/components/AuthContext";
import { useCart } from "@/components/CartContext";
import { getOrdersByUser } from "@/services/orders";
import type { Order } from "@/services/orders";
import { getMedicineById } from "@/services/medicines";
import type { Medicine } from "@/services/types";

/** A unique, reorderable medication derived from past order items. */
interface RefillItem {
  productId: string;
  productName: string;
  unitPrice: number;
  quantity: number;
  lastOrderedAt: string;
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("en-GB", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

/**
 * Collapse a user's orders into the unique set of medications they've bought,
 * keeping the most-recent order info and the largest quantity for each product.
 */
function buildRefillItems(orders: Order[]): RefillItem[] {
  const map = new Map<string, RefillItem>();
  for (const order of orders) {
    for (const item of order.items) {
      const existing = map.get(item.productId);
      if (!existing) {
        map.set(item.productId, {
          productId: item.productId,
          productName: item.productName,
          unitPrice: item.unitPrice,
          quantity: item.quantity,
          lastOrderedAt: order.createdAt,
        });
      } else {
        // Keep the most recent order date and the larger quantity.
        if (order.createdAt > existing.lastOrderedAt) {
          existing.lastOrderedAt = order.createdAt;
        }
        if (item.quantity > existing.quantity) {
          existing.quantity = item.quantity;
        }
        map.set(item.productId, existing);
      }
    }
  }
  return Array.from(map.values()).sort(
    (a, b) => b.lastOrderedAt.localeCompare(a.lastOrderedAt)
  );
}

function RefillRemindersContent() {
  const { user } = useAuth();
  const { addToCart } = useCart();
  const router = useRouter();
  const userId = user?.id;

  const [refillItems, setRefillItems] = useState<RefillItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [reordering, setReordering] = useState<string | null>(null);
  const [reordered, setReordered] = useState<string | null>(null);

  useEffect(() => {
    if (!userId) return;
    let cancelled = false;
    (async () => {
      setLoading(true);
      setError(null);
      const { data, error } = await getOrdersByUser(userId);
      if (cancelled) return;
      if (error) {
        setError(error);
      } else {
        setRefillItems(buildRefillItems(data ?? []));
      }
      setLoading(false);
    })();
    return () => {
      cancelled = true;
    };
  }, [userId]);

  const handleReorder = async (item: RefillItem) => {
    setReordering(item.productId);
    setReordered(null);
    try {
      // Resolve the full product record so the cart has image/brand/etc.
      const { data: product } = await getMedicineById(item.productId);
      if (!product) {
        setError(
          `"${item.productName}" is no longer available and can't be reordered.`
        );
        setReordering(null);
        return;
      }
      if (!product.inStock) {
        setError(`"${item.productName}" is currently out of stock.`);
        setReordering(null);
        return;
      }
      addToCart(product, item.quantity);
      setReordered(item.productId);
      // Brief confirmation before heading to the cart.
      setTimeout(() => router.push("/cart"), 600);
    } catch {
      setError("Something went wrong. Please try again.");
      setReordering(null);
    }
  };

  return (
    <div className="bg-gray-50 min-h-screen py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center gap-3 mb-8">
          <div className="w-11 h-11 bg-red-50 text-red-600 rounded-full flex items-center justify-center">
            <Bell size={22} />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Refill Reminders</h1>
            <p className="text-sm text-gray-500">
              Quickly reorder medications from your past orders.
            </p>
          </div>
        </div>

        <div className="flex flex-col md:flex-row gap-8">
          <AccountSidebar active="refills" />

          <div className="flex-grow">
            {/* Error banner */}
            {error && (
              <div className="bg-red-50 border border-red-100 rounded-lg p-4 flex items-start gap-3 mb-6">
                <AlertCircle className="text-red-500 flex-shrink-0 mt-0.5" size={18} />
                <p className="text-sm text-red-700">{error}</p>
              </div>
            )}

            <div className="bg-white border border-gray-200 rounded-xl p-6 mb-8">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-bold text-gray-900">
                  Your Medications
                </h2>
                {refillItems.length > 0 && (
                  <span className="text-sm text-gray-500">
                    {refillItems.length}{" "}
                    {refillItems.length === 1 ? "item" : "items"}
                  </span>
                )}
              </div>

              {/* Loading state */}
              {loading && (
                <div className="space-y-3">
                  {Array.from({ length: 3 }).map((_, i) => (
                    <div
                      key={i}
                      className="border border-gray-100 rounded-lg p-4 animate-pulse"
                    >
                      <div className="h-4 bg-gray-200 rounded w-40 mb-2" />
                      <div className="h-3 bg-gray-100 rounded w-28" />
                    </div>
                  ))}
                </div>
              )}

              {/* Empty state */}
              {!loading && !error && refillItems.length === 0 && (
                <div className="text-center py-12">
                  <Pill className="mx-auto text-gray-300 mb-3" size={40} />
                  <p className="text-gray-500 font-medium mb-1">
                    No medications to refill yet
                  </p>
                  <p className="text-sm text-gray-400 mb-4">
                    Medications from your past orders will appear here for quick
                    reordering.
                  </p>
                  <Link
                    href="/shop"
                    className="inline-block bg-red-600 hover:bg-red-700 text-white font-medium py-2 px-5 rounded-lg text-sm transition-colors"
                  >
                    Browse Products
                  </Link>
                </div>
              )}

              {/* Refill list */}
              {!loading && refillItems.length > 0 && (
                <div className="space-y-4">
                  {refillItems.map((item) => {
                    const isReordering = reordering === item.productId;
                    const justReordered = reordered === item.productId;
                    return (
                      <div
                        key={item.productId}
                        className="border border-gray-100 rounded-lg p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                      >
                        <div className="flex items-start gap-3">
                          <div className="w-10 h-10 bg-red-50 text-red-600 rounded-lg flex items-center justify-center flex-shrink-0">
                            <Pill size={20} />
                          </div>
                          <div>
                            <h3 className="font-bold text-gray-900">
                              {item.productName}
                            </h3>
                            <div className="text-sm text-gray-500 mt-0.5">
                              Last ordered {formatDate(item.lastOrderedAt)} ·
                              Qty {item.quantity}
                            </div>
                            <div className="text-sm font-semibold text-gray-900 mt-1">
                              GH₵ {(item.unitPrice * item.quantity).toFixed(2)}
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center gap-2">
                          {justReordered ? (
                            <span className="inline-flex items-center gap-1.5 text-sm font-medium text-green-700 bg-green-50 px-4 py-2 rounded-lg">
                              <CheckCircle size={16} /> Added
                            </span>
                          ) : (
                            <button
                              onClick={() => handleReorder(item)}
                              disabled={isReordering}
                              className="bg-red-600 hover:bg-red-700 text-white text-sm font-semibold px-4 py-2 rounded-lg transition-colors flex items-center gap-2 disabled:opacity-60 disabled:cursor-not-allowed"
                            >
                              {isReordering ? (
                                <RefreshCw size={16} className="animate-spin" />
                              ) : (
                                <ShoppingBag size={16} />
                              )}
                              {isReordering ? "Adding…" : "Reorder"}
                            </button>
                          )}
                          <Link
                            href={`/shop/${item.productId}`}
                            className="bg-white text-gray-700 border border-gray-200 hover:bg-gray-50 text-sm font-medium px-4 py-2 rounded-lg transition-colors"
                          >
                            View
                          </Link>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Tip card */}
            {!loading && refillItems.length > 0 && (
              <div className="bg-red-50 border border-red-100 rounded-xl p-5 flex items-start gap-3">
                <Bell className="text-red-600 flex-shrink-0 mt-0.5" size={20} />
                <div>
                  <h3 className="font-semibold text-gray-900 text-sm">
                    Stay on schedule
                  </h3>
                  <p className="text-sm text-gray-600 mt-1">
                    Reorder before you run out. Tap{" "}
                    <span className="font-medium text-red-600">Reorder</span> on
                    any medication to add it straight to your cart at your usual
                    quantity.
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default function RefillRemindersPage() {
  return (
    <AuthGate>
      <RefillRemindersContent />
    </AuthGate>
  );
}
