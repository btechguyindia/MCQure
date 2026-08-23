"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export function TopicPracticeButton({
  topicId,
  label = "Practice this topic",
  questionCount,
}: {
  topicId: string;
  label?: string;
  questionCount?: number;
}) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const empty = typeof questionCount === "number" && questionCount === 0;

  async function start() {
    setBusy(true);
    setError(null);
    try {
      const res = await fetch("/api/practice/start", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ mode: "custom", topicId, count: 10 }),
      });
      const data = (await res.json()) as {
        ok: boolean;
        session?: { id: string };
        message?: string;
      };
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
    <div className="flex flex-col items-start gap-1">
      <button
        type="button"
        onClick={start}
        disabled={busy || empty}
        title={empty ? "No questions available for this topic yet" : undefined}
        className="btn btn-primary btn-sm"
      >
        {busy
          ? "Starting…"
          : empty
            ? "No questions yet"
            : questionCount
              ? `${label} (${questionCount})`
              : label}
      </button>
      {error ? <p className="field-error mt-1">{error}</p> : null}
    </div>
  );
}
