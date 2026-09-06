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
  process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY ?? "";

export function isRazorpayConfigured(): boolean {
  return RAZORPAY_KEY_ID.length > 8 && RAZORPAY_KEY_SECRET.length > 8;
}

export function isStripeConfigured(): boolean {
  return STRIPE_SECRET_KEY.startsWith("sk_");
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