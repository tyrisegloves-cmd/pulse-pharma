"use client";

import { ShoppingBag } from "lucide-react";
import { useCart } from "@/components/CartContext";
import type { Medicine } from "@/services/types";

interface AddToCartButtonProps {
  product: Medicine;
  inStock?: boolean;
}

/** Full-width add-to-cart button used on the product detail page.
    Adds the product only — quantities are adjusted in the cart at checkout. */
export function AddToCartButton({ product, inStock }: AddToCartButtonProps) {
  const { addToCart } = useCart();

  // Fall back to the product's own inStock flag so callers can omit it.
  const available = inStock ?? product.inStock;

  return (
    <button
      disabled={!available}
      onClick={() => addToCart(product)}
      className="motion-press flex-grow bg-red-600 text-white py-3 px-6 rounded-lg font-bold hover:bg-red-700 transition-all duration-150 active:scale-[0.98] disabled:opacity-50 disabled:hover:bg-red-600 disabled:active:scale-100 flex items-center justify-center gap-2"
    >
      <ShoppingBag size={20} />
      {available ? "Add to Cart" : "Out of Stock"}
    </button>
  );
}
