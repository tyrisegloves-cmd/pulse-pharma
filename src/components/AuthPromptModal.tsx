"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import { X, ShoppingCart, LogIn, UserPlus, ShieldCheck } from "lucide-react";
import { LogoPulse } from "@/components/LogoPulse";

interface AuthPromptModalProps {
  isOpen: boolean;
  /** Name of the product the guest tried to add, shown in the message */
  productName: string | null;
  onClose: () => void;
}

/**
 * Prompted when a guest tries to add a product to the cart. The cart is tied
 * to the user's account, so they must sign in or create an account first;
 * CartContext completes the interrupted add automatically right after they
 * authenticate. "Maybe later" keeps the stashed add, so it still lands in the
 * cart if they sign in through any other path during this visit.
 */
export function AuthPromptModal({ isOpen, productName, onClose }: AuthPromptModalProps) {
  const router = useRouter();

  // Close on Escape.
  useEffect(() => {
    if (!isOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [isOpen, onClose]);

  const goAuth = (tab: "signin" | "signup") => {
    const next = encodeURIComponent(
      `${window.location.pathname}${window.location.search}`
    );
    router.push(
      tab === "signup" ? `/auth?tab=signup&next=${next}` : `/auth?next=${next}`
    );
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.18 }}
          onClick={onClose}
          className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-gray-900/60 backdrop-blur-sm"
        >
          <motion.div
            initial={{ opacity: 0, y: 16, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 8, scale: 0.96 }}
            transition={{ duration: 0.2, ease: "easeOut" }}
            role="dialog"
            aria-modal="true"
            aria-labelledby="auth-prompt-title"
            onClick={(e) => e.stopPropagation()}
            className="relative w-full max-w-md bg-white rounded-2xl shadow-2xl border border-gray-100 overflow-hidden"
          >
            {/* Header banner */}
            <div className="bg-gradient-to-r from-red-600 to-red-700 px-6 py-6 text-white relative">
              <button
                onClick={onClose}
                className="absolute top-4 right-4 p-1 rounded-full bg-white/10 hover:bg-white/20 transition-colors text-white"
                aria-label="Close dialog"
              >
                <X size={20} />
              </button>
              <div className="flex items-center gap-3">
                <LogoPulse size={36} />
                <span className="font-bold text-xl tracking-tight">Pulse Pharma</span>
              </div>
            </div>

            <div className="p-6 text-center">
              <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-red-50 text-red-600">
                <ShoppingCart size={26} />
              </div>
              <h2 id="auth-prompt-title" className="text-xl font-bold text-gray-900 mb-2">
                Sign in to add to cart
              </h2>
              <p className="text-sm text-gray-600 leading-relaxed mb-6">
                Your cart and orders are tied to your account.
                {productName && (
                  <> Sign in or create an account to add &ldquo;{productName}&rdquo; to your cart.</>
                )}
              </p>

              <div className="space-y-3">
                <button
                  onClick={() => goAuth("signin")}
                  className="w-full bg-red-600 hover:bg-red-700 text-white font-bold py-3 px-4 rounded-xl shadow-md transition-colors flex items-center justify-center gap-2"
                >
                  <LogIn size={18} />
                  <span>Sign In</span>
                </button>
                <button
                  onClick={() => goAuth("signup")}
                  className="w-full bg-white border-2 border-gray-200 hover:border-red-300 text-gray-700 font-bold py-3 px-4 rounded-xl transition-colors flex items-center justify-center gap-2"
                >
                  <UserPlus size={18} />
                  <span>Create Account</span>
                </button>
                <button
                  onClick={onClose}
                  className="w-full text-sm font-medium text-gray-500 hover:text-gray-700 py-2 transition-colors"
                >
                  Maybe later
                </button>
              </div>

              <div className="mt-5 pt-4 border-t border-gray-100 flex items-center justify-center gap-2 text-xs text-gray-500">
                <ShieldCheck size={14} className="text-red-600" />
                <span>Your cart is saved to your account, not this device.</span>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
