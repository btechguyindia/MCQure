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
    <section className="card p-5 sm:p-6">
      <h2 className="text-lg font-bold tracking-tight">Custom Practice</h2>
      <p className="mt-1 text-sm text-muted-fg">
        Pick your own subject, topic, difficulty and length.
      </p>

      {error ? (
        <p className="field-error mt-3">{error}</p>
      ) : noneAvailable ? (
        <p className="mt-3 rounded-lg bg-warn-soft px-3 py-2 text-sm text-warn">
          This selection has no questions yet — pick a topic that shows a count above zero.
        </p>
      ) : null}

      <form onSubmit={onSubmit} className="mt-4 grid gap-4 sm:grid-cols-2">
        <label className="block">
          <span className="label">Subject</span>
          <select
            value={subjectId}
            onChange={(e) => {
              setSubjectId(e.target.value);
              setTopicId("");
            }}
            className="input"
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

        <label className="block">
          <span className="label">Topic</span>
          <select
            value={topicId}
            onChange={(e) => setTopicId(e.target.value)}
            disabled={!selectedSubject}
            className="input"
          >
            <option value="">All topics</option>
            {selectedSubject?.topics.map((t) => (
              <option key={t.id} value={t.id}>
                {t.name} ({t.questionCount})
              </option>
            ))}
          </select>
        </label>

        <label className="block">
          <span className="label">Difficulty</span>
          <select
            value={difficulty}
            onChange={(e) => setDifficulty(e.target.value)}
            className="input"
          >
            <option value="">Any difficulty</option>
            <option value="EASY">Easy</option>
            <option value="MEDIUM">Medium</option>
            <option value="HARD">Hard</option>
            <option value="VERY_HARD">Very hard</option>
          </select>
        </label>

        <label className="block">
          <span className="label">Question source</span>
          <select
            value={sourceType}
            onChange={(e) => setSourceType(e.target.value)}
            className="input"
          >
            <option value="">Any source</option>
            <option value="AI_GENERATED">AI generated</option>
          </select>
        </label>

        <label className="block">
          <span className="label">Question count</span>
          <input
            type="number"
            min={1}
            max={200}
            value={count}
            onChange={(e) => setCount(Math.max(1, Math.min(200, Number(e.target.value) || 1)))}
            className="input"
          />
        </label>

        <label className="block">
          <span className="label">Time limit (minutes, optional)</span>
          <input
            type="number"
            min={1}
            max={600}
            value={timeLimit}
            onChange={(e) => setTimeLimit(e.target.value)}
            placeholder={exam ? `${exam.scoring.timeLimitMinutes} for the full exam` : "No limit"}
            className="input"
          />
        </label>

        <div className="sm:col-span-2">
          <button type="submit" disabled={busy} className="btn btn-primary w-full sm:w-auto">
            {busy ? "Starting…" : "Start Custom Practice"}
          </button>
        </div>
      </form>
    </section>
  );
}
