import Link from "next/link";
import { ArrowRight, Search, ShieldCheck, Clock, CheckCircle, FileText } from "lucide-react";
import { MOCK_PRODUCTS, CATEGORIES } from "@/lib/data";
import { ProductCard } from "@/components/ProductCard";
import { Reveal } from "@/components/Reveal";
import { PharmacyShowcase } from "@/components/PharmacyShowcase";

export default function Home() {
  const featuredProducts = MOCK_PRODUCTS.slice(0, 4);

  return (
    <div>
      {/*
        Hero Section
        Full-bleed branded pharmacy photo (pharmacist + customer at counter).
        Three overlay layers keep text legible without washing out the image:
          1. Desktop: left-to-right dark scrim — copy is on a dark field,
             the photo breathes freely on the right.
          2. Mobile: bottom-to-top scrim — full bottom darkening so the
             stacked text block always has contrast regardless of crop.
          3. White-to-transparent top-left highlight — gives the "white fade"
             feel requested while preserving white text contrast.
        object-position: 60% center keeps the pharmacist+customer in frame
        on all viewports and prevents awkward left-edge cropping.
      */}
      <section className="relative border-b border-red-100 overflow-hidden bg-gray-900">

        {/* ── Background image ── */}
        <div className="absolute inset-0">
          <img
            src="/images/ChatGPT%20Image%20Jul%202%2C%202026%2C%2004_14_05%20PM.png"
            alt="Pulse Pharma pharmacist in white coat discussing medication with a customer at the counter"
            className="w-full h-full object-cover"
            style={{ objectPosition: '60% center' }}
          />

          {/*
            Layer 1 — Desktop: left-anchored dark-to-transparent gradient.
            Covers ~55% of the width so text on the left is always on a
            near-opaque dark field; the right half of the photo is untouched.
            On mobile this layer is replaced by Layer 2 below.
          */}
          <div
            aria-hidden="true"
            className="absolute inset-0 hidden lg:block"
            style={{
              background:
                'linear-gradient(to right, rgba(10,10,20,0.88) 0%, rgba(10,10,20,0.75) 38%, rgba(10,10,20,0.35) 62%, transparent 80%)',
            }}
          />

          {/*
            Layer 1b — Tablet (sm → lg): softer split — text side darker,
            photo side still visible.
          */}
          <div
            aria-hidden="true"
            className="absolute inset-0 block lg:hidden"
            style={{
              background:
                'linear-gradient(to bottom, rgba(10,10,20,0.55) 0%, rgba(10,10,20,0.70) 45%, rgba(10,10,20,0.90) 100%)',
            }}
          />

          {/*
            Layer 2 — White-to-transparent glow on the top-left corner.
            Creates the "white fade" quality that references the bright
            pharmacy interior without touching the rest of the image.
            Opacity is kept low so white text contrast is unaffected.
          */}
          <div
            aria-hidden="true"
            className="absolute inset-0"
            style={{
              background:
                'radial-gradient(ellipse 55% 60% at 0% 0%, rgba(255,255,255,0.08) 0%, transparent 70%)',
            }}
          />

          {/*
            Layer 3 — Red brand tint in the deep shadows.
            mix-blend-multiply keeps it from tinting bright areas of the photo.
          */}
          <div
            aria-hidden="true"
            className="absolute inset-0 mix-blend-multiply"
            style={{
              background:
                'linear-gradient(135deg, rgba(185,28,28,0.20) 0%, transparent 55%)',
            }}
          />

          {/*
            Layer 4 — Animated EKG pulse line at the very bottom of the hero.
            Echoes the brand logo's heartbeat motif. Low opacity so it reads
            as texture rather than a competing element.
          */}
          <div aria-hidden="true" className="absolute bottom-0 left-0 right-0 h-16 opacity-25 pointer-events-none">
            <svg
              viewBox="0 0 1200 60"
              preserveAspectRatio="none"
              className="w-full h-full hero-ekg"
            >
              <defs>
                <linearGradient id="ekgGrad" x1="0" x2="1" y1="0" y2="0">
                  <stop offset="0%"   stopColor="#dc2626" stopOpacity="0" />
                  <stop offset="20%"  stopColor="#dc2626" stopOpacity="1" />
                  <stop offset="80%"  stopColor="#dc2626" stopOpacity="1" />
                  <stop offset="100%" stopColor="#dc2626" stopOpacity="0" />
                </linearGradient>
              </defs>
              {/* Flat-line with two QRS spikes across the full width */}
              <path
                d="M0 30 L280 30 L295 30 L300 22 L308 38 L316 18 L324 42 L330 30 L580 30 L595 30 L600 22 L608 38 L616 18 L624 42 L630 30 L1200 30"
                fill="none"
                stroke="url(#ekgGrad)"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="hero-ekg-path"
              />
            </svg>
          </div>
        </div>

        {/* ── Hero content ── */}
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24 lg:py-36">
          <div className="max-w-2xl">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-red-600/90 text-white text-sm font-semibold mb-6 shadow-sm ring-1 ring-white/20">
              <ShieldCheck size={16} /> Licensed Pharmacy in Accra
            </span>
            <h1 className="text-4xl lg:text-6xl font-extrabold text-white tracking-tight leading-[1.05] mb-6 drop-shadow-[0_2px_16px_rgba(0,0,0,0.5)]">
              Your health,{" "}
              <span className="text-red-400">delivered</span> with precision and
              care.
            </h1>
            <p className="text-lg text-gray-100/90 mb-8 max-w-lg drop-shadow-[0_1px_8px_rgba(0,0,0,0.5)]">
              Get your prescriptions filled and everyday health essentials
              delivered to your door in hours. Verified by licensed pharmacists.
            </p>

            {/* Search — solid white card keeps form controls always legible */}
            <div className="relative max-w-md mb-6 bg-white/95 backdrop-blur-sm rounded-xl shadow-xl ring-1 ring-black/5 p-1.5">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                <Search className="h-5 w-5 text-gray-400" />
              </div>
              <input
                type="text"
                className="block w-full pl-11 pr-32 py-3.5 rounded-lg bg-transparent text-gray-900 placeholder-gray-500 focus:outline-none"
                placeholder="Search for medication (e.g. Paracetamol)..."
              />
              <button className="absolute inset-y-1.5 right-1.5 px-5 bg-red-600 text-white font-medium rounded-lg hover:bg-red-700 transition-colors shadow-sm">
                Search
              </button>
            </div>

            <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-sm font-medium text-gray-200">
              <span className="text-gray-300/80">Popular:</span>
              <Link
                href="/shop?category=Pain+Relief"
                className="text-white hover:text-red-300 underline decoration-red-400/60 underline-offset-4 transition-colors"
              >
                Pain Relief
              </Link>
              <Link
                href="/shop?category=Antibiotics"
                className="text-white hover:text-red-300 underline decoration-red-400/60 underline-offset-4 transition-colors"
              >
                Antibiotics
              </Link>
              <Link
                href="/shop?category=First+Aid"
                className="text-white hover:text-red-300 underline decoration-red-400/60 underline-offset-4 transition-colors"
              >
                First Aid
              </Link>
            </div>

            {/* Floating Rx card */}
            <div className="mt-10 inline-flex bg-white/95 backdrop-blur-sm p-4 pr-6 rounded-2xl shadow-xl ring-1 ring-black/5">
              <div className="flex items-center gap-4">
                <div className="bg-red-100 p-3 rounded-full text-red-600">
                  <FileText size={22} />
                </div>
                <div>
                  <div className="font-bold text-gray-900">Easy Rx Upload</div>
                  <div className="text-sm text-gray-500">Fast pharmacist verification</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Trust Badges */}
      <section className="py-8 bg-white border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 divide-y md:divide-y-0 md:divide-x divide-gray-100">
            <Reveal delay={0} className="flex items-center gap-4 p-4 md:p-0 md:justify-center">
              <ShieldCheck className="text-red-600 w-8 h-8" />
              <div>
                <h3 className="font-bold text-gray-900">Licensed Pharmacy</h3>
                <p className="text-sm text-gray-500">Pharmacy Council Reg: PCG-2026-X8</p>
              </div>
            </Reveal>
            <Reveal delay={100} className="flex items-center gap-4 p-4 md:p-0 md:justify-center">
              <CheckCircle className="text-red-600 w-8 h-8" />
              <div>
                <h3 className="font-bold text-gray-900">Verified Pharmacists</h3>
                <p className="text-sm text-gray-500">Expert advice when you need it</p>
              </div>
            </Reveal>
            <Reveal delay={200} className="flex items-center gap-4 p-4 md:p-0 md:justify-center">
              <Clock className="text-red-600 w-8 h-8" />
              <div>
                <h3 className="font-bold text-gray-900">Fast Delivery in Accra</h3>
                <p className="text-sm text-gray-500">Same-day delivery for most orders</p>
              </div>
            </Reveal>
          </div>
        </div>
      </section>

      {/* Category Shortcuts */}
      <section className="py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-end mb-8">
            <div>
              <h2 className="text-2xl font-bold text-gray-900 mb-2">Shop by Category</h2>
              <p className="text-gray-600">Find exactly what you need quickly.</p>
            </div>
            <Link href="/shop" className="text-red-600 font-medium hover:text-red-700 flex items-center gap-1">
              View All <ArrowRight size={16} />
            </Link>
          </div>
          
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
            {CATEGORIES.map((cat, idx) => (
              <Reveal key={idx} delay={idx * 60}>
                <Link 
                  href={`/shop?category=${encodeURIComponent(cat)}`}
                  className="motion-lift block h-full bg-gray-50 border border-gray-100 hover:border-red-200 hover:shadow-md hover:-translate-y-0.5 transition-all duration-300 rounded-xl p-6 text[...]"
                >
                  <div className="w-12 h-12 mx-auto bg-white rounded-full flex items-center justify-center text-gray-400 group-hover:text-red-600 group-hover:bg-red-50 transition-colors mb-4 shad[...]">
                    {/* Just use a generic icon for prototype speed */}
                    <ShieldCheck size={20} />
                  </div>
                  <h3 className="font-medium text-gray-900 group-hover:text-red-600 transition-colors">{cat}</h3>
                </Link>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* Featured Products */}
      <section className="py-16 bg-gray-50 border-t border-gray-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-end mb-8">
            <div>
              <h2 className="text-2xl font-bold text-gray-900 mb-2">Featured Products</h2>
              <p className="text-gray-600">Commonly requested medications and essentials.</p>
            </div>
            <Link href="/shop" className="text-red-600 font-medium hover:text-red-700 flex items-center gap-1 hidden sm:flex">
              Shop All <ArrowRight size={16} />
            </Link>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {featuredProducts.map((product, idx) => (
              <Reveal key={product.id} delay={idx * 100} className="h-full">
                <ProductCard product={product} />
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* Zoom parallax brand showcase */}
      <PharmacyShowcase />

      {/* Prescription CTA */}
      <section className="py-20 bg-gray-900 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="text-3xl font-bold mb-4">Have a prescription?</h2>
              <p className="text-gray-400 text-lg mb-8 max-w-md">
                Upload a clear photo of your valid prescription. Our licensed pharmacists will review it and prepare your order for delivery.
              </p>
              <div className="flex flex-col sm:flex-row gap-4">
                <Link href="/upload-prescription" className="bg-red-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-red-700 transition-colors text-center">
                  Upload Prescription
                </Link>
                <Link href="/ask" className="bg-gray-800 text-white px-6 py-3 rounded-lg font-medium hover:bg-gray-700 transition-colors border border-gray-700 text-center">
                  Ask a Pharmacist
                </Link>
              </div>
            </div>
            <div className="relative">
              <div className="absolute inset-0 bg-gradient-to-r from-red-600/20 to-transparent blur-3xl"></div>
              <div className="relative bg-gray-800 border border-gray-700 p-8 rounded-2xl">
                <Reveal delay={0} className="flex items-start gap-4 mb-6">
                  <div className="bg-gray-700 p-3 rounded-full text-red-400">
                    <span className="font-bold">1</span>
                  </div>
                  <div>
                    <h3 className="font-bold text-lg mb-1">Upload</h3>
                    <p className="text-gray-400 text-sm">Snap a picture or upload a PDF of your doctor's prescription.</p>
                  </div>
                </Reveal>
                <Reveal delay={120} className="flex items-start gap-4 mb-6">
                  <div className="bg-gray-700 p-3 rounded-full text-red-400">
                    <span className="font-bold">2</span>
                  </div>
                  <div>
                    <h3 className="font-bold text-lg mb-1">Pharmacist Review</h3>
                    <p className="text-gray-400 text-sm">A licensed professional validates the dosage and details.</p>
                  </div>
                </Reveal>
                <Reveal delay={240} className="flex items-start gap-4">
                  <div className="bg-gray-700 p-3 rounded-full text-red-400">
                    <span className="font-bold">3</span>
                  </div>
                  <div>
                    <h3 className="font-bold text-lg mb-1">Delivery</h3>
                    <p className="text-gray-400 text-sm">Pay securely and track your delivery right to your door.</p>
                  </div>
                </Reveal>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
