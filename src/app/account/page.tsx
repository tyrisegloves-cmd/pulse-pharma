"use client";

import { User, Package, FileText, Bell, LogOut, Settings, LogIn } from "lucide-react";
import Link from "next/link";
import { useAuth } from "@/components/AuthContext";
import { useRouter } from "next/navigation";

export default function Account() {
  const { isLoggedIn, logout, user, login } = useAuth();
  const router = useRouter();

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
              onClick={() => login()}
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

  const handleSignOut = () => {
    logout();
    router.push("/");
  };

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
                <h2 className="font-bold text-gray-900">{user.name}</h2>
                <p className="text-sm text-gray-500">{user.email}</p>
              </div>
              <nav className="p-2">
                <Link href="#" className="flex items-center gap-3 px-4 py-3 text-red-600 bg-red-50 rounded-lg font-medium">
                  <Package size={20} /> Order History
                </Link>
                <Link href="#" className="flex items-center gap-3 px-4 py-3 text-gray-700 hover:bg-gray-50 rounded-lg font-medium transition-colors">
                  <FileText size={20} /> Saved Prescriptions
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
            
            <div className="bg-white border border-gray-200 rounded-xl p-6 mb-8">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-bold text-gray-900">Recent Orders</h2>
                <Link href="#" className="text-sm font-medium text-red-600 hover:underline">View All</Link>
              </div>

              <div className="space-y-4">
                
                {/* Order Item */}
                <div className="border border-gray-100 rounded-lg p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-bold text-gray-900">#PULSE-12345</span>
                      <span className="bg-green-50 text-green-700 text-xs px-2 py-0.5 rounded-full font-medium">Delivered</span>
                    </div>
                    <div className="text-sm text-gray-500">Placed on Oct 24, 2026</div>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="font-bold text-gray-900">GH₵ 131.00</div>
                    <Link href="/track/12345" className="bg-gray-900 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-gray-800 transition-colors">
                      View Details
                    </Link>
                  </div>
                </div>

                {/* Order Item */}
                <div className="border border-gray-100 rounded-lg p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-bold text-gray-900">#PULSE-12344</span>
                      <span className="bg-green-50 text-green-700 text-xs px-2 py-0.5 rounded-full font-medium">Delivered</span>
                    </div>
                    <div className="text-sm text-gray-500">Placed on Sep 12, 2026</div>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="font-bold text-gray-900">GH₵ 55.00</div>
                    <button className="bg-gray-100 text-gray-700 px-4 py-2 rounded-lg text-sm font-medium hover:bg-gray-200 transition-colors">
                      Reorder
                    </button>
                  </div>
                </div>

              </div>
            </div>

            <div className="bg-white border border-gray-200 rounded-xl p-6">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-bold text-gray-900">Saved Prescriptions</h2>
                <Link href="/upload-prescription" className="text-sm font-medium text-red-600 hover:underline">Upload New</Link>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="border border-gray-100 bg-gray-50 rounded-lg p-4 flex items-start gap-4">
                  <div className="w-12 h-12 bg-white rounded-lg flex items-center justify-center text-red-600 flex-shrink-0 border border-gray-200">
                    <FileText size={24} />
                  </div>
                  <div>
                    <h3 className="font-medium text-gray-900">Dr. Addo - Prescription</h3>
                    <p className="text-xs text-gray-500 mb-2">Verified on Oct 24, 2026</p>
                    <span className="bg-green-100 text-green-700 text-xs px-2 py-1 rounded-md font-medium">Verified Valid</span>
                  </div>
                </div>
              </div>
            </div>

          </div>
        </div>
      </div>
    </div>
  );
}