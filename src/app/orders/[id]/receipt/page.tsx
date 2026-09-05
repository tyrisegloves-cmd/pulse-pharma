/**
 * /orders/[id]/receipt
 * ─────────────────────────────────────────────────────────────────────────────
 * SERVER COMPONENT. Branded, printable receipt for one order. Ownership is
 * enforced in loadReceipt (user_id filter + RLS) — anyone else gets a 404.
 *
 * "Download PDF" hits /api/orders/[id]/receipt?download=1 (same data,
 * server-generated PDF). Print uses a dedicated print stylesheet so the
 * page prints as a clean document.
 * ─────────────────────────────────────────────────────────────────────────────
 */

import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, Download, CheckCircle2, Banknote } from "lucide-react";
import { createServerClient } from "@/lib/supabase/server";
import {
  loadReceipt,
  statusLabel,
  formatDateTime,
  formatCedis,
} from "@/lib/receipt";
import { LogoPulse } from "@/components/LogoPulse";
import { PrintButton } from "@/components/PrintButton";

export const dynamic = "force-dynamic";

function channelLabel(channel: string | null): string {
  switch (channel) {
    case "mobile_money":
      return "Mobile Money";
    case "card":
      return "Card";
    case "bank_transfer":
      return "Bank Transfer";
    default:
      return "Paystack";
  }
}

export default async function ReceiptPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const supabase = await createServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const receipt = user ? await loadReceipt(supabase, id, user.id) : null;
  if (!receipt) notFound();

  const isCod = receipt.paymentMethod === "cod";
  const itemsSubtotal = receipt.items.reduce((sum, i) => sum + i.totalPrice, 0);

  return (
    <div className="bg-gray-50 min-h-screen py-8 print:bg-white">
      {/* Actions — hidden when printing */}
      <div className="max-w-2xl mx-auto px-4 flex items-center justify-between print:hidden">
        <Link
          href="/account"
          className="inline-flex items-center gap-2 text-gray-500 hover:text-red-600 text-sm font-medium transition-colors"
        >
          <ArrowLeft size={16} /> Back to My Account
        </Link>
      </div>

      <div className="max-w-2xl mx-auto px-4 mt-4">
        <div className="bg-white border border-gray-200 rounded-2xl shadow-sm overflow-hidden print:border-0 print:shadow-none print:rounded-none">
          {/* Brand header */}
          <div className="bg-gradient-to-r from-red-600 to-red-700 px-8 py-6 text-white flex items-start justify-between print:bg-white print:text-gray-900 print:border-b print:border-gray-200">
            <div>
              <div className="flex items-center gap-2 font-bold text-xl tracking-tight print:text-red-600">
                <LogoPulse size={30} />
                Pulse Pharma
              </div>
              <p className="text-red-100 text-xs mt-1 print:text-gray-500">
                Your trusted e-health platform and retail pharmacy — Accra, Ghana
              </p>
            </div>
            <div className="text-right">
              <div className="font-bold text-sm print:text-gray-900">PAYMENT RECEIPT</div>
              <div className="text-red-100 text-xs mt-0.5 print:text-gray-500">
                #{receipt.orderId.slice(0, 8).toUpperCase()}
              </div>
            </div>
          </div>

          <div className="p-8">
            {/* Status strip */}
            <div className="flex items-center justify-between bg-gray-50 border border-gray-100 rounded-xl p-4 mb-8 print:bg-transparent">
              <div className="flex items-center gap-3">
                {receipt.status === "confirmed" ? (
                  <CheckCircle2 size={22} className="text-green-600" />
                ) : (
                  <Banknote size={22} className="text-yellow-600" />
                )}
                <span className="font-bold text-gray-900">
                  {statusLabel(receipt.status, receipt.paymentMethod)}
                </span>
              </div>
              <span className="text-xs text-gray-500">
                Placed {formatDateTime(receipt.createdAt)}
              </span>
            </div>

            {/* Billed to */}
            <div className="grid grid-cols-2 gap-6 mb-8">
              <div>
                <h3 className="text-[11px] font-bold text-gray-400 uppercase tracking-wider mb-2">
                  Billed To
                </h3>
                <p className="font-bold text-gray-900">{receipt.deliveryName ?? "Customer"}</p>
                {receipt.deliveryPhone && (
                  <p className="text-sm text-gray-600">{receipt.deliveryPhone}</p>
                )}
                {receipt.deliveryAddress && (
                  <p className="text-sm text-gray-600">{receipt.deliveryAddress}</p>
                )}
                <p className="text-xs text-gray-400 mt-1 font-mono break-all">
                  Order ID: {receipt.orderId}
                </p>
              </div>
              <div className="text-right">
                <h3 className="text-[11px] font-bold text-gray-400 uppercase tracking-wider mb-2">
                  Payment
                </h3>
                <p className="font-bold text-gray-900">
                  {isCod
                    ? "Cash on Delivery"
                    : `Paystack${receipt.payment?.channel ? ` · ${channelLabel(receipt.payment.channel)}` : ""}`}
                </p>
                <p className="text-sm text-gray-600">
                  {isCod
                    ? "Amount due on delivery"
                    : `Paid ${formatDateTime(receipt.payment?.paidAt ?? null)}`}
                </p>
                {receipt.payment?.reference && (
                  <p className="text-xs text-gray-400 mt-1 font-mono break-all">
                    Ref: {receipt.payment.reference}
                  </p>
                )}
              </div>
            </div>

            {/* Items table */}
            <table className="w-full text-sm mb-8">
              <thead>
                <tr className="border-b-2 border-gray-200 text-left text-[11px] font-bold text-gray-400 uppercase tracking-wider">
                  <th className="py-2 pr-2">Item</th>
                  <th className="py-2 px-2 text-right">Qty</th>
                  <th className="py-2 px-2 text-right">Unit</th>
                  <th className="py-2 pl-2 text-right">Total</th>
                </tr>
              </thead>
              <tbody>
                {receipt.items.map((item, idx) => (
                  <tr key={idx} className="border-b border-gray-100">
                    <td className="py-2.5 pr-2 text-gray-900 font-medium">{item.productName}</td>
                    <td className="py-2.5 px-2 text-right text-gray-600">{item.quantity}</td>
                    <td className="py-2.5 px-2 text-right text-gray-600">
                      {formatCedis(item.unitPrice)}
                    </td>
                    <td className="py-2.5 pl-2 text-right text-gray-900 font-semibold">
                      {formatCedis(item.totalPrice)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {/* Totals */}
            <div className="flex justify-end mb-8">
              <div className="w-64 space-y-2 text-sm">
                <div className="flex justify-between text-gray-600">
                  <span>Subtotal</span>
                  <span>{formatCedis(itemsSubtotal)}</span>
                </div>
                <div className="flex justify-between text-gray-600">
                  <span>Delivery fee</span>
                  <span>{formatCedis(receipt.deliveryFee)}</span>
                </div>
                <div className="flex justify-between border-t border-gray-200 pt-2 items-baseline">
                  <span className="font-bold text-gray-900">Total</span>
                  <span className="font-bold text-xl text-red-600">
                    {formatCedis(receipt.totalAmount)}
                  </span>
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="flex flex-col sm:flex-row gap-3 justify-center print:hidden">
              <a
                href={`/api/orders/${receipt.orderId}/receipt?download=1`}
                className="inline-flex items-center justify-center gap-2 bg-red-600 hover:bg-red-700 text-white font-bold py-3 px-6 rounded-lg transition-colors"
              >
                <Download size={18} />
                Download PDF
              </a>
              <PrintButton />
              <Link
                href={`/track/${receipt.orderId}`}
                className="inline-flex items-center justify-center gap-2 bg-white border border-gray-200 hover:border-gray-300 text-gray-700 font-bold py-3 px-6 rounded-lg transition-colors"
              >
                Track Order
              </Link>
            </div>
          </div>

          {/* Footer */}
          <div className="border-t border-gray-100 px-8 py-5 text-center text-xs text-gray-400 print:text-gray-500">
            Thank you for choosing Pulse Pharma. This is a computer-generated receipt.
            <br />
            Pharmacy Council Reg: PCG-2026-X8 · FDA Ghana Registered · support@pulsepharma.com.gh
          </div>
        </div>
      </div>
    </div>
  );
}
