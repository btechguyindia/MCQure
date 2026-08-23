"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

// Records a REVISION study visit (updating revision health) and starts a
// 10-question practice session for the topic.
export function RevisionButton({ topicId, label = "Revise now" }: { topicId: string; label?: string }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function start() {
    setBusy(true);
    setError(null);
    try {
      const visit = await fetch("/api/study/visit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ topicId, source: "REVISION" }),
      });
      if (!visit.ok) {
        const data = (await visit.json()) as { message?: string };
        setError(data.message ?? "Could not record revision");
        setBusy(false);
        return;
      }

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
        setError(data.message ?? "Could not start revision practice");
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
        className="btn btn-primary btn-sm"
      >
        {busy ? "Starting…" : label}
      </button>
      {error ? <p className="field-error mt-1">{error}</p> : null}
    </div>
  );
}
