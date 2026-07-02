"use client";

import { useState } from "react";
import { MOCK_PRODUCTS } from "@/lib/data";
import { Trash2, ArrowRight, ShieldCheck, MapPin, Clock, CreditCard } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";

export default function Cart() {
  const router = useRouter();
  const [step, setStep] = useState(1); // 1: Cart, 2: Delivery, 3: Payment
  
  // Mock cart items
  const [cartItems, setCartItems] = useState([
    { product: MOCK_PRODUCTS[0], quantity: 2 },
    { product: MOCK_PRODUCTS[4], quantity: 1 }
  ]);

  const subtotal = cartItems.reduce((acc, item) => acc + (item.product.price * item.quantity), 0);
  const deliveryFee = 15.00;
  const total = subtotal + deliveryFee;

  const handleRemove = (id: string) => {
    setCartItems(cartItems.filter(item => item.product.id !== id));
  };

  const updateQuantity = (id: string, delta: number) => {
    setCartItems(cartItems.map(item => {
      if (item.product.id === id) {
        const newQ = item.quantity + delta;
        return { ...item, quantity: newQ > 0 ? newQ : 1 };
      }
      return item;
    }));
  };

  const placeOrder = () => {
    // Simulate order placement
    router.push("/track/12345");
  };

  if (cartItems.length === 0) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-16 sm:px-6 lg:px-8 text-center">
        <h1 className="text-3xl font-bold text-gray-900 mb-4">Your Cart is Empty</h1>
        <p className="text-gray-500 mb-8">Looks like you haven't added any items to your cart yet.</p>
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
                      <img src={item.product.imageUrl} alt={item.product.name} className="w-24 h-24 object-contain" />
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
                    <input type="text" className="w-full border border-gray-300 rounded-lg p-3 focus:ring-red-500 focus:border-red-500" defaultValue="Kwame Mensah" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Phone Number</label>
                    <input type="tel" className="w-full border border-gray-300 rounded-lg p-3 focus:ring-red-500 focus:border-red-500" defaultValue="020 123 4567" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Delivery Address (Accra)</label>
                    <textarea className="w-full border border-gray-300 rounded-lg p-3 focus:ring-red-500 focus:border-red-500" rows={3} defaultValue="East Legon, near ANC Mall"></textarea>
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
                  <label className="flex items-center gap-4 border border-red-600 bg-red-50 p-4 rounded-lg cursor-pointer">
                    <input type="radio" name="payment" className="text-red-600 focus:ring-red-600 h-5 w-5" defaultChecked />
                    <div>
                      <div className="font-semibold text-gray-900">Mobile Money</div>
                      <div className="text-sm text-gray-500">MTN MoMo, Vodafone Cash, AirtelTigo</div>
                    </div>
                  </label>
                  
                  <label className="flex items-center gap-4 border border-gray-200 hover:border-gray-300 p-4 rounded-lg cursor-pointer">
                    <input type="radio" name="payment" className="text-red-600 focus:ring-red-600 h-5 w-5" />
                    <div>
                      <div className="font-semibold text-gray-900">Credit / Debit Card</div>
                      <div className="text-sm text-gray-500">Visa, Mastercard</div>
                    </div>
                  </label>
                  
                  <label className="flex items-center gap-4 border border-gray-200 hover:border-gray-300 p-4 rounded-lg cursor-pointer">
                    <input type="radio" name="payment" className="text-red-600 focus:ring-red-600 h-5 w-5" />
                    <div>
                      <div className="font-semibold text-gray-900">Cash on Delivery</div>
                      <div className="text-sm text-gray-500">Pay when your order arrives</div>
                    </div>
                  </label>
                </div>
                
                <div className="mt-8 bg-gray-50 p-4 rounded-lg flex items-start gap-3">
                  <ShieldCheck className="text-gray-400 mt-0.5" size={20} />
                  <p className="text-sm text-gray-600">Payments are secure and encrypted. Mobile Money prompt will be sent to your phone after placing the order.</p>
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

              {step < 3 ? (
                <button 
                  onClick={() => setStep(step + 1)}
                  className="w-full bg-red-600 text-white py-3 rounded-lg font-bold hover:bg-red-700 transition-colors flex items-center justify-center gap-2"
                >
                  Continue <ArrowRight size={18} />
                </button>
              ) : (
                <button 
                  onClick={placeOrder}
                  className="w-full bg-green-600 text-white py-3 rounded-lg font-bold hover:bg-green-700 transition-colors flex items-center justify-center gap-2"
                >
                  Place Order <ShieldCheck size={18} />
                </button>
              )}
              
              {step > 1 && (
                <button 
                  onClick={() => setStep(step - 1)}
                  className="w-full mt-3 bg-white text-gray-600 border border-gray-200 py-3 rounded-lg font-medium hover:bg-gray-50 transition-colors"
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