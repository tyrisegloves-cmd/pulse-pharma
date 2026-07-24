"use client";

import { useEffect, useState } from "react";
import { LogoPulse } from "./LogoPulse";

/**
 * Full-screen splash shown on initial page load:
 * logo beats in → app name → slogan, holds briefly, then the whole
 * overlay fades out and unmounts. Purely decorative (aria-hidden),
 * and kept short so it never blocks the task of ordering medication.
 */
export function SplashScreen() {
  const [hiding, setHiding] = useState(false);
  const [gone, setGone] = useState(false);

  useEffect(() => {
    // Lock scroll while the splash is visible
    document.body.style.overflow = "hidden";

    const hideTimer = setTimeout(() => setHiding(true), 2100);
    const goneTimer = setTimeout(() => {
      setGone(true);
      document.body.style.overflow = "";
    }, 2700);

    return () => {
      clearTimeout(hideTimer);
      clearTimeout(goneTimer);
      document.body.style.overflow = "";
    };
  }, []);

  if (gone) return null;

  return (
    <div
      className={`splash fixed inset-0 z-[100] flex flex-col items-center justify-center bg-white ${
        hiding ? "splash--hide" : ""
      }`}
      aria-hidden="true"
    >
      <div className="splash-item splash-item--logo">
        <LogoPulse size={72} />
      </div>

      <div className="splash-item splash-item--name mt-6 text-3xl font-extrabold tracking-tight text-gray-900">
        Pulse <span className="text-red-600">Pharma</span>
      </div>

      <div className="splash-item splash-item--slogan mt-2 text-sm font-medium text-gray-500">
        Your health, just a tap away.
      </div>

      {/* Thin EKG baseline accent under the lockup */}
      <div className="splash-item splash-item--rule mt-8 h-px w-40 bg-gradient-to-r from-transparent via-red-300 to-transparent" />
    </div>
  );
}
