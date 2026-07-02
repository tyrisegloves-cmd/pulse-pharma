"use client";

import { use, useEffect, useState } from "react";
import { CheckCircle2, Package, MapPin, Truck, Phone, FileText } from "lucide-react";
import Link from "next/link";
import { PulseLine } from "@/components/PulseLine";

const STAGES = [
  { key: "placed", label: "Placed", icon: FileText, time: "10:30 AM" },
  { key: "verified", label: "Verified", icon: CheckCircle2, time: "10:45 AM" },
  { key: "packed", label: "Packed", icon: Package, time: "11:15 AM" },
  { key: "out", label: "Out for Delivery", icon: Truck, time: "" },
  { key: "delivered", label: "Delivered", icon: MapPin, time: "" },
];

export default function TrackOrder({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const [currentStage, setCurrentStage] = useState(3);

  // Auto-advance to demo the live pulse-line reacting to progress
  useEffect(() => {
    if (currentStage >= STAGES.length) return;
    const t = setTimeout(() => {
      setCurrentStage((s) => Math.min(s + 1, STAGES.length));
    }, 6000);
    return () => clearTimeout(t);
  }, [currentStage]);

  const isDelivered = currentStage >= STAGES.length;

  return (
    <div className="bg-gray-50 min-h-screen py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-white border border-gray-200 rounded-2xl p-6 md:p-8 mb-6 shadow-sm">
          <div className="flex flex-col md:flex-row md:items-center justify-between mb-6 gap-4">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Order Tracking</h1>
              <p className="text-gray-500 mt-1">Order #PULSE-{id || "12345"}</p>
            </div>
            <div
              className={`px-4 py-2 rounded-lg font-medium text-sm inline-flex items-center gap-2 self-start md:self-auto ${
                isDelivered
                  ? "bg-green-50 text-green-700"
                  : "bg-red-50 text-red-700"
              }`}
            >
              <span
                className={`w-2 h-2 rounded-full ${
                  isDelivered ? "bg-green-500" : "bg-red-500 animate-pulse"
                }`}
              ></span>
              {isDelivered ? "Completed" : "In Progress"}
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
                      {stage.time && (
                        <div className="text-xs text-gray-500 hidden md:block">
                          {stage.time}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="bg-red-50 border border-red-100 rounded-xl p-5 mb-8">
            <h3 className="font-bold text-gray-900 mb-2">Current Status</h3>
            <p className="text-gray-700">
              {isDelivered
                ? "Your order has been delivered. Thank you for choosing Pulse Pharma."
                : currentStage === 1
                ? "Your order has been placed and is awaiting pharmacist verification."
                : currentStage === 2
                ? "Your prescription has been verified by our licensed pharmacist."
                : currentStage === 3
                ? "Your order has been packed and is awaiting pickup by our delivery partner."
                : "Your order is out for delivery and should arrive shortly."}
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="border border-gray-100 bg-gray-50 rounded-xl p-5">
              <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-4">
                Delivery Details
              </h3>
              <div className="space-y-3">
                <div className="flex items-start gap-3">
                  <MapPin size={18} className="text-gray-400 mt-0.5" />
                  <div>
                    <div className="font-medium text-gray-900">Kwame Mensah</div>
                    <div className="text-sm text-gray-600">East Legon, near ANC Mall</div>
                    <div className="text-sm text-gray-600">Accra, Ghana</div>
                  </div>
                </div>
                <div className="flex items-center gap-3 mt-2">
                  <Phone size={18} className="text-gray-400" />
                  <div className="text-sm text-gray-900">020 123 4567</div>
                </div>
              </div>
            </div>

            <div className="border border-gray-100 bg-gray-50 rounded-xl p-5">
              <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-4">
                Order Summary
              </h3>
              <div className="space-y-2 mb-4">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">2x Paracetamol 500mg</span>
                  <span className="font-medium text-gray-900">GH₵ 31.00</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">1x Vitamin C 1000mg</span>
                  <span className="font-medium text-gray-900">GH₵ 85.00</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Delivery Fee</span>
                  <span className="font-medium text-gray-900">GH₵ 15.00</span>
                </div>
              </div>
              <div className="pt-3 border-t border-gray-200 flex justify-between font-bold text-gray-900">
                <span>Total Paid (MoMo)</span>
                <span>GH₵ 131.00</span>
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
