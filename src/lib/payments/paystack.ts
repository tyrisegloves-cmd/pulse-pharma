/**
 * src/lib/payments/paystack.ts
 * ─────────────────────────────────────────────────────────────────────────────
 * SERVER-ONLY Paystack helper. Never import this from a client component —
 * it reads PAYSTACK_SECRET_KEY, which must never reach the browser.
 *
 * Uses the plain REST API (https://api.paystack.co) — no SDK dependency.
 *
 * Required env vars (see .env.example):
 *   PAYSTACK_SECRET_KEY  — sk_test_… / sk_live_… (server-side only)
 *   NEXT_PUBLIC_SITE_URL — public base URL used to build the callback URL
 * ─────────────────────────────────────────────────────────────────────────────
 */

const PAYSTACK_API = "https://api.paystack.co";

/** Charge currency — matches the GH₵ pricing across the site. */
export const PAYSTACK_CURRENCY = "GHS";

/** Standard delivery fee in major units, kept in sync with the cart UI. */
export const DELIVERY_FEE_GHS = 15;

/** Channels enabled for the checkout (per merchant configuration). */
export const PAYSTACK_CHANNELS = ["card", "bank_transfer", "mobile_money"];

/** Read a required env var lazily, with an actionable error. */
function requireEnv(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(
      `[Paystack] Missing env var: ${name}\n` +
        "Add it to .env.local (and your hosting provider's environment variables) and restart the server."
    );
  }
  return value;
}

export function getPaystackSecretKey(): string {
  return requireEnv("PAYSTACK_SECRET_KEY");
}

/** Public base URL (no trailing slash) used to build Paystack's callback_url. */
export function getSiteUrl(): string {
  return (process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000").replace(
    /\/$/,
    ""
  );
}

/** The route Paystack redirects the customer back to after checkout. */
export function getCallbackUrl(): string {
  return `${getSiteUrl()}/checkout/callback`;
}

/** Normalized result of the initialize call. */
export interface InitializeResult {
  authorizationUrl: string;
  reference: string;
  accessCode: string | null;
}

/** Normalized result of the verify call. */
export interface VerifyResult {
  /** Paystack transaction status, lowercased. */
  status: "success" | "failed" | "abandoned" | "pending" | string;
  amount: number; // major units
  currency: string;
  channel: string | null;
  gatewayResponse: string | null;
  paidAt: string | null;
  raw: unknown;
}

type PaystackResponse<T> = {
  status: boolean;
  message: string;
  data?: T;
};

async function paystackFetch<T>(
  path: string,
  init?: RequestInit & { body?: string }
): Promise<T> {
  const res = await fetch(`${PAYSTACK_API}${path}`, {
    ...init,
    headers: {
      Authorization: `Bearer ${getPaystackSecretKey()}`,
      "Content-Type": "application/json",
      ...(init?.headers ?? {}),
    },
    cache: "no-store",
  });

  const payload = (await res.json().catch(() => null)) as PaystackResponse<T> | null;

  if (!res.ok || !payload?.status || !payload.data) {
    const message = payload?.message ?? `Paystack request failed (HTTP ${res.status})`;
    throw new Error(`[Paystack] ${path}: ${message}`);
  }

  return payload.data;
}

/**
 * Start a Paystack transaction. `amountMajor` is in cedis (e.g. 120.5) —
 * it is converted to pesewas (integer) here, as Paystack requires the
 * smallest currency unit.
 */
export async function initializeTransaction(params: {
  email: string;
  amountMajor: number;
  reference: string;
  metadata?: Record<string, unknown>;
}): Promise<InitializeResult> {
  const amountKobo = Math.round(params.amountMajor * 100);

  const data = await paystackFetch<{
    authorization_url: string;
    access_code: string;
    reference: string;
  }>("/transaction/initialize", {
    method: "POST",
    body: JSON.stringify({
      email: params.email,
      amount: amountKobo,
      currency: PAYSTACK_CURRENCY,
      reference: params.reference,
      callback_url: getCallbackUrl(),
      channels: PAYSTACK_CHANNELS,
      metadata: params.metadata,
    }),
  });

  return {
    authorizationUrl: data.authorization_url,
    reference: data.reference,
    accessCode: data.access_code ?? null,
  };
}

/**
 * Verify a transaction server-side. This is the source of truth — the
 * callback page must never trust the redirect parameters alone.
 */
export async function verifyTransaction(reference: string): Promise<VerifyResult> {
  const data = await paystackFetch<{
    status: string;
    amount: number; // pesewas
    currency: string;
    channel: string | null;
    gateway_response: string | null;
    paid_at: string | null;
  }>(`/transaction/verify/${encodeURIComponent(reference)}`);

  return {
    status: (data.status ?? "pending").toLowerCase(),
    amount: data.amount / 100,
    currency: data.currency,
    channel: data.channel ?? null,
    gatewayResponse: data.gateway_response ?? null,
    paidAt: data.paid_at ?? null,
    raw: data,
  };
}
