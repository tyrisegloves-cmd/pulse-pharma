"use client";

import React, { useState } from "react";
import Link from "next/link";
import { ShoppingCart, User, Menu, LogIn } from "lucide-react";
import { useCart } from "@/components/CartContext";
import { useAuth } from "@/components/AuthContext";
import { LogoPulse } from "@/components/LogoPulse";
import { LoginModal } from "@/components/LoginModal";

export function Header() {
  const { count, isBouncing } = useCart();
  const { isLoggedIn } = useAuth();
  const [showLoginModal, setShowLoginModal] = useState(false);

  return (
    <>
      <LoginModal isOpen={showLoginModal} onClose={() => setShowLoginModal(false)} />
      <header className="sticky top-0 z-50 bg-white border-b border-gray-100 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <Link href="/" className="flex items-center gap-2 text-red-600 font-bold text-xl tracking-tight">
                <LogoPulse size={32} />
                Pulse Pharma
              </Link>
              <nav className="hidden md:flex ml-10 space-x-8">
                <Link href="/shop" className="text-gray-600 hover:text-red-600 font-medium transition-colors">Shop</Link>
                <Link href="/upload-prescription" className="text-gray-600 hover:text-red-600 font-medium transition-colors">Upload Prescription</Link>
                <Link href="/ask" className="text-gray-600 hover:text-red-600 font-medium transition-colors">Ask a Pharmacist</Link>
              </nav>
            </div>
            <div className="flex items-center space-x-4">
              {!isLoggedIn ? (
                <button
                  onClick={() => setShowLoginModal(true)}
                  className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg text-sm font-semibold transition-colors shadow-sm flex items-center gap-1.5"
                >
                  <LogIn size={16} />
                  <span>Sign In</span>
                </button>
              ) : (
                <Link href="/account" className="text-gray-600 hover:text-red-600 transition-colors p-1" aria-label="My Account">
                  <User size={24} />
                </Link>
              )}
              <Link href="/cart" className="text-gray-600 hover:text-red-600 transition-colors relative" aria-label={`Cart, ${count} items`}>
              <span className={`inline-block ${isBouncing ? "animate-cart-nudge" : ""}`}>
                <ShoppingCart size={24} />
              </span>
              <span
                className={`absolute -top-2 -right-2 bg-red-600 text-white text-xs font-bold rounded-full h-5 w-5 flex items-center justify-center ${isBouncing ? "animate-cart-bounce" : ""}`}
              >
                {count}
              </span>
            </Link>
            <button className="md:hidden text-gray-600">
              <Menu size={24} />
            </button>
          </div>
        </div>
      </div>
      </header>
    </>
  );
}
