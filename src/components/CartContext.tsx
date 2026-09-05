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
import { CartToast } from "@/components/CartToast";

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
  /** Add a product (merges quantity if already in the cart), bounce the badge and raise a toast */
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
const BOUNCE_MS = 550;
export const NOTIFICATION_MS = 3200;

const CartContext = createContext<CartContextValue | null>(null);

export function CartProvider({ children }: { children: ReactNode }) {
  // Start empty on the server and during the first client render to avoid
  // hydration mismatches; hydrate from localStorage in the effect below.
  const [items, setItems] = useState<CartItem[]>([]);
  const [isBouncing, setIsBouncing] = useState(false);
  const [notification, setNotification] = useState<CartNotification | null>(null);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const notifTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const notifKeyRef = useRef(0);
  const [hydrated, setHydrated] = useState(false);

  // Load any persisted cart once on mount.
  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw) as CartItem[];
        if (Array.isArray(parsed)) setItems(parsed);
      }
    } catch {
      // Ignore corrupt storage — treat as empty cart.
    }
    setHydrated(true);
  }, []);

  // Persist on every change once we've hydrated.
  useEffect(() => {
    if (!hydrated) return;
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
    } catch {
      // Storage full / unavailable — cart still works in-memory for the session.
    }
  }, [items, hydrated]);

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

  const addToCart = useCallback(
    (product: Medicine, quantity: number = 1) => {
      const existing = items.find((i) => i.product.id === product.id);
      setItems((prev) => {
        const existing = prev.find((i) => i.product.id === product.id);
        if (existing) {
          return prev.map((i) =>
            i.product.id === product.id
              ? { ...i, quantity: i.quantity + quantity }
              : i
          );
        }
        return [...prev, { product, quantity }];
      });
      notifKeyRef.current += 1;
      setNotification({
        key: notifKeyRef.current,
        product,
        totalInCart: (existing?.quantity ?? 0) + quantity,
        wasAlreadyInCart: Boolean(existing),
      });
      triggerBounce();
    },
    [items, triggerBounce]
  );

  // Auto-dismiss the toast shortly after each add.
  useEffect(() => {
    if (!notification) return;
    notifTimeoutRef.current = setTimeout(
      () => setNotification(null),
      NOTIFICATION_MS
    );
    return () => {
      if (notifTimeoutRef.current) clearTimeout(notifTimeoutRef.current);
    };
  }, [notification]);

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
    </CartContext.Provider>
  );
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useCart must be used within a CartProvider");
  return ctx;
}
