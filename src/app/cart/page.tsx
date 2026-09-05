"use client";

import { useState } from "react";
import { Trash2, ArrowRight, ShieldCheck, MapPin, Clock, CreditCard, ShoppingCart, LogIn, AlertCircle } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/components/AuthContext";
import { useCart } from "@/components/CartContext";

export default function Cart() {
  const router = useRouter();
  const { isLoggedIn, isLoading: isAuthLoading } = useAuth();
  const { items: cartItems, updateQuantity, removeFromCart, clearCart } = useCart();
  const [step, setStep] = useState(1); // 1: Cart, 2: Delivery, 3: Payment
  const [paymentMethod, setPaymentMethod] = useState<"paystack" | "cod">("paystack");
  const [delivery, setDelivery] = useState({ fullName: "", phone: "", address: "" });
  const [deliveryErrors, setDeliveryErrors] = useState<{
    fullName?: string;
    phone?: string;
    address?: string;
  }>({});
  const [placing, setPlacing] = useState(false);
  const [orderError, setOrderError] = useState<string | null>(null);

  const subtotal = cartItems.reduce((acc, item) => acc + (item.product.price * item.quantity), 0);
  const deliveryFee = 15.00;
  const total = subtotal + deliveryFee;

  const handleRemove = (id: string) => removeFromCart(id);

  const handleDeliveryChange =
    (field: keyof typeof delivery) =>
    (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
      setDelivery((d) => ({ ...d, [field]: e.target.value }));
      setDeliveryErrors((prev) => ({ ...prev, [field]: undefined }));
    };

  const goToStep = (next: number) => {
    setOrderError(null);
    // Delivery details must be complete before moving to payment.
    if (step === 2 && next === 3) {
      const errors: typeof deliveryErrors = {};
      if (!delivery.fullName.trim()) errors.fullName = "Please enter your full name.";
      if (!delivery.phone.trim()) {
        errors.phone = "Please enter your phone number.";
      } else if (delivery.phone.replace(/\D/g, "").length < 9) {
        errors.phone = "Please enter a valid phone number.";
      }
      if (!delivery.address.trim()) errors.address = "Please enter your delivery address.";
      if (Object.keys(errors).length > 0) {
        setDeliveryErrors(errors);
        return;
      }
    }
    setStep(next);
  };

  const placeOrder = async () => {
    if (placing || cartItems.length === 0) return;
    setPlacing(true);
    setOrderError(null);
    try {
      const res = await fetch("/api/checkout/initialize", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          items: cartItems.map((item) => ({
            productId: item.product.id,
            quantity: item.quantity,
          })),
          delivery,
          paymentMethod,
        }),
      });
      const data = (await res.json()) as {
        mode?: string;
        orderId?: string;
        authorizationUrl?: string;
        error?: string;
      };
      if (!res.ok) throw new Error(data.error ?? "Checkout failed. Please try again.");

      if (data.mode === "redirect" && data.authorizationUrl) {
        // Hand off to Paystack's hosted checkout. The cart is cleared by
        // /checkout/callback once the payment is verified.
        window.location.href = data.authorizationUrl;
        return;
      }
      if (data.mode === "cod" && data.orderId) {
        clearCart();
        router.push(`/checkout/success?order=${data.orderId}`);
        return;
      }
      throw new Error("Unexpected checkout response.");
    } catch (error) {
      setOrderError(
        error instanceof Error ? error.message : "Something went wrong. Please try again."
      );
    } finally {
      setPlacing(false);
    }
  };

  // Cart requires a signed-in user. While Supabase restores the session we
  // show the spinner to avoid a "sign in required" flash for logged-in users.
  if (isAuthLoading) {
    return (
      <div className="bg-white min-h-screen flex items-center justify-center">
        <div className="w-10 h-10 border-4 border-gray-200 border-t-red-600 rounded-full animate-spin" />
      </div>
    );
  }

  if (!isLoggedIn) {
    return (
      <div className="bg-gray-50 min-h-screen py-16 flex items-center justify-center">
        <div className="max-w-md w-full mx-auto px-4 text-center">
          <div className="bg-white border border-gray-200 rounded-2xl p-8 shadow-sm">
            <div className="w-16 h-16 bg-red-50 text-red-600 rounded-full flex items-center justify-center mx-auto mb-4">
              <ShoppingCart size={32} />
            </div>
            <h1 className="text-2xl font-bold text-gray-900 mb-2">Sign In to View Your Cart</h1>
            <p className="text-gray-600 text-sm mb-6">
              Your cart is tied to your account. Please sign in to review your items and proceed to checkout.
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

  if (cartItems.length === 0) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-16 sm:px-6 lg:px-8 text-center">
        <h1 className="text-3xl font-bold text-gray-900 mb-4">Your Cart is Empty</h1>
        <p className="text-gray-500 mb-8">Looks like you haven&apos;t added any items to your cart yet.</p>
        <Link href="/shop" className="bg-red-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-red-700 transition-colors inline-block">
          Start Shopping
        </Link>
      </div>
    );
  }

  return (
    <div className="bg-gray-50 min-h-screen py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Stepper */}
        <div className="mb-8">
          <div className="flex items-center justify-center max-w-2xl mx-auto">
            <div className={`flex flex-col items-center ${step >= 1 ? 'text-red-600' : 'text-gray-400'}`}>
              <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold mb-2 ${step >= 1 ? 'bg-red-600 text-white' : 'bg-gray-200 text-gray-500'}`}>1</div>
              <span className="text-xs font-medium">Cart</span>
            </div>
            <div className={`flex-grow h-1 mx-4 ${step >= 2 ? 'bg-red-600' : 'bg-gray-200'}`}></div>
            <div className={`flex flex-col items-center ${step >= 2 ? 'text-red-600' : 'text-gray-400'}`}>
              <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold mb-2 ${step >= 2 ? 'bg-red-600 text-white' : 'bg-gray-200 text-gray-500'}`}>2</div>
              <span className="text-xs font-medium">Delivery</span>
            </div>
            <div className={`flex-grow h-1 mx-4 ${step >= 3 ? 'bg-red-600' : 'bg-gray-200'}`}></div>
            <div className={`flex flex-col items-center ${step >= 3 ? 'text-red-600' : 'text-gray-400'}`}>
              <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold mb-2 ${step >= 3 ? 'bg-red-600 text-white' : 'bg-gray-200 text-gray-500'}`}>3</div>
              <span className="text-xs font-medium">Payment</span>
            </div>
          </div>
        </div>

        <div className="flex flex-col lg:flex-row gap-8">
          
          {/* Main Content Area */}
          <div className="flex-grow">
            
            {step === 1 && (
              <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
                <div className="p-6 border-b border-gray-200">
                  <h2 className="text-xl font-bold text-gray-900">Cart Items</h2>
                </div>
                <div className="divide-y divide-gray-200">
                  {cartItems.map(item => (
                    <div key={item.product.id} className="p-6 flex flex-col sm:flex-row items-center gap-6">
                      <Image src={item.product.imageUrl} alt={item.product.name} width={96} height={96} className="w-24 h-24 object-contain" />
                      <div className="flex-grow text-center sm:text-left">
                        <h3 className="font-semibold text-gray-900">{item.product.name}</h3>
                        <p className="text-sm text-gray-500">{item.product.brand}</p>
                        <div className="mt-2 font-bold text-gray-900">GH₵ {item.product.price.toFixed(2)}</div>
                      </div>
                      <div className="flex items-center gap-4">
                        <div className="flex border border-gray-200 rounded-lg overflow-hidden">
                          <button onClick={() => updateQuantity(item.product.id, -1)} className="px-3 py-1 bg-gray-50 hover:bg-gray-100">-</button>
                          <div className="px-3 py-1 bg-white border-x border-gray-200 text-sm font-medium">{item.quantity}</div>
                          <button onClick={() => updateQuantity(item.product.id, 1)} className="px-3 py-1 bg-gray-50 hover:bg-gray-100">+</button>
                        </div>
                        <button onClick={() => handleRemove(item.product.id)} className="text-gray-400 hover:text-red-600 transition-colors p-2">
                          <Trash2 size={20} />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {step === 2 && (
              <div className="bg-white border border-gray-200 rounded-xl overflow-hidden p-6">
                <h2 className="text-xl font-bold text-gray-900 mb-6 flex items-center gap-2"><MapPin size={24} className="text-red-600"/> Delivery Details</h2>
                
                <div className="space-y-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Full Name</label>
                    <input
                      type="text"
                      value={delivery.fullName}
                      onChange={handleDeliveryChange("fullName")}
                      className={`w-full border rounded-lg p-3 focus:ring-red-500 focus:border-red-500 ${
                        deliveryErrors.fullName ? "border-red-400 bg-red-50/40" : "border-gray-300"
                      }`}
                      placeholder="Kwame Mensah"
                    />
                    {deliveryErrors.fullName && (
                      <p className="mt-1 text-xs text-red-600">{deliveryErrors.fullName}</p>
                    )}
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Phone Number</label>
                    <input
                      type="tel"
                      value={delivery.phone}
                      onChange={handleDeliveryChange("phone")}
                      className={`w-full border rounded-lg p-3 focus:ring-red-500 focus:border-red-500 ${
                        deliveryErrors.phone ? "border-red-400 bg-red-50/40" : "border-gray-300"
                      }`}
                      placeholder="020 123 4567"
                    />
                    {deliveryErrors.phone && (
                      <p className="mt-1 text-xs text-red-600">{deliveryErrors.phone}</p>
                    )}
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Delivery Address (Accra)</label>
                    <textarea
                      value={delivery.address}
                      onChange={handleDeliveryChange("address")}
                      className={`w-full border rounded-lg p-3 focus:ring-red-500 focus:border-red-500 ${
                        deliveryErrors.address ? "border-red-400 bg-red-50/40" : "border-gray-300"
                      }`}
                      rows={3}
                      placeholder="East Legon, near ANC Mall"
                    ></textarea>
                    {deliveryErrors.address && (
                      <p className="mt-1 text-xs text-red-600">{deliveryErrors.address}</p>
                    )}
                  </div>
                  
                  <div className="pt-4 border-t border-gray-100">
                    <h3 className="text-sm font-medium text-gray-900 mb-3 flex items-center gap-2"><Clock size={16} /> Delivery Time</h3>
                    <div className="grid grid-cols-2 gap-4">
                      <label className="border border-red-600 bg-red-50 p-4 rounded-lg cursor-pointer relative">
                        <input type="radio" name="deliveryTime" className="absolute top-4 right-4 text-red-600" defaultChecked />
                        <div className="font-semibold text-gray-900">Standard</div>
                        <div className="text-sm text-gray-500">Today, 2pm - 5pm</div>
                      </label>
                      <label className="border border-gray-200 hover:border-gray-300 p-4 rounded-lg cursor-pointer relative">
                        <input type="radio" name="deliveryTime" className="absolute top-4 right-4 text-red-600" />
                        <div className="font-semibold text-gray-900">Express</div>
                        <div className="text-sm text-gray-500">Within 1 hour (+ GH₵ 20)</div>
                      </label>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {step === 3 && (
              <div className="bg-white border border-gray-200 rounded-xl overflow-hidden p-6">
                <h2 className="text-xl font-bold text-gray-900 mb-6 flex items-center gap-2"><CreditCard size={24} className="text-red-600"/> Payment Method</h2>
                
                <div className="space-y-4">
                  <label className={`flex items-center gap-4 border p-4 rounded-lg cursor-pointer transition-colors ${
                    paymentMethod === "paystack" ? "border-red-600 bg-red-50" : "border-gray-200 hover:border-gray-300"
                  }`}>
                    <input
                      type="radio"
                      name="payment"
                      className="text-red-600 focus:ring-red-600 h-5 w-5"
                      checked={paymentMethod === "paystack"}
                      onChange={() => setPaymentMethod("paystack")}
                    />
                    <div>
                      <div className="font-semibold text-gray-900">Pay with Paystack</div>
                      <div className="text-sm text-gray-500">Accepts Mobile Money &amp; Bank Transfer — MTN MoMo, Vodafone Cash, AirtelTigo</div>
                    </div>
                  </label>
                  
                  <label className={`flex items-center gap-4 border p-4 rounded-lg cursor-pointer transition-colors ${
                    paymentMethod === "cod" ? "border-red-600 bg-red-50" : "border-gray-200 hover:border-gray-300"
                  }`}>
                    <input
                      type="radio"
                      name="payment"
                      className="text-red-600 focus:ring-red-600 h-5 w-5"
                      checked={paymentMethod === "cod"}
                      onChange={() => setPaymentMethod("cod")}
                    />
                    <div>
                      <div className="font-semibold text-gray-900">Cash on Delivery</div>
                      <div className="text-sm text-gray-500">Pay when your order arrives</div>
                    </div>
                  </label>
                </div>
                
                <div className="mt-8 bg-gray-50 p-4 rounded-lg flex items-start gap-3">
                  <ShieldCheck className="text-gray-400 mt-0.5" size={20} />
                  <p className="text-sm text-gray-600">
                    {paymentMethod === "paystack"
                      ? "Payments are secure and encrypted. You'll be redirected to Paystack to complete your payment after placing the order."
                      : "Pay with cash when your order arrives. Please have the exact amount ready for the courier."}
                  </p>
                </div>
              </div>
            )}
            
          </div>

          {/* Order Summary Sidebar */}
          <div className="lg:w-80 flex-shrink-0">
            <div className="bg-white border border-gray-200 rounded-xl p-6 sticky top-24">
              <h2 className="text-lg font-bold text-gray-900 mb-6">Order Summary</h2>
              
              <div className="space-y-3 mb-6">
                <div className="flex justify-between text-gray-600">
                  <span>Subtotal</span>
                  <span>GH₵ {subtotal.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-gray-600">
                  <span>Delivery Fee</span>
                  <span>GH₵ {deliveryFee.toFixed(2)}</span>
                </div>
                <div className="pt-3 border-t border-gray-200 flex justify-between font-bold text-gray-900 text-lg">
                  <span>Total</span>
                  <span>GH₵ {total.toFixed(2)}</span>
                </div>
              </div>

              {orderError && (
                <div className="mb-4 bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg p-3 flex items-start gap-2">
                  <AlertCircle size={16} className="mt-0.5 flex-shrink-0" />
                  <span>{orderError}</span>
                </div>
              )}

              {step < 3 ? (
                <button
                  onClick={() => goToStep(step + 1)}
                  className="w-full bg-red-600 text-white py-3 rounded-lg font-bold hover:bg-red-700 transition-colors flex items-center justify-center gap-2"
                >
                  Continue <ArrowRight size={18} />
                </button>
              ) : (
                <button
                  onClick={placeOrder}
                  disabled={placing}
                  className="w-full bg-green-600 text-white py-3 rounded-lg font-bold hover:bg-green-700 transition-colors flex items-center justify-center gap-2 disabled:opacity-70"
                >
                  {placing ? (
                    <>
                      <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      <span>Processing…</span>
                    </>
                  ) : (
                    <>
                      <ShieldCheck size={18} />
                      {paymentMethod === "paystack" ? "Pay with Paystack" : "Place Order"}
                    </>
                  )}
                </button>
              )}

              {step > 1 && (
                <button
                  onClick={() => setStep(step - 1)}
                  disabled={placing}
                  className="w-full mt-3 bg-white text-gray-600 border border-gray-200 py-3 rounded-lg font-medium hover:bg-gray-50 transition-colors disabled:opacity-50"
                >
                  Back
                </button>
              )}
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}