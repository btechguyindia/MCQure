"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { CloseIcon, PyqIcon } from "@/components/icons";

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
        className="btn btn-primary"
      >
        <PyqIcon /> Add a question from a paper
      </button>
    );
  }

  const input = "input";
  const label = "label";

  return (
    <form onSubmit={submit} className="card flex w-full flex-col gap-4 p-5 sm:p-6">
      <div className="flex items-center justify-between gap-3">
        <h2 className="section-title">Transcribe a genuine PYQ</h2>
        <button type="button" onClick={() => setOpen(false)} className="btn btn-ghost btn-sm">
          <CloseIcon /> Close
        </button>
      </div>

      <p className="text-xs leading-relaxed text-muted-fg">
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
            <span className="text-sm font-bold text-subtle-fg">{String.fromCharCode(65 + i)}</span>
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

      {error ? <p className="field-error">{error}</p> : null}
      {success ? (
        <p className="field-ok">
          Added as Unverified. It will show up below once the paper is checked.
        </p>
      ) : null}

      <button
        type="submit"
        disabled={busy}
        className="btn btn-primary justify-center"
      >
        {busy ? "Submitting…" : "Add question"}
      </button>
    </form>
  );
}
