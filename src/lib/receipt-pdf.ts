/**
 * src/lib/receipt-pdf.ts
 * ─────────────────────────────────────────────────────────────────────────────
 * SERVER-ONLY. Renders a receipt as a PDF buffer with pdfkit.
 * Money is labeled "GHS" in the PDF (the ₵ glyph is not in the built-in
 * Helvetica encoding); the HTML receipt uses GH₵.
 * ─────────────────────────────────────────────────────────────────────────────
 */

import PDFDocument from "pdfkit";
import type { ReceiptData } from "@/lib/receipt";
import { statusLabel } from "@/lib/receipt";

const RED = "#dc2626";
const DARK = "#111827";
const GRAY = "#6b7280";
const LIGHT = "#9ca3af";

const BRAND = "PULSE PHARMA";
const BRAND_TAGLINE = "Your trusted e-health platform and retail pharmacy — Accra, Ghana";
const PAGE_WIDTH = 595.28; // A4
const MARGIN = 50;
const CONTENT_WIDTH = PAGE_WIDTH - MARGIN * 2;

function money(amount: number): string {
  return `GHS ${amount.toFixed(2)}`;
}

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

/** Build the PDF and resolve once fully written. */
export function buildReceiptPdf(receipt: ReceiptData): Promise<Uint8Array> {
  const doc = new PDFDocument({ size: "A4", margin: MARGIN });
  const chunks: Buffer[] = [];
  const done = new Promise<Uint8Array>((resolve, reject) => {
    doc.on("data", (c: Buffer) => chunks.push(c));
    doc.on("end", () => resolve(new Uint8Array(Buffer.concat(chunks))));
    doc.on("error", reject);
  });

  draw(doc, receipt);

  doc.end();
  return done;
}

function draw(doc: PDFKit.PDFDocument, receipt: ReceiptData): void {
  drawHeader(doc, receipt);
  drawBilledTo(doc, receipt);
  drawItems(doc, receipt);
  drawTotals(doc, receipt);
  drawPaymentInfo(doc, receipt);
  drawFooter(doc);
}

function drawHeader(doc: PDFKit.PDFDocument, receipt: ReceiptData): void {
  doc.rect(MARGIN, MARGIN, CONTENT_WIDTH, 78).fillAndStroke(RED, RED);

  doc.fillColor("#ffffff").font("Helvetica-Bold").fontSize(20);
  doc.text(BRAND, MARGIN + 20, MARGIN + 16);
  doc.font("Helvetica").fontSize(8.5).fillColor("#fecaca");
  doc.text(BRAND_TAGLINE, MARGIN + 20, MARGIN + 42, { width: CONTENT_WIDTH - 220 });

  doc.fillColor("#ffffff").font("Helvetica-Bold").fontSize(12);
  doc.text("PAYMENT RECEIPT", MARGIN + 20, MARGIN + 58);

  // Receipt meta on the right side of the banner.
  const shortId = receipt.orderId.slice(0, 8).toUpperCase();
  doc.font("Helvetica").fontSize(9).fillColor("#fecaca");
  doc.text(`Receipt #${shortId}`, MARGIN + CONTENT_WIDTH - 160, MARGIN + 18, {
    width: 140,
    align: "right",
  });
  doc
    .text(
      `Issued ${new Date(receipt.payment?.paidAt ?? receipt.createdAt).toLocaleDateString("en-GB")}`,
      MARGIN + CONTENT_WIDTH - 160,
      MARGIN + 34,
      { width: 140, align: "right" }
    );

  doc.moveDown(2);
  doc.y = MARGIN + 100;
}

function drawBilledTo(doc: PDFKit.PDFDocument, receipt: ReceiptData): void {
  doc.fillColor(GRAY).font("Helvetica-Bold").fontSize(8);
  doc.text("BILLED TO", MARGIN, doc.y, { characterSpacing: 1 });

  doc.fillColor(DARK).font("Helvetica-Bold").fontSize(11);
  doc.text(receipt.deliveryName ?? "Customer", MARGIN, doc.y + 4);

  doc.font("Helvetica").fontSize(9.5).fillColor(GRAY);
  if (receipt.deliveryPhone) doc.text(receipt.deliveryPhone, MARGIN, doc.y + 2);
  if (receipt.deliveryAddress) doc.text(receipt.deliveryAddress, MARGIN, doc.y + 2);

  doc
    .font("Helvetica")
    .fontSize(9)
    .fillColor(LIGHT)
    .text(`Order ID: ${receipt.orderId}`, MARGIN, doc.y + 2);

  doc.moveDown(1.6);
}

function drawItems(doc: PDFKit.PDFDocument, receipt: ReceiptData): void {
  const colItem = MARGIN;
  const colQty = MARGIN + CONTENT_WIDTH - 250;
  const colUnit = MARGIN + CONTENT_WIDTH - 170;
  const colTotal = MARGIN + CONTENT_WIDTH - 80;
  const rowTop = doc.y + 6;

  // Header row
  doc.rect(MARGIN, rowTop, CONTENT_WIDTH, 22).fill("#f3f4f6");
  doc.fillColor(GRAY).font("Helvetica-Bold").fontSize(8.5);
  doc.text("ITEM", colItem + 10, rowTop + 7);
  doc.text("QTY", colQty, rowTop + 7, { width: 60, align: "right" });
  doc.text("UNIT", colUnit, rowTop + 7, { width: 70, align: "right" });
  doc.text("TOTAL", colTotal, rowTop + 7, { width: 70, align: "right" });

  let y = rowTop + 30;
  doc.font("Helvetica").fontSize(9.5);

  for (const item of receipt.items) {
    const nameHeight = doc.heightOfString(item.productName, {
      width: CONTENT_WIDTH - 270,
    });
    const rowHeight = Math.max(nameHeight + 10, 22);

    if (y + rowHeight > doc.page.height - 150) {
      doc.addPage();
      y = MARGIN;
    }

    doc.fillColor(DARK);
    doc.text(item.productName, colItem + 10, y, { width: CONTENT_WIDTH - 270 });
    doc.fillColor(DARK);
    doc.text(String(item.quantity), colQty, y, { width: 60, align: "right" });
    doc.text(money(item.unitPrice), colUnit, y, { width: 70, align: "right" });
    doc.font("Helvetica-Bold").text(money(item.totalPrice), colTotal, y, {
      width: 70,
      align: "right",
    });
    doc.font("Helvetica");

    doc
      .moveTo(MARGIN, y + rowHeight - 4)
      .lineTo(MARGIN + CONTENT_WIDTH, y + rowHeight - 4)
      .strokeColor("#f3f4f6")
      .stroke();

    y += rowHeight;
  }

  doc.y = y + 8;
}

function drawTotals(doc: PDFKit.PDFDocument, receipt: ReceiptData): void {
  const labelX = MARGIN + CONTENT_WIDTH - 220;
  const valueX = MARGIN + CONTENT_WIDTH - 80;
  const itemsSubtotal = receipt.items.reduce((s, i) => s + i.totalPrice, 0);

  let y = doc.y;
  const line = (label: string, value: string, bold = false, fill = GRAY) => {
    doc.fillColor(fill).font(bold ? "Helvetica-Bold" : "Helvetica").fontSize(10);
    doc.text(label, labelX, y, { width: 130 });
    doc.text(value, valueX, y, { width: 80, align: "right" });
    y += 18;
  };

  line("Subtotal", money(itemsSubtotal));
  line("Delivery fee", money(receipt.deliveryFee));

  doc
    .moveTo(labelX, y)
    .lineTo(MARGIN + CONTENT_WIDTH, y)
    .strokeColor("#e5e7eb")
    .stroke();
  y += 8;

  doc
    .rect(labelX - 10, y - 4, 230, 26)
    .fillAndStroke("#fef2f2", "#fecaca");
  doc.fillColor(RED).font("Helvetica-Bold").fontSize(11);
  doc.text("TOTAL", labelX, y + 2, { width: 130 });
  doc.text(money(receipt.totalAmount), valueX, y + 2, { width: 80, align: "right" });
  doc.y = y + 34;
}

function drawPaymentInfo(doc: PDFKit.PDFDocument, receipt: ReceiptData): void {
  const pay = receipt.payment;
  const method =
    receipt.paymentMethod === "cod"
      ? "Cash on Delivery"
      : `Paystack${pay?.channel ? ` · ${channelLabel(pay.channel)}` : ""}`;
  const paidLabel =
    receipt.paymentMethod === "cod"
      ? "Amount due on delivery"
      : `Paid ${pay?.paidAt ? new Date(pay.paidAt).toLocaleString("en-GB") : "—"}`;

  doc
    .rect(MARGIN, doc.y, CONTENT_WIDTH, 58)
    .fillAndStroke("#f9fafb", "#f3f4f6");

  const top = doc.y + 10;
  doc.fillColor(GRAY).font("Helvetica-Bold").fontSize(8);
  doc.text("PAYMENT", MARGIN + 14, top, { characterSpacing: 1 });
  doc.text("STATUS", MARGIN + 200, top, { characterSpacing: 1 });
  doc.text("REFERENCE", MARGIN + 330, top, { characterSpacing: 1 });

  doc.fillColor(DARK).font("Helvetica").fontSize(9.5);
  doc.text(method, MARGIN + 14, top + 14);
  doc.text(statusLabel(receipt.status, receipt.paymentMethod), MARGIN + 200, top + 14);
  doc.font("Helvetica").fontSize(8.5).fillColor(GRAY);
  doc.text(pay?.reference ?? "—", MARGIN + 330, top + 14, { width: 190 });
  doc.text(paidLabel, MARGIN + 14, top + 30, { width: 250 });
  doc.y = top + 68;
}

function drawFooter(doc: PDFKit.PDFDocument): void {
  const range = doc.bufferedPageRange();
  for (let i = range.start; i < range.start + range.count; i++) {
    doc.switchToPage(i);
    const bottom = doc.page.height - 60;

    doc
      .moveTo(MARGIN, bottom - 14)
      .lineTo(MARGIN + CONTENT_WIDTH, bottom - 14)
      .strokeColor("#f3f4f6")
      .stroke();

    doc.fillColor(LIGHT).font("Helvetica").fontSize(7.5);
    doc.text(
      "Thank you for choosing Pulse Pharma. This is a computer-generated receipt.",
      MARGIN,
      bottom,
      { width: CONTENT_WIDTH, align: "center" }
    );
    doc.text("Pharmacy Council Reg: PCG-2026-X8  ·  FDA Ghana Registered  ·  support@pulsepharma.com.gh", {
      width: CONTENT_WIDTH,
      align: "center",
    });
  }
}
