"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { BookmarkIcon, XIcon } from "@/components/icons";

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
        <p className="inline-flex items-center gap-2 text-sm font-medium text-bad">
          <XIcon />
          {error}
        </p>
        <div>
          <Link href="/practice" className="btn btn-primary mt-4">
            Go to practice
          </Link>
        </div>
      </div>
    );
  }

  if (questions === null) {
    return (
      <div className="flex flex-col gap-4" role="status" aria-label="Loading saved questions">
        {Array.from({ length: 3 }, (_, i) => (
          <div key={i} className="card p-5">
            <div className="flex items-start gap-3">
              <div className="skeleton h-9 w-9" />
              <div className="flex-1 space-y-2">
                <div className="skeleton h-4 w-full" />
                <div className="skeleton h-4 w-2/3" />
              </div>
            </div>
            <div className="mt-4 flex gap-2">
              <div className="skeleton h-6 w-24" />
              <div className="skeleton h-6 w-20" />
              <div className="skeleton h-6 w-14" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (questions.length === 0) {
    return (
      <div className="card flex flex-col items-center gap-3 p-10 text-center">
        <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-brand-soft">
          <BookmarkIcon className="h-6 w-6 fill-brand text-brand" />
        </span>
        <h2 className="text-lg font-bold">No saved questions yet</h2>
        <p className="max-w-md text-sm text-muted-fg">
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
    <div className="stagger flex flex-col gap-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="text-sm text-muted-fg">
          {questions.length} saved question{questions.length === 1 ? "" : "s"}
          {missingCount > 0 ? ` · ${missingCount} no longer in the bank` : ""}
        </p>
        <button type="button" onClick={clearAll} className="btn btn-danger btn-sm">
          Clear all
        </button>
      </div>

      {questions.map((q) => {
        const isRevealed = revealed.has(q.id);
        return (
          <article key={q.id} className="card card-hover p-5">
            <div className="flex items-start gap-3">
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-brand-soft">
                <BookmarkIcon className="fill-brand text-brand" />
              </span>
              <p className="line-clamp-3 font-medium leading-relaxed text-ink">{q.text}</p>
            </div>

            <div className="mt-3 flex flex-wrap items-center gap-2 text-xs">
              <span className="chip">{q.subject}</span>
              <span className="chip">{q.topic}</span>
              <span
                className={`badge ${
                  q.difficulty === "EASY"
                    ? "badge-ok"
                    : q.difficulty === "MEDIUM"
                      ? "badge-warn"
                      : "badge-bad"
                }`}
              >
                {q.difficulty.toLowerCase()}
              </span>
            </div>

            {!isRevealed ? (
              <button type="button" onClick={() => toggleReveal(q.id)} className="btn btn-secondary mt-4">
                Show answer
              </button>
            ) : (
              <div className="mt-4 rounded-xl border border-line bg-canvas p-4">
                <ul className="flex flex-col gap-1.5 text-sm">
                  {q.options.map((opt, i) => (
                    <li key={opt.label} className="flex items-start gap-2">
                      <span
                        className={`mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded text-[0.65rem] font-bold ${
                          i === q.correctIndex
                            ? "bg-ok-soft text-ok"
                            : "border border-line bg-canvas text-subtle-fg"
                        }`}
                      >
                        {opt.label}
                      </span>
                      <span
                        className={
                          i === q.correctIndex ? "font-semibold text-ok" : "text-muted-fg"
                        }
                      >
                        {opt.text}
                      </span>
                    </li>
                  ))}
                </ul>
                <p className="mt-3 border-t border-line pt-3 text-sm leading-relaxed text-muted-fg">
                  {q.explanation}
                </p>
              </div>
            )}

            <div className="mt-4 flex justify-end">
              <button type="button" onClick={() => removeBookmark(q.id)} className="btn btn-ghost btn-sm">
                <BookmarkIcon className="fill-brand text-brand" />
                Remove
              </button>
            </div>
          </article>
        );
      })}
    </div>
  );
}
