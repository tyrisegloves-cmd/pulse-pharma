"use client";

import {
  createContext,
  useCallback,
  useContext,
  useRef,
  useState,
  type ReactNode,
} from "react";

interface CartContextValue {
  count: number;
  /** Increments the cart count and triggers the badge bounce animation */
  addToCart: (quantity?: number) => void;
  /** True briefly after an item is added — used to run the bounce animation */
  isBouncing: boolean;
}

const CartContext = createContext<CartContextValue | null>(null);

export function CartProvider({ children }: { children: ReactNode }) {
  const [count, setCount] = useState(0);
  const [isBouncing, setIsBouncing] = useState(false);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const addToCart = useCallback((quantity: number = 1) => {
    setCount((c) => c + quantity);

    // Restart the bounce animation cleanly even on rapid clicks
    setIsBouncing(false);
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    // Next frame: re-add the class so the animation replays
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        setIsBouncing(true);
        timeoutRef.current = setTimeout(() => setIsBouncing(false), 550);
      });
    });
  }, []);

  return (
    <CartContext.Provider value={{ count, addToCart, isBouncing }}>
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useCart must be used within a CartProvider");
  return ctx;
}
