"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

interface PracticeLauncherProps {
  mode: "quick" | "standard" | "deep" | "marathon" | "review" | "smart";
  title: string;
  description: string;
}

export function PracticeLauncher({ mode, title, description }: PracticeLauncherProps) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function launch() {
    setBusy(true);
    setError(null);
    try {
      const res = await fetch("/api/practice/start", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ mode }),
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
    <button
      type="button"
      onClick={launch}
      disabled={busy}
      className="flex flex-col items-start gap-1 rounded-2xl border border-zinc-200 bg-white p-5 text-left transition-colors hover:border-indigo-400 disabled:opacity-60 dark:border-zinc-800 dark:bg-zinc-900 dark:hover:border-indigo-500"
    >
      <h2 className="text-lg font-bold">{title}</h2>
      <p className="text-sm text-zinc-600 dark:text-zinc-400">{description}</p>
      {error ? <p className="mt-1 text-xs text-red-600 dark:text-red-400">{error}</p> : null}
      <span className="mt-2 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white">
        {busy ? "Starting…" : "Start"}
      </span>
    </button>
  );
}
