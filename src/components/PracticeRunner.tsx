"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import {
  ArrowRightIcon,
  BookmarkIcon,
  CheckIcon,
  ClockIcon,
  FlagIcon,
  SparklesIcon,
  XIcon,
} from "@/components/icons";

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

const DIFFICULTY_BADGE_CLASS: Record<string, string> = {
  EASY: "badge badge-ok",
  MEDIUM: "badge badge-warn",
  HARD: "badge badge-bad",
  VERY_HARD: "badge badge-bad",
};

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
      <div className="card p-6 text-center">
        <p className="field-error">{error}</p>
        <Link href="/practice" className="link mt-3 inline-block text-sm">
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
      <div className="card p-5 sm:p-6">
        <div className="skeleton h-6 w-1/3" />
        <div className="skeleton mt-4 h-24" />
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
        <span className="inline-flex items-center gap-1.5 text-muted-fg tabular-nums">
          <ClockIcon className="h-4 w-4" />
          {formatTime(elapsed)}
        </span>
      </div>

      <div className="progress">
        <div
          className="progress-bar"
          style={{ width: `${((currentIndex + (feedback ? 1 : 0)) / (questions?.length || 1)) * 100}%` }}
        />
      </div>

      {/* Question */}
      <section className="card rise-in p-5 sm:p-6">
        <div className="flex flex-wrap items-center gap-2 text-xs">
          <span className="chip">{question.subject}</span>
          <span className="chip">{question.topic}</span>
          <span className={DIFFICULTY_BADGE_CLASS[question.difficulty] ?? "badge badge-neutral"}>
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
                className={`mcq-option flex items-center gap-3 rounded-xl border px-4 py-3.5 text-left text-base transition-colors ${
                  isSelected
                    ? "border-brand bg-brand-soft ring-4 ring-brand/15"
                    : "border-line bg-card hover:border-line-strong"
                }`}
              >
                <span
                  className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border text-sm font-bold ${
                    isSelected
                      ? "border-brand bg-brand text-on-brand"
                      : "border-line bg-canvas text-muted-fg"
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
            <span className="text-muted-fg">Confidence:</span>
            {CONFIDENCE_LABELS.map((label, i) => (
              <button
                key={label}
                type="button"
                onClick={() => setConfidence(i + 1)}
                className={`rounded-full px-3 py-1.5 font-medium transition-colors ${
                  confidence === i + 1
                    ? "bg-brand text-on-brand"
                    : "border border-line text-muted-fg hover:border-brand"
                }`}
              >
                {label}
              </button>
            ))}
            <span className="ml-auto hidden items-center gap-1 text-xs text-subtle-fg xl:flex">
              <Kbd>A</Kbd>–<Kbd>D</Kbd> select · <Kbd>Enter</Kbd> submit · <Kbd>S</Kbd> skip
            </span>
          </div>

          <div className="sticky bottom-3 z-10 flex items-center gap-2 rounded-2xl glass p-2 shadow-soft">
            <button
              type="button"
              onClick={toggleBookmark}
              aria-label="Bookmark question"
              className={`inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border transition-colors ${
                bookmarked
                  ? "border-brand bg-brand-soft text-brand"
                  : "border-line text-muted-fg hover:border-brand hover:text-brand"
              }`}
            >
              <BookmarkIcon className={`h-5 w-5 ${bookmarked ? "fill-current" : ""}`} />
            </button>
            <button
              type="button"
              onClick={() => submit(null)}
              disabled={submitting}
              className="btn btn-secondary flex-1"
            >
              Skip
            </button>
            <button
              type="button"
              onClick={() => submit(selected)}
              disabled={selected === null || submitting}
              className="btn btn-primary flex-1"
            >
              {submitting ? "Saving…" : "Submit"}
            </button>
            <button
              type="button"
              onClick={() => setReportOpen(true)}
              aria-label="Report question"
              title="Report this question"
              className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-muted-fg transition-colors hover:bg-brand-soft hover:text-brand"
            >
              <FlagIcon className="h-5 w-5" />
            </button>
          </div>
        </>
      ) : null}

      {/* Report modal */}
      {reportOpen ? (
        <div className="fixed inset-0 z-30 flex items-end justify-center bg-black/50 p-4 backdrop-blur-sm sm:items-center">
          <div className="panel rise-in w-full max-w-md p-5">
            <h3 className="text-base font-bold tracking-tight">Report question</h3>
            {reportSent ? (
              <p className="field-ok mt-3">Thanks — your report has been submitted.</p>
            ) : (
              <>
                <textarea
                  value={reportIssue}
                  onChange={(e) => setReportIssue(e.target.value)}
                  placeholder="What's wrong? Wrong answer key, unclear wording…"
                  rows={3}
                  className="input mt-3"
                />
                <div className="mt-3 flex justify-end gap-2">
                  <button type="button" onClick={() => setReportOpen(false)} className="btn btn-secondary">
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={sendReport}
                    disabled={!reportIssue.trim()}
                    className="btn btn-primary"
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
  const tone = correct
    ? { border: "border-ok/40", bg: "bg-ok-soft", text: "text-ok" }
    : skipped
      ? { border: "border-warn/40", bg: "bg-warn-soft", text: "text-warn" }
      : { border: "border-bad/40", bg: "bg-bad-soft", text: "text-bad" };

  return (
    <section className={`rise-in rounded-2xl border p-5 ${tone.border} ${tone.bg}`}>
      <div className="flex items-center justify-between">
        <h3 className={`flex items-center gap-2 text-base font-bold ${tone.text}`}>
          {correct ? (
            <>
              <CheckIcon className="h-4 w-4" /> Correct
            </>
          ) : skipped ? (
            <>
              <span aria-hidden className="inline-block h-0.5 w-4 rounded-full bg-current" /> Skipped
            </>
          ) : (
            <>
              <XIcon className="h-4 w-4" /> Incorrect
            </>
          )}
        </h3>
        <span className={`stat-num text-sm ${tone.text}`}>
          {feedback.score > 0 ? `+${feedback.score}` : feedback.score}
        </span>
      </div>

      <div className="mt-3 rounded-xl border border-line bg-card p-4">
        <p className="text-sm font-medium text-muted-fg">
          Correct answer:{" "}
          <span className="font-semibold text-ok">
            {options[feedback.correctIndex].label}. {options[feedback.correctIndex].text}
          </span>
        </p>
        <p className="mt-3 text-sm leading-relaxed">{feedback.explanation}</p>

        <dl className="mt-3 grid grid-cols-2 gap-x-4 gap-y-1.5 border-t border-line pt-3 text-xs">
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

      <button type="button" onClick={onNext} className="btn btn-primary mt-4 w-full">
        {isLast ? (
          "Finish"
        ) : (
          <>
            Next question
            <ArrowRightIcon className="h-4 w-4" />
          </>
        )}
      </button>
    </section>
  );
}

function DetailRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex flex-col gap-0.5">
      <dt className="text-muted-fg">{label}</dt>
      <dd className="font-medium">{value}</dd>
    </div>
  );
}

function Kbd({ children }: { children: React.ReactNode }) {
  return <kbd className="kbd">{children}</kbd>;
}

function SummaryScreen({ summary }: { summary: SessionSummary }) {
  const accuracy = summary.accuracy == null ? "—" : `${summary.accuracy.toFixed(1)}%`;
  return (
    <div className="flex flex-col gap-5">
      <section className="card rise-in p-6 text-center">
        <h2 className="inline-flex items-center gap-2 text-lg font-bold tracking-tight">
          <SparklesIcon className="h-5 w-5 text-brand" />
          Session complete
        </h2>
        <p className="stat-num text-gradient mt-3 text-5xl">
          {summary.netScore > 0 ? `+${summary.netScore}` : summary.netScore}
        </p>
        <p className="text-sm text-muted-fg">net score</p>
      </section>

      <section className="stagger grid grid-cols-2 gap-3 sm:grid-cols-3">
        <Stat label="Questions" value={String(summary.total)} />
        <Stat label="Correct" value={String(summary.correct)} />
        <Stat label="Incorrect" value={String(summary.incorrect)} />
        <Stat label="Unattempted" value={String(summary.unattempted)} />
        <Stat label="Accuracy" value={accuracy} />
        <Stat label="Avg time" value={`${(summary.averageTimeMs / 1000).toFixed(1)}s`} />
      </section>

      <div className="flex flex-col gap-2">
        <Link href="/practice" className="btn btn-primary w-full">
          Back to practice
        </Link>
        <Link href="/" className="btn btn-secondary w-full">
          Home
        </Link>
      </div>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="card p-4 text-center">
      <p className="stat-num text-xl">{value}</p>
      <p className="mt-0.5 text-xs text-muted-fg">{label}</p>
    </div>
  );
}
