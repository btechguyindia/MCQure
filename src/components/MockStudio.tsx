"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowRightIcon, ReportsIcon, TargetIcon } from "@/components/icons";

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
      <section className="card p-5 sm:p-6">
        <div className="flex items-center gap-2">
          <TargetIcon className="text-brand" />
          <h2 className="section-title">Configure a mock</h2>
        </div>
        <div className="mt-4 grid gap-3 sm:grid-cols-3">
          {(Object.keys(SCOPE_META) as Scope[]).map((s) => (
            <button
              key={s}
              type="button"
              onClick={() => pickScope(s)}
              className={`rounded-xl border p-4 text-left transition-colors ${
                scope === s
                  ? "border-brand bg-brand-soft ring-4 ring-brand/15"
                  : "border-line bg-card hover:border-line-strong"
              }`}
            >
              <h3 className={`font-bold ${scope === s ? "text-brand" : "text-ink"}`}>
                {SCOPE_META[s].title}
              </h3>
              <p className="mt-1 text-xs text-muted-fg">{SCOPE_META[s].desc}</p>
            </button>
          ))}
        </div>

        {scope === "section" ? (
          <label className="mt-4 block">
            <span className="label">Section</span>
            <select
              value={sectionId}
              onChange={(e) => setSectionId(e.target.value)}
              className="input"
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
              <span className="label">Subject</span>
              <select
                value={topicId}
                onChange={(e) => setTopicId(e.target.value)}
                className="input"
              >
                {subjects.map((s) => (
                  <option key={s.id} value={s.topics[0]?.id ?? ""} disabled={s.topics.length === 0}>
                    {s.name}
                  </option>
                ))}
              </select>
            </label>
            <label>
              <span className="label">Topic</span>
              <select
                value={topicId}
                onChange={(e) => setTopicId(e.target.value)}
                className="input"
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
          <span className="label">Questions ({count})</span>
          <div className="flex gap-2">
            {countOptions.map((c) => (
              <button
                key={c}
                type="button"
                onClick={() => setCount(c)}
                className={`btn btn-sm ${count === c ? "btn-primary" : "btn-secondary"}`}
              >
                {c}
              </button>
            ))}
          </div>
        </label>

        {error ? <p className="field-error mt-4">{error}</p> : null}

        <button
          type="button"
          onClick={launch}
          disabled={busy || (scope === "section" && !sectionId) || (scope === "topic" && !topicId)}
          className="btn btn-primary btn-lg mt-5 w-full"
        >
          {busy ? (
            "Building mock…"
          ) : (
            <>
              Start mock <ArrowRightIcon />
            </>
          )}
        </button>
      </section>

      <section className="card p-5 sm:p-6">
        <div className="flex items-center gap-2">
          <ReportsIcon className="text-brand" />
          <h2 className="section-title">History</h2>
        </div>
        {history === null ? (
          <div className="mt-4 flex flex-col gap-2" aria-hidden>
            <div className="skeleton h-10 w-full" />
            <div className="skeleton h-10 w-full" />
            <div className="skeleton h-10 w-2/3" />
          </div>
        ) : history.runs.length === 0 ? (
          <p className="mt-4 rounded-xl border border-dashed border-line px-4 py-6 text-center text-sm text-muted-fg">
            No mock runs yet. Finish your first mock to see results here.
          </p>
        ) : (
          <>
            {history.comparison.mockAverage !== null ? (
              <p className="mt-4 text-sm text-muted-fg">
                Avg mock accuracy{" "}
                <span className="stat-num text-ink">{history.comparison.mockAverage.toFixed(1)}%</span>
                {history.comparison.practiceAverage !== null ? (
                  <>
                    {" "}
                    vs practice{" "}
                    <span className="stat-num text-ink">{history.comparison.practiceAverage.toFixed(1)}%</span>
                    {" "}— mock-performance gap for calibrating difficulty.
                  </>
                ) : null}
              </p>
            ) : null}
            <ul className="stagger mt-3 flex flex-col gap-2">
              {history.runs.map((r) => (
                <li
                  key={r.id}
                  className="flex flex-wrap items-center justify-between gap-x-3 gap-y-1 rounded-xl border border-line bg-card px-3 py-2.5 text-sm"
                >
                  <span className="flex flex-wrap items-center gap-2 font-medium text-ink">
                    {r.label}
                    <span className="badge badge-neutral">
                      {r.scope} · {r.questionCount} Q
                    </span>
                  </span>
                  <span className="stat-num font-semibold text-muted-fg">
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
