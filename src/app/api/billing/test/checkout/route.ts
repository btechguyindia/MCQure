import { randomUUID } from "node:crypto";
import { getCurrentUser, isNextResponse, jsonError, jsonOk } from "@/lib/api";
import { createPendingCheckout } from "@/lib/billing";
import { checkoutSchema } from "@/lib/validation";
import { resolveCheckout, testCheckoutEnabled } from "@/lib/payments";

// Local test checkout (no real provider keys needed). Returns a simulated
// checkout that the client "pays" via the in-app test modal, then verifies
// against /api/billing/test/verify. Same validation + pricing as the real
// providers — only fulfilment is simulated. Disabled outside test mode so a
// production deploy can never accidentally use the simulated gateway.
export async function POST(request: Request) {
  if (!testCheckoutEnabled()) {
    return jsonError("The test checkout is disabled in this environment", 403);
  }

  const user = await getCurrentUser();
  if (isNextResponse(user)) return user;
  if (!user) return jsonError("Authentication required", 401);

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return jsonError("Invalid JSON body", 400);
  }

  const parsed = checkoutSchema.safeParse(body);
  if (!parsed.success) {
    return jsonError("Validation failed", 400, parsed.error.flatten().fieldErrors);
  }

  let checkout;
  try {
    checkout = resolveCheckout(parsed.data);
  } catch (err) {
    return jsonError(err instanceof Error ? err.message : "Invalid checkout", 400);
  }

  try {
    const checkoutId = `test-${randomUUID()}`;

    await createPendingCheckout({
      userId: user.id,
      plan: checkout.plan,
      cycle: checkout.cycle,
      provider: "MANUAL",
      providerRef: checkoutId,
      amount: checkout.amountUnits,
      currency: checkout.currency,
    });

    return jsonOk({
      testMode: true,
      checkoutId,
      plan: checkout.plan,
      cycle: checkout.cycle,
      currency: checkout.currency,
      amountMinor: checkout.amountMinor,
      amountUnits: checkout.amountUnits,
      months: checkout.months,
    });
  } catch {
    return jsonError("Could not create the test checkout — please retry", 500);
  }
}