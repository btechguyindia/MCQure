"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

interface SubjectOption {
  id: string;
  name: string;
  topics: Array<{ id: string; name: string }>;
}

interface SectionOption {
  id: string;
  name: string;
  paper: string;
  subjects: string[];
}

interface MockRunItem {
  id: string;
  scope: string;
  label: string;
  questionCount: number;
  correct: number;
  incorrect: number;
  skipped: number;
  score: number;
  maxScore: number;
  accuracy: number;
  timeSpentMs: number;
  createdAt: string;
}

interface HistoryResponse {
  ok: boolean;
  runs: MockRunItem[];
  comparison: { mockAverage: number | null; practiceAverage: number | null };
}

type Scope = "full" | "section" | "topic";

const SCOPE_META: Record<Scope, { title: string; desc: string }> = {
  full: { title: "Full mock", desc: "Whole-paper exam, best simulate the real test." },
  section: { title: "Sectional", desc: "Only the subjects of one exam section." },
  topic: { title: "Topic test", desc: "Focused mock on a single topic." },
};

const DEFAULT_COUNTS: Record<Scope, number> = { full: 30, section: 20, topic: 15 };

export function MockStudio({
  subjects,
  sections,
}: {
  subjects: SubjectOption[];
  sections: SectionOption[];
}) {
  const router = useRouter();
  const [scope, setScope] = useState<Scope>("full");
  const [sectionId, setSectionId] = useState<string>(sections[0]?.id ?? "");
  const [topicId, setTopicId] = useState<string>(subjects[0]?.topics[0]?.id ?? "");
  const [count, setCount] = useState<number>(DEFAULT_COUNTS.full);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [history, setHistory] = useState<HistoryResponse | null>(null);

  useEffect(() => {
    fetch("/api/mock/history")
      .then((r) => r.json() as Promise<HistoryResponse>)
      .then((data) => {
        if (data.ok) setHistory(data);
      })
      .catch(() => {});
  }, []);

  function pickScope(next: Scope) {
    setScope(next);
    setCount(DEFAULT_COUNTS[next]);
  }

  async function launch() {
    setBusy(true);
    setError(null);
    try {
      const body: Record<string, unknown> = { scope, count };
      if (scope === "section") body.sectionId = sectionId;
      if (scope === "topic") body.topicId = topicId;
      const res = await fetch("/api/mock/start", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = (await res.json()) as {
        ok: boolean;
        session?: { id: string };
        message?: string;
      };
      if (!res.ok || !data.ok || !data.session) {
        setError(data.message ?? "Could not start the mock");
        setBusy(false);
        return;
      }
      router.push(`/practice/session?sessionId=${data.session.id}`);
    } catch {
      setError("Network error. Please try again.");
      setBusy(false);
    }
  }

  const countOptions = scope === "topic" ? [10, 15, 20] : scope === "section" ? [15, 20, 30] : [15, 30, 50];

  return (
    <div className="flex flex-col gap-6">
      <section className="rounded-2xl border border-zinc-200 bg-white p-5 dark:border-zinc-800 dark:bg-zinc-900">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-zinc-500">
          Configure a mock
        </h2>
        <div className="mt-3 grid gap-3 sm:grid-cols-3">
          {(Object.keys(SCOPE_META) as Scope[]).map((s) => (
            <button
              key={s}
              type="button"
              onClick={() => pickScope(s)}
              className={`rounded-xl border-2 p-4 text-left transition-colors ${
                scope === s
                  ? "border-indigo-500 bg-indigo-50 dark:bg-indigo-950/40"
                  : "border-zinc-200 bg-white hover:border-zinc-400 dark:border-zinc-700 dark:bg-zinc-900"
              }`}
            >
              <h3 className="font-bold">{SCOPE_META[s].title}</h3>
              <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">{SCOPE_META[s].desc}</p>
            </button>
          ))}
        </div>

        {scope === "section" ? (
          <label className="mt-4 block">
            <span className="text-sm font-medium text-zinc-700 dark:text-zinc-300">Section</span>
            <select
              value={sectionId}
              onChange={(e) => setSectionId(e.target.value)}
              className="mt-1.5 w-full rounded-xl border border-zinc-300 bg-white px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-900"
            >
              {sections.map((sec) => (
                <option key={sec.id} value={sec.id}>
                  {sec.name} · {sec.paper} ({sec.subjects.join(", ")})
                </option>
              ))}
            </select>
          </label>
        ) : null}

        {scope === "topic" ? (
          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            <label>
              <span className="text-sm font-medium text-zinc-700 dark:text-zinc-300">Subject</span>
              <select
                value={topicId}
                onChange={(e) => setTopicId(e.target.value)}
                className="mt-1.5 w-full rounded-xl border border-zinc-300 bg-white px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-900"
              >
                {subjects.map((s) => (
                  <option key={s.id} value={s.topics[0]?.id ?? ""} disabled={s.topics.length === 0}>
                    {s.name}
                  </option>
                ))}
              </select>
            </label>
            <label>
              <span className="text-sm font-medium text-zinc-700 dark:text-zinc-300">Topic</span>
              <select
                value={topicId}
                onChange={(e) => setTopicId(e.target.value)}
                className="mt-1.5 w-full rounded-xl border border-zinc-300 bg-white px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-900"
              >
                {subjects.flatMap((s) =>
                  s.topics.map((t) => (
                    <option key={t.id} value={t.id}>
                      {s.name} · {t.name}
                    </option>
                  ))
                )}
              </select>
            </label>
          </div>
        ) : null}

        <label className="mt-4 block">
          <span className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
            Questions ({count})
          </span>
          <div className="mt-1.5 flex gap-2">
            {countOptions.map((c) => (
              <button
                key={c}
                type="button"
                onClick={() => setCount(c)}
                className={`rounded-lg px-4 py-2 text-sm font-medium ${
                  count === c
                    ? "bg-indigo-600 text-white"
                    : "bg-zinc-100 text-zinc-600 hover:bg-zinc-200 dark:bg-zinc-800 dark:text-zinc-300"
                }`}
              >
                {c}
              </button>
            ))}
          </div>
        </label>

        {error ? <p className="mt-3 text-sm text-red-600 dark:text-red-400">{error}</p> : null}

        <button
          type="button"
          onClick={launch}
          disabled={busy || (scope === "section" && !sectionId) || (scope === "topic" && !topicId)}
          className="mt-4 w-full rounded-xl bg-indigo-600 px-4 py-3 text-sm font-semibold text-white hover:bg-indigo-500 disabled:opacity-50"
        >
          {busy ? "Building mock…" : "Start mock"}
        </button>
      </section>

      <section className="rounded-2xl border border-zinc-200 bg-white p-5 dark:border-zinc-800 dark:bg-zinc-900">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-zinc-500">
          History
        </h2>
        {history === null ? (
          <p className="mt-3 text-sm text-zinc-500">Loading…</p>
        ) : history.runs.length === 0 ? (
          <p className="mt-3 text-sm text-zinc-500">No mock runs yet. Finish your first mock to see results here.</p>
        ) : (
          <>
            {history.comparison.mockAverage !== null ? (
              <p className="mt-3 text-sm text-zinc-600 dark:text-zinc-400">
                Avg mock accuracy{" "}
                <span className="font-semibold">{history.comparison.mockAverage.toFixed(1)}%</span>
                {history.comparison.practiceAverage !== null ? (
                  <>
                    {" "}
                    vs practice{" "}
                    <span className="font-semibold">{history.comparison.practiceAverage.toFixed(1)}%</span>
                    {" "}— mock-performance gap for calibrating difficulty.
                  </>
                ) : null}
              </p>
            ) : null}
            <ul className="mt-3 flex flex-col gap-2">
              {history.runs.map((r) => (
                <li
                  key={r.id}
                  className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-zinc-200 px-3 py-2 text-sm dark:border-zinc-700"
                >
                  <span className="font-medium">
                    {r.label}
                    <span className="ml-2 rounded-full bg-zinc-100 px-2 py-0.5 text-xs text-zinc-500 dark:bg-zinc-800 dark:text-zinc-400">
                      {r.scope} · {r.questionCount} Q
                    </span>
                  </span>
                  <span className="tabular-nums text-zinc-600 dark:text-zinc-300">
                    {r.score}/{r.maxScore} · {r.accuracy.toFixed(0)}% ·{" "}
                    {new Date(r.createdAt).toLocaleDateString()}
                  </span>
                </li>
              ))}
            </ul>
          </>
        )}
      </section>
    </div>
  );
}
