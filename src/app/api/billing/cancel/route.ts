import { getCurrentUser, isNextResponse, jsonError, jsonOk } from "@/lib/api";
import { getCurrentSubscription } from "@/lib/billing";
import { prisma } from "@/lib/db";

// Cancel the user's active subscription. This stops auto-renewal: the user
// keeps access until the current period ends, then the plan reverts to Basic.
// This does NOT request a refund — that's handled via support/email.
export async function POST() {
  const user = await getCurrentUser();
  if (isNextResponse(user)) return user;
  if (!user) return jsonError("Authentication required", 401);

  const sub = await getCurrentSubscription(user.id);
  if (!sub) {
    return jsonError("No active subscription to cancel", 400);
  }

  const now = new Date();
  await prisma.subscription.update({
    where: { id: sub.id },
    data: {
      status: "CANCELLED",
      cancelledAt: now,
    },
  });

  // The user keeps access until currentPeriodEnd; tier is synced
  // automatically when the period lapses (via syncPlanFromSubscriptions or
  // the next entitledPlan check).

  return jsonOk({
    cancelled: true,
    currentPeriodEnd: sub.currentPeriodEnd.toISOString(),
    message: "Subscription cancelled. Access continues until " + sub.currentPeriodEnd.toLocaleDateString() + ".",
  });
}
