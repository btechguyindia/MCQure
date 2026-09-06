import { getCurrentUser, jsonError } from "@/lib/api";
import { getCurrentSubscription, isActive as isSubscriptionActive, msUntilPeriodEnd } from "@/lib/billing";

export async function GET() {
  const user = await getCurrentUser();
  if (!user) {
    return jsonError("Authentication required", 401);
  }

  const sub = await getCurrentSubscription(user.id);
  const active = sub != null && isSubscriptionActive(sub);

  return Response.json({
    ok: true,
    user: {
      id: user.id,
      email: user.email,
      name: user.name,
      plan: user.tier,
    },
    subscription: sub
      ? {
          plan: sub.plan,
          cycle: sub.cycle,
          status: sub.status,
          provider: sub.provider,
          currentPeriodEnd: sub.currentPeriodEnd.toISOString(),
          msUntilPeriodEnd: msUntilPeriodEnd(sub.currentPeriodEnd),
          active,
        }
      : null,
  });
}
