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
import { CheckIcon, FlagIcon, TargetIcon } from "@/components/icons";
import type { PrepReport } from "@/lib/tracking";

interface Props {
  report: PrepReport;
}

const TOOLTIP_STYLE = {
  background: "var(--mcq-card)",
  border: "1px solid var(--mcq-line-strong)",
  borderRadius: "0.75rem",
  fontSize: "0.8125rem",
  color: "var(--mcq-fg)",
  boxShadow: "var(--shadow-soft)",
} as const;

export function PreparationDashboard({ report }: Props) {
  const { overall, coverage, subjects, strengths, weaknesses, revisionDue, dailyPlan, trend, alignment, health, learningPriorities } =
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
    <div className="stagger flex flex-col gap-6">
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

      {/* Preparation Health Score */}
      <section className="card p-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 className="section-title flex items-center gap-2">
            <CheckIcon className="h-4 w-4 text-ok" />
            Preparation Health
          </h2>
          <span className="stat-num text-2xl text-gradient">
            {health.score}
            <span className="text-sm text-muted-fg"> / 100</span>
          </span>
        </div>
        {health.reliable ? (
          <>
            <div className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {health.breakdown.map((d) => (
                <div key={d.label} className="rounded-xl border border-line bg-card p-3">
                  <div className="flex items-center justify-between text-sm">
                    <span className="font-medium">{d.label}</span>
                    <span className="stat-num">{d.value}</span>
                  </div>
                  <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-canvas">
                    <div
                      className="h-full rounded-full bg-brand transition-all"
                      style={{ width: `${Math.max(0, Math.min(100, d.value))}%` }}
                    />
                  </div>
                  <p className="mt-2 text-xs text-muted-fg">{d.explanation}</p>
                </div>
              ))}
            </div>
            <p className="mt-3 text-sm font-medium text-muted-fg">
              Next: <span className="text-ink">{health.nextAction}</span>
            </p>
          </>
        ) : (
          <p className="mt-3 text-sm text-muted-fg">
            Answer questions and take at least one mock to unlock an evidence-based health score.
          </p>
        )}
      </section>

      {/* Learning priorities: study this next */}
      {learningPriorities.length > 0 ? (
        <section className="card p-5">
          <h2 className="section-title flex items-center gap-2">
            <TargetIcon className="h-4 w-4 text-brand" />
            Study this next
          </h2>
          <p className="mt-1 text-xs text-subtle-fg">
            Ranked by learning priority: mastery gap, exam weight, revision urgency and neglect.
          </p>
          <ol className="mt-3 flex flex-col gap-2">
            {learningPriorities.map((p, i) => (
              <li key={p.topicId} className="flex items-start gap-3">
                <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-brand text-[10px] font-bold text-on-brand">
                  {i + 1}
                </span>
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <Link
                      href={`/preparation/topic/${p.topicId}`}
                      className="font-semibold text-ink hover:underline"
                    >
                      {p.topicName}
                    </Link>
                    <span className="stat-num text-sm">{p.score}/100</span>
                  </div>
                  <span className="text-xs text-subtle-fg">{p.subjectName}</span>
                  {p.reasons.length > 0 ? (
                    <ul className="mt-1 flex flex-wrap gap-x-3 gap-y-0.5 text-xs text-muted-fg">
                      {p.reasons.map((r) => (
                        <li key={r} className="inline-flex items-center gap-1">
                          <span aria-hidden className="h-1 w-1 rounded-full bg-brand" />
                          {r}
                        </li>
                      ))}
                    </ul>
                  ) : null}
                </div>
              </li>
            ))}
          </ol>
        </section>
      ) : null}

      {/* Today's priority + revision queue */}
      <section className="grid gap-4 lg:grid-cols-2">
        <div className="card p-5">
          <h2 className="section-title">Today&apos;s priority</h2>
          {dailyPlan.priorities.length === 0 ? (
            <p className="mt-3 text-sm text-muted-fg">
              Answer more questions to build an evidence-based plan.
            </p>
          ) : (
            <ol className="mt-3 flex flex-col gap-2">
              {dailyPlan.priorities.map((p, i) => (
                <li key={p.topicId} className="flex items-start gap-3">
                  <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-brand-soft text-[10px] font-bold text-brand">
                    {i + 1}
                  </span>
                  <div>
                    <Link
                      href={`/preparation/topic/${p.topicId}`}
                      className="font-semibold text-ink hover:underline"
                    >
                      {p.topicName}
                    </Link>
                    <span className="ml-2 text-xs text-subtle-fg">{p.subjectName}</span>
                    <ul className="mt-0.5 flex flex-col gap-0.5 text-xs text-muted-fg">
                      {p.reasons.map((r) => (
                        <li key={r} className="flex items-start gap-1.5">
                          <span aria-hidden className="mt-[7px] h-1 w-1 shrink-0 rounded-full bg-brand" />
                          {r}
                        </li>
                      ))}
                    </ul>
                  </div>
                </li>
              ))}
            </ol>
          )}
          {dailyPlan.actions.length > 0 ? (
            <div className="mt-3 border-t border-line pt-3">
              {dailyPlan.actions.map((a, i) => (
                <p key={i} className="text-xs text-muted-fg">
                  {a.note}
                </p>
              ))}
            </div>
          ) : null}
        </div>

        <div className="card p-5">
          <h2 className="section-title flex items-center gap-2">
            <FlagIcon className="h-4 w-4 text-warn" />
            Revision required
          </h2>
          {revisionDue.length === 0 ? (
            <p className="mt-3 text-sm text-muted-fg">Nothing overdue. Nice.</p>
          ) : (
            <ul className="mt-3 flex flex-col gap-3">
              {revisionDue.map((r) => (
                <li
                  key={r.topicId}
                  className="rounded-xl border-l-2 border-warn bg-warn-soft/40 py-1 pl-3 pr-2"
                >
                  <div className="flex items-center justify-between gap-2">
                    <Link
                      href={`/preparation/topic/${r.topicId}`}
                      className="font-semibold text-ink hover:underline"
                    >
                      {r.topicName}
                    </Link>
                    <span className="stat-num text-xs text-warn">
                      {r.mastery == null ? "—" : `${r.mastery.toFixed(0)}%`}
                    </span>
                  </div>
                  <p className="text-xs text-muted-fg">{r.reason}</p>
                </li>
              ))}
            </ul>
          )}
        </div>
      </section>

      {/* Trend */}
      <section className="card p-5">
        <h2 className="section-title">Net score — last 14 days</h2>
        <div className="mt-3 h-56">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={trendData} margin={{ top: 5, right: 5, bottom: 0, left: -20 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} className="stroke-line" />
              <XAxis
                dataKey="day"
                tick={{ fontSize: 11, fill: "var(--mcq-subtle)" }}
                axisLine={false}
                tickLine={false}
              />
              <YAxis
                tick={{ fontSize: 11, fill: "var(--mcq-subtle)" }}
                axisLine={false}
                tickLine={false}
              />
              <Tooltip cursor={{ fill: "color-mix(in oklab, var(--mcq-brand) 6%, transparent)" }} contentStyle={TOOLTIP_STYLE} />
              <Bar dataKey="netScore" name="Net score" className="fill-brand" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </section>

      {/* Subject performance */}
      <section className="card p-5">
        <h2 className="section-title">Subject performance</h2>
        <div className="mt-3 overflow-x-auto">
          <table className="table-clean w-full min-w-[720px]">
            <thead>
              <tr>
                <th>Subject</th>
                <th>Questions</th>
                <th>Accuracy</th>
                <th>Mastery</th>
                <th>Alignment</th>
                <th>Avg time</th>
                <th>PYQ</th>
                <th>Mock</th>
                <th>Trend</th>
              </tr>
            </thead>
            <tbody>
              {subjects.map((s) => (
                <tr key={s.id}>
                  <td>
                    <Link href={`/preparation/subject/${s.id}`} className="font-semibold text-ink hover:underline">
                      {s.name}
                    </Link>
                    {s.expectedShare != null ? (
                      <span className="ml-1 text-xs text-subtle-fg">({s.expectedShare}q)</span>
                    ) : null}
                  </td>
                  <td>{s.stats.attempts}</td>
                  <td>
                    {s.stats.accuracy == null ? "—" : `${s.stats.accuracy.toFixed(0)}%`}
                  </td>
                  <td className="stat-num">
                    {s.mastery == null ? "—" : s.mastery.toFixed(0)}
                  </td>
                  <td>{s.alignment}</td>
                  <td>
                    {s.stats.attempts > 0 ? `${(s.stats.averageTimeMs / 1000).toFixed(0)}s` : "—"}
                  </td>
                  <td>
                    {s.stats.pyqAccuracy == null ? "—" : `${s.stats.pyqAccuracy.toFixed(0)}%`}
                  </td>
                  <td>
                    {s.stats.mockAccuracy == null ? "—" : `${s.stats.mockAccuracy.toFixed(0)}%`}
                  </td>
                  <td>
                    <TrendBadge trend={s.trend} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section className="grid gap-4 lg:grid-cols-2">
        <div className="card p-5">
          <h2 className="section-title flex items-center gap-2">
            <CheckIcon className="h-4 w-4 text-ok" />
            Strong areas
          </h2>
          <ul className="mt-3 flex flex-col gap-2">
            {strengths.length === 0 ? (
              <p className="text-sm text-muted-fg">No reliable strengths yet — keep practicing.</p>
            ) : (
              strengths.map((s) => (
                <li
                  key={s.id}
                  className="flex items-center justify-between rounded-xl px-3 py-2 text-sm transition-colors hover:bg-ok-soft/50"
                >
                  <Link href={`/preparation/topic/${s.id}`} className="font-semibold text-ink hover:underline">
                    {s.name}
                  </Link>
                  <span className="text-xs text-subtle-fg">
                    {s.mastery == null ? "—" : `Mastery ${s.mastery.toFixed(0)}`}
                    {s.accuracy != null ? ` · ${s.accuracy.toFixed(0)}%` : ""}
                  </span>
                </li>
              ))
            )}
          </ul>
        </div>

        <div className="card p-5">
          <h2 className="section-title flex items-center gap-2">
            <FlagIcon className="h-4 w-4 text-bad" />
            Weak areas
          </h2>
          <ul className="mt-3 flex flex-col gap-2">
            {weaknesses.length === 0 ? (
              <p className="text-sm text-muted-fg">No weak areas detected.</p>
            ) : (
              weaknesses.map((w) => (
                <li
                  key={w.id}
                  className="flex items-center justify-between gap-2 rounded-xl px-3 py-2 text-sm transition-colors hover:bg-bad-soft/50"
                >
                  <Link href={`/preparation/topic/${w.id}`} className="font-semibold text-ink hover:underline">
                    {w.name}
                  </Link>
                  <span className="stat-num text-xs text-bad">priority {w.weakness.score}/100</span>
                </li>
              ))
            )}
          </ul>
        </div>
      </section>

      {/* Coverage chart */}
      <section className="card p-5">
        <h2 className="section-title">Syllabus coverage — studied vs mastery</h2>
        <div className="mt-3 h-64">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={coverageData} layout="vertical" margin={{ top: 0, right: 10, bottom: 0, left: 10 }}>
              <CartesianGrid strokeDasharray="3 3" horizontal={false} className="stroke-line" />
              <XAxis
                type="number"
                domain={[0, 100]}
                tick={{ fontSize: 11, fill: "var(--mcq-subtle)" }}
                axisLine={false}
                tickLine={false}
              />
              <YAxis
                type="category"
                dataKey="name"
                width={190}
                tick={{ fontSize: 11, fill: "var(--mcq-muted)" }}
                axisLine={false}
                tickLine={false}
              />
              <Tooltip cursor={{ fill: "color-mix(in oklab, var(--mcq-brand) 6%, transparent)" }} contentStyle={TOOLTIP_STYLE} />
              <Bar dataKey="mastered" name="Mastery estimate" className="fill-ok" radius={[0, 4, 4, 0]} barSize={14} />
            </BarChart>
          </ResponsiveContainer>
        </div>
        <p className="mt-2 text-xs text-subtle-fg">
          A topic counts as studied once you open its material, but mastery only rises with real
          practice — opening a page alone never marks a topic complete.
        </p>
      </section>
    </div>
  );
}

function ScorecardTile({ label, value, sub }: { label: string; value: string; sub?: string }) {
  return (
    <div className="card p-4">
      <dt className="text-xs font-medium text-muted-fg">{label}</dt>
      <dd className="stat-num mt-1 text-xl text-ink">{value}</dd>
      {sub ? <dd className="mt-0.5 text-xs text-subtle-fg">{sub}</dd> : null}
    </div>
  );
}

function TrendBadge({ trend }: { trend: "improving" | "stable" | "declining" }) {
  const map = {
    improving: { label: "↑ Improving", className: "text-ok" },
    stable: { label: "→ Stable", className: "text-muted-fg" },
    declining: { label: "↓ Declining", className: "text-bad" },
  } as const;
  const m = map[trend];
  return <span className={`text-xs font-semibold ${m.className}`}>{m.label}</span>;
}
