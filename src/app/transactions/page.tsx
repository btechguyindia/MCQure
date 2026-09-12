import Link from "next/link";
import { redirect } from "next/navigation";
import type { Metadata } from "next";
import { getCurrentUser } from "@/lib/api";
import { listUserSubscriptions, msUntilPeriodEnd } from "@/lib/billing";
import { FEATURE_CATALOG, PLANS, type PlanFeature } from "@/lib/plans";
import type { Subscription } from "@prisma/client";
import {
  CheckIcon,
  CloseIcon,
  CrownIcon,
  HistoryIcon,
  SparklesIcon,
} from "@/components/icons";

export const metadata: Metadata = { title: "Billing history — MCQure" };

// ── Formatting helpers ────────────────────────────────────────────────────────

/** Fresh timestamp for one request render (wraps Date.now for lint purity). */
function nowMs(): number {
  return Date.now();
}

function fmtMoney(amount: number, currency: string): string {
  if (amount === 0) return "Free";
  return currency === "INR" ? `₹${amount.toLocaleString("en-IN")}` : `$${amount}`;
}

function fmtDate(d: Date): string {
  return d.toLocaleDateString(undefined, { day: "numeric", month: "short", year: "numeric" });
}

function fmtDateTime(d: Date): string {
  return d.toLocaleString(undefined, {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function planName(plan: string): string {
  const p = PLANS[plan as keyof typeof PLANS];
  return p?.name ?? plan.replace(/_/g, " ");
}

function cycleLabel(cycle: string): string {
  return cycle === "YEARLY" ? "Yearly (12-month term)" : "Monthly (1-month term)";
}

function providerLabel(provider: string, ref: string | null): { name: string; brand: string } {
  if (provider === "MANUAL") {
    return {
      name: (ref ?? "").startsWith("test-") ? "Test checkout" : "Admin grant",
      brand: "Manual",
    };
  }
  return {
    name: provider.charAt(0) + provider.slice(1).toLowerCase(),
    brand: provider.charAt(0) + provider.slice(1).toLowerCase(),
  };
}

function statusMeta(status: Subscription["status"]): {
  label: string;
  tone: "ok" | "warn" | "muted";
  chip: string;
} {
  switch (status) {
    case "ACTIVE":
      return { label: "Active", tone: "ok", chip: "bg-ok-soft text-ok border-ok/30" };
    case "PENDING":
      return { label: "Pending", tone: "warn", chip: "bg-warn-soft text-warn border-warn/30" };
    case "CANCELLED":
      return { label: "Cancelled", tone: "warn", chip: "bg-canvas text-muted-fg border-line" };
    case "EXPIRED":
      return { label: "Expired", tone: "muted", chip: "bg-canvas text-subtle-fg border-line" };
  }
}

function actionSummary(sub: Subscription): { title: string; subtitle: string; tone: "ok" | "warn" | "muted" } {
  const p = planName(sub.plan);
  const cycle = sub.cycle === "YEARLY" ? "yearly" : "monthly";
  switch (sub.status) {
    case "ACTIVE":
      return sub.createdAt.getTime() + 5000 > nowMs()
        ? { title: `Plan purchased — ${p}`, subtitle: `You bought the ${p} plan (${cycle}).`, tone: "ok" }
        : { title: `Plan renewed — ${p}`, subtitle: `Your ${p} plan (${cycle}) is active.`, tone: "ok" };
    case "PENDING":
      return {
        title: `Checkout started — ${p}`,
        subtitle: `Payment for ${p} (${cycle}) was initiated but not yet confirmed.`,
        tone: "warn",
      };
    case "CANCELLED": {
      const manualEnded = sub.cancelledAt && sub.amount === 0 && sub.provider === "MANUAL";
      return manualEnded
        ? { title: `Plan access ended — ${p}`, subtitle: `Access to ${p} was ended`, tone: "warn" }
        : { title: `Plan cancelled — ${p}`, subtitle: `Renewal of ${p} was stopped; access continues until the period ends.`, tone: "warn" };
    }
    case "EXPIRED":
      return sub.cancelledAt
        ? { title: `Plan superseded — ${p}`, subtitle: `A newer plan purchase replaced ${p}.`, tone: "muted" }
        : { title: `Period lapsed — ${p}`, subtitle: `The ${p} subscription reached its end and expired.`, tone: "muted" };
  }
}

// ── Plan snapshot parsing ─────────────────────────────────────────────────────

interface Snapshot {
  plan: string;
  name: string;
  limits: { dailyQuestions: number | null; mocksPerMonth: number | null; bookmarks: number | null; activeTimetables: number | null };
  features: string[];
}

function parseSnapshot(raw: unknown): Snapshot | null {
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) return null;
  const obj = raw as Record<string, unknown>;
  const plan = typeof obj.plan === "string" ? obj.plan : "";
  const name = typeof obj.name === "string" ? obj.name : planName(plan);
  const limitsRaw = (obj.limits ?? {}) as Record<string, unknown>;
  const numOrNull = (v: unknown): number | null => (typeof v === "number" || v === null) ? (v as number | null) : null;
  const features = Array.isArray(obj.features)
    ? obj.features.filter((f): f is string => typeof f === "string")
    : [];
  if (!plan) return null;
  return {
    plan,
    name,
    limits: {
      dailyQuestions: numOrNull(limitsRaw.dailyQuestions),
      mocksPerMonth: numOrNull(limitsRaw.mocksPerMonth),
      bookmarks: numOrNull(limitsRaw.bookmarks),
      activeTimetables: numOrNull(limitsRaw.activeTimetables),
    },
    features,
  };
}

const FEATURE_LABEL: Record<PlanFeature, string> = Object.fromEntries(
  FEATURE_CATALOG.map((f) => [f.id, f.label])
) as Record<PlanFeature, string>;

const FEATURE_GROUP: Record<string, string> = {
  questions_unlimited: "Practice",
  mock_tests: "Practice",
  pyq_bank: "Practice",
  prep_health: "Practice",
  learning_priority: "Learning",
  weakness_engine: "Learning",
  study_timetable: "Learning",
  unlimited_bookmarks: "Learning",
  ai_explanations: "AI & Analytics",
  ai_mock_analysis: "AI & Analytics",
  advanced_analytics: "AI & Analytics",
  reports_export: "AI & Analytics",
  moderation: "Community",
  exclusive_theme: "Community",
  custom_study_plan: "Community",
  priority_support: "Community",
};

// ── Status badge ──────────────────────────────────────────────────────────────

function StatusBadge({ status }: { status: Subscription["status"] }) {
  const meta = statusMeta(status);
  return (
    <span className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-[0.65rem] font-bold uppercase tracking-wider ${meta.chip}`}>
      {meta.label}
    </span>
  );
}

function DetailRow({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex items-start justify-between gap-4 border-b border-line/60 py-2 last:border-0">
      <span className="shrink-0 text-xs font-medium uppercase tracking-wide text-subtle-fg">{label}</span>
      <span className="text-right text-sm font-medium text-ink">{children}</span>
    </div>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default async function TransactionsPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login?next=/transactions");

  const now = nowMs();
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
            Every plan purchase, renewal, checkout attempt, cancellation and expiry on your
            account, newest first. Each entry shows the full plan details recorded at the time.
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
        <ol className="flex flex-col gap-4">
          {history.map((sub) => {
            const action = actionSummary(sub);
            const meta = statusMeta(sub.status);
            const payer = providerLabel(sub.provider, sub.providerRef);
            const snapshot = parseSnapshot(sub.planSnapshot);
            const stillActive = sub.status === "ACTIVE" && sub.currentPeriodEnd.getTime() > now;
            const daysLeft = stillActive ? Math.ceil(msUntilPeriodEnd(sub.currentPeriodEnd, new Date(now)) / 86_400_000) : null;
            const displayPlan = snapshot?.name ?? planName(sub.plan);

            const features = snapshot?.features ?? PLANS[sub.plan as keyof typeof PLANS]?.features ?? [];
            const limits = snapshot?.limits ?? PLANS[sub.plan as keyof typeof PLANS]?.limits ?? null;

            return (
              <li key={sub.id} className="card overflow-hidden p-5 sm:p-6">
                {/* Header */}
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="flex items-start gap-3">
                    <span
                      className={`mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl ${
                        action.tone === "ok"
                          ? "bg-ok-soft text-ok"
                          : action.tone === "warn"
                            ? "bg-warn-soft text-warn"
                            : "bg-canvas text-subtle-fg"
                      }`}
                      aria-hidden
                    >
                      {action.tone === "ok" ? (
                        <CrownIcon className="h-5 w-5" />
                      ) : action.tone === "warn" ? (
                        <CloseIcon className="h-5 w-5" />
                      ) : (
                        <HistoryIcon className="h-5 w-5" />
                      )}
                    </span>
                    <div>
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="text-base font-bold tracking-tight">{action.title}</p>
                        <StatusBadge status={sub.status} />
                      </div>
                      <p className="mt-0.5 max-w-xl text-xs leading-relaxed text-muted-fg">{action.subtitle}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-xl font-black tracking-tight">{fmtMoney(sub.amount, sub.currency)}</p>
                    {stillActive ? (
                      <p className="text-xs font-semibold text-ok">
                        {daysLeft === 1 ? "Expires tomorrow" : `${daysLeft} days left`}
                      </p>
                    ) : sub.cycle ? (
                      <p className="text-xs text-subtle-fg">{sub.cycle.toLowerCase()} term</p>
                    ) : sub.status === "PENDING" ? (
                      <p className="text-xs text-warn">Awaiting payment</p>
                    ) : null}
                  </div>
                </div>

                {/* Plan purchased */}
                <div className="mt-5 rounded-2xl border border-line bg-canvas p-4">
                  <p className="text-[0.65rem] font-bold uppercase tracking-widest text-subtle-fg">
                    {sub.status === "ACTIVE" ? "Plan purchased" : "Plan on this entry"}
                  </p>
                  <div className="mt-2 flex flex-wrap items-center justify-between gap-3">
                    <div>
                      <p className="flex items-center gap-1.5 text-lg font-bold tracking-tight">
                        {displayPlan}
                        {sub.plan === "ROYAL" || (snapshot?.plan === "ROYAL") ? <span aria-hidden>👑</span> : null}
                        {snapshot ? (
                          <span className="rounded-full border border-line bg-card px-2 py-0.5 text-[0.6rem] font-bold uppercase tracking-wider text-muted-fg">
                            snapshot at purchase
                          </span>
                        ) : null}
                      </p>
                      <p className="mt-0.5 text-xs text-muted-fg">
                        {PLANS[sub.plan as keyof typeof PLANS]?.tagline ?? `${planName(sub.plan)} plan`}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-xs text-subtle-fg">{cycleLabel(sub.cycle ?? "MONTHLY")}</p>
                      <p className="mt-0.5 text-xs text-muted-fg">{fmtMoney(sub.amount, sub.currency)} · {sub.currency}</p>
                    </div>
                  </div>
                </div>

                {/* Limits */}
                {limits ? (
                  <div className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-4">
                    {(
                      [
                        ["Daily questions", limits.dailyQuestions],
                        ["Mock tests / month", limits.mocksPerMonth],
                        ["Bookmarks", limits.bookmarks],
                        ["Active timetables", limits.activeTimetables],
                      ] as const
                    ).map(([label, value]) => (
                      <div key={label} className="rounded-xl border border-line bg-card-strong p-3 text-center">
                        <p className="stat-num text-lg text-ink">{value === null ? "∞" : value}</p>
                        <p className="section-title mt-1">{label}</p>
                      </div>
                    ))}
                  </div>
                ) : null}

                {/* Features included */}
                {features.length > 0 ? (
                  <div className="mt-4">
                    <p className="flex items-center gap-1.5 text-[0.65rem] font-bold uppercase tracking-widest text-subtle-fg">
                      <SparklesIcon className="h-3 w-3" />
                      {features.length} features included
                    </p>
                    <div className="mt-2 flex flex-wrap gap-1.5">
                      {features.map((f) => (
                        <span
                          key={f}
                          className="inline-flex items-center gap-1 rounded-full border border-line bg-card px-2.5 py-1 text-[0.7rem] font-medium text-muted-fg"
                        >
                          <CheckIcon className="h-3 w-3 text-ok" />
                          {FEATURE_LABEL[f as PlanFeature] ?? f}
                          <span className="hidden text-[0.6rem] text-subtle-fg sm:inline">· {FEATURE_GROUP[f] ?? "Feature"}</span>
                        </span>
                      ))}
                    </div>
                  </div>
                ) : null}

                {/* Billing details & timeline */}
                <div className="mt-5 grid gap-x-8 gap-y-1 sm:grid-cols-2">
                  <div>
                    <p className="mb-1 flex items-center gap-1.5 text-[0.65rem] font-bold uppercase tracking-widest text-subtle-fg">
                      <HistoryIcon className="h-3 w-3" />
                      Timeline
                    </p>
                    <DetailRow label="Started">
                      {fmtDateTime(sub.createdAt)}
                    </DetailRow>
                    <DetailRow label="Period ends">
                      {fmtDate(sub.currentPeriodEnd)}
                    </DetailRow>
                    {sub.cancelledAt ? (
                      <DetailRow label="Cancelled">{fmtDateTime(sub.cancelledAt)}</DetailRow>
                    ) : null}
                    {stillActive ? <DetailRow label="Remaining">{daysLeft === 1 ? "1 day" : `${daysLeft} days`}</DetailRow> : null}
                  </div>
                  <div>
                    <p className="mb-1 flex items-center gap-1.5 text-[0.65rem] font-bold uppercase tracking-widest text-subtle-fg">
                      <CrownIcon className="h-3 w-3" />
                      Payment
                    </p>
                    <DetailRow label="Method">{payer.brand}</DetailRow>
                    <DetailRow label="Amount paid">{fmtMoney(sub.amount, sub.currency)}</DetailRow>
                    <DetailRow label="Cycle">{sub.cycle === "YEARLY" ? "Yearly" : "Monthly"}</DetailRow>
                    <DetailRow label="Status">{meta.label}</DetailRow>
                  </div>
                </div>

                {/* Reference */}
                <p className="mt-4 border-t border-line pt-3 text-[0.65rem] text-subtle-fg" title={sub.id}>
                  Transaction ID <code className="rounded bg-canvas px-1.5 py-0.5">{sub.id}</code>
                  {sub.providerRef ? (
                    <>
                      {" "}· Provider ref <code className="rounded bg-canvas px-1.5 py-0.5">{sub.providerRef}</code>
                    </>
                  ) : null}
                </p>
              </li>
            );
          })}
        </ol>
      )}
    </div>
  );
}