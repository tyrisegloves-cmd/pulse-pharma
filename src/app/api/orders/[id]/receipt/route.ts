/**
 * GET /api/orders/[id]/receipt
 * ─────────────────────────────────────────────────────────────────────────────
 * SERVER-ONLY. Streams the order's receipt as a PDF.
 *
 * Auth: the caller's Supabase session cookie must match the order's owner
 * (double-checked in loadReceipt + enforced by RLS). Add ?download=1 to get
 * a Content-Disposition: attachment response; the default renders inline.
 * ─────────────────────────────────────────────────────────────────────────────
 */

import { NextRequest } from "next/server";
import { createServerClient } from "@/lib/supabase/server";
import { loadReceipt } from "@/lib/receipt";
import { buildReceiptPdf } from "@/lib/receipt-pdf";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  const supabase = await createServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return Response.json(
      { error: "Please sign in to view this receipt." },
      { status: 401 }
    );
  }

  const receipt = await loadReceipt(supabase, id, user.id);
  if (!receipt) {
    return Response.json(
      { error: "Receipt not found, or it belongs to another account." },
      { status: 404 }
    );
  }

  let pdf: Uint8Array;
  try {
    pdf = await buildReceiptPdf(receipt);
  } catch (error) {
    console.error("[receipt] PDF generation failed:", error);
    return Response.json(
      { error: "We couldn't generate your receipt. Please try again." },
      { status: 500 }
    );
  }

  const download = request.nextUrl.searchParams.get("download") === "1";
  const filename = `pulse-pharma-receipt-${id.slice(0, 8)}.pdf`;

  return new Response(pdf as unknown as BodyInit, {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `${download ? "attachment" : "inline"}; filename="${filename}"`,
      "Cache-Control": "no-store",
    },
  });
}
