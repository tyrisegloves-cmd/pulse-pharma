"use client";

import Link from "next/link";
import Image from "next/image";
import { Product } from "@/lib/data";
import { ShieldAlert, Check, ShoppingBag } from "lucide-react";
import { useCart } from "@/components/CartContext";

export function ProductCard({ product }: { product: Product }) {
  const { addToCart } = useCart();

  return (
    <div className="motion-lift group border border-gray-200 rounded-xl overflow-hidden bg-white flex flex-col h-full transition-all duration-300 ease-out hover:-translate-y-1 hover:shadow-lg hover:border-gray-300">
      <div className="relative h-48 bg-gray-50 flex items-center justify-center p-4">
        <Image
          src={product.imageUrl}
          alt={product.name}
          width={200}
          height={200}
          quality={75}
          loading="lazy"
          className="max-h-full object-contain group-hover:opacity-110 transition-opacity duration-300 rounded"
          sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
        />
        {product.isPrescriptionRequired && (
          <div className="absolute top-3 left-3 bg-red-100 text-red-700 text-xs font-bold px-2 py-1 rounded-md flex items-center gap-1">
            <ShieldAlert size={12} /> Rx Required
          </div>
        )}
      </div>
      <div className="p-5 flex-grow flex flex-col">
        <div className="text-sm text-gray-500 mb-1">{product.brand}</div>
        <h3 className="font-semibold text-gray-900 text-lg mb-2 leading-tight">
          <Link href={`/shop/${product.id}`} className="hover:text-red-600">
            {product.name}
          </Link>
        </h3>
        <div className="flex-grow"></div>
        <div className="flex items-center gap-2 mb-4">
          {product.inStock ? (
            <span className="text-xs text-green-700 bg-green-50 px-2 py-1 rounded-full flex items-center gap-1 font-medium">
              <Check size={12} /> In Stock
            </span>
          ) : (
            <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded-full font-medium">
              Out of Stock
            </span>
          )}
        </div>
        <div className="flex items-center justify-between mt-auto">
          <div className="font-bold text-xl text-gray-900">
            GH₵ {product.price.toFixed(2)}
          </div>
          <button
            disabled={!product.inStock}
            onClick={() => addToCart(1)}
            className="motion-press bg-gray-900 text-white p-2 rounded-lg hover:bg-red-600 transition-all duration-150 active:scale-90 disabled:opacity-50 disabled:hover:bg-gray-900 disabled:active:scale-100"
            aria-label={`Add ${product.name} to cart`}
          >
            <ShoppingBag size={20} />
          </button>
        </div>
      </div>
    </div>
  );
}
