"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { HistoryIcon, SparklesIcon } from "@/components/icons";

interface BillingState {
  ok: boolean;
  plan: string;
  isPaid: boolean;
  limits: { dailyQuestions: number | null; mocksPerMonth: number | null; bookmarks: number | null; activeTimetables: number | null };
  usage?: { mocksRemainingToday: number | null; dailyQuestionsRemaining: number | null };
  subscription?: {
    plan: string;
    cycle: "MONTHLY" | "YEARLY";
    status: string;
    provider: string;
    providerRef?: string | null;
    amount: number;
    currency: string;
    currentPeriodEnd: string;
    msUntilPeriodEnd: number;
    active: boolean;
  } | null;
  providers?: { razorpay: boolean; stripe: boolean };
  message?: string;
}

export function fmt(amount: number, currency: string): string {
  if (amount === 0) return "Free";
  return currency === "INR" ? `₹${amount.toLocaleString("en-IN")}` : `$${amount}`;
}

function providerLabel(sub: {
  provider: string;
  providerRef?: string | null;
  amount: number;
}): string {
  if (sub.provider === "MANUAL") {
    return (sub.providerRef ?? "").startsWith("test-") ? "test grant" : "admin grant";
  }
  return sub.provider.toLowerCase();
}

function fmtDate(iso: string): string {
  return new Date(iso).toLocaleDateString(undefined, { day: "numeric", month: "short", year: "numeric" });
}

function fmtDuration(ms: number): string {
  const days = Math.ceil(ms / 86_400_000);
  if (days > 60) return `${Math.round(days / 30)} months`;
  return `${days} day${days === 1 ? "" : "s"}`;
}

function UsageBar({ label, used, total }: { label: string; used: number; total: number }) {
  const pct = total === 0 ? 0 : Math.round(((total - used) / total) * 100);
  return (
    <div className="flex flex-col gap-1">
      <div className="flex items-center justify-between text-xs">
        <span className="text-muted-fg">{label}</span>
        <span className="font-semibold">{used} / {total}</span>
      </div>
      <div className="h-2 w-full overflow-hidden rounded-full bg-line">
        <div
          className="h-full rounded-full bg-brand transition-[width]"
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}

export function SubscriptionPanel() {
  const params = useSearchParams();
  const justPaid = params.get("payment") === "success";
  const cancelled = params.get("cancelled") !== null;
  const [state, setState] = useState<BillingState | null>(null);
  const [cancelling, setCancelling] = useState(false);
  const [cancelMsg, setCancelMsg] = useState<string | null>(null);

  const fetchState = useCallback(() => {
    fetch("/api/billing")
      .then((r) => r.json() as Promise<BillingState>)
      .then(setState)
      .catch(() => {});
  }, []);

  useEffect(fetchState, [fetchState]);

  async function handleCancel() {
    if (!confirm("Cancel your subscription? You'll keep access until the period ends.")) return;
    setCancelling(true);
    try {
      const res = await fetch("/api/billing/cancel", { method: "POST" });
      const body = await res.json();
      if (body.ok) {
        setCancelMsg(body.message);
        fetchState();
      } else {
        setCancelMsg(body.error ?? "Failed to cancel");
      }
    } catch {
      setCancelMsg("Network error — try again");
    } finally {
      setCancelling(false);
    }
  }

  if (!state) {
    return (
      <section className="card p-5" aria-live="polite">
        <p className="text-sm text-muted-fg">Loading your plan…</p>
      </section>
    );
  }

  const planName =
    state.plan === "PREMIUM_PLUS" ? "Premium Plus" : state.plan.charAt(0) + state.plan.slice(1).toLowerCase();
  const sub = state.subscription;
  const dailyCap = state.limits.dailyQuestions;
  const mockCap = state.limits.mocksPerMonth;
  const questionsUsed = dailyCap != null && state.usage?.dailyQuestionsRemaining != null ? dailyCap - state.usage.dailyQuestionsRemaining : null;
  const mocksUsed = mockCap != null && state.usage?.mocksRemainingToday != null ? mockCap - state.usage.mocksRemainingToday : null;

  return (
    <section className="card p-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="section-title flex items-center gap-2">
          <SparklesIcon className="h-4 w-4 text-brand" />
          My plan
        </h2>
        <div className="flex items-center gap-2">
          <Link href="/transactions" className="btn btn-ghost btn-sm">
            <HistoryIcon className="h-3.5 w-3.5" />
            History
          </Link>
          <Link href="/pricing" className="btn btn-secondary btn-sm">
            {state.isPaid ? "Change plan" : "Upgrade"}
          </Link>
        </div>
      </div>

      {justPaid ? (
        <p className="mt-3 rounded-2xl border border-ok/30 bg-ok-soft px-4 py-3 text-sm text-ok">
          Payment successful — your plan is active.
        </p>
      ) : null}
      {cancelled ? (
        <p className="mt-3 rounded-2xl border border-line bg-canvas px-4 py-3 text-sm text-muted-fg">
          Checkout cancelled. No charge was made.
        </p>
      ) : null}
      {cancelMsg ? (
        <p className="mt-3 rounded-2xl border border-warn/30 bg-warn-soft px-4 py-3 text-sm text-warn">
          {cancelMsg}
        </p>
      ) : null}

      <div className="mt-4 grid gap-4 sm:grid-cols-2">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider text-subtle-fg">Current plan</p>
          <p className="mt-1 text-2xl font-bold tracking-tight">{planName}</p>
          <p className="text-xs text-muted-fg">
            {sub?.active ? (
              <>
                {fmt(sub.amount, sub.currency)} · {sub.cycle === "YEARLY" ? "yearly" : "monthly"} · via {providerLabel(sub)}
              </>
            ) : (
              "Free tier — practise up to the daily limit and upgrade for more."
            )}
          </p>
        </div>

        <div className="flex flex-col gap-1.5 text-sm">
          {sub?.active ? (
            <>
              <p className="flex items-center justify-between gap-2">
                <span className="text-muted-fg">Renews in</span>
                <span className="font-semibold">{fmtDuration(sub.msUntilPeriodEnd)}</span>
              </p>
              <p className="flex items-center justify-between gap-2">
                <span className="text-muted-fg">Period ends</span>
                <span className="font-semibold">{fmtDate(sub.currentPeriodEnd)}</span>
              </p>
            </>
          ) : (
            <p className="text-xs text-subtle-fg">
              Paid plans renew for the same term; you can also pause by contacting support.
            </p>
          )}
        </div>
      </div>

      {(questionsUsed != null && dailyCap != null) || (mocksUsed != null && mockCap != null) ? (
        <div className="mt-5 flex flex-col gap-3 border-t border-line pt-4">
          <p className="text-xs font-semibold uppercase tracking-wider text-subtle-fg">Usage this period</p>
          {questionsUsed != null && dailyCap != null ? (
            <UsageBar label="Daily questions" used={questionsUsed} total={dailyCap} />
          ) : null}
          {mocksUsed != null && mockCap != null ? (
            <UsageBar label="Mock tests this month" used={mocksUsed} total={mockCap} />
          ) : null}
          {dailyCap === null ? (
            <p className="text-xs text-muted-fg">Daily questions: <span className="font-semibold">unlimited</span></p>
          ) : null}
          {mockCap === null ? (
            <p className="text-xs text-muted-fg">Mock tests: <span className="font-semibold">unlimited</span></p>
          ) : null}
        </div>
      ) : null}

      {sub?.active && sub.status === "ACTIVE" ? (
        <div className="mt-5 border-t border-line pt-4">
          <button
            type="button"
            className="btn btn-secondary btn-sm text-warn"
            onClick={handleCancel}
            disabled={cancelling}
          >
            {cancelling ? "Cancelling…" : "Cancel subscription"}
          </button>
          <p className="mt-1 text-xs text-subtle-fg">
            You keep access until {fmtDate(sub.currentPeriodEnd)}. No refund for the remaining period.
          </p>
        </div>
      ) : null}
    </section>
  );
}