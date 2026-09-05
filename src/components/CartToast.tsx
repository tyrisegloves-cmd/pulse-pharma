"use client";

import Link from "next/link";
import { AnimatePresence, motion } from "framer-motion";
import { Check } from "lucide-react";
import type { CartNotification } from "@/components/CartContext";
import { NOTIFICATION_MS } from "@/components/CartContext";

interface CartToastProps {
  notification: CartNotification | null;
  onDismiss: () => void;
}

/**
 * Global add-to-cart confirmation toast, rendered by CartProvider so it
 * appears on every page. When the product is already in the cart it tells
 * the user instead of stacking quantity — quantities are adjusted in the
 * cart at checkout.
 */
export function CartToast({ notification, onDismiss }: CartToastProps) {
  return (
    <div
      aria-live="polite"
      className="pointer-events-none fixed inset-x-4 bottom-4 z-[70] flex justify-end sm:inset-x-auto sm:right-6 sm:bottom-6"
    >
      <AnimatePresence>
        {notification && (
          <motion.div
            key={notification.key}
            role="status"
            initial={{ opacity: 0, y: 16, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 8, scale: 0.96 }}
            transition={{ duration: 0.2, ease: "easeOut" }}
            className="pointer-events-auto relative w-full max-w-sm overflow-hidden rounded-xl border border-gray-200 bg-white shadow-xl"
          >
            <div className="flex items-center gap-3 p-4 pr-5">
              <span className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-green-100 text-green-600">
                <Check size={20} strokeWidth={3} />
              </span>
              <div className="min-w-0 flex-grow">
                <p className="text-sm font-bold text-gray-900">
                  {notification.wasAlreadyInCart
                    ? "Already in your cart"
                    : "Added to cart"}
                </p>
                <p className="mt-0.5 truncate text-sm text-gray-600">
                  {notification.product.name}
                </p>
                <p className="mt-0.5 text-xs font-medium text-gray-500">
                  {notification.wasAlreadyInCart
                    ? `Quantity: ${notification.totalInCart} — adjust it in your cart`
                    : `${notification.totalInCart} ${
                        notification.totalInCart === 1 ? "unit" : "units"
                      } in your cart`}
                </p>
              </div>
              <Link
                href="/cart"
                onClick={onDismiss}
                className="flex-shrink-0 rounded-lg bg-gray-900 px-3 py-2 text-xs font-semibold text-white transition-colors hover:bg-red-600"
              >
                View Cart
              </Link>
            </div>
            {/* Auto-dismiss progress bar */}
            <motion.div
              initial={{ width: "100%" }}
              animate={{ width: "0%" }}
              transition={{ duration: NOTIFICATION_MS / 1000, ease: "linear" }}
              className="absolute bottom-0 left-0 h-0.5 bg-red-600"
            />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
