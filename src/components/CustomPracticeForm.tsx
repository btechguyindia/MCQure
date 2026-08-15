"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

interface ExamPayload {
  ok: boolean;
  exam?: {
    name: string;
    scoring: {
      correctMarks: number;
      incorrectPenalty: number;
      unattemptedMarks: number;
      timeLimitMinutes: number;
    };
    subjects: Array<{
      id: string;
      name: string;
      topics: Array<{
        id: string;
        name: string;
        questionCount: number;
        subtopics: Array<{ id: string; name: string; questionCount: number }>;
      }>;
    }>;
  };
  message?: string;
}

export function CustomPracticeForm() {
  const router = useRouter();
  const [exam, setExam] = useState<ExamPayload["exam"] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const [subjectId, setSubjectId] = useState("");
  const [topicId, setTopicId] = useState("");
  const [difficulty, setDifficulty] = useState("");
  const [sourceType, setSourceType] = useState("");
  const [count, setCount] = useState(25);
  const [timeLimit, setTimeLimit] = useState("");

  useEffect(() => {
    fetch("/api/exam")
      .then((r) => r.json() as Promise<ExamPayload>)
      .then((d) => {
        if (d.ok && d.exam) setExam(d.exam);
        else setError(d.message ?? "Could not load exam configuration");
      })
      .catch(() => setError("Could not load exam configuration"));
  }, []);

  const selectedSubject = exam?.subjects.find((s) => s.id === subjectId);
  const selectedTopic = selectedSubject?.topics.find((t) => t.id === topicId);
  const totalSubjectQuestions = selectedSubject?.topics.reduce((sum, t) => sum + t.questionCount, 0) ?? 0;
  const filteredCount =
    subjectId && !topicId
      ? totalSubjectQuestions
      : topicId
        ? selectedTopic?.questionCount ?? 0
        : null;
  const noneAvailable = filteredCount !== null && filteredCount === 0;

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setBusy(true);
    try {
      const res = await fetch("/api/practice/start", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          mode: "custom",
          count,
          subjectId: subjectId || undefined,
          topicId: topicId || undefined,
          difficulty: difficulty || undefined,
          sourceType: sourceType || undefined,
          timeLimitMinutes: timeLimit ? Number(timeLimit) : undefined,
        }),
      });
      const data = (await res.json()) as { ok: boolean; session?: { id: string }; message?: string };
      if (!res.ok || !data.ok || !data.session) {
        setError(data.message ?? "Could not start practice");
        setBusy(false);
        return;
      }
      router.push(`/practice/session?sessionId=${data.session.id}`);
    } catch {
      setError("Network error. Please try again.");
      setBusy(false);
    }
  }

  return (
    <section className="rounded-2xl border border-zinc-200 bg-white p-5 dark:border-zinc-800 dark:bg-zinc-900">
      <h2 className="text-lg font-bold">Custom Practice</h2>
      <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
        Pick your own subject, topic, difficulty and length.
      </p>

      {error ? (
        <p className="mt-3 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700 dark:bg-red-950/60 dark:text-red-300">
          {error}
        </p>
      ) : noneAvailable ? (
        <p className="mt-3 rounded-lg bg-amber-50 px-3 py-2 text-sm text-amber-700 dark:bg-amber-950/40 dark:text-amber-300">
          This selection has no questions yet — pick a topic that shows a count above zero.
        </p>
      ) : null}

      <form onSubmit={onSubmit} className="mt-4 grid gap-4 sm:grid-cols-2">
        <label className="flex flex-col gap-1.5 text-sm font-medium">
          Subject
          <select
            value={subjectId}
            onChange={(e) => {
              setSubjectId(e.target.value);
              setTopicId("");
            }}
            className="rounded-lg border border-zinc-300 bg-white px-3 py-2.5 text-sm outline-none focus:border-indigo-500 dark:border-zinc-700 dark:bg-zinc-800"
          >
            <option value="">All subjects</option>
            {exam?.subjects.map((s) => {
              const count = s.topics.reduce((sum, t) => sum + t.questionCount, 0);
              return (
                <option key={s.id} value={s.id}>
                  {s.name} ({count})
                </option>
              );
            })}
          </select>
        </label>

        <label className="flex flex-col gap-1.5 text-sm font-medium">
          Topic
          <select
            value={topicId}
            onChange={(e) => setTopicId(e.target.value)}
            disabled={!selectedSubject}
            className="rounded-lg border border-zinc-300 bg-white px-3 py-2.5 text-sm outline-none focus:border-indigo-500 disabled:opacity-50 dark:border-zinc-700 dark:bg-zinc-800"
          >
            <option value="">All topics</option>
            {selectedSubject?.topics.map((t) => (
              <option key={t.id} value={t.id}>
                {t.name} ({t.questionCount})
              </option>
            ))}
          </select>
        </label>

        <label className="flex flex-col gap-1.5 text-sm font-medium">
          Difficulty
          <select
            value={difficulty}
            onChange={(e) => setDifficulty(e.target.value)}
            className="rounded-lg border border-zinc-300 bg-white px-3 py-2.5 text-sm outline-none focus:border-indigo-500 dark:border-zinc-700 dark:bg-zinc-800"
          >
            <option value="">Any difficulty</option>
            <option value="EASY">Easy</option>
            <option value="MEDIUM">Medium</option>
            <option value="HARD">Hard</option>
            <option value="VERY_HARD">Very hard</option>
          </select>
        </label>

        <label className="flex flex-col gap-1.5 text-sm font-medium">
          Question source
          <select
            value={sourceType}
            onChange={(e) => setSourceType(e.target.value)}
            className="rounded-lg border border-zinc-300 bg-white px-3 py-2.5 text-sm outline-none focus:border-indigo-500 dark:border-zinc-700 dark:bg-zinc-800"
          >
            <option value="">Any source</option>
            <option value="AI_GENERATED">AI generated</option>
          </select>
        </label>

        <label className="flex flex-col gap-1.5 text-sm font-medium">
          Question count
          <input
            type="number"
            min={1}
            max={200}
            value={count}
            onChange={(e) => setCount(Math.max(1, Math.min(200, Number(e.target.value) || 1)))}
            className="rounded-lg border border-zinc-300 px-3 py-2.5 text-sm outline-none focus:border-indigo-500 dark:border-zinc-700 dark:bg-zinc-800"
          />
        </label>

        <label className="flex flex-col gap-1.5 text-sm font-medium">
          Time limit (minutes, optional)
          <input
            type="number"
            min={1}
            max={600}
            value={timeLimit}
            onChange={(e) => setTimeLimit(e.target.value)}
            placeholder={exam ? `${exam.scoring.timeLimitMinutes} for the full exam` : "No limit"}
            className="rounded-lg border border-zinc-300 px-3 py-2.5 text-sm outline-none focus:border-indigo-500 dark:border-zinc-700 dark:bg-zinc-800"
          />
        </label>

        <div className="sm:col-span-2">
          <button
            type="submit"
            disabled={busy}
            className="rounded-xl bg-indigo-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-indigo-500 disabled:opacity-60"
          >
            {busy ? "Starting…" : "Start Custom Practice"}
          </button>
        </div>
      </form>
    </section>
  );
}
