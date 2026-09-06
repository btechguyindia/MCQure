import Link from "next/link";
import { redirect } from "next/navigation";
import type { Metadata } from "next";
import { getCurrentUser } from "@/lib/api";
import { listUserSubscriptions, msUntilPeriodEnd } from "@/lib/billing";
import { PLANS } from "@/lib/plans";
import type { Subscription } from "@prisma/client";
import { CheckIcon, CloseIcon, HistoryIcon } from "@/components/icons";

export const metadata: Metadata = { title: "Billing history — MCQure" };

function fmtMoney(amount: number, currency: string): string {
  if (amount === 0) return "—";
  return currency === "INR" ? `₹${amount.toLocaleString("en-IN")}` : `$${amount}`;
}

function fmtDate(d: Date): string {
  return d.toLocaleDateString(undefined, { day: "numeric", month: "short", year: "numeric" });
}

function fmtTime(d: Date): string {
  return d.toLocaleTimeString(undefined, { hour: "2-digit", minute: "2-digit" });
}

function planName(plan: string): string {
  const p = PLANS[plan as keyof typeof PLANS];
  return p?.name ?? plan.replace(/_/g, " ");
}

function actionFor(sub: Subscription): { label: string; tone: "ok" | "warn" | "neutral" | "muted" } {
  switch (sub.status) {
    case "ACTIVE":
      return {
        label:
          sub.createdAt.getTime() + 5000 > Date.now()
            ? `Purchased ${planName(sub.plan)} (${sub.cycle === "YEARLY" ? "yearly" : "monthly"})`
            : `Renewed ${planName(sub.plan)} (${sub.cycle === "YEARLY" ? "yearly" : "monthly"})`,
        tone: "ok",
      };
    case "PENDING":
      return { label: `Checkout started — ${planName(sub.plan)}`, tone: "warn" };
    case "CANCELLED":
      return {
        label: sub.cancelledAt && sub.amount === 0 && sub.provider === "MANUAL"
          ? `Ended ${planName(sub.plan)} access`
          : `Cancelled ${planName(sub.plan)}`,
        tone: "warn",
      };
    case "EXPIRED":
      return {
        label: sub.cancelledAt
          ? `Superseded by a newer plan`
          : `Period lapsed — ${planName(sub.plan)}`,
        tone: "muted",
      };
  }
}

function providerLabel(provider: string, ref: string | null): string {
  if (provider === "MANUAL") {
    return (ref ?? "").startsWith("test-") ? "Test checkout" : "Admin grant";
  }
  return provider.charAt(0) + provider.slice(1).toLowerCase();
}

function StatusBadge({ status }: { status: Subscription["status"] }) {
  const map: Record<Subscription["status"], string> = {
    ACTIVE: "bg-ok-soft text-ok border-ok/30",
    PENDING: "bg-warn-soft text-warn border-warn/30",
    CANCELLED: "bg-canvas text-muted-fg border-line",
    EXPIRED: "bg-canvas text-subtle-fg border-line",
  };
  return (
    <span className={`rounded-full border px-2.5 py-0.5 text-[0.65rem] font-bold uppercase tracking-wider ${map[status]}`}>
      {status.toLowerCase()}
    </span>
  );
}

export default async function TransactionsPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login?next=/transactions");

  const history = await listUserSubscriptions(user.id);

  return (
    <div className="mx-auto flex max-w-3xl flex-col gap-6 py-6">
      <header className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="kicker">Account ledger</p>
          <h1 className="mt-2 flex items-center gap-2.5 text-2xl font-bold tracking-tight sm:text-3xl">
            <HistoryIcon className="h-6 w-6 text-brand" />
            Transaction history
          </h1>
          <p className="mt-2 max-w-2xl text-sm text-muted-fg">
            Every plan purchase, checkout attempt, cancellation and expiry on your account,
            newest first. Refunds are handled via support and appear here once issued.
          </p>
        </div>
        <Link href="/pricing" className="btn btn-secondary btn-sm">
          Manage plans
        </Link>
      </header>

      {history.length === 0 ? (
        <section className="card p-6 text-center">
          <p className="text-sm text-muted-fg">No transactions yet.</p>
          <p className="mt-1 text-xs text-subtle-fg">
            Your current plan, purchases and cancellations will show up here.
          </p>
        </section>
      ) : (
        <ol className="flex flex-col gap-3">
          {history.map((sub) => {
            const action = actionFor(sub);
            const stillActive = sub.status === "ACTIVE" && sub.currentPeriodEnd.getTime() > Date.now();
            const daysLeft =
              stillActive && sub.currentPeriodEnd.getTime() > Date.now()
                ? Math.ceil(msUntilPeriodEnd(sub.currentPeriodEnd) / 86_400_000)
                : null;
            return (
              <li key={sub.id} className="card p-4 sm:p-5">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="flex items-start gap-3">
                    <span
                      className={`mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-xl ${
                        action.tone === "ok"
                          ? "bg-ok-soft text-ok"
                          : action.tone === "warn"
                            ? "bg-warn-soft text-warn"
                            : "bg-canvas text-subtle-fg"
                      }`}
                      aria-hidden
                    >
                      {action.tone === "ok" ? (
                        <CheckIcon className="h-4 w-4" />
                      ) : action.tone === "warn" ? (
                        <CloseIcon className="h-4 w-4" />
                      ) : (
                        <HistoryIcon className="h-4 w-4" />
                      )}
                    </span>
                    <div>
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="font-semibold">{action.label}</p>
                        <StatusBadge status={sub.status} />
                      </div>
                      <p className="mt-0.5 text-xs text-muted-fg" title={sub.id}>
                        {fmtDate(sub.createdAt)} · {fmtTime(sub.createdAt)} · {providerLabel(sub.provider, sub.providerRef)}
                      </p>
                    </div>
                  </div>

                  <div className="text-right">
                    <p className="font-bold tracking-tight">{fmtMoney(sub.amount, sub.currency)}</p>
                    {stillActive ? (
                      <p className="text-xs font-medium text-ok">
                        {daysLeft === 1 ? "Expires tomorrow" : `${daysLeft} days left`}
                      </p>
                    ) : sub.cycle ? (
                      <p className="text-xs text-subtle-fg">{sub.cycle.toLowerCase()} term</p>
                    ) : null}
                  </div>
                </div>

                <div className="mt-3 flex flex-wrap gap-x-5 gap-y-1 border-t border-line pt-3 text-xs text-subtle-fg">
                  <span>
                    {sub.status === "ACTIVE"
                      ? `Active until ${fmtDate(sub.currentPeriodEnd)}`
                      : sub.status === "PENDING"
                        ? "Waiting for payment confirmation"
                        : `Started ${fmtDate(sub.createdAt)}`}
                  </span>
                  <span>via {providerLabel(sub.provider, sub.providerRef)}</span>
                  {sub.providerRef ? <span className="truncate" title={sub.providerRef}>ref {sub.providerRef.slice(0, 28)}</span> : null}
                </div>
              </li>
            );
          })}
        </ol>
      )}
    </div>
  );
}