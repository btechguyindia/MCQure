"use client";

import Link from "next/link";
import { useMemo } from "react";
import { useUpgrade } from "@/components/upgrade-context";
import {
  FEATURE_CATALOG,
  PLANS,
  PLAN_ORDER,
  type PlanId,
} from "@/lib/plans";
import { CheckIcon, CloseIcon, LockIcon, SparklesIcon } from "@/components/icons";

/** Map an entitlement error onto the plan that unlocks it (best effort). */
function planNeeded(message: string | null): PlanId | null {
  if (!message) return null;
  for (const f of FEATURE_CATALOG) {
    if (message.toLowerCase().includes(f.id.replace(/_/g, " "))) {
      // First paid plan that includes the feature.
      return f.highlights.find((p) => p !== "BASIC") ?? null;
    }
  }
  return null;
}

export function UpgradeModal() {
  const { isOpen, message, closeUpgrade } = useUpgrade();
  const needed = useMemo(() => planNeeded(message), [message]);

  if (!isOpen) return null;

  const neededPlan = needed ? PLANS[needed] : null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-black/50 p-4 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      aria-label="Upgrade required"
      onClick={closeUpgrade}
    >
      <div
        className="w-full max-w-md rounded-3xl border border-line bg-card p-6 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-3">
          <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-brand-soft text-brand">
            <LockIcon className="h-5 w-5" />
          </span>
          <button
            type="button"
            onClick={closeUpgrade}
            className="rounded-xl p-1.5 text-muted-fg hover:bg-canvas hover:text-ink"
            aria-label="Close"
          >
            <CloseIcon className="h-5 w-5" />
          </button>
        </div>

        <h3 className="mt-4 text-xl font-bold tracking-tight">This is a paid feature</h3>
        <p className="mt-1 text-sm text-muted-fg">
          {message ?? "Your account doesn't have access to this feature on your current plan."}
          {neededPlan
            ? <> Upgrade to <span className="font-semibold text-ink">{neededPlan.name}</span> or a higher plan to unlock it.</>
            : " Upgrade to any paid plan to unlock it."}
        </p>

        <div className="mt-5 flex flex-col gap-2">
          <span className="kicker !mb-0 flex items-center gap-1.5">
            {neededPlan ? <LockIcon className="h-3 w-3" /> : null}
            {neededPlan ? `Included with ${neededPlan.name}+` : "Included with every paid plan"}
          </span>
          <div className="grid grid-cols-2 gap-2">
            {PLAN_ORDER.filter((p) => p !== "BASIC").map((p) => {
              const plan = PLANS[p];
              const best = neededPlan ? p === neededPlan?.id : p === "PREMIUM";
              return (
                <div
                  key={p}
                  className={`rounded-2xl border p-3 ${
                    best ? "border-brand bg-brand-soft" : "border-line bg-canvas"
                  }`}
                >
                  <p className="flex items-center gap-1 text-sm font-bold">
                    {plan.name}
                    {p === "ROYAL" ? <span aria-hidden>👑</span> : null}
                    {best ? (
                      <span className="ml-auto text-[0.6rem] font-semibold text-muted-fg">recommended</span>
                    ) : null}
                  </p>
                  <p className="mt-0.5 text-[0.65rem] leading-snug text-muted-fg">
                    {plan.tagline}
                  </p>
                  <p className="mt-1.5 text-[0.65rem] font-semibold text-ok">
                    <span className="inline-flex items-center gap-1">
                      <CheckIcon className="h-3 w-3" />
                      Included
                    </span>
                  </p>
                </div>
              );
            })}
          </div>
        </div>

        <div className="mt-5 flex flex-col gap-2">
          <Link href="/pricing" className="btn btn-primary w-full" onClick={closeUpgrade}>
            <SparklesIcon className="h-4 w-4" />
            View plans & pricing
          </Link>
          <button type="button" onClick={closeUpgrade} className="btn btn-ghost w-full text-sm">
            Maybe later
          </button>
        </div>
      </div>
    </div>
  );
}