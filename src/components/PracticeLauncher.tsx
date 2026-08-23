"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowRightIcon } from "@/components/icons";

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
      className="card card-hover flex flex-col items-start gap-1 p-5 text-left disabled:opacity-60"
    >
      <h2 className="text-lg font-bold tracking-tight">{title}</h2>
      <p className="text-sm text-muted-fg">{description}</p>
      {error ? <p className="field-error mt-1">{error}</p> : null}
      <span className="mt-3 inline-flex items-center gap-1.5 rounded-xl bg-brand px-3.5 py-2 text-sm font-semibold text-on-brand shadow-glow">
        {busy ? "Starting…" : "Start"}
        <ArrowRightIcon className="h-4 w-4" />
      </span>
    </button>
  );
}
