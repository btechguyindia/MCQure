// ── Runtime plan enforcement ─────────────────────────────────────────────────
//
// Where limits/features are actually enforced (not just advertised): daily
// question caps, monthly mock caps, and premium-only modules. Reads come from
// the plan catalog; the current period is taken from the user's Subscription
// when one exists, otherwise the account is treated as Basic for today.

import type { User } from "@prisma/client";
import type { NextResponse } from "next/server";
import { jsonError } from "@/lib/api";
import { getCurrentSubscription, isActive, mocksUsedInPeriod } from "@/lib/billing";
import { PLANS, type PlanFeature, type PlanId } from "@/lib/plans";
import { prisma } from "@/lib/db";

export interface EntitledUser {
  tier: PlanId;
  features: Set<PlanFeature>;
}

export async function entitledPlan(user: User): Promise<EntitledUser> {
  const sub = await getCurrentSubscription(user.id);
  const effective: PlanId = sub != null && isActive(sub) ? (sub.plan as PlanId) : "BASIC";
  return { tier: effective, features: new Set(PLANS[effective].features) };
}

/**
 * Rejects (403) when the user's plan does not include the feature; returns the
 * user object otherwise so handlers can flow through cleanly.
 */
export async function requireFeature(
  user: User,
  feature: PlanFeature
): Promise<User | NextResponse> {
  const plan = await entitledPlan(user);
  if (!plan.features.has(feature)) {
    return jsonError("This feature requires an upgraded plan", 403);
  }
  return user;
}

/** Daily question ceiling for the account (null = unlimited). */
export async function dailyQuestionsRemaining(user: User): Promise<number | null> {
  const plan = await entitledPlan(user);
  const cap = PLANS[plan.tier].limits.dailyQuestions;
  if (cap === null) return null;

  const start = new Date();
  start.setHours(0, 0, 0, 0);
  const used = await prisma.attempt.count({
    where: { userId: user.id, createdAt: { gte: start } },
  });
  return Math.max(0, cap - used);
}

/** Mock sessions left this billing period (null = unlimited). */
export async function mocksRemaining(user: User): Promise<number | null> {
  const plan = await entitledPlan(user);
  const cap = PLANS[plan.tier].limits.mocksPerMonth;
  if (cap === null) return null;

  const sub = await getCurrentSubscription(user.id);
  const cycle = sub?.cycle ?? "MONTHLY";
  const used = await mocksUsedInPeriod(user.id, sub?.currentPeriodEnd ?? new Date(), cycle);
  return Math.max(0, cap - used);
}