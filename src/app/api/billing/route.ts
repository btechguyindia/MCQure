import { getCurrentUser, isNextResponse, jsonError, jsonOk } from "@/lib/api";
import { getCurrentSubscription, isActive, msUntilPeriodEnd } from "@/lib/billing";
import { entitledPlan, mocksRemaining, dailyQuestionsRemaining } from "@/lib/entitlements";
import { isRazorpayConfigured, isStripeConfigured } from "@/lib/payments";
import { PLANS } from "@/lib/plans";

export const dynamic = "force-dynamic";

// Billing / subscription status for the signed-in user. Powers the pricing
// and account pages: which plan they hold, how much of it is left this period,
// and whether each gateway is enabled.
export async function GET() {
  const user = await getCurrentUser();
  if (isNextResponse(user)) return user;
  if (!user) return jsonError("Authentication required", 401);

  const plan = await entitledPlan(user);
  const sub = await getCurrentSubscription(user.id);
  const active = sub != null && isActive(sub);

  const limit = PLANS[plan.tier].limits;
  const mocksLeft = await mocksRemaining(user);
  const questionsLeft = await dailyQuestionsRemaining(user);

  return jsonOk({
    plan: plan.tier,
    isPaid: plan.tier !== "BASIC",
    limits: limit,
    usage: {
      mocksRemainingToday: mocksLeft,
      dailyQuestionsRemaining: questionsLeft,
    },
    subscription: sub
      ? {
          plan: sub.plan,
          cycle: sub.cycle,
          status: sub.status,
          provider: sub.provider,
          providerRef: sub.providerRef,
          amount: sub.amount,
          currency: sub.currency,
          currentPeriodEnd: sub.currentPeriodEnd.toISOString(),
          msUntilPeriodEnd: msUntilPeriodEnd(sub.currentPeriodEnd),
          active,
        }
      : null,
    providers: {
      razorpay: isRazorpayConfigured(),
      stripe: isStripeConfigured(),
    },
  });
}