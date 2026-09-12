"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  PLANS,
  PLAN_ORDER,
  BILLING_CYCLES,
  CURRENCIES,
  FEATURE_CATALOG,
  formatPrice,
  monthlyEquivalent,
  yearlySavingPercent,
  type BillingCycle,
  type Currency,
  type PlanFeature,
  type PlanId,
} from "@/lib/plans";
import { CheckIcon, HelpIcon, MailIcon, SparklesIcon } from "@/components/icons";
import { TestCheckoutModal } from "@/components/TestCheckoutModal";
import { InquiryModal } from "@/components/InquiryModal";

interface Props {
  currentPlan: PlanId | null;
  providers: { razorpay: boolean; stripe: boolean };
  /** Logged-in user for inquiry prefilling (null when signed out). */
  user: { name: string; email: string } | null;
  /** When false, the simulated test checkout is hidden (production only). */
  testMode: boolean;
}

interface CheckoutResponse {
  ok: boolean;
  plan?: PlanId;
  cycle?: BillingCycle;
  currency?: Currency;
  amountMinor?: number;
  keyId?: string;
  orderId?: string;
  url?: string;
  publishableKey?: string;
  message?: string;
  testMode?: boolean;
}

declare global {
  interface Window {
    Razorpay?: new (opts: {
      key: string;
      amount: number;
      currency: string;
      name: string;
      description: string;
      order_id: string;
      handler: (res: { razorpay_payment_id: string; razorpay_signature: string; razorpay_order_id: string }) => void;
      modal: { ondismiss: () => void };
    }) => { open: () => void };
  }
}

const FEATURE_LABELS: Record<PlanFeature, string> = Object.fromEntries(
  FEATURE_CATALOG.map((f) => [f.id, f.label])
) as Record<PlanFeature, string>;

/** Load the Razorpay checkout SDK on demand, resolving when it's ready. */
function loadRazorpaySdk(): Promise<void> {
  return new Promise((resolve, reject) => {
    if (typeof window.Razorpay === "function") {
      resolve();
      return;
    }
    if (document.getElementById("razorpay-sdk")) {
      document
        .getElementById("razorpay-sdk")!
        .addEventListener("load", () => resolve(), { once: true });
      return;
    }
    const script = document.createElement("script");
    script.id = "razorpay-sdk";
    script.src = "https://checkout.razorpay.com/v1/checkout.js";
    script.onload = () => resolve();
    script.onerror = () => reject(new Error("Could not load the Razorpay SDK"));
    document.head.appendChild(script);
  });
}

/** Show features grouped: essentials first, then advanced, then exclusive. */
const FEATURE_GROUPS: { heading: string; features: PlanFeature[] }[] = [
  {
    heading: "Core",
    features: ["questions_unlimited", "mock_tests", "pyq_bank", "prep_health"],
  },
  {
    heading: "Learning tools",
    features: ["learning_priority", "weakness_engine", "study_timetable", "unlimited_bookmarks"],
  },
  {
    heading: "AI & Analytics",
    features: ["ai_explanations", "ai_mock_analysis", "advanced_analytics", "reports_export"],
  },
  {
    heading: "Exclusive",
    features: ["moderation", "exclusive_theme", "custom_study_plan", "priority_support"],
  },
];

export function PricingCards({ currentPlan, providers, user, testMode }: Props) {
  const router = useRouter();
  const [cycle, setCycle] = useState<BillingCycle>("MONTHLY");
  const [currency, setCurrency] = useState<Currency>("INR");
  const [busy, setBusy] = useState<PlanId | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [testFor, setTestFor] = useState<PlanId | null>(null);
  const [inquiryOpen, setInquiryOpen] = useState(false);

  const anyProvider = providers.razorpay || providers.stripe;

  async function startCheckout(plan: PlanId, provider: "razorpay" | "stripe") {
    setError(null);
    setBusy(plan);
    try {
      const res = await fetch(`/api/billing/${provider}/checkout`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ plan, cycle, currency }),
      });
      const data = (await res.json()) as CheckoutResponse;
      if (!res.ok || !data.ok) {
        throw new Error(data.message ?? "Checkout could not be started");
      }

      if (provider === "stripe" && data.url) {
        window.location.assign(data.url);
        return;
      }

      if (provider === "razorpay" && data.orderId && data.keyId) {
        await loadRazorpaySdk();
        if (typeof window.Razorpay !== "function") {
          throw new Error("Razorpay SDK could not be loaded");
        }
        const rzp = new window.Razorpay({
          key: data.keyId,
          amount: data.amountMinor ?? 0,
          currency: data.currency ?? "INR",
          name: "MCQure",
          description: `${PLANS[plan].name} — ${cycle === "YEARLY" ? "yearly" : "monthly"}`,
          order_id: data.orderId,
          handler: async (res) => {
            const verify = await fetch("/api/billing/razorpay/verify", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                razorpay_order_id: res.razorpay_order_id,
                razorpay_payment_id: res.razorpay_payment_id,
                razorpay_signature: res.razorpay_signature,
                plan,
                cycle,
                currency,
              }),
            });
            const v = (await verify.json()) as { ok: boolean; message?: string };
            if (!verify.ok || !v.ok) {
              setError(v.message ?? "Payment verification failed. Contact support with your payment ID.");
              return;
            }
            router.push("/settings?payment=success");
            router.refresh();
          },
          modal: { ondismiss: () => setBusy(null) },
        });
        rzp.open();
        return;
      }

      throw new Error(
        data.message ??
          (provider === "razorpay"
            ? "Razorpay is not configured — add RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET to .env"
            : "Stripe is not configured — add STRIPE_SECRET_KEY to .env")
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : "Checkout failed");
      setBusy(null);
    }
  }

  return (
    <div className="flex flex-col gap-6">
      {/* Controls */}
      <div className="flex flex-wrap items-center justify-center gap-3">
        <div className="flex items-center gap-1 rounded-2xl border border-line bg-card p-1">
          {CURRENCIES.map((c) => (
            <button
              key={c}
              type="button"
              onClick={() => setCurrency(c)}
              className={`rounded-xl px-4 py-1.5 text-sm font-semibold transition-colors ${
                currency === c ? "bg-brand text-on-brand" : "text-muted-fg hover:text-ink"
              }`}
            >
              {c === "INR" ? "₹ INR" : "$ USD"}
            </button>
          ))}
        </div>
        <div className="flex items-center gap-1 rounded-2xl border border-line bg-card p-1">
          {BILLING_CYCLES.map((c) => (
            <button
              key={c}
              type="button"
              onClick={() => setCycle(c)}
              className={`rounded-xl px-4 py-1.5 text-sm font-semibold transition-colors ${
                cycle === c ? "bg-brand text-on-brand" : "text-muted-fg hover:text-ink"
              }`}
            >
              {c === "MONTHLY" ? "Monthly" : "Yearly"}
              {c === "YEARLY" ? (
                <span className="ml-1.5 rounded-full bg-warn-soft px-1.5 py-0.5 text-[0.6rem] font-bold text-warn">
                  −{yearlySavingPercent("PREMIUM")}%
                </span>
              ) : null}
            </button>
          ))}
        </div>
        <button
          type="button"
          onClick={() => setInquiryOpen(true)}
          className="inline-flex items-center gap-1.5 rounded-xl border border-line bg-card px-3 py-2 text-xs font-semibold text-muted-fg transition-colors hover:text-ink"
        >
          <HelpIcon className="h-3.5 w-3.5" />
          Raise an inquiry
        </button>
      </div>

      {error ? (
        <p role="alert" className="mx-auto max-w-xl rounded-2xl border border-bad/30 bg-bad-soft px-4 py-3 text-sm text-bad">
          {error}
        </p>
      ) : null}

      {/* Plan cards */}
      <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-4">
        {PLAN_ORDER.map((planId) => {
          const plan = PLANS[planId];
          const total = plan.prices[cycle][currency];
          const isCurrent = currentPlan != null && currentPlan === planId;
          const isBasic = planId === "BASIC";
          const featured = planId === "PREMIUM_PLUS";

          const planFeatures = new Set(plan.features);
          const visibleGroups = FEATURE_GROUPS.filter((g) =>
            g.features.some((f) => planFeatures.has(f))
          );

          return (
            <section
              key={planId}
              className={`card relative flex flex-col p-6 ${
                featured ? "!border-brand ring-2 ring-brand/20" : ""
              } ${isCurrent ? "!border-ok/50" : ""}`}
            >
              {(featured || isCurrent) ? (
                <div className="absolute -top-3 left-1/2 flex -translate-x-1/2 gap-1.5 whitespace-nowrap">
                  {isCurrent ? (
                    <span className="rounded-full bg-ok px-3 py-1 text-[0.65rem] font-bold uppercase tracking-wider text-on-brand">
                      Your plan
                    </span>
                  ) : null}
                  {featured ? (
                    <span className="rounded-full bg-brand px-3 py-1 text-[0.65rem] font-bold uppercase tracking-wider text-on-brand">
                      Most popular
                    </span>
                  ) : null}
                </div>
              ) : null}

              {/* Plan header */}
              <header className="text-center">
                <h3 className="flex items-center justify-center gap-2 text-lg font-bold tracking-tight">
                  {plan.name}
                  {planId === "ROYAL" ? (
                    <span className="text-lg" aria-label="Royal">
                      👑
                    </span>
                  ) : null}
                </h3>
                <p className="mt-1 text-xs leading-relaxed text-muted-fg">{plan.tagline}</p>
              </header>

              {/* Price */}
              <div className="mt-5 text-center">
                <div className="flex items-baseline justify-center gap-1">
                  <span className="text-4xl font-black tracking-tight">
                    {formatPrice(total, currency)}
                  </span>
                  {!isBasic ? (
                    <span className="text-sm text-subtle-fg">
                      / {cycle === "MONTHLY" ? "mo" : "yr"}
                    </span>
                  ) : null}
                </div>
                {!isBasic ? (
                  <p className="mt-1 text-xs text-subtle-fg">
                    {cycle === "YEARLY"
                      ? `${formatPrice(monthlyEquivalent(planId, "YEARLY", currency), currency)}/mo billed yearly`
                      : `Billed monthly${plan.yearlyPerk ? `. Yearly = ${plan.yearlyPerk}` : ""}`}
                  </p>
                ) : (
                  <p className="mt-1 text-xs text-subtle-fg">Free forever</p>
                )}
              </div>

              {/* Key limits */}
              <div className="mt-4 flex flex-wrap items-center justify-center gap-2">
                {plan.limits.dailyQuestions != null ? (
                  <span className="rounded-full border border-line bg-canvas px-3 py-1 text-xs font-medium text-muted-fg">
                    {plan.limits.dailyQuestions} questions/day
                  </span>
                ) : (
                  <span className="rounded-full border border-ok/30 bg-ok-soft px-3 py-1 text-xs font-medium text-ok">
                    Unlimited questions
                  </span>
                )}
                {plan.limits.mocksPerMonth != null ? (
                  <span className="rounded-full border border-line bg-canvas px-3 py-1 text-xs font-medium text-muted-fg">
                    {plan.limits.mocksPerMonth} mocks/mo
                  </span>
                ) : planId !== "BASIC" ? (
                  <span className="rounded-full border border-ok/30 bg-ok-soft px-3 py-1 text-xs font-medium text-ok">
                    Unlimited mocks
                  </span>
                ) : null}
              </div>

              {/* Features grouped */}
              <div className="mt-5 flex flex-1 flex-col gap-3">
                {visibleGroups.map((group) => {
                  const items = group.features.filter((f) => planFeatures.has(f));
                  if (items.length === 0) return null;
                  return (
                    <div key={group.heading}>
                      <p className="mb-1 text-[0.6rem] font-bold uppercase tracking-widest text-subtle-fg">
                        {group.heading}
                      </p>
                      <ul className="flex flex-col gap-1.5">
                        {items.map((f) => (
                          <li key={f} className="flex items-center gap-2 text-sm">
                            <span className="flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-ok-soft text-ok">
                              <CheckIcon className="h-2.5 w-2.5" />
                            </span>
                            {FEATURE_LABELS[f] ?? f}
                          </li>
                        ))}
                      </ul>
                    </div>
                  );
                })}
              </div>

              {/* CTA */}
              <div className="mt-6">
                {isBasic ? (
                  <Link
                    href={currentPlan ? "/practice" : "/register"}
                    className="btn btn-secondary w-full"
                  >
                    {currentPlan ? "Start practising" : "Get started free"}
                  </Link>
                ) : isCurrent ? (
                  <div className="flex flex-col gap-2">
                    <button
                      type="button"
                      disabled
                      className="btn btn-ghost w-full opacity-70"
                      aria-disabled="true"
                    >
                      Your current plan
                    </button>
                    <button
                      type="button"
                      onClick={() => setInquiryOpen(true)}
                      className="btn btn-secondary w-full text-xs"
                    >
                      <MailIcon className="h-3.5 w-3.5" />
                      Feedback · Raise an inquiry
                    </button>
                  </div>
                ) : anyProvider ? (
                  <div className="flex flex-col gap-2">
                    {providers.razorpay ? (
                      <button
                        type="button"
                        disabled={busy === planId}
                        onClick={() => startCheckout(planId, "razorpay")}
                        className="btn btn-primary w-full"
                      >
                        {busy === planId ? (
                          <span className="flex items-center justify-center gap-2">
                            <span className="h-4 w-4 animate-spin rounded-full border-2 border-on-brand border-t-transparent" />
                            Opening…
                          </span>
                        ) : (
                          `Pay with Razorpay · ${formatPrice(total, currency)}`
                        )}
                      </button>
                    ) : null}
                    {providers.stripe ? (
                      <button
                        type="button"
                        disabled={busy === planId}
                        onClick={() => startCheckout(planId, "stripe")}
                        className="btn btn-secondary w-full"
                      >
                        {busy === planId ? (
                          <span className="flex items-center justify-center gap-2">
                            <span className="h-4 w-4 animate-spin rounded-full border-2 border-ink border-t-transparent" />
                            Opening…
                          </span>
                        ) : (
                          `Pay with Stripe · ${formatPrice(total, currency)}`
                        )}
                      </button>
                    ) : null}
                    {testMode ? (
                      <button
                        type="button"
                        disabled={busy === planId}
                        onClick={() => {
                          setError(null);
                          setTestFor(planId);
                        }}
                        className="btn btn-ghost w-full text-[0.7rem]"
                      >
                        <SparklesIcon className="h-3.5 w-3.5 text-brand" />
                        Try the test checkout
                      </button>
                    ) : null}
                  </div>
                ) : (
                  <div className="flex flex-col gap-2">
                    {testMode ? (
                      <>
                        <button
                          type="button"
                          onClick={() => {
                            setError(null);
                            setTestFor(planId);
                          }}
                          className="btn btn-primary w-full"
                        >
                          <SparklesIcon className="h-4 w-4" />
                          Try the test checkout
                        </button>
                        <p className="text-center text-[0.65rem] text-subtle-fg">
                          Payment providers are not configured yet — this plays a simulated gateway.
                        </p>
                      </>
                    ) : (
                      <p className="text-center text-xs text-muted-fg">
                        Online payments are not configured yet — contact us to upgrade.
                      </p>
                    )}
                    <button
                      type="button"
                      onClick={() => setInquiryOpen(true)}
                      className="btn btn-secondary w-full text-xs"
                    >
                      <MailIcon className="h-3.5 w-3.5" />
                      Contact admin to upgrade
                    </button>
                  </div>
                )}
              </div>
            </section>
          );
        })}
      </div>

      {testFor ? (
        <TestCheckoutModal
          plan={testFor}
          planName={PLANS[testFor].name}
          cycle={cycle}
          currency={currency}
          amount={PLANS[testFor].prices[cycle][currency]}
          onClose={() => setTestFor(null)}
        />
      ) : null}

      {inquiryOpen ? (
        <InquiryModal
          user={user}
          plan={currentPlan}
          onClose={() => setInquiryOpen(false)}
        />
      ) : null}
    </div>
  );
}