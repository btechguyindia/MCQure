import { redirect } from "next/navigation";
import type { Metadata } from "next";
import { getCurrentUser } from "@/lib/api";
import { getReport } from "@/lib/reports";

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
    <div className="flex flex-col gap-6">
      <header>
        <h1 className="text-2xl font-bold">📊 Reports</h1>
        <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
          Weekly and monthly aggregates derived from your permanent attempt history.
          Export as CSV or JSON for your own tracking.
        </p>
      </header>

      {sections.map(({ title, report }) => {
        const t = report.totals;
        return (
          <section key={title} className="rounded-2xl border border-zinc-200 bg-white p-5 dark:border-zinc-800 dark:bg-zinc-900">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <h2 className="text-base font-bold">{title}</h2>
              <div className="flex gap-2">
                <a
                  href={`/api/reports/export?period=${t.period}&format=csv`}
                  className="rounded-lg border border-zinc-300 px-3 py-1.5 text-xs font-semibold hover:bg-zinc-100 dark:border-zinc-700 dark:hover:bg-zinc-800"
                >
                  CSV
                </a>
                <a
                  href={`/api/reports/export?period=${t.period}&format=json`}
                  className="rounded-lg border border-zinc-300 px-3 py-1.5 text-xs font-semibold hover:bg-zinc-100 dark:border-zinc-700 dark:hover:bg-zinc-800"
                >
                  JSON
                </a>
              </div>
            </div>

            <div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-4">
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
              <div className="mt-4 overflow-x-auto">
                <table className="w-full min-w-[420px] text-left text-sm">
                  <thead>
                    <tr className="border-b border-zinc-200 text-xs uppercase tracking-wide text-zinc-500 dark:border-zinc-700">
                      <th className="py-2 pr-4">Subject</th>
                      <th className="py-2 pr-4 text-right">Total</th>
                      <th className="py-2 pr-4 text-right">Correct</th>
                      <th className="py-2 pr-4 text-right">Incorrect</th>
                      <th className="py-2 pr-4 text-right">Accuracy</th>
                      <th className="py-2 text-right">Net score</th>
                    </tr>
                  </thead>
                  <tbody>
                    {report.bySubject.map((r) => (
                      <tr key={r.subject} className="border-b border-zinc-100 dark:border-zinc-800">
                        <td className="py-2 pr-4 font-medium">{r.subject}</td>
                        <td className="py-2 pr-4 text-right tabular-nums">{r.total}</td>
                        <td className="py-2 pr-4 text-right tabular-nums">{r.correct}</td>
                        <td className="py-2 pr-4 text-right tabular-nums">{r.incorrect}</td>
                        <td className="py-2 pr-4 text-right tabular-nums">{r.accuracy == null ? "—" : `${r.accuracy.toFixed(1)}%`}</td>
                        <td className="py-2 text-right tabular-nums">{r.netScore > 0 ? `+${r.netScore}` : r.netScore}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <p className="mt-3 text-sm text-zinc-500">No activity in this period yet.</p>
            )}
          </section>
        );
      })}
    </div>
  );
}

function ReportStat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-zinc-200 bg-zinc-50 p-3 text-center dark:border-zinc-700 dark:bg-zinc-800/60">
      <p className="text-lg font-bold">{value}</p>
      <p className="text-xs text-zinc-500 dark:text-zinc-400">{label}</p>
    </div>
  );
}
