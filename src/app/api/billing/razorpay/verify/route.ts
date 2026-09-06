import { createHmac, timingSafeEqual } from "node:crypto";
import { getCurrentUser, isNextResponse, jsonError, jsonOk } from "@/lib/api";
import { isRazorpayConfigured, RAZORPAY_KEY_SECRET, resolveCheckout } from "@/lib/payments";
import { checkoutSchema } from "@/lib/validation";
import { activateSubscription } from "@/lib/billing";
import { prisma } from "@/lib/db";

// Razorpay payment verification. Only a request with a valid HMAC signature
// (signed with our key_secret over order|payment) can activate a subscription,
// so a forged "verified" call cannot grant plans.
export async function POST(request: Request) {
  const user = await getCurrentUser();
  if (isNextResponse(user)) return user;
  if (!user) return jsonError("Authentication required", 401);

  if (!isRazorpayConfigured()) {
    return jsonError("Razorpay is not configured", 503);
  }

  let body: { plan?: unknown; cycle?: unknown; currency?: unknown; razorpay_order_id?: unknown; razorpay_payment_id?: unknown; razorpay_signature?: unknown };
  try {
    body = await request.json();
  } catch {
    return jsonError("Invalid JSON body", 400);
  }

  const { orderId, paymentId, signature } = {
    orderId: typeof body.razorpay_order_id === "string" ? body.razorpay_order_id : "",
    paymentId: typeof body.razorpay_payment_id === "string" ? body.razorpay_payment_id : "",
    signature: typeof body.razorpay_signature === "string" ? body.razorpay_signature : "",
  };
  if (!orderId || !paymentId || !signature) {
    return jsonError("Missing payment details", 400);
  }

  const planBody = checkoutSchema.safeParse({ plan: body.plan, cycle: body.cycle, currency: body.currency });
  if (!planBody.success) {
    return jsonError("Invalid plan details", 400);
  }

  // 1) Verify HMAC signature — rejects forged/incorrect callbacks.
  const expected = createHmac("sha256", RAZORPAY_KEY_SECRET)
    .update(`${orderId}|${paymentId}`)
    .digest("hex");
  const diff = Buffer.byteLength(expected) === Buffer.byteLength(signature)
    ? timingSafeEqual(Buffer.from(expected), Buffer.from(signature))
    : false;
  if (!diff) {
    return jsonError("Payment verification failed", 400);
  }

  const checkout = resolveCheckout(planBody.data);

  // 2) Idempotency: a payment_id must activate exactly once.
  const existing = await prisma.subscription.findFirst({
    where: { provider: "RAZORPAY", providerRef: paymentId },
  });
  if (existing) {
    return jsonOk({ activated: false, already: true, subscription: existing });
  }

  // Find the PENDING row created at checkout so we can upgrade it in place.
  const pending = await prisma.subscription.findFirst({
    where: { userId: user.id, provider: "RAZORPAY", providerRef: orderId, status: "PENDING" },
  });

  // 3) Activate — atomic entitlement grant.
  const subscription = await activateSubscription({
    userId: user.id,
    plan: checkout.plan,
    cycle: checkout.cycle,
    provider: "RAZORPAY",
    providerRef: paymentId,
    amount: checkout.amountUnits,
    currency: checkout.currency,
    pendingId: pending?.id,
  });

  return jsonOk({ activated: true, subscription });
}