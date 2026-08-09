"use client";

import { useEffect, useState } from "react";

interface StatusResponse {
  ok: boolean;
  status?: {
    attemptedToday: number;
    accuracyToday: number | null;
    netScoreToday: number;
    studyTopicsCompleted: number;
    currentStreak: number;
    hasActivityToday: boolean;
    dailyTarget: number;
    weakestTopic: { name: string; accuracy: number; attempts: number } | null;
    questionsAttemptedAllTime: number;
  };
  message?: string;
}

export function TodayStatus() {
  const [data, setData] = useState<StatusResponse["status"] | null>(null);
  const [error, setError] = useState(false);

  useEffect(() => {
    fetch("/api/status")
      .then((r) => r.json() as Promise<StatusResponse>)
      .then((d) => (d.ok && d.status ? setData(d.status) : setError(true)))
      .catch(() => setError(true));
  }, []);

  if (error) {
    return (
      <section className="rounded-2xl border border-zinc-200 bg-white p-5 dark:border-zinc-800 dark:bg-zinc-900">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-zinc-500">
          Today&apos;s Status
        </h2>
        <p className="mt-2 text-sm text-zinc-500">Could not load today&apos;s status.</p>
      </section>
    );
  }

  if (!data) {
    return (
      <section className="rounded-2xl border border-zinc-200 bg-white p-5 dark:border-zinc-800 dark:bg-zinc-900">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-zinc-500">
          Today&apos;s Status
        </h2>
        <div className="mt-3 h-24 animate-pulse rounded-lg bg-zinc-100 dark:bg-zinc-800" />
      </section>
    );
  }

  const accuracy = data.accuracyToday == null ? "—" : `${data.accuracyToday.toFixed(0)}%`;

  return (
    <section className="rounded-2xl border border-zinc-200 bg-white p-5 dark:border-zinc-800 dark:bg-zinc-900">
      <div className="flex items-baseline justify-between">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-zinc-500">
          Today&apos;s Status
        </h2>
        <span className="text-xs text-zinc-400">
          {data.attemptedToday}/{data.dailyTarget} target
        </span>
      </div>

      <dl className="mt-4 grid grid-cols-2 gap-x-4 gap-y-3 sm:grid-cols-3">
        <StatusItem label="Questions today" value={String(data.attemptedToday)} />
        <StatusItem label="Accuracy" value={accuracy} />
        <StatusItem
          label="Net score"
          value={data.netScoreToday > 0 ? `+${data.netScoreToday}` : String(data.netScoreToday)}
        />
        <StatusItem label="Study topics" value={String(data.studyTopicsCompleted)} />
        <StatusItem label="Streak" value={`${data.currentStreak} ${data.currentStreak === 1 ? "day" : "days"}`} />
        <StatusItem
          label="Weakest topic"
          value={data.weakestTopic ? data.weakestTopic.name : "—"}
          title={
            data.weakestTopic
              ? `${data.weakestTopic.accuracy.toFixed(0)}% accuracy over ${data.weakestTopic.attempts} attempts`
              : undefined
          }
        />
      </dl>
    </section>
  );
}

function StatusItem({
  label,
  value,
  title,
}: {
  label: string;
  value: string;
  title?: string;
}) {
  return (
    <div title={title}>
      <dt className="text-xs text-zinc-500 dark:text-zinc-400">{label}</dt>
      <dd className="mt-0.5 truncate text-base font-semibold">{value}</dd>
    </div>
  );
}
