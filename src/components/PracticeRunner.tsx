"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";

interface PublicQuestion {
  id: string;
  subject: string;
  topic: string;
  subtopic: string | null;
  difficulty: "EASY" | "MEDIUM" | "HARD" | "VERY_HARD";
  sourceType: string;
  examRelevance: number;
  text: string;
  options: Array<{ label: string; text: string }>;
}

interface Feedback {
  isCorrect: boolean | null;
  score: number;
  correctIndex: number;
  explanation: string;
  source: { name: string; type: string; examName: string | null; year: number | null; verified: boolean } | null;
  subject: string;
  topic: string;
  subtopic: string | null;
  difficulty: string;
  examRelevance: number;
  responseTimeMs: number;
}

interface SessionSummary {
  total: number;
  answered: number;
  correct: number;
  incorrect: number;
  unattempted: number;
  accuracy: number | null;
  netScore: number;
  averageTimeMs: number;
}

const BOOKMARK_KEY = "mcqure-bookmarks";
const CONFIDENCE_LABELS = ["Not sure", "Fairly", "Confident"] as const;

function loadBookmarks(): Set<string> {
  try {
    const raw = localStorage.getItem(BOOKMARK_KEY);
    return new Set(raw ? (JSON.parse(raw) as string[]) : []);
  } catch {
    return new Set();
  }
}

function saveBookmarks(bookmarks: Set<string>) {
  try {
    localStorage.setItem(BOOKMARK_KEY, JSON.stringify([...bookmarks]));
  } catch {
    // ignore storage errors
  }
}

export function PracticeRunner({ sessionId }: { sessionId: string }) {
  const [questions, setQuestions] = useState<PublicQuestion[] | null>(null);
  const [summary, setSummary] = useState<SessionSummary | null>(null);
  const [error, setError] = useState<string | null>(null);

  const [currentIndex, setCurrentIndex] = useState(0);
  const [selected, setSelected] = useState<number | null>(null);
  const [confidence, setConfidence] = useState<number | null>(null);
  const [feedback, setFeedback] = useState<Feedback | null>(null);
  const [elapsed, setElapsed] = useState(0);
  const [submitting, setSubmitting] = useState(false);
  const [bookmarked, setBookmarked] = useState(false);
  const [reportOpen, setReportOpen] = useState(false);
  const [reportIssue, setReportIssue] = useState("");
  const [reportSent, setReportSent] = useState(false);

  const questionStartRef = useRef<number>(0);
  const bookmarksRef = useRef<Set<string>>(new Set());

  // Load the session
  useEffect(() => {
    fetch(`/api/practice/session?sessionId=${encodeURIComponent(sessionId)}`)
      .then((r) => r.json())
      .then((data) => {
        if (!data.ok) throw new Error(data.message ?? "Could not load session");
        if (data.session.status === "COMPLETED") {
          setSummary(data.summary);
          return;
        }
        const qs = data.questions as PublicQuestion[];
        setQuestions(qs);

        // Resume at the first unanswered question.
        const answeredIds = new Set(Object.keys(data.attempts ?? {}));
        const firstUnanswered = qs.findIndex((q) => !answeredIds.has(q.id));
        const startIndex = firstUnanswered === -1 ? Math.max(qs.length - 1, 0) : firstUnanswered;
        setCurrentIndex(startIndex);
        questionStartRef.current = Date.now();
      })
      .catch((e) => setError(e.message ?? "Could not load session"));

    bookmarksRef.current = loadBookmarks();
  }, [sessionId]);

  // Restore bookmark state when the question changes
  useEffect(() => {
    const q = questions?.[currentIndex];
    if (q) setBookmarked(bookmarksRef.current.has(q.id));
  }, [currentIndex, questions]);

  // Per-question timer
  useEffect(() => {
    if (!questions || feedback) return;
    const id = setInterval(() => {
      setElapsed(Math.floor((Date.now() - questionStartRef.current) / 1000));
    }, 500);
    return () => clearInterval(id);
  }, [questions, currentIndex, feedback]);

  const question = questions?.[currentIndex];

  function toggleBookmark() {
    if (!question) return;
    const next = new Set(bookmarksRef.current);
    if (next.has(question.id)) next.delete(question.id);
    else next.add(question.id);
    bookmarksRef.current = next;
    setBookmarked(next.has(question.id));
    saveBookmarks(next);
  }

  const submit = useCallback(
    async (selectedIndex: number | null) => {
      if (!question || !sessionId || submitting) return;
      setSubmitting(true);
      const responseTimeMs = Date.now() - questionStartRef.current;
      try {
        const res = await fetch("/api/practice/answer", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            sessionId,
            questionId: question.id,
            selectedIndex,
            confidence,
            responseTimeMs,
            errorType: null,
          }),
        });
        const data = (await res.json()) as {
          ok: boolean;
          attempt?: Feedback;
          message?: string;
        };
        if (!res.ok || !data.ok || !data.attempt) {
          setError(data.message ?? "Could not save your answer");
          setSubmitting(false);
          return;
        }
        setFeedback(data.attempt);
      } catch {
        setError("Network error. Please try again.");
      } finally {
        setSubmitting(false);
      }
    },
    [question, sessionId, submitting, confidence]
  );

  const nextQuestion = useCallback(async function nextQuestion() {
    setFeedback(null);
    setSelected(null);
    setConfidence(null);
    setReportSent(false);
    setReportOpen(false);

    if (questions && currentIndex + 1 < questions.length) {
      setCurrentIndex(currentIndex + 1);
      questionStartRef.current = Date.now();
      setElapsed(0);
      return;
    }

    // Last question → complete the session.
    try {
      const res = await fetch("/api/practice/complete", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sessionId }),
      });
      const data = (await res.json()) as { ok: boolean; summary?: SessionSummary; message?: string };
      if (!res.ok || !data.ok || !data.summary) {
        setError(data.message ?? "Could not complete session");
        return;
      }
      setSummary(data.summary);
    } catch {
      setError("Network error. Please try again.");
    }
  }, [questions, currentIndex, sessionId]);

  async function sendReport() {
    if (!question || !reportIssue.trim()) return;
    try {
      const res = await fetch("/api/questions/report", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ questionId: question.id, issue: reportIssue.trim() }),
      });
      const data = (await res.json()) as { ok: boolean; message?: string };
      if (!res.ok || !data.ok) {
        setError(data.message ?? "Could not submit report");
        return;
      }
      setReportSent(true);
    } catch {
      setError("Network error. Please try again.");
    }
  }

  // Keyboard shortcuts: 1-4 / A-D select an option, Enter submits or advances,
  // S skips. Disabled while typing in inputs (e.g. the report modal).
  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      const target = e.target as HTMLElement | null;
      if (target && ["INPUT", "TEXTAREA", "SELECT"].includes(target.tagName)) return;
      if (e.metaKey || e.ctrlKey || e.altKey) return;
      if (!question) return;

      const key = e.key.toLowerCase();
      const optionIndex =
        ["1", "2", "3", "4"].indexOf(key) >= 0
          ? Number(key) - 1
          : ["a", "b", "c", "d"].indexOf(key);

      if (feedback) {
        if (e.key === "Enter" || key === "n") {
          e.preventDefault();
          void nextQuestion();
        }
        return;
      }

      if (optionIndex >= 0 && optionIndex < question.options.length) {
        e.preventDefault();
        setSelected(optionIndex);
      } else if (e.key === "Enter" && selected !== null) {
        e.preventDefault();
        void submit(selected);
      } else if (key === "s") {
        e.preventDefault();
        void submit(null);
      }
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [question, feedback, selected, submit, nextQuestion]);

  // ── Render ────────────────────────────────────────────────────────────────

  if (error && !questions && !summary) {
    return (
      <div className="rounded-2xl border border-zinc-200 bg-white p-6 text-center dark:border-zinc-800 dark:bg-zinc-900">
        <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
        <Link href="/practice" className="mt-3 inline-block text-sm font-semibold text-indigo-600">
          Back to practice
        </Link>
      </div>
    );
  }

  if (summary) {
    return <SummaryScreen summary={summary} />;
  }

  if (!question) {
    return (
      <div className="rounded-2xl border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-900">
        <div className="h-6 w-1/3 animate-pulse rounded bg-zinc-100 dark:bg-zinc-800" />
        <div className="mt-4 h-24 animate-pulse rounded bg-zinc-100 dark:bg-zinc-800" />
      </div>
    );
  }

  const formatTime = (s: number) => {
    const m = Math.floor(s / 60);
    const sec = s % 60;
    return `${m}:${String(sec).padStart(2, "0")}`;
  };

  return (
    <div className="flex flex-col gap-4">
      {/* Top bar */}
      <div className="flex items-center justify-between text-sm">
        <span className="font-semibold">
          Question {currentIndex + 1} / {questions?.length}
        </span>
        <span className="tabular-nums text-zinc-500 dark:text-zinc-400">
          ⏱ {formatTime(elapsed)}
        </span>
      </div>

      <div className="h-1.5 w-full overflow-hidden rounded-full bg-zinc-200 dark:bg-zinc-800">
        <div
          className="h-full bg-indigo-600 transition-all"
          style={{ width: `${((currentIndex + (feedback ? 1 : 0)) / (questions?.length || 1)) * 100}%` }}
        />
      </div>

      {/* Question */}
      <section className="rounded-2xl border border-zinc-200 bg-white p-5 dark:border-zinc-800 dark:bg-zinc-900">
        <div className="flex flex-wrap items-center gap-2 text-xs">
          <span className="rounded-full bg-zinc-100 px-2.5 py-1 font-medium text-zinc-600 dark:bg-zinc-800 dark:text-zinc-300">
            {question.subject}
          </span>
          <span className="rounded-full bg-zinc-100 px-2.5 py-1 font-medium text-zinc-600 dark:bg-zinc-800 dark:text-zinc-300">
            {question.topic}
          </span>
          <span
            className={`rounded-full px-2.5 py-1 font-medium ${
              question.difficulty === "EASY"
                ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/50 dark:text-emerald-300"
                : question.difficulty === "MEDIUM"
                  ? "bg-amber-100 text-amber-700 dark:bg-amber-900/50 dark:text-amber-300"
                  : "bg-red-100 text-red-700 dark:bg-red-900/50 dark:text-red-300"
            }`}
          >
            {question.difficulty}
          </span>
        </div>

        <p className="mt-4 text-lg font-medium leading-relaxed">{question.text}</p>
      </section>

      {/* Options */}
      {!feedback ? (
        <section className="flex flex-col gap-2.5">
          {question.options.map((opt) => {
            const isSelected = selected === question.options.indexOf(opt);
            return (
              <button
                key={opt.label}
                type="button"
                onClick={() => setSelected(question.options.indexOf(opt))}
                className={`mcq-option flex items-center gap-3 rounded-xl border-2 px-4 py-3.5 text-left text-base transition-colors ${
                  isSelected
                    ? "border-indigo-500 bg-indigo-50 dark:bg-indigo-950/40"
                    : "border-zinc-200 bg-white hover:border-zinc-400 dark:border-zinc-800 dark:bg-zinc-900 dark:hover:border-zinc-600"
                }`}
              >
                <span
                  className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-sm font-bold ${
                    isSelected
                      ? "bg-indigo-600 text-white"
                      : "bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-300"
                  }`}
                >
                  {opt.label}
                </span>
                <span>{opt.text}</span>
              </button>
            );
          })}
        </section>
      ) : (
        <FeedbackPanel
          feedback={feedback}
          options={question.options}
          onNext={nextQuestion}
          isLast={currentIndex + 1 === questions?.length}
        />
      )}

      {/* Controls */}
      {!feedback ? (
        <>
          <div className="flex flex-wrap items-center gap-2 text-sm">
            <span className="text-zinc-500 dark:text-zinc-400">Confidence:</span>
            {CONFIDENCE_LABELS.map((label, i) => (
              <button
                key={label}
                type="button"
                onClick={() => setConfidence(i + 1)}
                className={`rounded-full px-3 py-1.5 font-medium transition-colors ${
                  confidence === i + 1
                    ? "bg-indigo-600 text-white"
                    : "bg-zinc-100 text-zinc-600 hover:bg-zinc-200 dark:bg-zinc-800 dark:text-zinc-300"
                }`}
              >
                {label}
              </button>
            ))}
            <span className="ml-auto hidden text-xs text-zinc-400 xl:block">
              <Kbd>A</Kbd>–<Kbd>D</Kbd> select · <Kbd>⏎</Kbd> submit · <Kbd>S</Kbd> skip
            </span>
          </div>

          <div className="sticky bottom-3 flex items-center gap-2">
            <button
              type="button"
              onClick={toggleBookmark}
              aria-label="Bookmark question"
              className={`rounded-xl border px-4 py-3 text-lg transition-colors ${
                bookmarked
                  ? "border-indigo-500 bg-indigo-50 dark:bg-indigo-950/40"
                  : "border-zinc-300 bg-white hover:bg-zinc-100 dark:border-zinc-700 dark:bg-zinc-900 dark:hover:bg-zinc-800"
              }`}
            >
              {bookmarked ? "🔖" : "▢"}
            </button>
            <button
              type="button"
              onClick={() => submit(null)}
              disabled={submitting}
              className="flex-1 rounded-xl border border-zinc-300 px-4 py-3 text-sm font-semibold hover:bg-zinc-100 disabled:opacity-50 dark:border-zinc-700 dark:hover:bg-zinc-800"
            >
              Skip
            </button>
            <button
              type="button"
              onClick={() => submit(selected)}
              disabled={selected === null || submitting}
              className="flex-1 rounded-xl bg-indigo-600 px-4 py-3 text-sm font-semibold text-white hover:bg-indigo-500 disabled:opacity-50"
            >
              {submitting ? "Saving…" : "Submit"}
            </button>
            <button
              type="button"
              onClick={() => setReportOpen(true)}
              aria-label="Report question"
              className="rounded-xl border border-zinc-300 bg-white px-4 py-3 text-sm hover:bg-zinc-100 dark:border-zinc-700 dark:bg-zinc-900 dark:hover:bg-zinc-800"
            >
              ⚑
            </button>
          </div>
        </>
      ) : null}

      {/* Report modal */}
      {reportOpen ? (
        <div className="fixed inset-0 z-30 flex items-end justify-center bg-black/40 p-4 sm:items-center">
          <div className="w-full max-w-md rounded-2xl bg-white p-5 dark:bg-zinc-900">
            <h3 className="text-base font-bold">Report question</h3>
            {reportSent ? (
              <p className="mt-3 text-sm text-emerald-600 dark:text-emerald-400">
                Thanks — your report has been submitted.
              </p>
            ) : (
              <>
                <textarea
                  value={reportIssue}
                  onChange={(e) => setReportIssue(e.target.value)}
                  placeholder="What's wrong? Wrong answer key, unclear wording…"
                  rows={3}
                  className="mt-3 w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm outline-none focus:border-indigo-500 dark:border-zinc-700 dark:bg-zinc-800"
                />
                <div className="mt-3 flex justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setReportOpen(false)}
                    className="rounded-lg border border-zinc-300 px-4 py-2 text-sm font-medium dark:border-zinc-700"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={sendReport}
                    disabled={!reportIssue.trim()}
                    className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white disabled:opacity-50"
                  >
                    Submit
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      ) : null}
    </div>
  );
}

function FeedbackPanel({
  feedback,
  options,
  onNext,
  isLast,
}: {
  feedback: Feedback;
  options: Array<{ label: string; text: string }>;
  onNext: () => void;
  isLast: boolean;
}) {
  const correct = feedback.isCorrect === true;
  const skipped = feedback.isCorrect === null;

  return (
    <section
      className={`rounded-2xl border p-5 ${
        correct
          ? "border-emerald-300 bg-emerald-50 dark:border-emerald-800 dark:bg-emerald-950/30"
          : skipped
            ? "border-amber-300 bg-amber-50 dark:border-amber-800 dark:bg-amber-950/30"
            : "border-red-300 bg-red-50 dark:border-red-800 dark:bg-red-950/30"
      }`}
    >
      <div className="flex items-center justify-between">
        <h3 className="text-base font-bold">
          {correct ? "✓ Correct" : skipped ? "— Skipped" : "✗ Incorrect"}
        </h3>
        <span className="text-sm font-semibold tabular-nums">
          {feedback.score > 0 ? `+${feedback.score}` : feedback.score}
        </span>
      </div>

      <div className="mt-3 rounded-xl bg-white p-4 dark:bg-zinc-900">
        <p className="text-sm font-medium text-zinc-500 dark:text-zinc-400">
          Correct answer:{" "}
          <span className="font-semibold text-emerald-700 dark:text-emerald-400">
            {options[feedback.correctIndex].label}. {options[feedback.correctIndex].text}
          </span>
        </p>
        <p className="mt-3 text-sm leading-relaxed">{feedback.explanation}</p>

        <dl className="mt-3 grid grid-cols-2 gap-x-4 gap-y-1.5 border-t border-zinc-200 pt-3 text-xs dark:border-zinc-800">
          <DetailRow label="Concept" value={feedback.topic} />
          <DetailRow label="Subject" value={feedback.subject} />
          <DetailRow
            label="Response time"
            value={`${(feedback.responseTimeMs / 1000).toFixed(1)}s`}
          />
          <DetailRow
            label="Source"
            value={
              feedback.source
                ? `${feedback.source.name}${feedback.source.verified ? " · verified" : " · unverified"}`
                : "—"
            }
          />
        </dl>
      </div>

      <button
        type="button"
        onClick={onNext}
        className="mt-4 w-full rounded-xl bg-indigo-600 px-4 py-3 text-sm font-semibold text-white hover:bg-indigo-500"
      >
        {isLast ? "Finish" : "Next question →"}
      </button>
    </section>
  );
}

function DetailRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex flex-col gap-0.5">
      <dt className="text-zinc-500 dark:text-zinc-400">{label}</dt>
      <dd className="font-medium">{value}</dd>
    </div>
  );
}

function Kbd({ children }: { children: React.ReactNode }) {
  return (
    <kbd className="rounded border border-zinc-300 bg-zinc-100 px-1.5 py-0.5 font-mono text-[0.65rem] font-semibold text-zinc-500 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-400">
      {children}
    </kbd>
  );
}

function SummaryScreen({ summary }: { summary: SessionSummary }) {
  const accuracy = summary.accuracy == null ? "—" : `${summary.accuracy.toFixed(1)}%`;
  return (
    <div className="flex flex-col gap-5">
      <section className="rounded-2xl border border-zinc-200 bg-white p-6 text-center dark:border-zinc-800 dark:bg-zinc-900">
        <h2 className="text-lg font-bold">Session complete 🎉</h2>
        <p className="mt-1 text-4xl font-black tracking-tight text-indigo-600 dark:text-indigo-400">
          {summary.netScore > 0 ? `+${summary.netScore}` : summary.netScore}
        </p>
        <p className="text-sm text-zinc-500 dark:text-zinc-400">net score</p>
      </section>

      <section className="grid grid-cols-2 gap-3 sm:grid-cols-3">
        <Stat label="Questions" value={String(summary.total)} />
        <Stat label="Correct" value={String(summary.correct)} />
        <Stat label="Incorrect" value={String(summary.incorrect)} />
        <Stat label="Unattempted" value={String(summary.unattempted)} />
        <Stat label="Accuracy" value={accuracy} />
        <Stat label="Avg time" value={`${(summary.averageTimeMs / 1000).toFixed(1)}s`} />
      </section>

      <div className="flex flex-col gap-2">
        <Link
          href="/practice"
          className="rounded-xl bg-indigo-600 px-4 py-3 text-center text-sm font-semibold text-white hover:bg-indigo-500"
        >
          Back to practice
        </Link>
        <Link
          href="/"
          className="rounded-xl border border-zinc-300 px-4 py-3 text-center text-sm font-semibold hover:bg-zinc-100 dark:border-zinc-700 dark:hover:bg-zinc-800"
        >
          Home
        </Link>
      </div>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-zinc-200 bg-white p-4 text-center dark:border-zinc-800 dark:bg-zinc-900">
      <p className="text-xl font-bold">{value}</p>
      <p className="text-xs text-zinc-500 dark:text-zinc-400">{label}</p>
    </div>
  );
}
