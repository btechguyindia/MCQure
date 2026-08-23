"use client";

import { useEffect, useState } from "react";
import { MotivationIcon } from "@/components/icons";

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

function GoalRing({ done, total }: { done: number; total: number }) {
  const pct = total > 0 ? Math.min(done / total, 1) : 0;
  const radius = 34;
  const circumference = 2 * Math.PI * radius;
  const complete = pct >= 1;

  return (
    <div className="relative h-24 w-24 shrink-0" role="img" aria-label={`${done} of ${total} daily questions answered`}>
      <svg viewBox="0 0 80 80" width={80} height={80} className="h-full w-full -rotate-90">
        <circle cx="40" cy="40" r={radius} fill="none" strokeWidth="8" className="stroke-line" />
        <circle
          cx="40"
          cy="40"
          r={radius}
          fill="none"
          strokeWidth="8"
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={circumference * (1 - pct)}
          className={`transition-[stroke-dashoffset] duration-700 ease-out ${complete ? "stroke-ok" : "stroke-brand"}`}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="stat-num text-lg leading-none">{Math.round(pct * 100)}%</span>
        <span className="mt-0.5 text-[0.6rem] font-medium uppercase tracking-wide text-subtle-fg">
          {complete ? "done" : "of goal"}
        </span>
      </div>
    </div>
  );
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
      <section className="card p-5">
        <h2 className="section-title">Today&apos;s Status</h2>
        <p className="mt-2 text-sm text-muted-fg">Could not load today&apos;s status.</p>
      </section>
    );
  }

  if (!data) {
    return (
      <section className="card p-5">
        <h2 className="section-title">Today&apos;s Status</h2>
        <div className="skeleton mt-3 h-24 w-full" />
      </section>
    );
  }

  const accuracy = data.accuracyToday == null ? "—" : `${data.accuracyToday.toFixed(0)}%`;

  return (
    <section
      className={`card relative overflow-hidden p-5 transition-shadow sm:p-6 ${
        data.hasActivityToday ? "" : "ring-1 ring-brand/40"
      }`}
    >
      <div className="flex flex-col gap-5 sm:flex-row sm:items-center">
        <GoalRing done={data.attemptedToday} total={data.dailyTarget} />
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h2 className="section-title">Today&apos;s Status</h2>
            {data.currentStreak > 0 ? (
              <span className="badge badge-warn">
                <MotivationIcon className="h-3.5 w-3.5" />
                {data.currentStreak}-day streak
              </span>
            ) : null}
          </div>
          <p className="mt-2 truncate text-sm font-semibold sm:text-base">
            {!data.hasActivityToday
              ? "No activity yet today — start a practice session to keep your streak alive."
              : data.attemptedToday >= data.dailyTarget
                ? `Daily target hit — ${data.attemptedToday} questions answered. Keep going!`
                : `${Math.max(data.dailyTarget - data.attemptedToday, 0)} more questions to hit today's target.`}
          </p>
          <dl className="mt-4 grid grid-cols-2 gap-x-4 gap-y-3 sm:grid-cols-3 lg:grid-cols-5">
            <StatusItem label="Accuracy" value={accuracy} />
            <StatusItem
              label="Net score"
              value={data.netScoreToday > 0 ? `+${data.netScoreToday}` : String(data.netScoreToday)}
            />
            <StatusItem label="Study topics" value={String(data.studyTopicsCompleted)} />
            <StatusItem label="All-time" value={data.questionsAttemptedAllTime.toLocaleString()} />
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
        </div>
      </div>
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
      <dt className="text-xs font-medium text-subtle-fg">{label}</dt>
      <dd className="mt-0.5 truncate text-base font-semibold">{value}</dd>
    </div>
  );
}
