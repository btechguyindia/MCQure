import { getCurrentUser, isNextResponse, jsonError, jsonOk } from "@/lib/api";
import { checkoutSchema } from "@/lib/validation";
import { resolveCheckout, testCheckoutEnabled } from "@/lib/payments";
import { activateSubscription } from "@/lib/billing";
import { prisma } from "@/lib/db";

// Local test fulfilment: turns a simulated checkout into a real subscription
// record tagged provider=MANUAL (ref "test:<checkoutId>") when the user picks
// "simulate successful payment". Choosing failure just errors — no grant.
// Disabled outside test mode.
export async function POST(request: Request) {
  if (!testCheckoutEnabled()) {
    return jsonError("The test checkout is disabled in this environment", 403);
  }

  const user = await getCurrentUser();
  if (isNextResponse(user)) return user;
  if (!user) return jsonError("Authentication required", 401);

  let body: { plan?: unknown; cycle?: unknown; currency?: unknown; checkoutId?: unknown; simulate?: unknown };
  try {
    body = await request.json();
  } catch {
    return jsonError("Invalid JSON body", 400);
  }

  if (body.simulate === "failed") {
    return jsonError("Simulated payment declined by the test gateway", 400);
  }

  const checkoutId = typeof body.checkoutId === "string" && body.checkoutId.startsWith("test-") ? body.checkoutId : "";
  if (!checkoutId) {
    return jsonError("Invalid test checkout", 400);
  }

  const parsed = checkoutSchema.safeParse({ plan: body.plan, cycle: body.cycle, currency: body.currency });
  if (!parsed.success) {
    return jsonError("Invalid plan details", 400);
  }

  const checkout = resolveCheckout(parsed.data);

  try {
    // Upgrade the PENDING row created by the test checkout, if present.
    const pending = await prisma.subscription.findFirst({
      where: { userId: user.id, provider: "MANUAL", providerRef: checkoutId, status: "PENDING" },
    });

    const subscription = await activateSubscription({
      userId: user.id,
      plan: checkout.plan,
      cycle: checkout.cycle,
      provider: "MANUAL",
      providerRef: checkoutId,
      amount: checkout.amountUnits,
      currency: checkout.currency,
      pendingId: pending?.id,
    });

    return jsonOk({ activated: true, testMode: true, subscription });
  } catch {
    return jsonError("Could not complete the test payment — please retry", 500);
  }
}