"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

const STAGES = [
  { value: "not_started", label: "Not started" },
  { value: "starting", label: "Just starting" },
  { value: "early_prep", label: "Early prep" },
  { value: "mid_prep", label: "Mid prep" },
  { value: "intensive", label: "Intensive" },
  { value: "revision", label: "Revision" },
  { value: "mock_testing", label: "Mock testing" },
  { value: "exam_ready", label: "Exam ready" },
];

interface Props {
  preparation: {
    targetScore: number | null;
    dailyTarget: number;
    weeklyTarget: number;
    targetExamDate: string | null;
    examAttemptYear: number | null;
    stage: string;
    prepStartDate: string;
  } | null;
  examName: string | null;
}

export function PreparationSettings({ preparation, examName }: Props) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [form, setForm] = useState({
    examAttemptYear: preparation?.examAttemptYear ?? new Date().getFullYear(),
    targetExamDate: preparation?.targetExamDate ? preparation.targetExamDate.slice(0, 10) : "",
    targetScore: preparation?.targetScore ?? null,
    dailyTarget: preparation?.dailyTarget ?? 25,
    weeklyTarget: preparation?.weeklyTarget ?? 175,
    stage: preparation?.stage ?? "starting",
  });

  async function save(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setMessage(null);
    try {
      const res = await fetch("/api/preparation/settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          examAttemptYear: Number(form.examAttemptYear),
          targetExamDate: form.targetExamDate ? `${form.targetExamDate}T00:00:00.000Z` : null,
          targetScore: form.targetScore === null || form.targetScore === 0 ? null : Number(form.targetScore),
          dailyTarget: Number(form.dailyTarget),
          weeklyTarget: Number(form.weeklyTarget),
          stage: form.stage,
        }),
      });
      const data = (await res.json()) as { ok: boolean; message?: string };
      if (!res.ok || !data.ok) {
        setMessage(data.message ?? "Could not save settings");
        setBusy(false);
        return;
      }
      setMessage("Saved");
      setBusy(false);
      router.refresh();
    } catch {
      setMessage("Network error");
      setBusy(false);
    }
  }

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="rounded-lg border border-zinc-300 px-4 py-2 text-sm font-semibold hover:bg-zinc-100 dark:border-zinc-700 dark:hover:bg-zinc-800"
      >
        ⚙️ Target exam
      </button>
    );
  }

  const input =
    "w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none dark:border-zinc-700 dark:bg-zinc-900";
  const label = "text-xs font-semibold text-zinc-500";

  return (
    <form
      onSubmit={save}
      className="flex w-full max-w-md flex-col gap-3 rounded-2xl border border-zinc-200 bg-white p-5 dark:border-zinc-800 dark:bg-zinc-900"
    >
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-zinc-500">My target exam</h2>
        <button type="button" onClick={() => setOpen(false)} className="text-sm text-zinc-400 hover:text-zinc-600">
          Close
        </button>
      </div>

      <p className="text-xs text-zinc-500">
        Target exam: <span className="font-semibold text-zinc-700 dark:text-zinc-200">{examName ?? "—"}</span>
      </p>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <div className="flex flex-col gap-1">
          <label className={label}>Attempt year</label>
          <input
            type="number"
            min={1990}
            max={new Date().getFullYear() + 1}
            value={form.examAttemptYear}
            onChange={(e) => setForm({ ...form, examAttemptYear: Number(e.target.value) })}
            className={input}
          />
        </div>
        <div className="flex flex-col gap-1">
          <label className={label}>Target exam date</label>
          <input
            type="date"
            value={form.targetExamDate}
            onChange={(e) => setForm({ ...form, targetExamDate: e.target.value })}
            className={input}
          />
        </div>
        <div className="flex flex-col gap-1">
          <label className={label}>Target score (of 200)</label>
          <input
            type="number"
            min={0}
            max={400}
            value={form.targetScore ?? ""}
            onChange={(e) => setForm({ ...form, targetScore: e.target.value === "" ? null : Number(e.target.value) })}
            className={input}
          />
        </div>
        <div className="flex flex-col gap-1">
          <label className={label}>Stage</label>
          <select
            value={form.stage}
            onChange={(e) => setForm({ ...form, stage: e.target.value })}
            className={input}
          >
            {STAGES.map((s) => (
              <option key={s.value} value={s.value}>
                {s.label}
              </option>
            ))}
          </select>
        </div>
        <div className="flex flex-col gap-1">
          <label className={label}>Daily target (questions)</label>
          <input
            type="number"
            min={1}
            max={500}
            value={form.dailyTarget}
            onChange={(e) => setForm({ ...form, dailyTarget: Number(e.target.value) })}
            className={input}
          />
        </div>
        <div className="flex flex-col gap-1">
          <label className={label}>Weekly target</label>
          <input
            type="number"
            min={1}
            max={3500}
            value={form.weeklyTarget}
            onChange={(e) => setForm({ ...form, weeklyTarget: Number(e.target.value) })}
            className={input}
          />
        </div>
      </div>

      {message ? <p className="text-sm text-zinc-600">{message}</p> : null}

      <button
        type="submit"
        disabled={busy}
        className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-500 disabled:opacity-60"
      >
        {busy ? "Saving…" : "Save"}
      </button>
    </form>
  );
}
