import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/api";
import { entitledPlan } from "@/lib/entitlements";
import { FEATURE_CATALOG, PLANS, type PlanFeature } from "@/lib/plans";
import { LockIcon, SparklesIcon } from "@/components/icons";

interface Props {
  /** The feature the page needs; unknown = not entitled. */
  required: PlanFeature;
  title?: string;
  description?: string;
  children: React.ReactNode;
}

const FEATURE_LABEL: Record<string, string> = Object.fromEntries(
  FEATURE_CATALOG.map((f) => [f.id, f.label])
);

/**
 * Server-side page gate. When the signed-in user's plan includes `required`,
 * renders children; otherwise renders a full upgrade screen instead of the
 * page. Handles login redirect the same way pages do.
 */
export async function PlanGate({ required, title, description, children }: Props) {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const plan = await entitledPlan(user);
  if (plan.features.has(required)) {
    return <>{children}</>;
  }

  const feature = FEATURE_CATALOG.find((f) => f.id === required);
  const unlock = feature
    ? feature.highlights.find((p) => p !== "BASIC")
    : undefined;
  const unlockPlan = unlock ? PLANS[unlock] : null;

  return (
    <div className="flex flex-col items-center gap-5 py-14 text-center">
      <span className="flex h-16 w-16 items-center justify-center rounded-3xl bg-brand-soft text-brand">
        <LockIcon className="h-7 w-7" />
      </span>
      <div className="max-w-xl">
        <p className="kicker">Limited access</p>
        <h1 className="mt-2 text-2xl font-bold tracking-tight sm:text-3xl">
          {title ?? `${FEATURE_LABEL[required] ?? "This feature"} is a paid feature`}
        </h1>
        <p className="mt-3 text-sm leading-relaxed text-muted-fg">
          {description ??
            (feature
              ? `"${FEATURE_LABEL[feature.id] ?? feature.id}" is included with the ${unlockPlan?.name ?? "paid"} plans. Upgrade your Basic account to unlock it and much more.`
              : "Upgrade your plan to unlock this feature.")}
        </p>
      </div>
      <div className="flex flex-wrap items-center justify-center gap-3">
        <Link href="/pricing" className="btn btn-primary">
          <SparklesIcon className="h-4 w-4" />
          {unlockPlan ? `Unlock with ${unlockPlan.name}` : "View plans & pricing"}
        </Link>
        <Link href="/" className="btn btn-ghost">
          Go back home
        </Link>
      </div>
      <p className="max-w-md text-xs leading-relaxed text-subtle-fg">
        Your free Basic plan keeps daily practice, the health dashboard and the
        core question bank available — paid plans add mock tests, PYQs, deep
        analytics and more.
      </p>
    </div>
  );
}