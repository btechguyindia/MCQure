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

const COLORS = ["#6366f1", "#10b981", "#f59e0b", "#ef4444", "#8b5cf6", "#06b6d4"];

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
      <div className="rounded-2xl border border-zinc-200 bg-white p-6 text-center dark:border-zinc-800 dark:bg-zinc-900">
        <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="flex flex-col gap-4">
        <div className="h-24 animate-pulse rounded-2xl bg-zinc-100 dark:bg-zinc-800" />
        <div className="h-64 animate-pulse rounded-2xl bg-zinc-100 dark:bg-zinc-800" />
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
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
        <StatCard label="Attempts" value={String(summary.total)} />
        <StatCard label="Accuracy" value={accuracy} />
        <StatCard
          label="Net score"
          value={summary.netScore > 0 ? `+${summary.netScore}` : String(summary.netScore)}
        />
        <StatCard label="Streak" value={`${streak.current} day${streak.current === 1 ? "" : "s"}`} />
        <StatCard label="Avg time" value={`${(summary.averageTimeMs / 1000).toFixed(0)}s`} />
        <StatCard label="Missed" value={String(summary.incorrect + summary.unattempted)} />
      </div>

      {/* Trend */}
      <section className="rounded-2xl border border-zinc-200 bg-white p-5 dark:border-zinc-800 dark:bg-zinc-900">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-zinc-500">
          Net score — last 14 days
        </h2>
        <div className="mt-4 h-56">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={trend} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
              <XAxis dataKey="day" tick={{ fontSize: 10 }} interval="preserveStartEnd" />
              <YAxis tick={{ fontSize: 10 }} />
              <Tooltip />
              <ReferenceLine y={0} stroke="var(--border)" />
              <Line
                type="monotone"
                dataKey="netScore"
                stroke="#6366f1"
                strokeWidth={2}
                dot={{ r: 2 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </section>

      {/* Subject accuracy */}
      {subjectChart.length > 0 ? (
        <section className="rounded-2xl border border-zinc-200 bg-white p-5 dark:border-zinc-800 dark:bg-zinc-900">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-zinc-500">
            Accuracy by subject
          </h2>
          <div className="mt-4 h-56">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={subjectChart} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                <XAxis dataKey="name" tick={{ fontSize: 9 }} interval={0} angle={-25} textAnchor="end" height={60} />
                <YAxis domain={[0, 100]} tick={{ fontSize: 10 }} />
                <Tooltip />
                <Bar dataKey="accuracy" radius={[4, 4, 0, 0]}>
                  {subjectChart.map((_, i) => (
                    <Cell key={i} fill={COLORS[i % COLORS.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </section>
      ) : null}

      {/* Topic breakdown */}
      {byTopic.length > 0 ? (
        <section className="rounded-2xl border border-zinc-200 bg-white p-5 dark:border-zinc-800 dark:bg-zinc-900">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-zinc-500">
            Topic strength (weakest first)
          </h2>
          <ul className="mt-3 flex flex-col gap-3">
            {byTopic.map((t) => (
              <li key={t.group}>
                <div className="flex items-baseline justify-between text-sm">
                  <span className="font-medium">{t.group}</span>
                  <span className="tabular-nums text-zinc-500">
                    {t.accuracy == null ? "—" : `${t.accuracy.toFixed(0)}%`} · {t.attempts} attempts
                  </span>
                </div>
                <div className="mt-1 h-2 w-full overflow-hidden rounded-full bg-zinc-100 dark:bg-zinc-800">
                  <div
                    className={`h-full rounded-full ${
                      (t.accuracy ?? 0) >= 70
                        ? "bg-emerald-500"
                        : (t.accuracy ?? 0) >= 50
                          ? "bg-amber-500"
                          : "bg-red-500"
                    }`}
                    style={{ width: `${t.accuracy ?? 0}%` }}
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
          <section className="rounded-2xl border border-zinc-200 bg-white p-5 dark:border-zinc-800 dark:bg-zinc-900">
            <h2 className="text-sm font-semibold uppercase tracking-wide text-zinc-500">
              Why you&apos;re missing questions
            </h2>
            <ul className="mt-3 flex flex-col gap-2">
              {errorTypes.map((e) => (
                <li key={e.type} className="flex items-center justify-between text-sm">
                  <span className="capitalize">{e.type.replace(/_/g, " ").toLowerCase()}</span>
                  <span className="tabular-nums font-medium">{e.count}</span>
                </li>
              ))}
            </ul>
          </section>
        ) : null}

        <section className="rounded-2xl border border-zinc-200 bg-white p-5 dark:border-zinc-800 dark:bg-zinc-900">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-zinc-500">
            Confidence vs accuracy
          </h2>
          <dl className="mt-3 grid grid-cols-2 gap-3 text-sm">
            <div>
              <dt className="text-zinc-500">Confident</dt>
              <dd className="text-lg font-bold">{confidence.highCorrect} correct · {confidence.highWrong} wrong</dd>
              <dd className="text-xs text-zinc-500">
                {confidence.highAccuracy == null ? "—" : `${confidence.highAccuracy.toFixed(0)}% accurate`}
              </dd>
            </div>
            <div>
              <dt className="text-zinc-500">Not sure</dt>
              <dd className="text-lg font-bold">{confidence.lowCorrect} correct · {confidence.lowWrong} wrong</dd>
              <dd className="text-xs text-zinc-500">
                {confidence.lowAccuracy == null ? "—" : `${confidence.lowAccuracy.toFixed(0)}% accurate`}
              </dd>
            </div>
          </dl>
        </section>
      </div>

      {/* Mistake book */}
      {mistakes.length > 0 ? (
        <section className="rounded-2xl border border-zinc-200 bg-white p-5 dark:border-zinc-800 dark:bg-zinc-900">
          <div className="flex items-center justify-between gap-3">
            <h2 className="text-sm font-semibold uppercase tracking-wide text-zinc-500">
              Mistake book · {mistakes.length}
            </h2>
            <button
              type="button"
              onClick={startReview}
              disabled={reviewBusy}
              className="rounded-lg bg-indigo-600 px-4 py-2 text-xs font-semibold text-white hover:bg-indigo-500 disabled:opacity-60"
            >
              {reviewBusy ? "Starting…" : "Review mistakes →"}
            </button>
          </div>
          <ul className="mt-3 flex flex-col divide-y divide-zinc-100 dark:divide-zinc-800">
            {mistakes.slice(0, 10).map((m) => (
              <li key={m.id} className="flex flex-col gap-1 py-3">
                <p className="text-sm leading-snug">{m.text}</p>
                <div className="flex flex-wrap gap-1.5 text-xs text-zinc-500">
                  <span className="rounded-full bg-zinc-100 px-2 py-0.5 dark:bg-zinc-800">{m.subject}</span>
                  <span className="rounded-full bg-zinc-100 px-2 py-0.5 dark:bg-zinc-800">{m.topic}</span>
                  {m.isCorrect === null ? (
                    <span className="rounded-full bg-amber-100 px-2 py-0.5 text-amber-700 dark:bg-amber-900/50 dark:text-amber-300">
                      skipped
                    </span>
                  ) : (
                    <span className="rounded-full bg-red-100 px-2 py-0.5 text-red-700 dark:bg-red-900/50 dark:text-red-300">
                      wrong
                    </span>
                  )}
                </div>
              </li>
            ))}
          </ul>
        </section>
      ) : (
        <section className="rounded-2xl border border-zinc-200 bg-white p-5 text-center dark:border-zinc-800 dark:bg-zinc-900">
          <p className="text-sm text-zinc-500">
            No mistakes yet — keep practicing and your mistake book will build itself.
          </p>
        </section>
      )}
    </div>
  );
}

function StatCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-zinc-200 bg-white p-4 text-center dark:border-zinc-800 dark:bg-zinc-900">
      <p className="text-xl font-bold tabular-nums">{value}</p>
      <p className="text-xs text-zinc-500">{label}</p>
    </div>
  );
}
