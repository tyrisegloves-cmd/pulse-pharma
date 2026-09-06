/**
 * src/app/api/ask/route.ts
 * ─────────────────────────────────────────────────────────────────────────────
 * POST /api/ask — the "Ask Your Pharmacist" consult endpoint.
 *
 * Receives the conversation so far, runs the consult engine
 * (`src/lib/pharmacist/engine`) against it with the LIVE product catalogue
 * from Supabase, and returns a composed reply the page renders.
 *
 * Stateless by design: the client sends the full history each time, so any
 * server instance can answer any request.
 *
 * Request:  { messages: { role: "user" | "assistant", content: string }[],
 *             userName?: string }
 * Response: { reply, urgency, suggestions, products, notes, topicTitle }
 * ─────────────────────────────────────────────────────────────────────────────
 */

import { getAllMedicines } from "@/services/medicines";
import {
  respond,
  type ChatTurn,
  type ConsultResult,
  type CatalogueProduct,
} from "@/lib/pharmacist/engine";

export const dynamic = "force-dynamic";

/** A single engine call exchanges at most ~40 turns; anything beyond is abuse. */
const MAX_TURNS = 40;
const MAX_MESSAGE_LENGTH = 2_000;

export async function POST(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  const { messages, userName } = (body ?? {}) as {
    messages?: unknown;
    userName?: unknown;
  };

  if (!Array.isArray(messages) || messages.length === 0) {
    return Response.json(
      { error: "messages must be a non-empty array." },
      { status: 400 }
    );
  }

  // Sanitize: keep only well-formed user/assistant turns, trimmed and capped.
  const chatTurns: ChatTurn[] = messages
    .filter((m): m is ChatTurn => {
      if (!m || typeof m !== "object") return false;
      const turn = m as ChatTurn;
      return (
        (turn.role === "user" || turn.role === "assistant") &&
        typeof turn.content === "string"
      );
    })
    .filter(
      (m) =>
        m.content.trim().length > 0 &&
        m.content.length <= MAX_MESSAGE_LENGTH
    )
    .map((m) => ({ role: m.role, content: m.content.trim() }))
    .slice(-MAX_TURNS);

  if (chatTurns.length === 0 || chatTurns[chatTurns.length - 1].role !== "user") {
    return Response.json(
      { error: "The last message must be from the user." },
      { status: 400 }
    );
  }

  try {
    // The catalogue links advice to real, purchasable products. A failed
    // load degrades gracefully: replies still work, minus product cards.
    const { data: catalogue } = await getAllMedicines({ limit: 200 });

    const products: CatalogueProduct[] = (catalogue ?? []).map((m) => ({
      id: m.id,
      name: m.name,
      price: m.price,
      imageUrl: m.imageUrl,
      brand: m.brand,
      dosage: m.dosage,
      isPrescriptionRequired: m.isPrescriptionRequired,
      inStock: m.inStock,
    }));

    const result: ConsultResult = respond({
      messages: chatTurns,
      catalogue: products,
      userName: typeof userName === "string" ? userName.slice(0, 40) : undefined,
    });

    return Response.json(result);
  } catch (error) {
    console.error("[api/ask] consult failed:", error);
    return Response.json(
      {
        error:
          "Something went wrong on our side. Please try again — for anything urgent, call 112 or visit the nearest pharmacy.",
      },
      { status: 500 }
    );
  }
}
