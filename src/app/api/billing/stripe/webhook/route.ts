import Stripe from "stripe";
import { jsonError, jsonOk } from "@/lib/api";
import { isStripeConfigured, STRIPE_SECRET_KEY, STRIPE_WEBHOOK_SECRET } from "@/lib/payments";
import { activateSubscription } from "@/lib/billing";
import type { PlanId } from "@/lib/plans";
import { prisma } from "@/lib/db";

export const runtime = "nodejs";

// Stripe webhook. Stripe POSTs signed events here; the handler verifies the
// signature and only then activates a plan (from checkout metadata). Returning
// a non-2xx lets Stripe retry; activation is idempotent per checkout session.
export async function POST(request: Request) {
  if (!isStripeConfigured() || !STRIPE_WEBHOOK_SECRET) {
    return jsonError("Stripe is not configured", 503);
  }

  const payload = await request.text();
  const signature = request.headers.get("stripe-signature") ?? "";

  let event: Stripe.Event;
  const stripe = new Stripe(STRIPE_SECRET_KEY);
  try {
    event = stripe.webhooks.constructEvent(payload, signature, STRIPE_WEBHOOK_SECRET);
  } catch {
    return jsonError("Invalid webhook signature", 400);
  }

  if (event.type === "checkout.session.completed") {
    const session = event.data.object as Stripe.Checkout.Session;
    const plan = session.metadata?.plan as PlanId | undefined;
    const cycle = session.metadata?.cycle as "MONTHLY" | "YEARLY" | undefined;
    const currencyRaw = session.metadata?.currency ?? "INR";
    const userId = session.metadata?.userId;

    if (plan && cycle && userId && session.id && session.amount_total != null) {
      const currency = currencyRaw.toUpperCase() === "USD" ? "USD" : "INR";
      // Idempotent: a checkout session must activate at most once, even when
      // Stripe redelivers the event (which it does).
      const existing = await prisma.subscription.findFirst({
        where: { provider: "STRIPE", providerRef: session.id },
      });
      if (!existing) {
        // Upgrade the PENDING row created at checkout, if it still exists.
        const pending = await prisma.subscription.findFirst({
          where: { userId, provider: "STRIPE", providerRef: session.id, status: "PENDING" },
        });
        await activateSubscription({
          userId,
          plan,
          cycle,
          provider: "STRIPE",
          providerRef: session.id,
          amount: Math.round(session.amount_total / 100),
          currency,
          pendingId: pending?.id,
        });
      }
    }
  }

  return jsonOk({ received: true });
}