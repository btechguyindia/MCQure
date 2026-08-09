"use client";

import { useEffect, useState } from "react";

interface AiStatusResponse {
  ok: boolean;
  providers?: { gemini: boolean; tavily: boolean; openRouter: boolean };
}

const PROVIDER_LABELS: Array<{ key: "gemini" | "tavily" | "openRouter"; label: string }> = [
  { key: "gemini", label: "Gemini" },
  { key: "tavily", label: "Tavily" },
  { key: "openRouter", label: "OpenRouter" },
];

export function AiStatusBadge() {
  const [providers, setProviders] = useState<AiStatusResponse["providers"] | null>(null);
  const [error, setError] = useState(false);

  useEffect(() => {
    fetch("/api/ai/status")
      .then((r) => r.json() as Promise<AiStatusResponse>)
      .then((d) => (d.ok && d.providers ? setProviders(d.providers) : setError(true)))
      .catch(() => setError(true));
  }, []);

  if (error) return null;

  const anyConfigured = providers
    ? Object.values(providers).some(Boolean)
    : false;

  return (
    <div className="flex flex-wrap items-center gap-2 rounded-xl border border-zinc-200 bg-white px-4 py-3 text-sm dark:border-zinc-800 dark:bg-zinc-900">
      <span className="font-medium text-zinc-600 dark:text-zinc-300">AI integrations</span>
      {providers
        ? PROVIDER_LABELS.map((p) => (
            <span
              key={p.key}
              className={`rounded-full px-2.5 py-1 text-xs font-medium ${
                providers[p.key]
                  ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/50 dark:text-emerald-300"
                  : "bg-zinc-100 text-zinc-500 dark:bg-zinc-800 dark:text-zinc-400"
              }`}
            >
              {providers[p.key] ? "✓ " : ""}
              {p.label}
            </span>
          ))
        : null}
      {providers && !anyConfigured ? (
        <span className="text-xs text-zinc-400">
          Add keys in .env to enable question generation, web-sourced content and
          AI study help.
        </span>
      ) : null}
    </div>
  );
}
