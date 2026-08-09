import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/api";
import { getPrepReport } from "@/lib/tracking";
import { PreparationDashboard } from "@/components/PreparationDashboard";
import { PreparationSettings } from "@/components/PreparationSettings";

export const metadata = { title: "My Preparation — MCQure" };

export default async function PreparationPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const report = await getPrepReport(user.id);

  return (
    <div className="flex flex-col gap-6">
      <header className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold">📊 My Preparation</h1>
          <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
            Where you are, what you have covered, what is weak, and what to do today —
            computed from your full attempt, study and mock history.
          </p>
        </div>
        <PreparationSettings
          preparation={report.preparation}
          examName={report.exam?.name ?? null}
        />
      </header>

      <PreparationDashboard report={report} />

      <p className="text-center text-xs text-zinc-400">
        Alignment and weights use the configured blueprint. Where the exact exam weight is
        unknown it is marked <Link href="/pyq" className="underline">Estimated / Unknown</Link> and the
        basis is disclosed — nothing is fabricated.
      </p>
    </div>
  );
}
