"use client";

import { Printer } from "lucide-react";

/** Triggers the browser's print dialog — the receipt page has a print stylesheet. */
export function PrintButton() {
  return (
    <button
      onClick={() => window.print()}
      className="inline-flex items-center justify-center gap-2 bg-white border border-gray-200 hover:border-gray-300 text-gray-700 font-bold py-3 px-6 rounded-lg transition-colors"
    >
      <Printer size={18} />
      Print
    </button>
  );
}
