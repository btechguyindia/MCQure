"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

const empty = () => ["", "", "", ""];

export function PyqSubmitForm() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [form, setForm] = useState({
    year: new Date().getFullYear(),
    paper: "",
    questionText: "",
    options: empty(),
    correctIndex: 0,
    explanation: "",
    source: "",
    sourceUrl: "",
  });

  function setOption(i: number, value: string) {
    const options = [...form.options];
    options[i] = value;
    setForm({ ...form, options });
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    setSuccess(false);
    try {
      const res = await fetch("/api/pyq", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          year: Number(form.year),
          paper: form.paper || undefined,
          questionText: form.questionText,
          options: form.options,
          correctIndex: form.correctIndex,
          explanation: form.explanation || undefined,
          source: form.source,
          sourceUrl: form.sourceUrl || undefined,
        }),
      });
      const data = (await res.json()) as { ok: boolean; message?: string };
      if (!res.ok || !data.ok) {
        setError(data.message ?? "Could not submit question");
        setBusy(false);
        return;
      }
      setSuccess(true);
      setForm({
        year: new Date().getFullYear(),
        paper: "",
        questionText: "",
        options: empty(),
        correctIndex: 0,
        explanation: "",
        source: "",
        sourceUrl: "",
      });
      setBusy(false);
      router.refresh();
    } catch {
      setError("Network error. Please try again.");
      setBusy(false);
    }
  }

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="inline-flex rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-500"
      >
        + Add a question from a paper
      </button>
    );
  }

  const input =
    "w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none dark:border-zinc-700 dark:bg-zinc-900";
  const label = "text-xs font-semibold text-zinc-500";

  return (
    <form onSubmit={submit} className="flex flex-col gap-4 rounded-2xl border border-zinc-200 bg-white p-5 dark:border-zinc-800 dark:bg-zinc-900">
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-zinc-500">
          Transcribe a genuine PYQ
        </h2>
        <button type="button" onClick={() => setOpen(false)} className="text-sm text-zinc-400 hover:text-zinc-600">
          Close
        </button>
      </div>

      <p className="text-xs leading-relaxed text-zinc-500">
        Only questions copied verbatim from an authentic DSSSB paper belong here. You must
        disclose the source — entries start <span className="font-semibold">Unverified</span> and
        are never presented as authoritative until checked against the paper copy.
      </p>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="flex flex-col gap-1">
          <label className={label}>Year *</label>
          <input
            type="number"
            min={1990}
            max={new Date().getFullYear() + 1}
            value={form.year}
            onChange={(e) => setForm({ ...form, year: Number(e.target.value) })}
            className={input}
            required
          />
        </div>
        <div className="flex flex-col gap-1">
          <label className={label}>Paper (e.g. &quot;Paper II, Shift 1&quot;)</label>
          <input
            type="text"
            value={form.paper}
            onChange={(e) => setForm({ ...form, paper: e.target.value })}
            className={input}
          />
        </div>
      </div>

      <div className="flex flex-col gap-1">
        <label className={label}>Question *</label>
        <textarea
          value={form.questionText}
          onChange={(e) => setForm({ ...form, questionText: e.target.value })}
          className={input}
          rows={2}
          required
        />
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        {form.options.map((opt, i) => (
          <div key={i} className="flex items-center gap-2">
            <span className="text-sm font-bold text-zinc-500">{String.fromCharCode(65 + i)}</span>
            <input
              type="text"
              value={opt}
              onChange={(e) => setOption(i, e.target.value)}
              className={input}
              placeholder={`Option ${String.fromCharCode(65 + i)}`}
              required
            />
          </div>
        ))}
      </div>

      <div className="flex flex-col gap-1">
        <label className={label}>Correct option *</label>
        <select
          value={form.correctIndex}
          onChange={(e) => setForm({ ...form, correctIndex: Number(e.target.value) })}
          className={input}
        >
          {form.options.map((_, i) => (
            <option key={i} value={i}>
              {String.fromCharCode(65 + i)}
            </option>
          ))}
        </select>
      </div>

      <div className="flex flex-col gap-1">
        <label className={label}>Explanation (optional)</label>
        <textarea
          value={form.explanation}
          onChange={(e) => setForm({ ...form, explanation: e.target.value })}
          className={input}
          rows={2}
        />
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="flex flex-col gap-1">
          <label className={label}>Source *</label>
          <input
            type="text"
            value={form.source}
            onChange={(e) => setForm({ ...form, source: e.target.value })}
            className={input}
            placeholder="e.g. DSSSB TGT CS 2019 Paper II"
            required
          />
        </div>
        <div className="flex flex-col gap-1">
          <label className={label}>Source URL (optional)</label>
          <input
            type="url"
            value={form.sourceUrl}
            onChange={(e) => setForm({ ...form, sourceUrl: e.target.value })}
            className={input}
            placeholder="https://…"
          />
        </div>
      </div>

      {error ? <p className="text-sm text-red-600 dark:text-red-400">{error}</p> : null}
      {success ? (
        <p className="text-sm text-emerald-600 dark:text-emerald-400">
          Added as Unverified. It will show up below once the paper is checked.
        </p>
      ) : null}

      <button
        type="submit"
        disabled={busy}
        className="inline-flex justify-center rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-500 disabled:opacity-60"
      >
        {busy ? "Submitting…" : "Add question"}
      </button>
    </form>
  );
}
