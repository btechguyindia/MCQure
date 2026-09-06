"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { formatPrice, type BillingCycle, type Currency, type PlanId } from "@/lib/plans";
import { CloseIcon, CheckIcon } from "@/components/icons";

interface Props {
  plan: PlanId;
  planName: string;
  cycle: BillingCycle;
  currency: Currency;
  amount: number;
  onClose: () => void;
}

type Gateway = "razorpay" | "stripe";

const TEST_CARDS: Record<Gateway, { label: string; value: string; hint: string }> = {
  razorpay: {
    label: "Razorpay test card",
    value: "4111 1111 1111 1111",
    hint: "Use UPI test ID user@razorpay or test card 4111111111111111",
  },
  stripe: {
    label: "Stripe test card",
    value: "4242 4242 4242 4242",
    hint: "4242 4242 4242 4242 · any future expiry · any CVC",
  },
};

export function TestCheckoutModal({ plan, planName, cycle, currency, amount, onClose }: Props) {
  const router = useRouter();
  const [gateway, setGateway] = useState<Gateway>("razorpay");
  const [card, setCard] = useState(TEST_CARDS.razorpay.value);
  const [expiry, setExpiry] = useState("12/29");
  const [cvc, setCvc] = useState("123");
  const [step, setStep] = useState<"form" | "processing" | "done">("form");
  const [failed, setFailed] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function run(simulate: "success" | "failed") {
    setError(null);
    setFailed(false);
    setStep("processing");

    // Tolerate empty/non-JSON bodies from the server (cold starts, 5xx)
    // instead of crashing with "Unexpected end of JSON input".
    const readJson = async (res: Response) => {
      try {
        return (await res.json()) as { ok?: boolean; message?: string; checkoutId?: string };
      } catch {
        return { ok: false, message: "The server returned an empty response — please try again." };
      }
    };

    try {
      const res = await fetch("/api/billing/test/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ plan, cycle, currency }),
      });
      const order = await readJson(res);
      if (!res.ok || !order.ok || !order.checkoutId) {
        throw new Error(order.message ?? "Could not create test checkout");
      }

      await new Promise((r) => setTimeout(r, 1400));

      if (simulate === "failed") {
        setStep("form");
        setFailed(true);
        setError("Payment declined by the test gateway. The card was not charged.");
        return;
      }

      const verify = await fetch("/api/billing/test/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          checkoutId: order.checkoutId,
          plan,
          cycle,
          currency,
          simulate,
        }),
      });
      const v = await readJson(verify);
      if (!verify.ok || !v.ok) {
        throw new Error(v.message ?? "Test verification failed");
      }

      setStep("done");
      setTimeout(() => {
        router.push("/settings?payment=success&provider=" + gateway);
        router.refresh();
      }, 900);
    } catch (err) {
      setStep("form");
      setError(err instanceof Error ? err.message : "Checkout failed");
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-black/50 p-4 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      aria-label="Test payment"
      onClick={onClose}
    >
      <div className="w-full max-w-md rounded-3xl border border-line bg-card p-6 shadow-2xl" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between">
          <div>
            <p className="text-[0.65rem] font-bold uppercase tracking-widest text-warn">
              Test mode — no real charge
            </p>
            <h3 className="mt-1 text-lg font-bold tracking-tight">Pay with {gateway === "razorpay" ? "Razorpay" : "Stripe"}</h3>
          </div>
          <button type="button" onClick={onClose} className="rounded-xl p-1.5 text-muted-fg hover:bg-canvas hover:text-ink" aria-label="Close">
            <CloseIcon className="h-5 w-5" />
          </button>
        </div>

        {step === "done" ? (
          <div className="mt-6 flex flex-col items-center gap-3 py-8 text-center">
            <span className="flex h-12 w-12 items-center justify-center rounded-full bg-ok-soft text-ok">
              <CheckIcon className="h-6 w-6" />
            </span>
            <p className="font-semibold">Payment successful!</p>
            <p className="text-sm text-muted-fg">Activating your {planName} plan…</p>
          </div>
        ) : (
          <>
            <div className="mt-5 rounded-2xl border border-line bg-canvas px-4 py-3 text-sm">
              <div className="flex items-center justify-between">
                <span className="text-muted-fg">Order summary</span>
                <span className="text-xs text-subtle-fg">
                  {cycle === "YEARLY" ? "Yearly" : "Monthly"} · {formatPrice(amount, currency)}
                </span>
              </div>
            </div>

            <div className="mt-3 flex gap-2">
              {(Object.keys(TEST_CARDS) as Gateway[]).map((g) => (
                <button
                  key={g}
                  type="button"
                  onClick={() => {
                    setGateway(g);
                    setCard(TEST_CARDS[g].value);
                  }}
                  className={`rounded-xl border px-3 py-2 text-xs font-semibold transition-colors ${
                    gateway === g ? "border-brand bg-brand-soft text-brand" : "border-line text-muted-fg hover:text-ink"
                  }`}
                >
                  {g === "razorpay" ? "Razorpay" : "Stripe"}
                </button>
              ))}
            </div>

            <div className="mt-4 flex flex-col gap-3">
              <div>
                <label className="text-xs font-semibold text-muted-fg">Card number</label>
                <input
                  value={card}
                  onChange={(e) => setCard(e.target.value)}
                  inputMode="numeric"
                  className="mt-1 w-full rounded-xl border border-line bg-canvas px-3 py-2 text-sm focus:border-brand focus:outline-none"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-muted-fg">Expiry</label>
                  <input
                    value={expiry}
                    onChange={(e) => setExpiry(e.target.value)}
                    className="mt-1 w-full rounded-xl border border-line bg-canvas px-3 py-2 text-sm focus:border-brand focus:outline-none"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-muted-fg">CVC</label>
                  <input
                    value={cvc}
                    onChange={(e) => setCvc(e.target.value)}
                    inputMode="numeric"
                    className="mt-1 w-full rounded-xl border border-line bg-canvas px-3 py-2 text-sm focus:border-brand focus:outline-none"
                  />
                </div>
              </div>
              <p className="text-[0.7rem] text-subtle-fg">{TEST_CARDS[gateway].hint}</p>
            </div>

            {failed ? (
              <p role="alert" className="mt-3 rounded-xl border border-bad/30 bg-bad-soft px-3 py-2 text-xs text-bad">
                {error ?? "Payment declined."}
              </p>
            ) : error ? (
              <p role="alert" className="mt-3 rounded-xl border border-bad/30 bg-bad-soft px-3 py-2 text-xs text-bad">
                {error}
              </p>
            ) : null}

            <div className="mt-5 flex flex-col gap-2">
              <button
                type="button"
                disabled={step === "processing"}
                onClick={() => run("success")}
                className="btn btn-primary w-full"
              >
                {step === "processing" ? (
                  <span className="flex items-center justify-center gap-2">
                    <span className="h-4 w-4 animate-spin rounded-full border-2 border-on-brand border-t-transparent" />
                    Processing…
                  </span>
                ) : (
                  `Pay ${formatPrice(amount, currency)}`
                )}
              </button>
              <button
                type="button"
                disabled={step === "processing"}
                onClick={() => run("failed")}
                className="btn btn-secondary w-full text-xs"
              >
                Simulate declined payment
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}