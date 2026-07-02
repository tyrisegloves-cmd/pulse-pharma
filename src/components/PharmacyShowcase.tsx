"use client";

import { useReducedMotion } from "framer-motion";
import { cn } from "@/lib/utils";
import { ZoomParallax } from "@/components/ui/zoom-parallax";

const showcaseImages = [
  {
    // Index 0 is the centerpiece — it fills the viewport at full zoom
    src: "/hero-pharmacy.jpg",
    alt: "Pulse Pharma pharmacist advising a customer in store",
  },
  {
    src: "https://images.unsplash.com/photo-1587854692152-cbe660dbde88?w=1280&h=720&fit=crop&crop=entropy&auto=format&q=80",
    alt: "Pharmacist preparing medication",
  },
  {
    src: "https://images.unsplash.com/photo-1584308666744-24d5e12810a0?w=800&h=1200&fit=crop&crop=entropy&auto=format&q=80",
    alt: "Assorted medication tablets",
  },
  {
    src: "https://images.unsplash.com/photo-1550572017-ed34c6776856?w=1280&h=720&fit=crop&crop=entropy&auto=format&q=80",
    alt: "Antibiotic capsules close up",
  },
  {
    src: "https://images.unsplash.com/photo-1620612668581-7f99991206f4?w=800&h=800&fit=crop&crop=entropy&auto=format&q=80",
    alt: "Vitamin and wellness supplements",
  },
  {
    src: "https://images.unsplash.com/photo-1471864190281-a93a3070b6de?w=1280&h=720&fit=crop&crop=entropy&auto=format&q=80",
    alt: "Prescription medicine bottles",
  },
  {
    src: "https://images.unsplash.com/photo-1583947215259-38e31be8751f?w=1280&h=720&fit=crop&crop=entropy&auto=format&q=80",
    alt: "Clinical health monitoring equipment",
  },
];

/**
 * Brand-story section using the ZoomParallax scroll effect.
 * Under prefers-reduced-motion the parallax is replaced with a
 * simple static image grid, so no scroll-linked motion occurs.
 */
export function PharmacyShowcase() {
  const prefersReducedMotion = useReducedMotion();

  return (
    <section className="bg-white">
      <div className="relative flex h-[40vh] items-center justify-center">
        {/* Radial spotlight */}
        <div
          aria-hidden="true"
          className={cn(
            "pointer-events-none absolute -top-1/2 left-1/2 h-[120vmin] w-[120vmin] -translate-x-1/2 rounded-full",
            "bg-[radial-gradient(ellipse_at_center,rgba(220,38,38,0.06),transparent_50%)]",
            "blur-[30px]",
          )}
        />
        <div className="text-center px-4">
          <span className="inline-block px-3 py-1 rounded-full bg-red-50 text-red-700 text-sm font-semibold mb-4 border border-red-100">
            Inside Pulse Pharma
          </span>
          <h2 className="text-3xl lg:text-4xl font-extrabold text-gray-900 tracking-tight">
            Care you can see, up close.
          </h2>
          <p className="text-gray-600 mt-3 max-w-md mx-auto">
            {prefersReducedMotion
              ? "A look inside our licensed pharmacy in Accra."
              : "Keep scrolling to step inside our licensed pharmacy in Accra."}
          </p>
        </div>
      </div>

      {prefersReducedMotion ? (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-16">
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            {showcaseImages.slice(0, 6).map((img, i) => (
              <div
                key={i}
                className={cn(
                  "overflow-hidden rounded-xl border border-gray-100",
                  i === 0 && "col-span-2 row-span-2",
                )}
              >
                <img
                  src={img.src}
                  alt={img.alt}
                  className="h-full w-full object-cover"
                  loading="lazy"
                />
              </div>
            ))}
          </div>
        </div>
      ) : (
        <ZoomParallax images={showcaseImages} />
      )}
    </section>
  );
}
