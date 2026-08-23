"use client";

import { useState } from "react";
import { CheckIcon } from "@/components/icons";

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
      setMessage("Saved");
    } catch {
      setMessage("Network error. Please try again.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="grid gap-3 sm:grid-cols-2">
        <div>
          <label className="label">Daily target</label>
          <input
            type="number"
            min={1}
            value={daily}
            onChange={(e) => setDaily(e.target.value)}
            className="input"
          />
        </div>
        <div>
          <label className="label">Weekly target</label>
          <input
            type="number"
            min={1}
            value={weekly}
            onChange={(e) => setWeekly(e.target.value)}
            className="input"
          />
        </div>
      </div>
      <div className="flex flex-wrap items-center gap-3">
        <button type="button" onClick={save} disabled={busy} className="btn btn-primary">
          {busy ? "Saving…" : "Save goals"}
        </button>
        {message ? (
          <p
            className={`inline-flex items-center gap-1.5 text-sm font-medium ${
              message === "Saved" ? "field-ok" : "field-error"
            }`}
          >
            {message === "Saved" ? <CheckIcon /> : null}
            {message}
          </p>
        ) : null}
      </div>
      <div className="flex flex-col gap-2">
        <div>
          <p className="mb-1 text-xs text-subtle-fg">
            Today: <span className="stat-num">{goals.today}</span>/{goals.dailyTarget}
          </p>
          <div className="progress">
            <div
              className="progress-bar"
              style={{ width: `${Math.min(100, (goals.today / Math.max(1, goals.dailyTarget)) * 100)}%` }}
            />
          </div>
        </div>
        <div>
          <p className="mb-1 text-xs text-subtle-fg">
            Week: <span className="stat-num">{goals.week}</span>/{goals.weeklyTarget}
          </p>
          <div className="progress">
            <div
              className="progress-bar"
              style={{ width: `${Math.min(100, (goals.week / Math.max(1, goals.weeklyTarget)) * 100)}%` }}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
