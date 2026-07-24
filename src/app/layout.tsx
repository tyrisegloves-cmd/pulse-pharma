import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import Link from "next/link";
import { Stethoscope } from "lucide-react";
import { AuthProvider } from "@/components/AuthContext";
import { CartProvider } from "@/components/CartContext";
import { Header } from "@/components/Header";
import { LogoPulse } from "@/components/LogoPulse";
import { SplashScreen } from "@/components/SplashScreen";
import { PageTransitionClient } from "@/components/PageTransitionClient";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Pulse Pharma | Your Trusted Online Pharmacy in Accra",
  description: "Retail pharmacy and drug delivery e-health platform based in Accra, Ghana.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${inter.className} bg-white text-gray-900 min-h-screen flex flex-col antialiased`}>
        <AuthProvider>
          <CartProvider>
            <SplashScreen />
            <Header />

            <PageTransitionClient>
              {children}
            </PageTransitionClient>

            <footer className="bg-gray-50 border-t border-gray-200 py-12 mt-12">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
              <div>
                <Link href="/" className="flex items-center gap-2 text-red-600 font-bold text-xl tracking-tight mb-4">
                  <LogoPulse size={32} />
                  Pulse Pharma
                </Link>
                <p className="text-gray-500 text-sm mb-4">
                  Your trusted e-health platform and retail pharmacy based in Accra, Ghana.
                </p>
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <Stethoscope size={16} className="text-red-600"/> Licensed Pharmacy
                </div>
              </div>
              <div>
                <h4 className="font-semibold text-gray-900 mb-4">Pulse Pharma</h4>
                <ul className="space-y-2 text-sm text-gray-600">
                  <li><Link href="/shop" className="hover:text-red-600">Shop Products</Link></li>
                  <li><Link href="/upload-prescription" className="hover:text-red-600">Prescription Info</Link></li>
                  <li><Link href="/ask" className="hover:text-red-600">Ask Your Pharmacist</Link></li>
                  <li><Link href="/track/1" className="hover:text-red-600">Track Order</Link></li>
                </ul>
              </div>
              <div>
                <h4 className="font-semibold text-gray-900 mb-4">Legal & Compliance</h4>
                <ul className="space-y-2 text-sm text-gray-600">
                  <li><Link href="#" className="hover:text-red-600">Privacy Policy</Link></li>
                  <li><Link href="#" className="hover:text-red-600">Terms of Service</Link></li>
                  <li><span className="text-gray-500 block">Pharmacy Council Reg: PCG-2026-X8</span></li>
                  <li><span className="text-gray-500 block">FDA Ghana Registered</span></li>
                </ul>
              </div>
              <div>
                <h4 className="font-semibold text-gray-900 mb-4">Contact Us</h4>
                <ul className="space-y-2 text-sm text-gray-600">
                  <li>Accra, Ghana</li>
                  <li>support@pulsepharma.com.gh</li>
                  <li>+233 20 123 4567</li>
                </ul>
              </div>
            </div>
            <div className="mt-8 pt-8 border-t border-gray-200 text-sm text-gray-500 flex flex-col md:flex-row justify-between items-center">
              <p>&copy; {new Date().getFullYear()} Pulse Pharma. All rights reserved. | Your health, just a tap away.</p>
              <p className="mt-2 md:mt-0 text-xs text-gray-400">NB: Health information is encrypted and strictly confidential.</p>
            </div>
          </div>
        </footer>
          </CartProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
