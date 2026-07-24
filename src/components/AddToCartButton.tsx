"use client";

import { ShoppingBag } from "lucide-react";
import { useCart } from "@/components/CartContext";

interface AddToCartButtonProps {
  inStock: boolean;
  quantity?: number;
}

/** Full-width add-to-cart button used on the product detail page */
export function AddToCartButton({ inStock, quantity = 1 }: AddToCartButtonProps) {
  const { addToCart } = useCart();

  return (
    <button
      disabled={!inStock}
      onClick={() => addToCart(quantity)}
      className="motion-press flex-grow bg-red-600 text-white py-3 px-6 rounded-lg font-bold hover:bg-red-700 transition-all duration-150 active:scale-[0.98] disabled:opacity-50 disabled:hover:bg-red-600 disabled:active:scale-100 flex items-center justify-center gap-2"
    >
      <ShoppingBag size={20} />
      {inStock ? "Add to Cart" : "Out of Stock"}
    </button>
  );
}
