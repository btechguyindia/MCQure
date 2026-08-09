"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export function TopicPracticeButton({ topicId, label = "Practice this topic" }: { topicId: string; label?: string }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

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
        disabled={busy}
        className="inline-flex rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-500 disabled:opacity-60"
      >
        {busy ? "Starting…" : label}
      </button>
      {error ? <p className="text-xs text-red-600 dark:text-red-400">{error}</p> : null}
    </div>
  );
}
