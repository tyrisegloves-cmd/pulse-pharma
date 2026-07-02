"use client";

import { useEffect, useState } from "react";
import { MOCK_PRODUCTS, CATEGORIES } from "@/lib/data";
import { ProductCard } from "@/components/ProductCard";
import { ProductCardSkeleton } from "@/components/ProductCardSkeleton";
import { Reveal } from "@/components/Reveal";
import { Filter, X } from "lucide-react";

export default function Shop() {
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [showRxOnly, setShowRxOnly] = useState(false);
  const [showInStock, setShowInStock] = useState(false);
  const [isMobileFiltersOpen, setIsMobileFiltersOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // Simulate a data fetch on mount + whenever filters change
  useEffect(() => {
    setIsLoading(true);
    const t = setTimeout(() => setIsLoading(false), 750);
    return () => clearTimeout(t);
  }, [selectedCategory, showRxOnly, showInStock]);

  const filteredProducts = MOCK_PRODUCTS.filter((product) => {
    if (selectedCategory && product.category !== selectedCategory) return false;
    if (showRxOnly && !product.isPrescriptionRequired) return false;
    if (showInStock && !product.inStock) return false;
    return true;
  });

  return (
    <div className="bg-gray-50 min-h-screen py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900">All Products</h1>
          <button
            className="lg:hidden flex items-center gap-2 bg-white border border-gray-200 px-4 py-2 rounded-lg text-sm font-medium text-gray-700"
            onClick={() => setIsMobileFiltersOpen(true)}
          >
            <Filter size={16} /> Filters
          </button>
        </div>

        <div className="flex flex-col lg:flex-row gap-8">
          {/* Filters Sidebar */}
          <div
            className={`
              fixed inset-0 z-50 bg-white p-6 lg:p-0 lg:bg-transparent lg:static lg:block lg:w-64 flex-shrink-0
              ${isMobileFiltersOpen ? "block" : "hidden"}
            `}
          >
            <div className="flex justify-between items-center lg:hidden mb-6">
              <h2 className="font-bold text-xl">Filters</h2>
              <button onClick={() => setIsMobileFiltersOpen(false)} className="text-gray-500">
                <X size={24} />
              </button>
            </div>

            <div className="space-y-8 sticky top-24">
              <div>
                <h3 className="font-semibold text-gray-900 mb-4 uppercase text-xs tracking-wider">Categories</h3>
                <div className="space-y-3">
                  <label className="flex items-center gap-3 cursor-pointer">
                    <input
                      type="radio"
                      name="category"
                      checked={selectedCategory === null}
                      onChange={() => setSelectedCategory(null)}
                      className="text-red-600 focus:ring-red-600 w-4 h-4"
                    />
                    <span className="text-gray-700 text-sm">All Categories</span>
                  </label>
                  {CATEGORIES.map((cat) => (
                    <label key={cat} className="flex items-center gap-3 cursor-pointer">
                      <input
                        type="radio"
                        name="category"
                        checked={selectedCategory === cat}
                        onChange={() => setSelectedCategory(cat)}
                        className="text-red-600 focus:ring-red-600 w-4 h-4"
                      />
                      <span className="text-gray-700 text-sm">{cat}</span>
                    </label>
                  ))}
                </div>
              </div>

              <div className="pt-6 border-t border-gray-200">
                <h3 className="font-semibold text-gray-900 mb-4 uppercase text-xs tracking-wider">Availability & Type</h3>
                <div className="space-y-3">
                  <label className="flex items-center gap-3 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={showRxOnly}
                      onChange={(e) => setShowRxOnly(e.target.checked)}
                      className="text-red-600 focus:ring-red-600 rounded w-4 h-4"
                    />
                    <span className="text-gray-700 text-sm">Prescription Only</span>
                  </label>
                  <label className="flex items-center gap-3 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={showInStock}
                      onChange={(e) => setShowInStock(e.target.checked)}
                      className="text-red-600 focus:ring-red-600 rounded w-4 h-4"
                    />
                    <span className="text-gray-700 text-sm">In Stock Only</span>
                  </label>
                </div>
              </div>

              <div className="pt-6 border-t border-gray-200 lg:hidden">
                <button
                  onClick={() => setIsMobileFiltersOpen(false)}
                  className="w-full bg-red-600 text-white py-3 rounded-lg font-medium"
                >
                  Apply Filters
                </button>
              </div>
            </div>
          </div>

          {/* Product Grid */}
          <div className="flex-grow">
            <div className="mb-4 text-sm text-gray-500 h-5">
              {isLoading ? (
                <span className="inline-block h-3 w-40 rounded shimmer align-middle" />
              ) : (
                <>
                  Showing {filteredProducts.length} results{" "}
                  {selectedCategory && `in ${selectedCategory}`}
                </>
              )}
            </div>

            {isLoading ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6" aria-busy="true">
                {Array.from({ length: 6 }).map((_, i) => (
                  <ProductCardSkeleton key={i} />
                ))}
              </div>
            ) : filteredProducts.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredProducts.map((product, idx) => (
                  <Reveal key={product.id} delay={idx * 60} className="h-full">
                    <ProductCard product={product} />
                  </Reveal>
                ))}
              </div>
            ) : (
              <div className="bg-white p-12 text-center rounded-xl border border-gray-200">
                <h3 className="text-lg font-bold text-gray-900 mb-2">No products found</h3>
                <p className="text-gray-500">Try adjusting your filters to see more results.</p>
                <button
                  onClick={() => {
                    setSelectedCategory(null);
                    setShowRxOnly(false);
                    setShowInStock(false);
                  }}
                  className="mt-4 text-red-600 font-medium hover:underline"
                >
                  Clear all filters
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
