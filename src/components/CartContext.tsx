"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import type { Medicine } from "@/services/types";
import { useAuth } from "@/components/AuthContext";
import { CartToast } from "@/components/CartToast";
import { AuthPromptModal } from "@/components/AuthPromptModal";

export interface CartItem {
  product: Medicine;
  quantity: number;
}

/** One add-to-cart event, consumed by the CartToast notification */
export interface CartNotification {
  /** Monotonic key so repeat adds re-trigger the toast animation */
  key: number;
  product: Medicine;
  /** Total quantity of this product now in the cart */
  totalInCart: number;
  /** True when the product was already in the cart (quantity merged) */
  wasAlreadyInCart: boolean;
}

interface CartContextValue {
  /** Full list of cart lines */
  items: CartItem[];
  /** Sum of all line quantities — drives the header badge */
  count: number;
  /** Add a product to the cart. Guests are prompted to sign in/up first and
      the add completes automatically once they authenticate. If the product
      is already in the cart the quantity is left untouched — quantities are
      only adjusted from the cart (checkout). */
  addToCart: (product: Medicine, quantity?: number) => void;
  /** Replace the quantity of a line, removing it if quantity hits 0 */
  updateQuantity: (id: string, delta: number) => void;
  /** Remove a line entirely */
  removeFromCart: (id: string) => void;
  /** Empty the cart */
  clearCart: () => void;
  /** True briefly after an item is added — used to run the bounce animation */
  isBouncing: boolean;
  /** Most recent add-to-cart event, or null when the toast is hidden */
  notification: CartNotification | null;
  /** Hide the add-to-cart toast */
  dismissNotification: () => void;
}

const STORAGE_KEY = "pulse-cart";
const PENDING_ADD_KEY = "pulse-pending-cart-add";
const BOUNCE_MS = 550;
export const NOTIFICATION_MS = 3200;

const CartContext = createContext<CartContextValue | null>(null);

export function CartProvider({ children }: { children: ReactNode }) {
  // Cart is tied to the user's account (AuthProvider wraps this provider).
  const { isLoggedIn, isLoading: isAuthLoading, user } = useAuth();
  // Start empty until the session resolves and the owner's cart is loaded.
  const [items, setItems] = useState<CartItem[]>([]);
  const [isBouncing, setIsBouncing] = useState(false);
  const [notification, setNotification] = useState<CartNotification | null>(null);
  /** Product a guest tried to add — drives the sign-in/up prompt modal */
  const [authPromptProduct, setAuthPromptProduct] = useState<Medicine | null>(null);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const notifTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const notifKeyRef = useRef(0);
  /** Which account the currently-loaded cart belongs to — blocks one user's
      cart from leaking into another's session on account switches. */
  const cartOwnerRef = useRef<string | null>(null);
  const [hydrated, setHydrated] = useState(false);

  // Load the persisted cart once the auth session resolves — and only for a
  // signed-in user. A guest (or a just-signed-out user) always ends up with an
  // empty cart: items are wiped and any leftover storage is removed, so no
  // cart survives a logout or leaks between accounts.
  useEffect(() => {
    if (isAuthLoading) return;
    if (isLoggedIn && user) {
      if (cartOwnerRef.current === user.id) return;
      cartOwnerRef.current = user.id;
      let stored: CartItem[] = [];
      try {
        const raw = localStorage.getItem(STORAGE_KEY);
        if (raw) {
          const parsed = JSON.parse(raw) as CartItem[];
          if (Array.isArray(parsed)) stored = parsed;
        }
      } catch {
        // Ignore corrupt storage — treat as empty cart.
      }
      setItems(stored);
    } else {
      cartOwnerRef.current = null;
      setItems([]);
      try {
        localStorage.removeItem(STORAGE_KEY);
      } catch {
        // Storage unavailable — in-memory clear above still applies.
      }
    }
    setHydrated(true);
  }, [isAuthLoading, isLoggedIn, user]);

  // Persist on every change, but only while signed in.
  useEffect(() => {
    if (!hydrated || !isLoggedIn) return;
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
    } catch {
      // Storage full / unavailable — cart still works in-memory for the session.
    }
  }, [items, hydrated, isLoggedIn]);

  const triggerBounce = useCallback(() => {
    setIsBouncing(false);
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    // Restart the animation cleanly on the next frame so rapid adds re-bounce.
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        setIsBouncing(true);
        timeoutRef.current = setTimeout(() => setIsBouncing(false), BOUNCE_MS);
      });
    });
  }, []);

  const dismissNotification = useCallback(() => {
    if (notifTimeoutRef.current) clearTimeout(notifTimeoutRef.current);
    setNotification(null);
  }, []);

  /** Shared add logic — used directly when signed in and by the pending-add
      processor right after a guest authenticates. */
  const performAdd = useCallback(
    (product: Medicine, quantity: number = 1) => {
      const existing = items.find((i) => i.product.id === product.id);
      // Adding a product that's already in the cart never stacks quantity —
      // the toast just reminds the user, and they adjust units in the cart.
      // The .some() guard inside keeps the append idempotent against
      // double-clicks landing before the next render commits.
      setItems((prev) =>
        prev.some((i) => i.product.id === product.id)
          ? prev
          : [...prev, { product, quantity }]
      );
      notifKeyRef.current += 1;
      setNotification({
        key: notifKeyRef.current,
        product,
        totalInCart: existing?.quantity ?? quantity,
        wasAlreadyInCart: Boolean(existing),
      });
      triggerBounce();
    },
    [items, triggerBounce]
  );

  // Keep a live ref so the pending-add effect can call the latest version
  // without re-running on every cart change.
  const performAddRef = useRef(performAdd);
  useEffect(() => {
    performAddRef.current = performAdd;
  }, [performAdd]);

  const addToCart = useCallback(
    (product: Medicine, quantity: number = 1) => {
      // Not authenticated → the cart is off-limits. Stash the intended add so
      // it completes automatically right after the user signs in or up.
      if (isAuthLoading || !isLoggedIn) {
        try {
          sessionStorage.setItem(
            PENDING_ADD_KEY,
            JSON.stringify({ product, quantity })
          );
        } catch {
          // Session storage unavailable — the add simply won't be replayed.
        }
        // Skip the prompt while the session is still resolving (the splash
        // screen covers this window) to avoid flashing it for signed-in users.
        if (!isAuthLoading) setAuthPromptProduct(product);
        return;
      }
      performAdd(product, quantity);
    },
    [isAuthLoading, isLoggedIn, performAdd]
  );

  // Complete a stashed guest add immediately after authentication, wherever
  // the user happens to land after signing in or up.
  useEffect(() => {
    if (isAuthLoading || !isLoggedIn) return;
    let raw: string | null = null;
    try {
      raw = sessionStorage.getItem(PENDING_ADD_KEY);
    } catch {
      return;
    }
    if (!raw) return;
    try {
      sessionStorage.removeItem(PENDING_ADD_KEY);
    } catch {
      // Best-effort cleanup.
    }
    try {
      const { product, quantity } = JSON.parse(raw) as {
        product: Medicine;
        quantity?: number;
      };
      if (product?.id) performAddRef.current(product, quantity ?? 1);
    } catch {
      // Corrupt stash — drop it silently.
    }
  }, [isAuthLoading, isLoggedIn]);

  const updateQuantity = useCallback((id: string, delta: number) => {
    setItems((prev) =>
      prev
        .map((i) =>
          i.product.id === id ? { ...i, quantity: i.quantity + delta } : i
        )
        // Drop lines whose quantity has fallen to zero or below.
        .filter((i) => i.quantity > 0)
    );
  }, []);

  const removeFromCart = useCallback((id: string) => {
    setItems((prev) => prev.filter((i) => i.product.id !== id));
  }, []);

  const clearCart = useCallback(() => setItems([]), []);

  const count = useMemo(
    () => items.reduce((sum, i) => sum + i.quantity, 0),
    [items]
  );

  return (
    <CartContext.Provider
      value={{
        items,
        count,
        addToCart,
        updateQuantity,
        removeFromCart,
        clearCart,
        isBouncing,
        notification,
        dismissNotification,
      }}
    >
      {children}
      <CartToast notification={notification} onDismiss={dismissNotification} />
      <AuthPromptModal
        isOpen={authPromptProduct !== null}
        productName={authPromptProduct?.name ?? null}
        onClose={() => setAuthPromptProduct(null)}
      />
    </CartContext.Provider>
  );
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useCart must be used within a CartProvider");
  return ctx;
}
