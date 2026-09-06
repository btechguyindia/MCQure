// ── Plan catalog: pricing + feature access ───────────────────────────────────
//
// Single source of truth for the four plans (Basic, Premium, Premium Plus,
// Royal), their monthly/yearly prices in both INR and USD, and the feature
// matrix. Everything that wants to know "does this user's plan include X?"
// goes through hasFeature/planOf here — never through scattered comparisons.
// Prices are configured below, never hardcoded anywhere else.

export const PLAN_ORDER = ["BASIC", "PREMIUM", "PREMIUM_PLUS", "ROYAL"] as const;
export type PlanId = (typeof PLAN_ORDER)[number];

/** Billing cycle offered for every paid plan. */
export const BILLING_CYCLES = ["MONTHLY", "YEARLY"] as const;
export type BillingCycle = (typeof BILLING_CYCLES)[number];

/** Currencies offered: India-first (INR) with USD for international users. */
export const CURRENCIES = ["INR", "USD"] as const;
export type Currency = (typeof CURRENCIES)[number];

export const MONTHS_PER_CYCLE: Record<BillingCycle, number> = {
  MONTHLY: 1,
  YEARLY: 12,
};

// ── Feature ids ──────────────────────────────────────────────────────────────
// Used for both the catalog UI (what each plan "includes") and runtime
// enforcement (can this plan do X right now).

export type PlanFeature =
  | "questions_unlimited" // no daily question ceiling
  | "mock_tests" // can take mock tests
  | "pyq_bank" // full previous-year question bank
  | "ai_explanations" // AI answer explanations / analysis
  | "ai_mock_analysis" // AI deep-dive on whole mock attempts
  | "advanced_analytics" // analytics page + detailed charts
  | "reports_export" // PDF/CSV report export
  | "learning_priority" // ranked study-this-next engine
  | "prep_health" // preparation health score dashboard
  | "study_timetable" // study timetable builder
  | "unlimited_bookmarks" // no bookmark/notebook cap
  | "weakness_engine" // weakness-driven practice
  | "moderation" // question quality review access
  | "exclusive_theme" // account-tier colour identity
  | "custom_study_plan" // AI/custom daily study plan
  | "priority_support" // 24x7 priority support

export interface PricePoint {
  INR: number;
  USD: number;
}

export interface PlanDef {
  id: PlanId;
  name: string;
  tagline: string;
  /** Individual price the user pays per cycle. */
  prices: Record<BillingCycle, PricePoint>;
  /** Extra paid-cycle features (e.g. "2 months free"). */
  yearlyPerk: string | null;
  /** Human-readable limits for the two countable things. */
  limits: {
    dailyQuestions: number | null; // null = unlimited
    mocksPerMonth: number | null; // null = unlimited
    bookmarks: number | null;
    activeTimetables: number | null;
  };
  /** Every feature the plan includes. */
  features: readonly PlanFeature[];
}

// Monthly/yearly price pairs. Yearly is priced at ~2 months free.
// Values are pre-tax display prices; the same amounts are charged to the
// payment providers (no tax is computed on our side).
const PRICE: Record<
  Exclude<PlanId, "BASIC">,
  Record<BillingCycle, PricePoint>
> = {
  PREMIUM: {
    MONTHLY: { INR: 199, USD: 5 },
    YEARLY: { INR: 1999, USD: 49 },
  },
  PREMIUM_PLUS: {
    MONTHLY: { INR: 399, USD: 9 },
    YEARLY: { INR: 3999, USD: 89 },
  },
  ROYAL: {
    MONTHLY: { INR: 699, USD: 15 },
    YEARLY: { INR: 6999, USD: 149 },
  },
};

export const PLANS: Record<PlanId, PlanDef> = {
  BASIC: {
    id: "BASIC",
    name: "Basic",
    tagline: "Free forever — get going with core practice.",
    prices: {
      MONTHLY: { INR: 0, USD: 0 },
      YEARLY: { INR: 0, USD: 0 },
    },
    yearlyPerk: null,
    limits: {
      dailyQuestions: 10,
      mocksPerMonth: 0,
      bookmarks: 20,
      activeTimetables: 0,
    },
    features: [
      "prep_health",
    ] as const satisfies readonly PlanFeature[],
  },
  PREMIUM: {
    id: "PREMIUM",
    name: "Premium",
    tagline: "Unlimited practice, PYQs and mocks each month.",
    prices: PRICE.PREMIUM,
    yearlyPerk: "2 months free",
    limits: {
      dailyQuestions: null,
      mocksPerMonth: 4,
      bookmarks: null,
      activeTimetables: 1,
    },
    features: [
      "questions_unlimited",
      "mock_tests",
      "pyq_bank",
      "learning_priority",
      "prep_health",
      "study_timetable",
      "unlimited_bookmarks",
      "weakness_engine",
      "exclusive_theme",
    ] as const satisfies readonly PlanFeature[],
  },
  PREMIUM_PLUS: {
    id: "PREMIUM_PLUS",
    name: "Premium Plus",
    tagline: "AI explanations, deep analytics and 12 mocks a month.",
    prices: PRICE.PREMIUM_PLUS,
    yearlyPerk: "2 months free",
    limits: {
      dailyQuestions: null,
      mocksPerMonth: 12,
      bookmarks: null,
      activeTimetables: 3,
    },
    features: [
      "questions_unlimited",
      "mock_tests",
      "pyq_bank",
      "ai_explanations",
      "advanced_analytics",
      "reports_export",
      "learning_priority",
      "prep_health",
      "study_timetable",
      "unlimited_bookmarks",
      "weakness_engine",
      "moderation",
      "exclusive_theme",
    ] as const satisfies readonly PlanFeature[],
  },
  ROYAL: {
    id: "ROYAL",
    name: "Royal",
    tagline: "Everything, unlimited mocks and an AI study plan.",
    prices: PRICE.ROYAL,
    yearlyPerk: "2 months free",
    limits: {
      dailyQuestions: null,
      mocksPerMonth: null,
      bookmarks: null,
      activeTimetables: null,
    },
    features: [
      "questions_unlimited",
      "mock_tests",
      "pyq_bank",
      "ai_explanations",
      "ai_mock_analysis",
      "advanced_analytics",
      "reports_export",
      "learning_priority",
      "prep_health",
      "study_timetable",
      "unlimited_bookmarks",
      "weakness_engine",
      "moderation",
      "exclusive_theme",
      "custom_study_plan",
      "priority_support",
    ] as const satisfies readonly PlanFeature[],
  },
};

// ── Feature catalogue (for UI + enforcement docs) ────────────────────────────

export const FEATURE_CATALOG: ReadonlyArray<{
  id: PlanFeature;
  label: string;
  /** Multi-plan feature: which plans include it (ascending). */
  highlights: readonly PlanId[];
}> = [
  { id: "questions_unlimited", label: "Daily practice questions", highlights: ["BASIC", "PREMIUM", "PREMIUM_PLUS", "ROYAL"] },
  { id: "mock_tests", label: "Mock tests per month", highlights: ["PREMIUM", "PREMIUM_PLUS", "ROYAL"] },
  { id: "pyq_bank", label: "Previous-year question bank", highlights: ["PREMIUM", "PREMIUM_PLUS", "ROYAL"] },
  { id: "ai_explanations", label: "AI answer explanations", highlights: ["PREMIUM_PLUS", "ROYAL"] },
  { id: "ai_mock_analysis", label: "AI mock deep analysis", highlights: ["ROYAL"] },
  { id: "advanced_analytics", label: "Advanced analytics & charts", highlights: ["PREMIUM_PLUS", "ROYAL"] },
  { id: "reports_export", label: "Report export", highlights: ["PREMIUM_PLUS", "ROYAL"] },
  { id: "learning_priority", label: "Learning priority engine", highlights: ["PREMIUM", "PREMIUM_PLUS", "ROYAL"] },
  { id: "prep_health", label: "Preparation health dashboard", highlights: ["BASIC", "PREMIUM", "PREMIUM_PLUS", "ROYAL"] },
  { id: "study_timetable", label: "Study timetable", highlights: ["PREMIUM", "PREMIUM_PLUS", "ROYAL"] },
  { id: "unlimited_bookmarks", label: "Unlimited bookmarks & notes", highlights: ["PREMIUM", "PREMIUM_PLUS", "ROYAL"] },
  { id: "weakness_engine", label: "Weakness-driven practice", highlights: ["PREMIUM", "PREMIUM_PLUS", "ROYAL"] },
  { id: "moderation", label: "Question review access", highlights: ["PREMIUM_PLUS", "ROYAL"] },
  { id: "exclusive_theme", label: "Exclusive colour identity", highlights: ["PREMIUM", "PREMIUM_PLUS", "ROYAL"] },
  { id: "custom_study_plan", label: "AI custom study plan", highlights: ["ROYAL"] },
  { id: "priority_support", label: "Priority support", highlights: ["ROYAL"] },
];

/** Ordered list for the pricing-page rows. */
export const FEATURE_ROWS: ReadonlyArray<{
  label: string;
  /** Which plans include it, by plan position 0..3. */
  included: [boolean, boolean, boolean, boolean];
}> = [
  { label: "Daily practice questions", included: [true, true, true, true] },
  { label: "Unlimited questions (no daily cap)", included: [false, true, true, true] },
  { label: "Previous-year question bank", included: [false, true, true, true] },
  { label: "Learning priority engine", included: [false, true, true, true] },
  { label: "Preparation health dashboard", included: [true, true, true, true] },
  { label: "Study timetable", included: [false, true, true, true] },
  { label: "Unlimited bookmarks & notes", included: [false, true, true, true] },
  { label: "Weakness-driven practice", included: [false, true, true, true] },
  { label: "AI answer explanations", included: [false, false, true, true] },
  { label: "Advanced analytics & charts", included: [false, false, true, true] },
  { label: "Report export (CSV/PDF)", included: [false, false, true, true] },
  { label: "AI mock deep analysis", included: [false, false, false, true] },
  { label: "AI custom study plan", included: [false, false, false, true] },
  { label: "Question review access", included: [false, false, true, true] },
  { label: "Exclusive colour identity", included: [false, true, true, true] },
  { label: "Priority support", included: [false, false, false, true] },
];

// ── Helpers ──────────────────────────────────────────────────────────────────

const FEATURE_SETS: Record<PlanId, Set<PlanFeature>> = {
  BASIC: new Set(PLANS.BASIC.features),
  PREMIUM: new Set(PLANS.PREMIUM.features),
  PREMIUM_PLUS: new Set(PLANS.PREMIUM_PLUS.features),
  ROYAL: new Set(PLANS.ROYAL.features),
};

export function isPlanId(value: string): value is PlanId {
  return (PLAN_ORDER as readonly string[]).includes(value);
}

/** Does `plan` include feature `feature`? Unknown plans get nothing. */
export function hasFeature(plan: string | null | undefined, feature: PlanFeature): boolean {
  if (!plan) return false;
  const set = FEATURE_SETS[plan as PlanId];
  return set?.has(feature) ?? false;
}

export function planExists(plan: string): boolean {
  return isPlanId(plan);
}

export function priceFor(
  plan: PlanId,
  cycle: BillingCycle,
  currency: Currency
): number {
  return PLANS[plan].prices[cycle][currency];
}

/** Price expressed as a per-month figure (for the "yearly = X/mo" hint). */
export function monthlyEquivalent(
  plan: PlanId,
  cycle: BillingCycle,
  currency: Currency
): number {
  const total = priceFor(plan, cycle, currency);
  if (total === 0) return 0;
  return Math.round(total / MONTHS_PER_CYCLE[cycle]);
}

export function formatPrice(amount: number, currency: Currency): string {
  if (amount === 0) return "Free";
  if (currency === "INR") {
    return `₹${amount.toLocaleString("en-IN")}`;
  }
  return `$${amount.toFixed(amount % 1 === 0 ? 0 : 2)}`;
}

export function yearlySavingPercent(plan: PlanId): number {
  const monthly = priceFor(plan, "MONTHLY", "INR");
  const yearly = priceFor(plan, "YEARLY", "INR");
  if (monthly === 0) return 0;
  return Math.round((1 - yearly / (monthly * 12)) * 100);
}

/** Migration of the legacy account-tier identities onto the new plans. */
export const LEGACY_TIER_MAP: Record<string, PlanId> = {
  FREE: "BASIC",
  SILVER: "PREMIUM",
  GOLD: "ROYAL",
};

/** The identity colour key each plan grants (null = no exclusive identity). */
export const PLAN_IDENTITY: Record<PlanId, "silver" | "gold" | "royal" | null> = {
  BASIC: null,
  PREMIUM: "silver",
  PREMIUM_PLUS: "gold",
  ROYAL: "royal",
};