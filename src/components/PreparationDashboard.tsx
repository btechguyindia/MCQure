"use client";

import Link from "next/link";
import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import type { PrepReport } from "@/lib/tracking";

interface Props {
  report: PrepReport;
}

export function PreparationDashboard({ report }: Props) {
  const { overall, coverage, subjects, strengths, weaknesses, revisionDue, dailyPlan, trend, alignment } =
    report;

  const mastery = overall.mastery;
  const score = overall.netScore;

  const trendData = trend.map((t) => ({
    day: t.day.slice(5),
    netScore: t.netScore,
    attempts: t.attempts,
  }));

  const coverageData = subjects
    .map((s) => ({
      name: s.name,
      studied: s.lastPracticedDays !== null || s.lastVisitedDays !== null ? 100 : 0,
      mastered: s.stats.attempts > 0 ? Math.round(s.mastery ?? 0) : 0,
    }))
    .sort((a, b) => b.mastered - a.mastered);

  return (
    <div className="flex flex-col gap-6">
      {/* Scorecard */}
      <section className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <ScorecardTile
          label="Overall mastery"
          value={mastery == null ? "—" : `${mastery.toFixed(0)}/100`}
          sub={overall.masteryReliable ? undefined : "insufficient data"}
        />
        <ScorecardTile label="Exam alignment" value={`${alignment}/100`} sub="vs blueprint" />
        <ScorecardTile
          label="Practice accuracy"
          value={overall.practiceAccuracy == null ? "—" : `${overall.practiceAccuracy.toFixed(0)}%`}
        />
        <ScorecardTile
          label="Mock average"
          value={overall.mockAccuracy == null ? "—" : `${overall.mockAccuracy.toFixed(0)}%`}
          sub={`${overall.completedMocks} completed`}
        />
        <ScorecardTile
          label="PYQ accuracy"
          value={overall.pyqAccuracy == null ? "—" : `${overall.pyqAccuracy.toFixed(0)}%`}
        />
        <ScorecardTile
          label="Syllabus coverage"
          value={`${coverage.studiedPct.toFixed(0)}%`}
          sub={`${coverage.studied}/${coverage.totalTopics} topics`}
        />
        <ScorecardTile
          label="Net score"
          value={score > 0 ? `+${score.toFixed(1)}` : score.toFixed(1)}
        />
        <ScorecardTile
          label="Questions/day (7d)"
          value={String(overall.questionsPerDay7d)}
          sub={`target ${report.preparation?.dailyTarget ?? 25}/day`}
        />
      </section>

      {/* Today's priority + revision queue */}
      <section className="grid gap-4 lg:grid-cols-2">
        <div className="rounded-2xl border border-zinc-200 bg-white p-5 dark:border-zinc-800 dark:bg-zinc-900">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-zinc-500">
            Today&apos;s priority
          </h2>
          {dailyPlan.priorities.length === 0 ? (
            <p className="mt-3 text-sm text-zinc-500">
              Answer more questions to build an evidence-based plan.
            </p>
          ) : (
            <ol className="mt-3 flex flex-col gap-2">
              {dailyPlan.priorities.map((p, i) => (
                <li key={p.topicId} className="flex items-start gap-3">
                  <span className="mt-0.5 rounded-full bg-indigo-100 px-2 py-0.5 text-xs font-bold text-indigo-700 dark:bg-indigo-900/50 dark:text-indigo-300">
                    {i + 1}
                  </span>
                  <div>
                    <Link
                      href={`/preparation/topic/${p.topicId}`}
                      className="font-semibold hover:underline"
                    >
                      {p.topicName}
                    </Link>
                    <span className="ml-2 text-xs text-zinc-400">{p.subjectName}</span>
                    <ul className="mt-0.5 flex flex-col gap-0.5 text-xs text-zinc-500">
                      {p.reasons.map((r) => (
                        <li key={r}>• {r}</li>
                      ))}
                    </ul>
                  </div>
                </li>
              ))}
            </ol>
          )}
          {dailyPlan.actions.length > 0 ? (
            <div className="mt-3 border-t border-zinc-100 pt-3 dark:border-zinc-800">
              {dailyPlan.actions.map((a, i) => (
                <p key={i} className="text-xs text-zinc-600 dark:text-zinc-400">
                  {a.note}
                </p>
              ))}
            </div>
          ) : null}
        </div>

        <div className="rounded-2xl border border-zinc-200 bg-white p-5 dark:border-zinc-800 dark:bg-zinc-900">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-zinc-500">
            🔴 Revision required
          </h2>
          {revisionDue.length === 0 ? (
            <p className="mt-3 text-sm text-zinc-500">Nothing overdue. Nice.</p>
          ) : (
            <ul className="mt-3 flex flex-col gap-3">
              {revisionDue.map((r) => (
                <li key={r.topicId}>
                  <div className="flex items-center justify-between gap-2">
                    <Link
                      href={`/preparation/topic/${r.topicId}`}
                      className="font-semibold hover:underline"
                    >
                      {r.topicName}
                    </Link>
                    <span className="text-xs text-zinc-400">
                      {r.mastery == null ? "—" : `${r.mastery.toFixed(0)}%`}
                    </span>
                  </div>
                  <p className="text-xs text-zinc-500">{r.reason}</p>
                </li>
              ))}
            </ul>
          )}
        </div>
      </section>

      {/* Trend */}
      <section className="rounded-2xl border border-zinc-200 bg-white p-5 dark:border-zinc-800 dark:bg-zinc-900">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-zinc-500">
          Net score — last 14 days
        </h2>
        <div className="mt-3 h-56">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={trendData} margin={{ top: 5, right: 5, bottom: 0, left: -20 }}>
              <CartesianGrid strokeDasharray="3 3" className="stroke-zinc-200 dark:stroke-zinc-800" />
              <XAxis dataKey="day" tick={{ fontSize: 11 }} />
              <YAxis tick={{ fontSize: 11 }} />
              <Tooltip />
              <Bar dataKey="netScore" fill="#6366f1" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </section>

      {/* Subject performance */}
      <section className="rounded-2xl border border-zinc-200 bg-white p-5 dark:border-zinc-800 dark:bg-zinc-900">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-zinc-500">
          Subject performance
        </h2>
        <div className="mt-3 overflow-x-auto">
          <table className="w-full min-w-[720px] text-sm">
            <thead>
              <tr className="text-left text-xs uppercase text-zinc-400">
                <th className="pb-2 pr-3">Subject</th>
                <th className="pb-2 pr-3">Questions</th>
                <th className="pb-2 pr-3">Accuracy</th>
                <th className="pb-2 pr-3">Mastery</th>
                <th className="pb-2 pr-3">Alignment</th>
                <th className="pb-2 pr-3">Avg time</th>
                <th className="pb-2 pr-3">PYQ</th>
                <th className="pb-2 pr-3">Mock</th>
                <th className="pb-2">Trend</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800">
              {subjects.map((s) => (
                <tr key={s.id} className="text-zinc-700 dark:text-zinc-300">
                  <td className="py-2 pr-3">
                    <Link href={`/preparation/subject/${s.id}`} className="font-semibold hover:underline">
                      {s.name}
                    </Link>
                    {s.expectedShare != null ? (
                      <span className="ml-1 text-xs text-zinc-400">({s.expectedShare}q)</span>
                    ) : null}
                  </td>
                  <td className="py-2 pr-3">{s.stats.attempts}</td>
                  <td className="py-2 pr-3">
                    {s.stats.accuracy == null ? "—" : `${s.stats.accuracy.toFixed(0)}%`}
                  </td>
                  <td className="py-2 pr-3">
                    {s.mastery == null ? "—" : s.mastery.toFixed(0)}
                  </td>
                  <td className="py-2 pr-3">{s.alignment}</td>
                  <td className="py-2 pr-3">
                    {s.stats.attempts > 0 ? `${(s.stats.averageTimeMs / 1000).toFixed(0)}s` : "—"}
                  </td>
                  <td className="py-2 pr-3">
                    {s.stats.pyqAccuracy == null ? "—" : `${s.stats.pyqAccuracy.toFixed(0)}%`}
                  </td>
                  <td className="py-2 pr-3">
                    {s.stats.mockAccuracy == null ? "—" : `${s.stats.mockAccuracy.toFixed(0)}%`}
                  </td>
                  <td className="py-2">
                    <TrendBadge trend={s.trend} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section className="grid gap-4 lg:grid-cols-2">
        <div className="rounded-2xl border border-zinc-200 bg-white p-5 dark:border-zinc-800 dark:bg-zinc-900">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-zinc-500">
            🟢 Strong areas
          </h2>
          <ul className="mt-3 flex flex-col gap-2">
            {strengths.length === 0 ? (
              <p className="text-sm text-zinc-500">No reliable strengths yet — keep practicing.</p>
            ) : (
              strengths.map((s) => (
                <li key={s.id} className="flex items-center justify-between text-sm">
                  <Link href={`/preparation/topic/${s.id}`} className="font-semibold hover:underline">
                    {s.name}
                  </Link>
                  <span className="text-xs text-zinc-400">
                    {s.mastery == null ? "—" : `Mastery ${s.mastery.toFixed(0)}`}
                    {s.accuracy != null ? ` · ${s.accuracy.toFixed(0)}%` : ""}
                  </span>
                </li>
              ))
            )}
          </ul>
        </div>

        <div className="rounded-2xl border border-zinc-200 bg-white p-5 dark:border-zinc-800 dark:bg-zinc-900">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-zinc-500">
            🔴 Weak areas
          </h2>
          <ul className="mt-3 flex flex-col gap-2">
            {weaknesses.length === 0 ? (
              <p className="text-sm text-zinc-500">No weak areas detected.</p>
            ) : (
              weaknesses.map((w) => (
                <li key={w.id} className="flex items-center justify-between gap-2 text-sm">
                  <Link href={`/preparation/topic/${w.id}`} className="font-semibold hover:underline">
                    {w.name}
                  </Link>
                  <span className="text-xs text-zinc-400">priority {w.weakness.score}/100</span>
                </li>
              ))
            )}
          </ul>
        </div>
      </section>

      {/* Coverage chart */}
      <section className="rounded-2xl border border-zinc-200 bg-white p-5 dark:border-zinc-800 dark:bg-zinc-900">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-zinc-500">
          Syllabus coverage — studied vs mastery
        </h2>
        <div className="mt-3 h-64">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={coverageData} layout="vertical" margin={{ top: 0, right: 10, bottom: 0, left: 10 }}>
              <CartesianGrid strokeDasharray="3 3" className="stroke-zinc-200 dark:stroke-zinc-800" />
              <XAxis type="number" domain={[0, 100]} tick={{ fontSize: 11 }} />
              <YAxis type="category" dataKey="name" width={190} tick={{ fontSize: 11 }} />
              <Tooltip />
              <Bar dataKey="mastered" name="Mastery estimate" fill="#10b981" radius={[0, 4, 4, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
        <p className="mt-2 text-xs text-zinc-500">
          A topic counts as studied once you open its material, but mastery only rises with real
          practice — opening a page alone never marks a topic complete.
        </p>
      </section>
    </div>
  );
}

function ScorecardTile({ label, value, sub }: { label: string; value: string; sub?: string }) {
  return (
    <div className="rounded-2xl border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900">
      <dt className="text-xs text-zinc-500 dark:text-zinc-400">{label}</dt>
      <dd className="mt-1 text-xl font-bold">{value}</dd>
      {sub ? <dd className="text-xs text-zinc-400">{sub}</dd> : null}
    </div>
  );
}

function TrendBadge({ trend }: { trend: "improving" | "stable" | "declining" }) {
  const map = {
    improving: { label: "↑ Improving", className: "text-emerald-600 dark:text-emerald-400" },
    stable: { label: "→ Stable", className: "text-zinc-500" },
    declining: { label: "↓ Declining", className: "text-red-600 dark:text-red-400" },
  } as const;
  const m = map[trend];
  return <span className={`text-xs font-semibold ${m.className}`}>{m.label}</span>;
}
