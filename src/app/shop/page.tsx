"use client";

import { useEffect, useMemo, useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { normalizeCategory } from "@/lib/data";
import { ProductCard } from "@/components/ProductCard";
import { ProductCardSkeleton } from "@/components/ProductCardSkeleton";
import { Reveal } from "@/components/Reveal";
import { Filter, X } from "lucide-react";
import { getAllMedicines } from "@/services/medicines";
import { getCategories } from "@/services/categories";
import type { Medicine, Category } from "@/services/types";

function ShopContent() {
  const searchParams = useSearchParams();
  const [products, setProducts] = useState<Medicine[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [showRxOnly, setShowRxOnly] = useState(false);
  const [showInStock, setShowInStock] = useState(false);
  const [isMobileFiltersOpen, setIsMobileFiltersOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const searchTerm = searchParams.get("search")?.trim() ?? "";

  // Derive the active category from the URL query param.
  // Legacy names (e.g. "Baby & Mother") are normalized to the current name.
  const urlCategory = useMemo(() => {
    const cat = searchParams.get("category");
    if (!cat) return null;
    return normalizeCategory(cat);
  }, [searchParams]);

  // Allow the sidebar radio buttons to override the URL-driven selection.
  const [overrideCategory, setOverrideCategory] = useState<string | null>(null);
  const selectedCategory = overrideCategory ?? urlCategory;

  // Fetch categories from Supabase on mount.
  useEffect(() => {
    async function loadCategories() {
      const categoriesResult = await getCategories();
      if (!categoriesResult.error && categoriesResult.data) {
        setCategories(categoriesResult.data);
      }
    }
    loadCategories();
  }, []);

  // Fetch the visible medicines from Supabase whenever filters/search change.
  useEffect(() => {
    async function loadProducts() {
      setIsLoading(true);
      setLoadError(null);

      const medicinesResult = await getAllMedicines({
        category: selectedCategory ?? undefined,
        search: searchTerm || undefined,
        inStockOnly: showInStock,
        prescriptionOnly: showRxOnly,
        sortBy: "name-asc",
      });

      if (medicinesResult.error) {
        setLoadError(medicinesResult.error);
        setProducts([]);
      } else {
        setProducts(medicinesResult.data ?? []);
      }

      setIsLoading(false);
    }

    loadProducts();
  }, [selectedCategory, searchTerm, showInStock, showRxOnly]);

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
                      onChange={() => setOverrideCategory(null)}
                      className="text-red-600 focus:ring-red-600 w-4 h-4"
                    />
                    <span className="text-gray-700 text-sm">All Categories</span>
                  </label>
                  {categories.map((cat) => (
                    <label key={cat.name} className="flex items-center gap-3 cursor-pointer">
                      <input
                        type="radio"
                        name="category"
                        checked={selectedCategory === cat.name}
                        onChange={() => setOverrideCategory(cat.name)}
                        className="text-red-600 focus:ring-red-600 w-4 h-4"
                      />
                      <span className="text-gray-700 text-sm">{cat.name}</span>
                    </label>
                  ))}
                </div>
              </div>

              <div className="pt-6 border-t border-gray-200">
                <h3 className="font-semibold text-gray-900 mb-4 uppercase text-xs tracking-wider">Availability &amp; Type</h3>
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
                  Showing {products.length} results{" "}
                  {selectedCategory && `in ${selectedCategory}`}
                  {searchTerm && ` for "${searchTerm}"`}
                </>
              )}
            </div>

            {/* Error state */}
            {loadError && !isLoading && (
              <div className="bg-red-50 border border-red-200 rounded-xl p-6 text-center">
                <p className="text-red-700 font-medium">{loadError}</p>
                <button
                  onClick={() => window.location.reload()}
                  className="mt-3 text-red-600 font-medium hover:underline text-sm"
                >
                  Try again
                </button>
              </div>
            )}

            {isLoading ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6" aria-busy="true">
                {Array.from({ length: 6 }).map((_, i) => (
                  <ProductCardSkeleton key={i} />
                ))}
              </div>
            ) : !loadError && products.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {products.map((product, idx) => (
                  <Reveal key={product.id} delay={idx * 60} className="h-full">
                    <ProductCard product={product} />
                  </Reveal>
                ))}
              </div>
            ) : !loadError ? (
              <div className="bg-white p-12 text-center rounded-xl border border-gray-200">
                <h3 className="text-lg font-bold text-gray-900 mb-2">No products found</h3>
                <p className="text-gray-500">Try adjusting your filters to see more results.</p>
                <button
                  onClick={() => {
                    setOverrideCategory(null);
                    setShowRxOnly(false);
                    setShowInStock(false);
                  }}
                  className="mt-4 text-red-600 font-medium hover:underline"
                >
                  Clear all filters
                </button>
              </div>
            ) : null}
          </div>
        </div>
      </div>
    </div>
  );
}

export default function Shop() {
  return (
    <Suspense
      fallback={
        <div className="bg-gray-50 min-h-screen flex items-center justify-center">
          <div className="w-10 h-10 border-4 border-gray-200 border-t-red-600 rounded-full animate-spin" />
        </div>
      }
    >
      <ShopContent />
    </Suspense>
  );
}
