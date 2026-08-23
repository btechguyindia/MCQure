"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Line,
  LineChart,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import {
  ArrowRightIcon,
  FlagIcon,
  ProgressIcon,
  SparklesIcon,
  StudyIcon,
  TargetIcon,
  XIcon,
} from "@/components/icons";

interface AnalyticsResponse {
  ok: boolean;
  analytics?: {
    summary: {
      total: number;
      answered: number;
      correct: number;
      incorrect: number;
      unattempted: number;
      accuracy: number | null;
      netScore: number;
      averageTimeMs: number;
      medianTimeMs: number;
    };
    streak: { current: number; best: number; hasActivityToday: boolean };
    trend: Array<{ day: string; attempts: number; netScore: number }>;
    bySubject: Array<{ group: string; attempts: number; correct: number; accuracy: number | null; avgTimeMs: number }>;
    byTopic: Array<{ group: string; attempts: number; correct: number; accuracy: number | null; avgTimeMs: number }>;
    errorTypes: Array<{ type: string; count: number }>;
    confidence: {
      highCorrect: number;
      highWrong: number;
      lowCorrect: number;
      lowWrong: number;
      highAccuracy: number | null;
      lowAccuracy: number | null;
    };
    mistakes: Array<{
      id: string;
      questionId: string;
      text: string;
      subject: string;
      topic: string;
      difficulty: string;
      isCorrect: boolean | null;
      createdAt: string;
    }>;
  };
  message?: string;
}

const TICK_STYLE = { fill: "var(--mcq-subtle)", fontSize: 11 };
const TOOLTIP_CONTENT_STYLE = {
  background: "var(--mcq-card)",
  border: "1px solid var(--mcq-line)",
  borderRadius: 12,
  color: "var(--mcq-fg)",
  boxShadow: "var(--shadow-lift)",
  fontSize: 12,
};

export function AnalyticsDashboard() {
  const router = useRouter();
  const [data, setData] = useState<AnalyticsResponse["analytics"] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [reviewBusy, setReviewBusy] = useState(false);

  useEffect(() => {
    fetch("/api/analytics")
      .then((r) => r.json() as Promise<AnalyticsResponse>)
      .then((d) => (d.ok && d.analytics ? setData(d.analytics) : setError(d.message ?? "Could not load analytics")))
      .catch(() => setError("Could not load analytics"));
  }, []);

  async function startReview() {
    setReviewBusy(true);
    try {
      const res = await fetch("/api/practice/start", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ mode: "review" }),
      });
      const d = (await res.json()) as { ok: boolean; session?: { id: string }; message?: string };
      if (!res.ok || !d.ok || !d.session) {
        setError(d.message ?? "Could not start review");
        setReviewBusy(false);
        return;
      }
      router.push(`/practice/session?sessionId=${d.session.id}`);
    } catch {
      setError("Network error. Please try again.");
      setReviewBusy(false);
    }
  }

  if (error) {
    return (
      <div className="card p-6 text-center" role="alert">
        <p className="inline-flex items-center gap-2 text-sm font-medium text-bad">
          <XIcon />
          {error}
        </p>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="flex flex-col gap-6" role="status" aria-label="Loading analytics">
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
          {Array.from({ length: 6 }, (_, i) => (
            <div key={i} className="card p-4">
              <div className="skeleton mx-auto h-7 w-14" />
              <div className="skeleton mx-auto mt-2 h-2.5 w-20" />
            </div>
          ))}
        </div>
        {[0, 1].map((i) => (
          <div key={i} className="card p-5">
            <div className="skeleton h-3 w-44" />
            <div className="skeleton mt-4 h-56" />
          </div>
        ))}
      </div>
    );
  }

  const { summary, streak, trend, bySubject, byTopic, errorTypes, confidence, mistakes } = data;
  const accuracy = summary.accuracy == null ? "—" : `${summary.accuracy.toFixed(1)}%`;
  const subjectChart = bySubject.map((s) => ({
    name: s.group,
    accuracy: s.accuracy == null ? 0 : Math.round(s.accuracy),
  }));

  return (
    <div className="flex flex-col gap-6">
      <div className="stagger grid grid-cols-2 gap-3 sm:grid-cols-3">
        <StatCard label="Attempts" value={String(summary.total)} />
        <StatCard label="Accuracy" value={accuracy} />
        <div className="card card-hover p-4 text-center">
          <p
            className={`stat-num text-xl ${
              summary.netScore > 0 ? "text-ok" : summary.netScore < 0 ? "text-bad" : "text-ink"
            }`}
          >
            {summary.netScore > 0 ? `+${summary.netScore}` : String(summary.netScore)}
          </p>
          <p className="kicker mt-1.5 justify-center">Net score</p>
        </div>
        <StatCard label="Streak" value={`${streak.current} day${streak.current === 1 ? "" : "s"}`} />
        <StatCard label="Avg time" value={`${(summary.averageTimeMs / 1000).toFixed(0)}s`} />
        <StatCard label="Missed" value={String(summary.incorrect + summary.unattempted)} />
      </div>

      {/* Trend */}
      <section className="card p-5">
        <h2 className="section-title flex items-center gap-2">
          <ProgressIcon className="h-3.5 w-3.5 text-brand" />
          Net score — last 14 days
        </h2>
        <div className="mt-4 h-56">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={trend} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--mcq-line)" />
              <XAxis
                dataKey="day"
                tick={TICK_STYLE}
                tickLine={false}
                axisLine={{ stroke: "var(--mcq-line)" }}
                interval="preserveStartEnd"
              />
              <YAxis tick={TICK_STYLE} tickLine={false} axisLine={false} />
              <Tooltip
                contentStyle={TOOLTIP_CONTENT_STYLE}
                labelStyle={{ color: "var(--mcq-muted)", fontSize: 12, fontWeight: 600 }}
                itemStyle={{ color: "var(--mcq-fg)", fontSize: 12 }}
                cursor={{ stroke: "var(--mcq-line-strong)" }}
              />
              <ReferenceLine y={0} stroke="var(--mcq-line-strong)" />
              <Line
                type="monotone"
                dataKey="netScore"
                stroke="var(--mcq-brand)"
                strokeWidth={2}
                dot={{ r: 2, fill: "var(--mcq-brand)", strokeWidth: 0 }}
                activeDot={{ r: 4, fill: "var(--mcq-brand)" }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </section>

      {/* Subject accuracy */}
      {subjectChart.length > 0 ? (
        <section className="card p-5">
          <h2 className="section-title flex items-center gap-2">
            <TargetIcon className="h-3.5 w-3.5 text-brand" />
            Accuracy by subject
          </h2>
          <div className="mt-4 h-56">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={subjectChart} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--mcq-line)" vertical={false} />
                <XAxis
                  dataKey="name"
                  tick={{ fill: "var(--mcq-subtle)", fontSize: 11 }}
                  tickLine={false}
                  axisLine={{ stroke: "var(--mcq-line)" }}
                  interval={0}
                  angle={-25}
                  textAnchor="end"
                  height={60}
                />
                <YAxis domain={[0, 100]} tick={TICK_STYLE} tickLine={false} axisLine={false} />
                <Tooltip
                  contentStyle={TOOLTIP_CONTENT_STYLE}
                  labelStyle={{ color: "var(--mcq-muted)", fontSize: 12, fontWeight: 600 }}
                  itemStyle={{ color: "var(--mcq-fg)", fontSize: 12 }}
                  cursor={{ fill: "var(--mcq-brand-soft)" }}
                />
                <Bar dataKey="accuracy" radius={[4, 4, 0, 0]}>
                  {subjectChart.map((d, i) => (
                    <Cell
                      key={i}
                      fill={
                        d.accuracy >= 70
                          ? "var(--mcq-brand)"
                          : d.accuracy >= 50
                            ? "var(--mcq-warn)"
                            : "var(--mcq-bad)"
                      }
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </section>
      ) : null}

      {/* Topic breakdown */}
      {byTopic.length > 0 ? (
        <section className="card p-5">
          <h2 className="section-title flex items-center gap-2">
            <StudyIcon className="h-3.5 w-3.5 text-brand" />
            Topic strength (weakest first)
          </h2>
          <ul className="mt-4 flex flex-col gap-4">
            {byTopic.map((t) => (
              <li key={t.group}>
                <div className="flex items-baseline justify-between gap-3 text-sm">
                  <span className="truncate font-medium text-ink">{t.group}</span>
                  <span className="shrink-0 tabular-nums text-subtle-fg">
                    <span className="stat-num text-sm text-ink">
                      {t.accuracy == null ? "—" : `${t.accuracy.toFixed(0)}%`}
                    </span>{" "}
                    · {t.attempts} attempts
                  </span>
                </div>
                <div className="progress mt-2">
                  <div
                    className="progress-bar"
                    style={{
                      width: `${t.accuracy ?? 0}%`,
                      background:
                        (t.accuracy ?? 0) >= 70
                          ? "var(--mcq-brand)"
                          : (t.accuracy ?? 0) >= 50
                            ? "var(--mcq-warn)"
                            : "var(--mcq-bad)",
                    }}
                  />
                </div>
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      {/* Error types + confidence */}
      <div className="grid gap-4 sm:grid-cols-2">
        {errorTypes.length > 0 ? (
          <section className="card p-5">
            <h2 className="section-title flex items-center gap-2">
              <XIcon className="h-3.5 w-3.5 text-brand" />
              Why you&apos;re missing questions
            </h2>
            <ul className="mt-4 flex flex-wrap gap-2">
              {errorTypes.map((e) => (
                <li key={e.type} className="chip">
                  {e.type.replace(/_/g, " ").toLowerCase()}
                  <span className="stat-num text-sm text-bad">{e.count}</span>
                </li>
              ))}
            </ul>
          </section>
        ) : null}

        <section className="card p-5">
          <h2 className="section-title flex items-center gap-2">
            <SparklesIcon className="h-3.5 w-3.5 text-brand" />
            Confidence vs accuracy
          </h2>
          <dl className="mt-4 grid grid-cols-2 gap-3">
            <div className="rounded-xl border border-line bg-canvas p-3">
              <dt>
                <span className="badge badge-brand">Confident</span>
              </dt>
              <dd className="stat-num mt-2 text-base leading-snug">
                {confidence.highCorrect} correct · {confidence.highWrong} wrong
              </dd>
              <dd className="mt-1 text-xs text-subtle-fg">
                {confidence.highAccuracy == null ? "—" : `${confidence.highAccuracy.toFixed(0)}% accurate`}
              </dd>
            </div>
            <div className="rounded-xl border border-line bg-canvas p-3">
              <dt>
                <span className="badge badge-warn">Not sure</span>
              </dt>
              <dd className="stat-num mt-2 text-base leading-snug">
                {confidence.lowCorrect} correct · {confidence.lowWrong} wrong
              </dd>
              <dd className="mt-1 text-xs text-subtle-fg">
                {confidence.lowAccuracy == null ? "—" : `${confidence.lowAccuracy.toFixed(0)}% accurate`}
              </dd>
            </div>
          </dl>
        </section>
      </div>

      {/* Mistake book */}
      {mistakes.length > 0 ? (
        <section className="card p-5">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h2 className="section-title flex items-center gap-2">
              <FlagIcon className="h-3.5 w-3.5 text-brand" />
              Mistake book · {mistakes.length}
            </h2>
            <button
              type="button"
              onClick={startReview}
              disabled={reviewBusy}
              className="btn btn-primary btn-sm shadow-glow"
            >
              {reviewBusy ? "Starting…" : "Review mistakes"}
              {!reviewBusy && <ArrowRightIcon className="h-3.5 w-3.5" />}
            </button>
          </div>
          <ul className="mt-2 flex flex-col divide-y divide-line">
            {mistakes.slice(0, 10).map((m) => (
              <li key={m.id} className="flex flex-col gap-1.5 py-3">
                <p className="text-sm leading-snug text-ink">{m.text}</p>
                <div className="flex flex-wrap items-center gap-1.5">
                  <span className="chip">{m.subject}</span>
                  <span className="chip">{m.topic}</span>
                  {m.isCorrect === null ? (
                    <span className="badge badge-warn">skipped</span>
                  ) : (
                    <span className="badge badge-bad">wrong</span>
                  )}
                </div>
              </li>
            ))}
          </ul>
        </section>
      ) : (
        <section className="card p-8 text-center">
          <span className="mx-auto flex h-11 w-11 items-center justify-center rounded-2xl bg-brand-soft">
            <SparklesIcon className="h-5 w-5 text-brand" />
          </span>
          <p className="mx-auto mt-3 max-w-md text-sm text-muted-fg">
            No mistakes yet — keep practicing and your mistake book will build itself.
          </p>
        </section>
      )}
    </div>
  );
}

function StatCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="card card-hover p-4 text-center">
      <p className="stat-num text-xl text-ink">{value}</p>
      <p className="kicker mt-1.5 justify-center">{label}</p>
    </div>
  );
}
