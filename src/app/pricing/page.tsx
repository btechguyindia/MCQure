import type { Metadata } from "next";
import Link from "next/link";
import { PricingCards } from "@/components/PricingCards";
import { getCurrentUser } from "@/lib/api";
import { getCurrentSubscription, isActive } from "@/lib/billing";
import { isRazorpayConfigured, isStripeConfigured, testCheckoutEnabled } from "@/lib/payments";
import type { PlanId } from "@/lib/plans";

export const metadata: Metadata = { title: "Pricing — MCQure" };

export default async function PricingPage() {
  const user = await getCurrentUser();
  const sub = user ? await getCurrentSubscription(user.id) : null;
  const currentPlan: PlanId = user && sub && isActive(sub) ? (sub.plan as PlanId) : "BASIC";

  return (
    <div className="mx-auto flex max-w-6xl flex-col gap-8 py-10">
      <header className="text-center">
        <p className="kicker">Plans &amp; pricing</p>
        <h1 className="mt-2 text-3xl font-bold tracking-tight">
          Pick the plan that fits your prep
        </h1>
        <p className="mx-auto mt-2 max-w-2xl text-sm text-muted-fg">
          Four plans, two currencies, monthly or yearly. Every paid plan builds
          on the one below it — Royal includes everything Premium Plus has,
          plus more. Prices are shown inclusive of terms and can be paid via
          Razorpay or Stripe.
        </p>
      </header>

      <PricingCards
        currentPlan={user ? currentPlan : null}
        providers={{ razorpay: isRazorpayConfigured(), stripe: isStripeConfigured() }}
        user={user ? { name: user.name ?? "", email: user.email } : null}
        testMode={testCheckoutEnabled()}
      />

      <footer className="mx-auto max-w-2xl text-center text-xs text-subtle-fg">
        <p>
          Payments are handled by Razorpay / Stripe — we never see your card details.
          Subscriptions auto-renew for the same term; you can stop renewing any time in
          Settings and keep access until the end of your paid period.
        </p>
        {!user ? (
          <Link className="link" href="/register">
            Create a free account
          </Link>
        ) : null}
      </footer>
    </div>
  );
}