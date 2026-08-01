"use client";

import { User, Package, FileText, Bell, LogOut, Settings, LogIn } from "lucide-react";
import Link from "next/link";
import { useAuth } from "@/components/AuthContext";
import { useRouter } from "next/navigation";
import { useState } from "react";

type ActiveSection = "orders" | "refills" | "settings";

const LINKS: {
  key: ActiveSection;
  href: string;
  label: string;
  icon: typeof Package;
}[] = [
  { key: "orders", href: "/account", label: "Order History", icon: Package },
  {
    key: "refills",
    href: "/account/refill-reminders",
    label: "Refill Reminders",
    icon: Bell,
  },
  {
    key: "settings",
    href: "/account/settings",
    label: "Settings",
    icon: Settings,
  },
];

/**
 * Shared account sidebar. Renders the avatar, nav links, and sign-out button.
 * `active` controls which link is highlighted.
 *
 * Used by the main account page and the Settings / Refill Reminders sub-pages
 * so they share the same look and navigation.
 */
export function AccountSidebar({ active }: { active: ActiveSection }) {
  const { user, signOut } = useAuth();
  const router = useRouter();
  const [signingOut, setSigningOut] = useState(false);

  const handleSignOut = async () => {
    setSigningOut(true);
    await signOut();
    router.push("/");
  };

  return (
    <div className="w-full md:w-64 flex-shrink-0">
      <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
        <div className="p-6 border-b border-gray-200 bg-gray-50 text-center">
          <div className="w-20 h-20 bg-gray-200 rounded-full flex items-center justify-center mx-auto mb-3 text-gray-500">
            <User size={40} />
          </div>
          <h2 className="font-bold text-gray-900">
            {user?.user_metadata?.full_name ?? user?.email ?? "My Account"}
          </h2>
          <p className="text-sm text-gray-500">{user?.email}</p>
        </div>
        <nav className="p-2">
          {LINKS.map(({ key, href, label, icon: Icon }) => {
            const isActive = key === active;
            return (
              <Link
                key={key}
                href={href}
                className={`flex items-center gap-3 px-4 py-3 rounded-lg font-medium transition-colors ${
                  isActive
                    ? "text-red-600 bg-red-50"
                    : "text-gray-700 hover:bg-gray-50"
                }`}
              >
                <Icon size={20} /> {label}
              </Link>
            );
          })}
          <Link
            href="/upload-prescription"
            className="flex items-center gap-3 px-4 py-3 text-gray-700 hover:bg-gray-50 rounded-lg font-medium transition-colors"
          >
            <FileText size={20} /> Prescriptions
          </Link>
          <div className="my-2 border-t border-gray-100" />
          <button
            onClick={handleSignOut}
            disabled={signingOut}
            className="w-full flex items-center gap-3 px-4 py-3 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-lg font-medium transition-colors disabled:opacity-60"
          >
            <LogOut size={20} /> {signingOut ? "Signing out…" : "Sign Out"}
          </button>
        </nav>
      </div>
    </div>
  );
}

/** Reusable auth gates mirroring the main account page. */
export function AuthGate({ children }: { children: React.ReactNode }) {
  const { isLoggedIn, isLoading } = useAuth();
  const router = useRouter();

  if (isLoading) {
    return (
      <div className="bg-gray-50 min-h-screen flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-gray-200 border-t-red-600 rounded-full animate-spin" />
      </div>
    );
  }

  if (!isLoggedIn) {
    return (
      <div className="bg-gray-50 min-h-screen py-16 flex items-center justify-center">
        <div className="max-w-md w-full mx-auto px-4 text-center">
          <div className="bg-white border border-gray-200 rounded-2xl p-8 shadow-sm">
            <div className="w-16 h-16 bg-red-50 text-red-600 rounded-full flex items-center justify-center mx-auto mb-4">
              <User size={32} />
            </div>
            <h1 className="text-2xl font-bold text-gray-900 mb-2">
              Sign In Required
            </h1>
            <p className="text-gray-600 text-sm mb-6">
              Please sign in to view your account.
            </p>
            <button
              onClick={() => router.push("/auth")}
              className="w-full bg-red-600 hover:bg-red-700 text-white font-bold py-3 px-4 rounded-xl shadow-md transition-colors flex items-center justify-center gap-2"
            >
              <LogIn size={18} />
              <span>Sign In Now</span>
            </button>
            <Link
              href="/"
              className="inline-block mt-4 text-sm text-gray-500 hover:text-gray-900 transition-colors"
            >
              &larr; Return to Homepage
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
