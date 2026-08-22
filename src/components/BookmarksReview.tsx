"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";

const BOOKMARK_KEY = "mcqure-bookmarks";

interface SavedQuestion {
  id: string;
  text: string;
  options: Array<{ label: string; text: string }>;
  correctIndex: number;
  explanation: string;
  difficulty: "EASY" | "MEDIUM" | "HARD" | "VERY_HARD";
  sourceType: string;
  subject: string;
  topic: string;
  subtopic: string | null;
}

function loadBookmarkIds(): string[] {
  try {
    const raw = localStorage.getItem(BOOKMARK_KEY);
    const parsed = raw ? (JSON.parse(raw) as unknown) : [];
    return Array.isArray(parsed) ? parsed.filter((x): x is string => typeof x === "string") : [];
  } catch {
    return [];
  }
}

function persistBookmarkIds(ids: string[]) {
  try {
    localStorage.setItem(BOOKMARK_KEY, JSON.stringify(ids));
  } catch {
    // ignore storage errors
  }
}

export function BookmarksReview() {
  const [questions, setQuestions] = useState<SavedQuestion[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [revealed, setRevealed] = useState<Set<string>>(new Set());
  const [missingCount, setMissingCount] = useState(0);

  useEffect(() => {
    // Deferred to a microtask so no setState happens synchronously in the
    // effect body.
    Promise.resolve().then(async () => {
      const ids = loadBookmarkIds();
      if (ids.length === 0) {
        setQuestions([]);
        return;
      }
      try {
        const res = await fetch(`/api/questions/bookmarks?ids=${encodeURIComponent(ids.join(","))}`);
        const data = (await res.json()) as {
          ok: boolean;
          questions?: SavedQuestion[];
          message?: string;
        };
        if (!data.ok || !data.questions) throw new Error(data.message ?? "Could not load saved questions");
        setQuestions(data.questions);
        if (data.questions.length < ids.length) setMissingCount(ids.length - data.questions.length);
      } catch (e) {
        setError(e instanceof Error ? e.message : "Could not load saved questions");
      }
    });
  }, []);

  const removeBookmark = useCallback((id: string) => {
    persistBookmarkIds(loadBookmarkIds().filter((x) => x !== id));
    setQuestions((qs) => (qs ? qs.filter((q) => q.id !== id) : qs));
  }, []);

  const toggleReveal = useCallback((id: string) => {
    setRevealed((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }, []);

  function clearAll() {
    persistBookmarkIds([]);
    setQuestions([]);
    setMissingCount(0);
  }

  if (error) {
    return (
      <div className="card p-6 text-center">
        <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
        <Link href="/practice" className="btn btn-primary mt-4">
          Go to practice
        </Link>
      </div>
    );
  }

  if (questions === null) {
    return (
      <div className="flex flex-col gap-4" role="status" aria-label="Loading saved questions">
        {Array.from({ length: 3 }, (_, i) => (
          <div key={i} className="h-32 animate-pulse rounded-2xl bg-zinc-200/70 dark:bg-zinc-800/70" />
        ))}
      </div>
    );
  }

  if (questions.length === 0) {
    return (
      <div className="card flex flex-col items-center gap-3 p-10 text-center">
        <span className="text-4xl" aria-hidden>
          🔖
        </span>
        <h2 className="text-lg font-bold">No saved questions yet</h2>
        <p className="max-w-md text-sm text-zinc-500 dark:text-zinc-400">
          While practicing, tap the bookmark button on a question you want to revisit.
          Your saved questions appear here for review — with answers and explanations.
        </p>
        <Link href="/practice" className="btn btn-primary mt-2">
          Start practicing
        </Link>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="text-sm text-zinc-500 dark:text-zinc-400">
          {questions.length} saved question{questions.length === 1 ? "" : "s"}
          {missingCount > 0 ? ` · ${missingCount} no longer in the bank` : ""}
        </p>
        <button type="button" onClick={clearAll} className="btn btn-secondary !py-1.5 text-xs">
          Clear all
        </button>
      </div>

      {questions.map((q) => {
        const isRevealed = revealed.has(q.id);
        return (
          <article key={q.id} className="card p-5">
            <div className="flex flex-wrap items-center gap-2 text-xs">
              <span className="badge bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-300">{q.subject}</span>
              <span className="badge bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-300">{q.topic}</span>
              <span
                className={`badge ${
                  q.difficulty === "EASY"
                    ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/50 dark:text-emerald-300"
                    : q.difficulty === "MEDIUM"
                      ? "bg-amber-100 text-amber-700 dark:bg-amber-900/50 dark:text-amber-300"
                      : "bg-red-100 text-red-700 dark:bg-red-900/50 dark:text-red-300"
                }`}
              >
                {q.difficulty.toLowerCase()}
              </span>
            </div>

            <p className="mt-3 font-medium leading-relaxed">{q.text}</p>

            {!isRevealed ? (
              <button type="button" onClick={() => toggleReveal(q.id)} className="btn btn-secondary mt-4 !py-2">
                Show answer
              </button>
            ) : (
              <div className="mt-4 rounded-xl bg-zinc-50 p-4 dark:bg-zinc-800/60">
                <ul className="flex flex-col gap-1.5 text-sm">
                  {q.options.map((opt, i) => (
                    <li key={opt.label} className="flex items-start gap-2">
                      <span
                        className={`mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded text-[0.65rem] font-bold ${
                          i === q.correctIndex
                            ? "bg-emerald-600 text-white"
                            : "bg-zinc-200 text-zinc-500 dark:bg-zinc-700 dark:text-zinc-400"
                        }`}
                      >
                        {opt.label}
                      </span>
                      <span className={i === q.correctIndex ? "font-semibold text-emerald-700 dark:text-emerald-400" : "text-zinc-600 dark:text-zinc-300"}>
                        {opt.text}
                      </span>
                    </li>
                  ))}
                </ul>
                <p className="mt-3 border-t border-zinc-200 pt-3 text-sm leading-relaxed text-zinc-700 dark:border-zinc-700 dark:text-zinc-300">
                  {q.explanation}
                </p>
              </div>
            )}

            <div className="mt-4 flex justify-end">
              <button type="button" onClick={() => removeBookmark(q.id)} className="btn btn-ghost !py-1.5 text-xs text-zinc-500">
                Remove 🔖
              </button>
            </div>
          </article>
        );
      })}
    </div>
  );
}
