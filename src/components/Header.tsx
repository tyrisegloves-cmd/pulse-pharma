"use client";

import React, { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { ShoppingCart, User, Menu, X, LogIn, ArrowLeft, Bell, CheckCheck } from "lucide-react";
import { useCart } from "@/components/CartContext";
import { useAuth } from "@/components/AuthContext";
import { LogoPulse } from "@/components/LogoPulse";
import { useRouter, usePathname } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";

/* ── Sample notifications ────────────────────────────────────────────────────
   Static demo list. Swap this for a Supabase query / API call when the
   notifications feature is wired up to real data. ────────────────────────── */
interface NotificationItem {
  id: string;
  title: string;
  message: string;
  time: string;
  unread: boolean;
}

const SAMPLE_NOTIFICATIONS: NotificationItem[] = [
  {
    id: "3",
    title: "Welcome to Pulse Pharma 👋",
    message: "Browse our catalog and upload your first prescription.",
    time: "3d ago",
    unread: false,
  },
];

export function Header() {
  const { count, isBouncing } = useCart();
  const { isLoggedIn } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const notifRef = useRef<HTMLDivElement>(null);

  const unreadCount = notifications.filter((n) => n.unread).length;

  // Show back button on all pages except home
  const showBackButton = pathname !== "/";

  // Close menus whenever the route changes
  useEffect(() => {
    const timeout = window.setTimeout(() => {
      setMobileMenuOpen(false);
      setNotifOpen(false);
    }, 0);

    return () => window.clearTimeout(timeout);
  }, [pathname]);

  // Lock body scroll while the mobile menu is open
  useEffect(() => {
    if (mobileMenuOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [mobileMenuOpen]);

  // Close the notification dropdown when clicking outside of it
  useEffect(() => {
    if (!notifOpen) return;
    function handleClickOutside(e: MouseEvent) {
      if (notifRef.current && !notifRef.current.contains(e.target as Node)) {
        setNotifOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [notifOpen]);

  // Cart is restricted: must be signed in to access it.
  const handleCartClick = (e: React.MouseEvent) => {
    if (!isLoggedIn) {
      e.preventDefault();
      router.push("/auth");
    }
  };

  const markAllRead = () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, unread: false })));
  };

  return (
    <>
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
                <Link href="/upload-prescription" className="text-gray-600 hover:text-red-600 font-medium transition-colors"> Prescription Info</Link>
                <Link href="/ask" className="text-gray-600 hover:text-red-600 font-medium transition-colors">Ask Your Pharmacist</Link>
              </nav>
            </div>
            <div className="flex items-center space-x-4">
              {!isLoggedIn ? (
                <button
                  onClick={() => router.push("/auth")}
                  className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg text-sm font-semibold transition-colors shadow-sm flex items-center gap-1.5"
                >
                  <LogIn size={16} />
                  <span>Sign In/Up</span>
                </button>
              ) : (
                <Link href="/account" className="text-gray-600 hover:text-red-600 transition-colors p-1" aria-label="My Account">
                  <User size={24} />
                </Link>
              )}

              {/* Notification Bell */}
              <div className="relative" ref={notifRef}>
                <button
                  onClick={() => setNotifOpen((open) => !open)}
                  aria-label="Notifications"
                  aria-expanded={notifOpen}
                  aria-haspopup="true"
                  className="relative text-gray-500 hover:text-red-600 transition-colors p-1 group"
                >
                  <motion.span
                    whileHover={{ rotate: [0, -18, 18, -12, 12, 0] }}
                    transition={{ duration: 0.5, ease: "easeInOut" }}
                    className="inline-block"
                  >
                    <Bell
                      size={24}
                      strokeWidth={1.8}
                      className="transition-colors"
                    />
                  </motion.span>
                  {/* Pulsing notification dot — only when there are unread items */}
                  {unreadCount > 0 && (
                    <span className="absolute top-0.5 right-0.5 flex h-2.5 w-2.5">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-500 opacity-75" />
                      <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-red-600" />
                    </span>
                  )}
                </button>

                {/* Notification dropdown */}
                <AnimatePresence>
                  {notifOpen && (
                    <motion.div
                      initial={{ opacity: 0, y: -8, scale: 0.97 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: -8, scale: 0.97 }}
                      transition={{ duration: 0.18, ease: "easeOut" }}
                      className="absolute right-0 mt-2 w-80 max-w-[calc(100vw-2rem)] bg-white rounded-xl shadow-xl border border-gray-100 z-50 overflow-hidden"
                    >
                      <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
                        <h3 className="font-semibold text-gray-900">Notifications</h3>
                        {unreadCount > 0 && (
                          <button
                            onClick={markAllRead}
                            className="text-xs font-medium text-red-600 hover:text-red-700 flex items-center gap-1"
                          >
                            <CheckCheck size={14} />
                            Mark all read
                          </button>
                        )}
                      </div>

                      <div className="max-h-80 overflow-y-auto">
                        {notifications.length === 0 ? (
                          <div className="px-4 py-8 text-center text-sm text-gray-500">
                            No notifications yet
                          </div>
                        ) : (
                          notifications.map((n) => (
                            <div
                              key={n.id}
                              className={`flex gap-3 px-4 py-3 border-b border-gray-50 last:border-b-0 hover:bg-gray-50 transition-colors ${
                                n.unread ? "bg-red-50/40" : ""
                              }`}
                            >
                              <div className="flex-shrink-0 mt-1">
                                <span
                                  className={`block h-2 w-2 rounded-full ${
                                    n.unread ? "bg-red-600" : "bg-gray-300"
                                  }`}
                                />
                              </div>
                              <div className="min-w-0">
                                <p className="text-sm font-medium text-gray-900">{n.title}</p>
                                <p className="text-xs text-gray-600 mt-0.5 leading-snug">{n.message}</p>
                                <p className="text-[11px] text-gray-400 mt-1">{n.time}</p>
                              </div>
                            </div>
                          ))
                        )}
                      </div>

                      <Link
                        href="/account"
                        className="block text-center text-sm font-medium text-red-600 hover:bg-red-50 py-3 transition-colors"
                      >
                        View all in My Account
                      </Link>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              <Link
                href={isLoggedIn ? "/cart" : "/auth"}
                onClick={handleCartClick}
                className="text-gray-600 hover:text-red-600 transition-colors relative cursor-pointer"
                aria-label={`Cart, ${count} items`}
                title={isLoggedIn ? "View cart" : "Sign in to view cart"}
              >
                <motion.span
                  key={`cart-icon-${count}`}
                  animate={isBouncing ? { x: [0, 6, 0] } : { x: 0 }}
                  transition={{ duration: 0.35, ease: "easeOut" }}
                  className="inline-block"
                >
                  <ShoppingCart size={24} />
                </motion.span>

                <motion.span
                  key={`cart-count-${count}`}
                  initial={{ scale: 0.8, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ type: "spring", stiffness: 300, damping: 20 }}
                  className="absolute -top-2 -right-2 bg-red-600 text-white text-xs font-bold rounded-full h-5 w-5 flex items-center justify-center"
                >
                  {count}
                </motion.span>
              </Link>

              <button
                onClick={() => setMobileMenuOpen((open) => !open)}
                className="md:hidden text-gray-600 hover:text-red-600 transition-colors p-1"
                aria-label={mobileMenuOpen ? "Close menu" : "Open menu"}
                aria-expanded={mobileMenuOpen}
                aria-controls="mobile-menu"
              >
                {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
              </button>
            </div>
          </div>
        </div>

        {/* Mobile menu */}
        <AnimatePresence>
          {mobileMenuOpen && (
            <motion.div
              id="mobile-menu"
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.25, ease: "easeInOut" }}
              className="md:hidden overflow-hidden border-t border-gray-100 bg-white"
            >
              <nav className="px-4 sm:px-6 py-4 space-y-1">
                <Link
                  href="/shop"
                  className="block px-3 py-2.5 rounded-lg text-gray-700 hover:text-red-600 hover:bg-red-50 font-medium transition-colors"
                >
                  Shop
                </Link>
                <Link
                  href="/upload-prescription"
                  className="block px-3 py-2.5 rounded-lg text-gray-700 hover:text-red-600 hover:bg-red-50 font-medium transition-colors"
                >
                  Prescription Info
                </Link>
                <Link
                  href="/ask"
                  className="block px-3 py-2.5 rounded-lg text-gray-700 hover:text-red-600 hover:bg-red-50 font-medium transition-colors"
                >
                  Ask Your Pharmacist
                </Link>
                <Link
                  href={isLoggedIn ? "/cart" : "/auth"}
                  onClick={handleCartClick}
                  className="flex items-center justify-between px-3 py-2.5 rounded-lg text-gray-700 hover:text-red-600 hover:bg-red-50 font-medium transition-colors"
                >
                  <span>Cart</span>
                  <span className="relative">
                    <ShoppingCart size={18} />
                    {count > 0 && (
                      <span className="absolute -top-2 -right-2 bg-red-600 text-white text-[10px] font-bold rounded-full h-4 w-4 flex items-center justify-center">
                        {count}
                      </span>
                    )}
                  </span>
                </Link>
                <Link
                  href="/account"
                  className="block px-3 py-2.5 rounded-lg text-gray-700 hover:text-red-600 hover:bg-red-50 font-medium transition-colors"
                >
                  My Account
                </Link>
                <div className="pt-2">
                  {!isLoggedIn ? (
                    <button
                      onClick={() => router.push("/auth")}
                      className="w-full bg-red-600 hover:bg-red-700 text-white px-4 py-2.5 rounded-lg text-sm font-semibold transition-colors shadow-sm flex items-center justify-center gap-1.5"
                    >
                      <LogIn size={16} />
                      <span>Sign In / Up</span>
                    </button>
                  ) : (
                    <Link
                      href="/account"
                      className="w-full bg-gray-100 hover:bg-gray-200 text-gray-700 px-4 py-2.5 rounded-lg text-sm font-semibold transition-colors flex items-center justify-center gap-1.5"
                    >
                      <User size={16} />
                      <span>My Account</span>
                    </Link>
                  )}
                </div>
              </nav>
            </motion.div>
          )}
        </AnimatePresence>
      </header>

      {/* Back Button Bar — appears on all pages except home */}
      {showBackButton && (
        <div className="sticky top-16 z-40 bg-gray-50 border-b border-gray-100">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <button
              onClick={() => router.back()}
              className="inline-flex items-center gap-2 text-gray-600 hover:text-red-600 py-3 text-sm font-medium transition-colors group"
              aria-label="Go back"
            >
              <ArrowLeft size={18} className="group-hover:translate-x-0.5 transition-transform" />
              <span>Go Back</span>
            </button>
          </div>
        </div>
      )}
    </>
  );
}
