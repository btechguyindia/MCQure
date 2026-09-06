import { redirect } from "next/navigation";
import type { Metadata } from "next";
import { getCurrentUser } from "@/lib/api";
import { getReport } from "@/lib/reports";
import { ReportsIcon } from "@/components/icons";
import { PlanGate } from "@/components/PlanGate";

export const metadata: Metadata = { title: "Reports — MCQure" };

function fmt(s: number) {
  const m = Math.floor(s / 60);
  const sec = Math.round(s % 60);
  return `${m}m ${sec}s`;
}

export default async function ReportsPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const [week, month] = await Promise.all([
    getReport(user.id, "week"),
    getReport(user.id, "month"),
  ]);

  const sections: Array<{ title: string; report: typeof week }> = [
    { title: "Last 7 days", report: week },
    { title: "Last 30 days", report: month },
  ];

  return (
    <PlanGate
      required="reports_export"
      title="Reports are a paid feature"
      description="CSV/JSON export and the full reports dashboard are included with Premium Plus and Royal. Basic keeps the preparation health view."
    >
      <div className="stagger flex flex-col gap-6">
      <header>
        <p className="kicker">Progress reports</p>
        <h1 className="mt-2 flex items-center gap-2.5 text-2xl font-bold tracking-tight">
          <ReportsIcon className="h-6 w-6 text-brand" />
          Reports
        </h1>
        <p className="mt-1 max-w-2xl text-sm text-muted-fg">
          Weekly and monthly aggregates derived from your permanent attempt history.
          Export as CSV or JSON for your own tracking.
        </p>
      </header>

      {sections.map(({ title, report }) => {
        const t = report.totals;
        return (
          <section key={title} className="card p-5">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <span className="inline-flex items-center rounded-xl bg-brand-soft px-3.5 py-2 text-sm font-semibold text-brand">
                {title}
              </span>
              <div className="flex gap-2">
                <a
                  href={`/api/reports/export?period=${t.period}&format=csv`}
                  className="btn btn-secondary btn-sm"
                >
                  CSV
                </a>
                <a
                  href={`/api/reports/export?period=${t.period}&format=json`}
                  className="btn btn-primary btn-sm"
                >
                  JSON
                </a>
              </div>
            </div>

            <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
              <ReportStat label="Attempts" value={String(t.total)} />
              <ReportStat label="Answered" value={String(t.answered)} />
              <ReportStat label="Correct" value={String(t.correct)} />
              <ReportStat label="Incorrect" value={String(t.incorrect)} />
              <ReportStat label="Accuracy" value={t.accuracy == null ? "—" : `${t.accuracy.toFixed(1)}%`} />
              <ReportStat label="Net score" value={t.netScore > 0 ? `+${t.netScore}` : String(t.netScore)} />
              <ReportStat label="Time spent" value={fmt(t.timeSpentMs)} />
              <ReportStat label="Streak" value={`${t.streak.current} (best ${t.streak.best})`} />
            </div>

            {report.bySubject.length > 0 ? (
              <div className="mt-5 overflow-x-auto">
                <table className="w-full min-w-[420px] text-left text-sm">
                  <thead>
                    <tr className="border-b border-line-strong">
                      <th className="py-2 pr-4 text-xs font-semibold uppercase tracking-wide text-subtle-fg">Subject</th>
                      <th className="py-2 pr-4 text-right text-xs font-semibold uppercase tracking-wide text-subtle-fg">Total</th>
                      <th className="py-2 pr-4 text-right text-xs font-semibold uppercase tracking-wide text-subtle-fg">Correct</th>
                      <th className="py-2 pr-4 text-right text-xs font-semibold uppercase tracking-wide text-subtle-fg">Incorrect</th>
                      <th className="py-2 pr-4 text-right text-xs font-semibold uppercase tracking-wide text-subtle-fg">Accuracy</th>
                      <th className="py-2 text-right text-xs font-semibold uppercase tracking-wide text-subtle-fg">Net score</th>
                    </tr>
                  </thead>
                  <tbody>
                    {report.bySubject.map((r) => (
                      <tr key={r.subject} className="border-b border-line transition-colors hover:bg-brand-soft/40">
                        <td className="py-2.5 pr-4 font-medium">{r.subject}</td>
                        <td className="stat-num py-2.5 pr-4 text-right text-sm">{r.total}</td>
                        <td className="py-2.5 pr-4 text-right tabular-nums text-ok">{r.correct}</td>
                        <td className="py-2.5 pr-4 text-right tabular-nums text-bad">{r.incorrect}</td>
                        <td className="stat-num py-2.5 pr-4 text-right text-sm">{r.accuracy == null ? "—" : `${r.accuracy.toFixed(1)}%`}</td>
                        <td
                          className={`stat-num py-2.5 text-right text-sm ${
                            r.netScore > 0 ? "text-ok" : r.netScore < 0 ? "text-bad" : ""
                          }`}
                        >
                          {r.netScore > 0 ? `+${r.netScore}` : r.netScore}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <p className="mt-4 text-sm text-subtle-fg">No activity in this period yet.</p>
            )}
          </section>
        );
      })}
    </div>
    </PlanGate>
  );
}

function ReportStat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-line bg-card-strong p-3 text-center">
      <p className="stat-num text-lg text-ink">{value}</p>
      <p className="section-title mt-1">{label}</p>
    </div>
  );
}
