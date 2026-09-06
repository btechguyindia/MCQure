import Stripe from "stripe";
import { getCurrentUser, isNextResponse, jsonError, jsonOk } from "@/lib/api";
import { createPendingCheckout } from "@/lib/billing";
import { checkoutSchema } from "@/lib/validation";
import { appBaseUrl, isStripeConfigured, resolveCheckout, STRIPE_PUBLISHABLE_KEY, STRIPE_SECRET_KEY } from "@/lib/payments";

// Stripe Checkout. Creates a hosted one-time payment session for the chosen
// term; the webhook activates the plan only after payment succeeds.
// Renewals for later terms are bought as fresh sessions (or granted manually),
// which keeps this self-contained without dashboard-managed products/prices.
export async function POST(request: Request) {
  const user = await getCurrentUser();
  if (isNextResponse(user)) return user;
  if (!user) return jsonError("Authentication required", 401);

  if (!isStripeConfigured()) {
    return jsonError(
      "Stripe is not configured. Set STRIPE_SECRET_KEY in .env to enable paid plans.",
      503
    );
  }

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

  const stripe = new Stripe(STRIPE_SECRET_KEY);
  const base = appBaseUrl();

  const session = await stripe.checkout.sessions.create({
    mode: "payment",
    client_reference_id: user.id,
    metadata: {
      plan: checkout.plan,
      cycle: checkout.cycle,
      currency: checkout.currency,
      userId: user.id,
    },
    line_items: [
      {
        price_data: {
          currency: checkout.currency.toLowerCase(),
          unit_amount: checkout.amountMinor,
          product_data: {
            name: checkout.descriptor,
            description: `MCQure ${checkout.plan.replace("_", " ")} plan`,
          },
        },
        quantity: 1,
      },
    ],
    success_url: `${base}/settings?payment=success&provider=stripe&plan=${checkout.plan}`,
    cancel_url: `${base}/pricing?cancelled=1`,
  });

  // Record the attempt so the transaction history shows "checkout started".
  const pending = await createPendingCheckout({
    userId: user.id,
    plan: checkout.plan,
    cycle: checkout.cycle,
    provider: "STRIPE",
    providerRef: session.id,
    amount: checkout.amountUnits,
    currency: checkout.currency,
  });

  return jsonOk({
    sessionId: session.id,
    url: session.url,
    publishableKey: STRIPE_PUBLISHABLE_KEY,
    plan: checkout.plan,
    cycle: checkout.cycle,
    pendingId: pending.id,
  });
}