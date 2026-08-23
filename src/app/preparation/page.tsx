import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/api";
import { getPrepReport } from "@/lib/tracking";
import { ProgressIcon, ClockIcon } from "@/components/icons";
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
          <p className="kicker">Command center</p>
          <h1 className="mt-2 flex items-center gap-2 text-2xl font-bold tracking-tight sm:text-3xl">
            <ProgressIcon className="h-6 w-6 text-brand" />
            My Preparation
          </h1>
          <p className="mt-1 max-w-2xl text-sm text-muted-fg">
            Where you are, what you have covered, what is weak, and what to do today —
            computed from your full attempt, study and mock history.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Link href="/preparation/timetable" className="btn btn-secondary btn-sm">
            <ClockIcon />
            Timetable
          </Link>
          <PreparationSettings
            preparation={report.preparation}
            examName={report.exam?.name ?? null}
          />
        </div>
      </header>

      <PreparationDashboard report={report} />

      <p className="text-center text-xs text-subtle-fg">
        Alignment and weights use the configured blueprint. Where the exact exam weight is
        unknown it is marked <Link href="/pyq" className="link">Estimated / Unknown</Link> and the
        basis is disclosed — nothing is fabricated.
      </p>
    </div>
  );
}
