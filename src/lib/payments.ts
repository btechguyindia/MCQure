// ── Payment provider wiring (Razorpay + Stripe) ──────────────────────────────
//
// Provider keys come from .env. Every integration checks isConfigured() first
// so the app stays fully usable without payment keys (manual grants still
// work). Amounts are always in the provider's smallest unit (paise / cents).

import type { BillingCycle, Currency, PlanId } from "@/lib/plans";
import { MONTHS_PER_CYCLE, PLANS, isPlanId } from "@/lib/plans";

export const RAZORPAY_KEY_ID = process.env.RAZORPAY_KEY_ID ?? "";
export const RAZORPAY_KEY_SECRET = process.env.RAZORPAY_KEY_SECRET ?? "";
export const STRIPE_SECRET_KEY = process.env.STRIPE_SECRET_KEY ?? "";
export const STRIPE_WEBHOOK_SECRET = process.env.STRIPE_WEBHOOK_SECRET ?? "";
export const STRIPE_PUBLISHABLE_KEY =
  process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY ??
  process.env.STRIPE_PUBLISHABLE_KEY ??
  "";

export function isRazorpayConfigured(): boolean {
  return RAZORPAY_KEY_ID.length > 8 && RAZORPAY_KEY_SECRET.length > 8;
}

export function isStripeConfigured(): boolean {
  return STRIPE_SECRET_KEY.startsWith("sk_");
}

// ── Environment / payment mode ───────────────────────────────────────────────
//
// APP_ENV decides the gateway mode: production always runs LIVE payments and
// refuses sandbox credentials; anything else runs the test/sandbox mode by
// default (or LIVE when explicitly opted in via PAYMENT_MODE=live for local
// testing against real keys). An explicit PAYMENT_MODE only ever downgrades
// the default for non-production environments — production is locked to live.
//
//   APP_ENV=production        → always live
//   APP_ENV=uat / dev         → test (or live with PAYMENT_MODE=live)
//   PAYMENT_MODE=test         → test, unless APP_ENV=production
//
// Secrets (key secrets, SMTP passwords…) are server-side only and never sent
// to the client; the checkout flows return only public keys.

export type PaymentMode = "live" | "test";

export const APP_ENV = process.env.APP_ENV ?? "development";

/** Purely derived mode resolver, unit-testable without env mocks. */
export function resolvePaymentMode(appEnv: string, explicit = ""): PaymentMode {
  if (appEnv === "production") return "live";
  return explicit === "live" ? "live" : "test";
}

export const PAYMENT_MODE: PaymentMode = resolvePaymentMode(APP_ENV, process.env.PAYMENT_MODE ?? "");

export function paymentMode(): PaymentMode {
  return PAYMENT_MODE;
}

export function isLiveMode(): boolean {
  return PAYMENT_MODE === "live";
}

/** Whether the simulated "test checkout" may be shown / used in this env. */
export function testCheckoutEnabled(): boolean {
  return PAYMENT_MODE === "test";
}

function isLiveRazorpayKey(key: string): boolean {
  return key.startsWith("rzp_live_");
}

function isLiveStripeKey(key: string): boolean {
  return key.startsWith("sk_live_");
}

/**
 * Live mode requires LIVE credentials (rzp_live_* / sk_live_*). Sandbox keys
 * (rzp_test_* / sk_test_*) are refused so a production deploy can never
 * silently fall back to the test gateway.
 */
export function keysMatchMode(): boolean {
  if (PAYMENT_MODE === "test") return true;
  if (RAZORPAY_KEY_ID && !isLiveRazorpayKey(RAZORPAY_KEY_ID)) return false;
  if (STRIPE_SECRET_KEY && !isLiveStripeKey(STRIPE_SECRET_KEY)) return false;
  return true;
}

/** Multiplier from base currency unit to smallest unit (INR paise / USD cents). */
export const UNIT_MULTIPLIER: Record<Currency, number> = {
  INR: 100,
  USD: 100,
};

export type CheckoutRequest = {
  plan: PlanId;
  cycle: BillingCycle;
  currency: Currency;
};

/**
 * Validated, price-checked checkout request. `amount` is the authoritative
 * price from the central catalog in the smallest unit — providers are told the
 * amount, never asked to compute it, and callbacks re-derive it from the plan
 * so no one can pay a discounted amount by tampering with the request.
 */
export interface ValidatedCheckout extends CheckoutRequest {
  amountUnits: number;
  amountMinor: number;
  months: number;
  descriptor: string;
}

export function descriptorsFor(plan: PlanId, cycle: BillingCycle) {
  return {
    name: `${plan === "BASIC" ? "Basic" : plan === "PREMIUM" ? "Premium" : plan === "PREMIUM_PLUS" ? "Premium Plus" : "Royal"}`,
    description: `${plan} plan — ${cycle === "MONTHLY" ? "1 month" : "12 months"}`,
  };
}

/** Absolute base URL for success/cancel redirects (dev-safe on localhost). */
export function appBaseUrl(): string {
  return process.env.NEXT_PUBLIC_APP_URL ?? (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : "http://localhost:3000");
}

/**
 * Turn a validated checkout body into the authoritative price + period. Throws
 * for unknown plans and rejects paying for the free Basic plan.
 */
export function resolveCheckout(body: {
  plan: string;
  cycle: string;
  currency: string;
}): ValidatedCheckout {
  if (!isPlanId(body.plan)) throw new Error("Unknown plan");
  if (body.plan === "BASIC") throw new Error("Basic is free — nothing to pay for");
  const cycle = body.cycle === "YEARLY" ? "YEARLY" : body.cycle === "MONTHLY" ? "MONTHLY" : null;
  if (!cycle) throw new Error("Unknown billing cycle");
  const currency: Currency = body.currency === "USD" ? "USD" : body.currency === "INR" ? "INR" : "INR";

  const amount = PLANS[body.plan].prices[cycle][currency];
  const amountUnits = amount;
  const amountMinor = Math.round(amount * UNIT_MULTIPLIER[currency]);

  return {
    plan: body.plan,
    cycle,
    currency,
    amountUnits,
    amountMinor,
    months: MONTHS_PER_CYCLE[cycle],
    descriptor: `${body.plan} ${cycle === "YEARLY" ? "yearly" : "monthly"} (${currency})`,
  };
}