"use client";

import { use, useEffect, useState } from "react";
import { CheckCircle2, Package, MapPin, Truck, Phone, FileText, AlertCircle } from "lucide-react";
import Link from "next/link";
import { PulseLine } from "@/components/PulseLine";
import { getOrderById } from "@/services/orders";
import type { Order } from "@/services/orders";

const STAGES = [
  { key: "pending", label: "Placed", icon: FileText, time: "" },
  { key: "confirmed", label: "Verified", icon: CheckCircle2, time: "" },
  { key: "processing", label: "Packed", icon: Package, time: "" },
  { key: "shipped", label: "Out for Delivery", icon: Truck, time: "" },
  { key: "delivered", label: "Delivered", icon: MapPin, time: "" },
];

function getStageIndex(status: string): number {
  const idx = STAGES.findIndex((s) => s.key === status);
  return idx >= 0 ? idx + 1 : 1;
}

function getStatusMessage(stageIndex: number, isDelivered: boolean): string {
  if (isDelivered) return "Your order has been delivered. Thank you for choosing Pulse Pharma.";
  switch (stageIndex) {
    case 1: return "Your order has been placed and is awaiting pharmacist verification.";
    case 2: return "Your prescription has been verified by our licensed pharmacist.";
    case 3: return "Your order has been packed and is awaiting pickup by our delivery partner.";
    case 4: return "Your order is out for delivery and should arrive shortly.";
    default: return "Your order is being processed.";
  }
}

export default function TrackOrder({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [currentStage, setCurrentStage] = useState(1);

  useEffect(() => {
    async function loadOrder() {
      setLoading(true);
      setLoadError(null);

      const { data, error } = await getOrderById(id);

      if (error) {
        setLoadError(error);
      } else if (data) {
        setOrder(data);
        setCurrentStage(getStageIndex(data.status));
      }

      setLoading(false);
    }

    loadOrder();
  }, [id]);

  // Auto-advance stage animation for in-progress orders
  useEffect(() => {
    if (!order || order.status === "delivered" || order.status === "cancelled") return;
    if (currentStage >= STAGES.length) return;
    const t = setTimeout(() => {
      setCurrentStage((s) => Math.min(s + 1, STAGES.length));
    }, 6000);
    return () => clearTimeout(t);
  }, [currentStage, order]);

  const isDelivered = currentStage >= STAGES.length;

  if (loading) {
    return (
      <div className="bg-gray-50 min-h-screen flex items-center justify-center">
        <div className="w-10 h-10 border-4 border-gray-200 border-t-red-600 rounded-full animate-spin" />
      </div>
    );
  }

  if (loadError || !order) {
    return (
      <div className="bg-gray-50 min-h-screen py-16 flex items-center justify-center">
        <div className="max-w-md w-full mx-auto px-4 text-center">
          <div className="bg-white border border-gray-200 rounded-2xl p-8 shadow-sm">
            <div className="w-16 h-16 bg-red-50 text-red-600 rounded-full flex items-center justify-center mx-auto mb-4">
              <AlertCircle size={32} />
            </div>
            <h1 className="text-2xl font-bold text-gray-900 mb-2">Order Not Found</h1>
            <p className="text-gray-600 text-sm mb-6">
              {loadError ?? "We couldn't find an order with that ID."}
            </p>
            <Link
              href="/account"
              className="inline-block bg-red-600 hover:bg-red-700 text-white font-bold py-3 px-6 rounded-lg transition-colors"
            >
              My Orders
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-gray-50 min-h-screen py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-white border border-gray-200 rounded-2xl p-6 md:p-8 mb-6 shadow-sm">
          <div className="flex flex-col md:flex-row md:items-center justify-between mb-6 gap-4">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Order Tracking</h1>
              <p className="text-gray-500 mt-1">Order #{order.id.slice(0, 8).toUpperCase()}</p>
            </div>
            <div
              className={`px-4 py-2 rounded-lg font-medium text-sm inline-flex items-center gap-2 self-start md:self-auto ${
                isDelivered
                  ? "bg-green-50 text-green-700"
                  : order.status === "cancelled"
                  ? "bg-red-50 text-red-700"
                  : "bg-red-50 text-red-700"
              }`}
            >
              <span
                className={`w-2 h-2 rounded-full ${
                  isDelivered
                    ? "bg-green-500"
                    : order.status === "cancelled"
                    ? "bg-red-500"
                    : "bg-red-500 animate-pulse"
                }`}
              ></span>
              {isDelivered
                ? "Completed"
                : order.status === "cancelled"
                ? "Cancelled"
                : "In Progress"}
            </div>
          </div>

          {/* Live EKG pulse line */}
          <div className="mb-8 bg-gray-50 border border-gray-100 rounded-xl px-4 pt-3 pb-1">
            <div className="flex items-center justify-between mb-1">
              <div className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
                Live Order Pulse
              </div>
              <div className="text-xs text-gray-400">
                Stage {Math.min(currentStage, STAGES.length)} of {STAGES.length}
              </div>
            </div>
            <PulseLine stage={currentStage} totalStages={STAGES.length} />
          </div>

          {/* Stepper */}
          <div className="relative mb-10 mt-4 pl-4 md:pl-0">
            {/* Mobile line */}
            <div className="absolute left-7 top-4 bottom-4 w-0.5 bg-gray-200 md:hidden"></div>

            <div className="flex flex-col md:flex-row justify-between relative gap-8 md:gap-0">
              {/* Desktop line */}
              <div className="absolute top-5 left-10 right-10 h-1 bg-gray-200 hidden md:block z-0"></div>
              <div
                className="absolute top-5 left-10 h-1 bg-red-600 hidden md:block z-0 transition-all duration-700 ease-out"
                style={{
                  width: `${
                    ((Math.min(currentStage, STAGES.length) - 1) /
                      (STAGES.length - 1)) *
                    80
                  }%`,
                }}
              ></div>

              {STAGES.map((stage, idx) => {
                const stageNum = idx + 1;
                const reached = currentStage >= stageNum;
                const isFinal = stageNum === STAGES.length;
                const isCurrent = currentStage === stageNum;
                const Icon = stage.icon;

                return (
                  <div
                    key={stage.key}
                    className="relative z-10 flex md:flex-col items-start md:items-center gap-4 md:gap-2"
                  >
                    <div
                      className={`w-10 h-10 rounded-full flex items-center justify-center font-bold transition-colors duration-500 ${
                        reached
                          ? isFinal
                            ? "bg-green-600 text-white"
                            : "bg-red-600 text-white"
                          : "bg-gray-200 text-gray-500"
                      } ${
                        isCurrent && !isFinal
                          ? "shadow-lg shadow-red-200"
                          : ""
                      }`}
                    >
                      <Icon size={20} />
                    </div>
                    <div>
                      <div
                        className={`font-bold ${
                          reached ? "text-gray-900" : "text-gray-400"
                        }`}
                      >
                        {stage.label}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="bg-red-50 border border-red-100 rounded-xl p-5 mb-8">
            <h3 className="font-bold text-gray-900 mb-2">Current Status</h3>
            <p className="text-gray-700">
              {getStatusMessage(currentStage, isDelivered)}
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Delivery Details */}
            <div className="border border-gray-100 bg-gray-50 rounded-xl p-5">
              <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-4">
                Delivery Details
              </h3>
              <div className="space-y-3">
                {order.deliveryAddress ? (
                  <div className="flex items-start gap-3">
                    <MapPin size={18} className="text-gray-400 mt-0.5" />
                    <div>
                      <div className="text-sm text-gray-600">{order.deliveryAddress}</div>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-start gap-3">
                    <MapPin size={18} className="text-gray-400 mt-0.5" />
                    <div className="text-sm text-gray-500 italic">No address provided</div>
                  </div>
                )}
                <div className="flex items-center gap-3 mt-2">
                  <Phone size={18} className="text-gray-400" />
                  <div className="text-sm text-gray-500 italic">Contact via My Account</div>
                </div>
              </div>
            </div>

            {/* Order Summary */}
            <div className="border border-gray-100 bg-gray-50 rounded-xl p-5">
              <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-4">
                Order Summary
              </h3>
              <div className="space-y-2 mb-4">
                {order.items.length > 0 ? (
                  order.items.map((item) => (
                    <div key={item.id} className="flex justify-between text-sm">
                      <span className="text-gray-600">
                        {item.quantity}x {item.productName}
                      </span>
                      <span className="font-medium text-gray-900">
                        GH₵ {item.totalPrice.toFixed(2)}
                      </span>
                    </div>
                  ))
                ) : (
                  <div className="text-sm text-gray-500 italic">No items listed</div>
                )}
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Delivery Fee</span>
                  <span className="font-medium text-gray-900">GH₵ 15.00</span>
                </div>
              </div>
              <div className="pt-3 border-t border-gray-200 flex justify-between font-bold text-gray-900">
                <span>Total</span>
                <span>GH₵ {order.totalAmount.toFixed(2)}</span>
              </div>
            </div>
          </div>
        </div>

        <div className="text-center">
          <p className="text-gray-500 mb-4">Need help with this order?</p>
          <div className="flex justify-center gap-4">
            <Link
              href="/ask"
              className="bg-white border border-gray-200 text-gray-700 px-6 py-2 rounded-lg font-medium hover:bg-gray-50 transition-colors"
            >
              Contact Pharmacist
            </Link>
            <Link href="/" className="text-red-600 px-6 py-2 font-medium hover:underline">
              Return Home
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
