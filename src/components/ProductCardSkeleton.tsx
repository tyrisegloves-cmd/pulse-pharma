/**
 * Shimmering skeleton placeholder for a ProductCard.
 * Uses CSS shimmer classes defined in globals.css and respects
 * prefers-reduced-motion (shimmer collapses to a static tone).
 */
export function ProductCardSkeleton() {
  return (
    <div
      className="border border-gray-200 rounded-xl overflow-hidden bg-white flex flex-col h-full"
      aria-hidden="true"
    >
      <div className="h-48 bg-gray-50 flex items-center justify-center p-4">
        <div className="w-32 h-32 rounded-lg shimmer" />
      </div>
      <div className="p-5 flex-grow flex flex-col gap-3">
        <div className="h-3 w-16 rounded shimmer" />
        <div className="h-4 w-4/5 rounded shimmer" />
        <div className="h-4 w-3/5 rounded shimmer" />
        <div className="flex-grow" />
        <div className="h-5 w-20 rounded-full shimmer" />
        <div className="flex items-center justify-between mt-2">
          <div className="h-6 w-24 rounded shimmer" />
          <div className="h-10 w-10 rounded-lg shimmer" />
        </div>
      </div>
    </div>
  );
}
