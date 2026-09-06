import { prisma } from "@/lib/db";
import { jsonError, jsonOk } from "@/lib/api";
import { activateSubscription, planSnapshot, syncPlanFromSubscriptions } from "@/lib/billing";
import { isPlanId, type PlanId } from "@/lib/plans";

/**
 * Admin manual-upgrade/revoke for the four plans. Requests must carry
 * `x-admin-key` matching the SEED_KEY environment variable. Grants record a
 * MANUAL subscription so the account page and billing history stay truthful,
 * and the same atomic grant path is used as for paid checkouts.
 *
 *   POST / with no body    -> reset every account to Basic
 *   POST / {email, plan, cycle} -> grant that plan (default MONTHLY)
 *   DELETE / {email}       -> revoke: back to Basic, entitlements ended
 */
export async function handlePlanAdmin(request: Request): Promise<Response> {
  const key = request.headers.get("x-admin-key");
  if (!process.env.SEED_KEY || key !== process.env.SEED_KEY) {
    return jsonError("Forbidden", 403);
  }

  // Reset: clear every account back to Basic (used during setup / tests).
  if (request.method === "DELETE" && (await request.clone().text()) === "") {
    const r = await prisma.user.updateMany({ data: { tier: "BASIC" } });
    return jsonOk({ ok: true, reset: r.count });
  }

  let body: { email?: unknown; plan?: unknown; cycle?: unknown } = {};
  try {
    body = (await request.json()) as typeof body;
  } catch {
    return jsonError("Invalid JSON body", 400);
  }

  const email = typeof body.email === "string" ? body.email.trim().toLowerCase() : "";
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return jsonError("A valid email is required", 400);
  }

  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) return jsonError("No account found with that email", 404);

  // Revoke: expire entitlements and drop to Basic.
  if (request.method === "DELETE") {
    await prisma.$transaction([
      prisma.subscription.updateMany({
        where: { userId: user.id, status: { in: ["ACTIVE", "PENDING"] } },
        data: { status: "EXPIRED", cancelledAt: new Date() },
      }),
      prisma.user.update({ where: { id: user.id }, data: { tier: "BASIC" } }),
    ]);
    return jsonOk({ ok: true, email, plan: "BASIC", revoked: true });
  }

  const plan = typeof body.plan === "string" && isPlanId(body.plan) ? (body.plan as PlanId) : null;
  if (!plan) return jsonError("plan must be BASIC, PREMIUM, PREMIUM_PLUS or ROYAL", 400);
  if (plan === "BASIC") {
    await syncPlanFromSubscriptions(user.id);
    return jsonOk({ ok: true, email, plan: "BASIC", reverted: true });
  }

  const cycle = body.cycle === "YEARLY" ? "YEARLY" : "MONTHLY";

  const subscription = await activateSubscription({
    userId: user.id,
    plan,
    cycle,
    provider: "MANUAL",
    providerRef: `admin:${Date.now()}`,
  });

  return jsonOk({
    ok: true,
    email,
    plan,
    cycle,
    subscription: {
      id: subscription.id,
      status: subscription.status,
      currentPeriodEnd: subscription.currentPeriodEnd,
      snapshot: planSnapshot(plan),
    },
  });
}