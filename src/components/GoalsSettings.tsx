"use client";

import { useState } from "react";

interface GoalsData {
  today: number;
  dailyTarget: number;
  week: number;
  weeklyTarget: number;
}

export function GoalsSettings({ initial }: { initial: GoalsData }) {
  const [goals, setGoals] = useState<GoalsData>(initial);
  const [daily, setDaily] = useState(String(initial.dailyTarget));
  const [weekly, setWeekly] = useState(String(initial.weeklyTarget));
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  async function save() {
    setBusy(true);
    setMessage(null);
    try {
      const res = await fetch("/api/goals", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          dailyTarget: Number(daily),
          weeklyTarget: Number(weekly),
        }),
      });
      const data = (await res.json()) as { ok: boolean; goals?: GoalsData; message?: string };
      if (!res.ok || !data.ok || !data.goals) {
        setMessage(data.message ?? "Could not save goals");
        return;
      }
      setGoals(data.goals);
      setMessage("Saved ✓");
    } catch {
      setMessage("Network error. Please try again.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="flex flex-col gap-3">
      <div className="grid gap-3 sm:grid-cols-2">
        <label>
          <span className="text-sm font-medium text-zinc-700 dark:text-zinc-300">Daily target</span>
          <input
            type="number"
            min={1}
            value={daily}
            onChange={(e) => setDaily(e.target.value)}
            className="mt-1.5 w-full rounded-xl border border-zinc-300 bg-white px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-900"
          />
        </label>
        <label>
          <span className="text-sm font-medium text-zinc-700 dark:text-zinc-300">Weekly target</span>
          <input
            type="number"
            min={1}
            value={weekly}
            onChange={(e) => setWeekly(e.target.value)}
            className="mt-1.5 w-full rounded-xl border border-zinc-300 bg-white px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-900"
          />
        </label>
      </div>
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={save}
          disabled={busy}
          className="rounded-xl bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-500 disabled:opacity-50"
        >
          {busy ? "Saving…" : "Save goals"}
        </button>
        {message ? <p className="text-sm text-zinc-600 dark:text-zinc-400">{message}</p> : null}
      </div>
      <p className="text-xs text-zinc-500">
        Today: {goals.today}/{goals.dailyTarget} · Week: {goals.week}/{goals.weeklyTarget}
      </p>
    </div>
  );
}
