// ── Subscription lifecycle (activation, queries, expiry) ────────────────────
//
// Every payment provider (Razorpay, Stripe) and the manual grant API funnels
// through activateSubscription: it atomically ends any previous entitlements,
// creates the ACTIVE Subscription, writes the plan snapshot and syncs
// User.tier so existing feature checks keep working. Nothing titles an account
// directly except this module.

import { prisma } from "@/lib/db";
import { MONTHS_PER_CYCLE, PLANS, type BillingCycle, type Currency, type PlanId } from "@/lib/plans";
import type { AccountTier, BillingCurrency, PaymentProvider, Subscription } from "@prisma/client";

export const PLAN_TO_TIER: Record<PlanId, AccountTier> = {
  BASIC: "BASIC",
  PREMIUM: "PREMIUM",
  PREMIUM_PLUS: "PREMIUM_PLUS",
  ROYAL: "ROYAL",
};

export const TIER_TO_PLAN: Record<AccountTier, PlanId> = {
  BASIC: "BASIC",
  PREMIUM: "PREMIUM",
  PREMIUM_PLUS: "PREMIUM_PLUS",
  ROYAL: "ROYAL",
};

export function isPaidPlan(plan: PlanId): boolean {
  return plan !== "BASIC";
}

/** End of the billing period for a given cycle, measured from `from`. */
export function periodEnd(from: Date, cycle: BillingCycle, now = new Date()): Date {
  const base = Number.isNaN(from.getTime()) ? now : from;
  const end = new Date(base);
  end.setMonth(end.getMonth() + MONTHS_PER_CYCLE[cycle]);
  return end;
}

/** JSON snapshot of a plan at purchase time (billing history self-describes). */
export function planSnapshot(plan: PlanId) {
  return {
    plan,
    name: PLANS[plan].name,
    limits: PLANS[plan].limits,
    features: [...PLANS[plan].features],
  };
}

export interface ActivateInput {
  userId: string;
  plan: PlanId;
  cycle: BillingCycle;
  provider: PaymentProvider;
  providerRef?: string | null;
  amount?: number;
  currency?: Currency;
  currentPeriodEnd?: Date;
  /** When the payment was verified against an existing PENDING checkout row,
   *  that row is upgraded to ACTIVE in place (keeps one clean history entry). */
  pendingId?: string;
}

/**
 * Atomically grant (or renew) a plan. Past ACTIVE rows for the user are ended,
 * the (pending or fresh) Subscription is written ACTIVE and User.tier is synced
 * in the same transaction so a crash can never leave entitlements out of sync.
 */
export async function activateSubscription(input: ActivateInput): Promise<Subscription> {
  const now = new Date();
  const end = input.currentPeriodEnd ?? periodEnd(now, input.cycle);
  const currency: BillingCurrency = input.currency ?? "INR";
  const details = {
    plan: PLAN_TO_TIER[input.plan],
    cycle: input.cycle,
    status: "ACTIVE" as const,
    provider: input.provider,
    providerRef: input.providerRef ?? null,
    amount: input.amount ?? 0,
    currency,
    planSnapshot: planSnapshot(input.plan),
    currentPeriodEnd: end,
    cancelledAt: null,
  };

  // Upgrade an existing PENDING checkout to ACTIVE (rendered as one entry in
  // the transaction history) instead of appending a second row.
  if (input.pendingId) {
    const [, sub] = await prisma.$transaction([
      prisma.subscription.updateMany({
        where: { userId: input.userId, status: { in: ["ACTIVE", "PENDING"] }, id: { not: input.pendingId } },
        data: { status: "EXPIRED", cancelledAt: now },
      }),
      prisma.subscription.update({ where: { id: input.pendingId }, data: details }),
      prisma.user.update({ where: { id: input.userId }, data: { tier: PLAN_TO_TIER[input.plan] } }),
    ]);
    return sub;
  }

  const [, sub] = await prisma.$transaction([
    // End any prior entitlement. CANCELLED rows are kept for the account page.
    prisma.subscription.updateMany({
      where: { userId: input.userId, status: { in: ["ACTIVE", "PENDING"] } },
      data: { status: "EXPIRED", cancelledAt: now },
    }),
    prisma.subscription.create({
      data: {
        userId: input.userId,
        ...details,
      },
    }),
    prisma.user.update({ where: { id: input.userId }, data: { tier: PLAN_TO_TIER[input.plan] } }),
  ]);

  return sub;
}

/** Create a PENDING checkout row (providerRef = order/session id) so the
 *  transaction history records "checkout started" for every attempt. */
export async function createPendingCheckout(input: {
  userId: string;
  plan: PlanId;
  cycle: BillingCycle;
  provider: PaymentProvider;
  providerRef: string;
  amount: number;
  currency: Currency;
}): Promise<Subscription> {
  return prisma.subscription.create({
    data: {
      userId: input.userId,
      plan: PLAN_TO_TIER[input.plan],
      cycle: input.cycle,
      status: "PENDING",
      provider: input.provider,
      providerRef: input.providerRef,
      amount: input.amount,
      currency: input.currency,
      planSnapshot: planSnapshot(input.plan),
      currentPeriodEnd: periodEnd(new Date(), input.cycle),
    },
  });
}

/** The user's billing history, newest first (all statuses). PENDING rows for
 *  abandoned checkouts (>24h old, never verified) are closed to CANCELLED so
 *  the history shows a clean progression. */
export async function listUserSubscriptions(userId: string) {
  const staleThreshold = new Date(Date.now() - 24 * 60 * 60 * 1000);
  await prisma.subscription.updateMany({
    where: { userId, status: "PENDING", createdAt: { lt: staleThreshold } },
    data: { status: "EXPIRED", cancelledAt: new Date() },
  });
  return prisma.subscription.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
  });
}

/** The user's current entitlement, if any. */
export async function getCurrentSubscription(userId: string): Promise<Subscription | null> {
  return prisma.subscription.findFirst({
    where: { userId, status: "ACTIVE", currentPeriodEnd: { gte: new Date() } },
    orderBy: { createdAt: "desc" },
  });
}

/** A user whose ACTIVE sub has lapsed is back to Basic — no paid perks. */
export async function syncPlanFromSubscriptions(userId: string): Promise<void> {
  const active = await getCurrentSubscription(userId);
  if (active) return;
  await prisma.user.update({ where: { id: userId }, data: { tier: "BASIC" } });
  await prisma.subscription.updateMany({
    where: { userId, status: "ACTIVE" },
    data: { status: "EXPIRED" },
  });
}

/**
 * How many mock sessions the user has started in the current billing period.
 * The period is derived from the active subscription's cycle and period end.
 */
export async function mocksUsedInPeriod(
  userId: string,
  currentPeriodEnd: Date,
  cycle: BillingCycle
): Promise<number> {
  const from = new Date(currentPeriodEnd);
  from.setMonth(from.getMonth() - MONTHS_PER_CYCLE[cycle]);
  return prisma.mockRun.count({ where: { userId, createdAt: { gte: from } } });
}

/** Milliseconds until the current period ends (UTF), for the account page. */
export function msUntilPeriodEnd(currentPeriodEnd: Date, now = new Date()): number {
  return Math.max(0, currentPeriodEnd.getTime() - now.getTime());
}

/** True when the account should be treated as the paid plan right now. */
export function isActive(sub: Subscription | null, now = new Date()): boolean {
  return (
    sub != null &&
    sub.status === "ACTIVE" &&
    sub.currentPeriodEnd.getTime() > now.getTime()
  );
}