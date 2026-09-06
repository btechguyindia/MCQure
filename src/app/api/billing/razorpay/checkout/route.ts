import Razorpay from "razorpay";
import { getCurrentUser, isNextResponse, jsonError, jsonOk } from "@/lib/api";
import { createPendingCheckout } from "@/lib/billing";
import { checkoutSchema } from "@/lib/validation";
import { isRazorpayConfigured, RAZORPAY_KEY_ID, RAZORPAY_KEY_SECRET, resolveCheckout } from "@/lib/payments";

// Razorpay order creation. The client opens the Razorpay checkout modal with
// the returned order_id and pays; the verify endpoint confirms the payment.
// Amounts come from the central plan catalog — never from the request body.
export async function POST(request: Request) {
  const user = await getCurrentUser();
  if (isNextResponse(user)) return user;
  if (!user) return jsonError("Authentication required", 401);

  if (!isRazorpayConfigured()) {
    return jsonError(
      "Razorpay is not configured. Set RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET in .env to enable paid plans.",
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

  const client = new Razorpay({ key_id: RAZORPAY_KEY_ID, key_secret: RAZORPAY_KEY_SECRET });

  const order = await client.orders.create({
    amount: checkout.amountMinor,
    currency: checkout.currency,
    receipt: `${user.id.slice(0, 12)}-${checkout.plan}-${checkout.cycle}-${Date.now()}`,
    notes: {
      plan: checkout.plan,
      cycle: checkout.cycle,
      currency: checkout.currency,
      userId: user.id,
    },
  });

  // Record the attempt so the transaction history shows "checkout started".
  const pending = await createPendingCheckout({
    userId: user.id,
    plan: checkout.plan,
    cycle: checkout.cycle,
    provider: "RAZORPAY",
    providerRef: order.id,
    amount: checkout.amountUnits,
    currency: checkout.currency,
  });

  return jsonOk({
    plan: checkout.plan,
    cycle: checkout.cycle,
    currency: checkout.currency,
    amountMinor: order.amount,
    keyId: RAZORPAY_KEY_ID,
    orderId: order.id,
    pendingId: pending.id,
  });
}