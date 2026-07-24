"use client";

import { User, Package, FileText, Bell, LogOut, Settings, LogIn, AlertCircle } from "lucide-react";
import Link from "next/link";
import { useAuth } from "@/components/AuthContext";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { getOrdersByUser } from "@/services/orders";
import type { Order } from "@/services/orders";

const STATUS_STYLES: Record<string, string> = {
  delivered: "bg-green-50 text-green-700",
  shipped: "bg-blue-50 text-blue-700",
  processing: "bg-yellow-50 text-yellow-700",
  confirmed: "bg-purple-50 text-purple-700",
  pending: "bg-gray-100 text-gray-600",
  cancelled: "bg-red-50 text-red-700",
};

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("en-GB", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

export default function Account() {
  const { isLoggedIn, isLoading, signOut, user } = useAuth();
  const router = useRouter();

  const [orders, setOrders] = useState<Order[]>([]);
  const [ordersLoading, setOrdersLoading] = useState(false);
  const [ordersError, setOrdersError] = useState<string | null>(null);
  const userId = user?.id;

  // Load user orders once authenticated
  useEffect(() => {
    if (!isLoggedIn || !userId) return;
    const activeUserId = userId;

    async function loadOrders() {
      setOrdersLoading(true);
      setOrdersError(null);
      const { data, error } = await getOrdersByUser(activeUserId);
      if (error) {
        setOrdersError(error);
      } else {
        setOrders(data ?? []);
      }
      setOrdersLoading(false);
    }

    loadOrders();
  }, [isLoggedIn, userId]);

  // Wait for Supabase to restore the session before rendering.
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
            <h1 className="text-2xl font-bold text-gray-900 mb-2">Sign In Required</h1>
            <p className="text-gray-600 text-sm mb-6">
              Please sign in to view your order history, saved prescriptions, and manage your account details.
            </p>
            <button
              onClick={() => router.push("/auth")}
              className="w-full bg-red-600 hover:bg-red-700 text-white font-bold py-3 px-4 rounded-xl shadow-md transition-colors flex items-center justify-center gap-2"
            >
              <LogIn size={18} />
              <span>Sign In Now</span>
            </button>
            <Link href="/" className="inline-block mt-4 text-sm text-gray-500 hover:text-gray-900 transition-colors">
              &larr; Return to Homepage
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const handleSignOut = async () => {
    await signOut();
    router.push("/");
  };

  const recentOrders = orders.slice(0, 5);

  return (
    <div className="bg-gray-50 min-h-screen py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">

        <h1 className="text-3xl font-bold text-gray-900 mb-8">My Account</h1>

        <div className="flex flex-col md:flex-row gap-8">

          {/* Sidebar */}
          <div className="w-full md:w-64 flex-shrink-0">
            <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
              <div className="p-6 border-b border-gray-200 bg-gray-50 text-center">
                <div className="w-20 h-20 bg-gray-200 rounded-full flex items-center justify-center mx-auto mb-3 text-gray-500">
                  <User size={40} />
                </div>
                <h2 className="font-bold text-gray-900">{user?.user_metadata?.full_name ?? user?.email ?? "My Account"}</h2>
                <p className="text-sm text-gray-500">{user?.email}</p>
              </div>
              <nav className="p-2">
                <Link href="#" className="flex items-center gap-3 px-4 py-3 text-red-600 bg-red-50 rounded-lg font-medium">
                  <Package size={20} /> Order History
                </Link>
                <Link href="/upload-prescription" className="flex items-center gap-3 px-4 py-3 text-gray-700 hover:bg-gray-50 rounded-lg font-medium transition-colors">
                  <FileText size={20} /> Prescriptions
                </Link>
                <Link href="#" className="flex items-center gap-3 px-4 py-3 text-gray-700 hover:bg-gray-50 rounded-lg font-medium transition-colors">
                  <Bell size={20} /> Refill Reminders
                </Link>
                <Link href="#" className="flex items-center gap-3 px-4 py-3 text-gray-700 hover:bg-gray-50 rounded-lg font-medium transition-colors">
                  <Settings size={20} /> Settings
                </Link>
                <div className="my-2 border-t border-gray-100"></div>
                <button
                  onClick={handleSignOut}
                  className="w-full flex items-center gap-3 px-4 py-3 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-lg font-medium transition-colors"
                >
                  <LogOut size={20} /> Sign Out
                </button>
              </nav>
            </div>
          </div>

          {/* Main Content */}
          <div className="flex-grow">

            {/* Orders Section */}
            <div className="bg-white border border-gray-200 rounded-xl p-6 mb-8">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-bold text-gray-900">Recent Orders</h2>
                {orders.length > 5 && (
                  <button className="text-sm font-medium text-red-600 hover:underline">
                    View All ({orders.length})
                  </button>
                )}
              </div>

              {/* Loading state */}
              {ordersLoading && (
                <div className="space-y-3">
                  {Array.from({ length: 2 }).map((_, i) => (
                    <div key={i} className="border border-gray-100 rounded-lg p-4 animate-pulse">
                      <div className="h-4 bg-gray-200 rounded w-40 mb-2" />
                      <div className="h-3 bg-gray-100 rounded w-28" />
                    </div>
                  ))}
                </div>
              )}

              {/* Error state */}
              {ordersError && !ordersLoading && (
                <div className="bg-red-50 border border-red-100 rounded-lg p-4 flex items-start gap-3">
                  <AlertCircle className="text-red-500 flex-shrink-0 mt-0.5" size={18} />
                  <p className="text-sm text-red-700">{ordersError}</p>
                </div>
              )}

              {/* Empty state */}
              {!ordersLoading && !ordersError && orders.length === 0 && (
                <div className="text-center py-8">
                  <Package className="mx-auto text-gray-300 mb-3" size={40} />
                  <p className="text-gray-500 font-medium mb-1">No orders yet</p>
                  <p className="text-sm text-gray-400 mb-4">Your order history will appear here once you place your first order.</p>
                  <Link
                    href="/shop"
                    className="inline-block bg-red-600 hover:bg-red-700 text-white font-medium py-2 px-5 rounded-lg text-sm transition-colors"
                  >
                    Browse Products
                  </Link>
                </div>
              )}

              {/* Orders list */}
              {!ordersLoading && !ordersError && recentOrders.length > 0 && (
                <div className="space-y-4">
                  {recentOrders.map((order) => (
                    <div
                      key={order.id}
                      className="border border-gray-100 rounded-lg p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                    >
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-bold text-gray-900">
                            #{order.id.slice(0, 8).toUpperCase()}
                          </span>
                          <span
                            className={`text-xs px-2 py-0.5 rounded-full font-medium capitalize ${
                              STATUS_STYLES[order.status] ?? "bg-gray-100 text-gray-600"
                            }`}
                          >
                            {order.status}
                          </span>
                        </div>
                        <div className="text-sm text-gray-500">
                          Placed on {formatDate(order.createdAt)}
                        </div>
                        {order.items.length > 0 && (
                          <div className="text-xs text-gray-400 mt-1">
                            {order.items.map((item) => item.productName).join(", ")}
                          </div>
                        )}
                      </div>
                      <div className="flex items-center gap-4">
                        <div className="font-bold text-gray-900">
                          GH₵ {order.totalAmount.toFixed(2)}
                        </div>
                        <Link
                          href={`/track/${order.id}`}
                          className="bg-gray-900 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-gray-800 transition-colors"
                        >
                          View Details
                        </Link>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Prescriptions Section */}
            <div className="bg-white border border-gray-200 rounded-xl p-6">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-bold text-gray-900">Saved Prescriptions</h2>
                <Link href="/upload-prescription" className="text-sm font-medium text-red-600 hover:underline">
                  Upload New
                </Link>
              </div>

              <div className="text-center py-8">
                <FileText className="mx-auto text-gray-300 mb-3" size={40} />
                <p className="text-gray-500 font-medium mb-1">No prescriptions saved</p>
                <p className="text-sm text-gray-400 mb-4">Upload a prescription to get started with your medication order.</p>
                <Link
                  href="/upload-prescription"
                  className="inline-block bg-red-600 hover:bg-red-700 text-white font-medium py-2 px-5 rounded-lg text-sm transition-colors"
                >
                  Upload Prescription
                </Link>
              </div>
            </div>

          </div>
        </div>
      </div>
    </div>
  );
}
