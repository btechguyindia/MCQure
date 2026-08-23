"use client";

import { useEffect, useState } from "react";
import { CheckIcon, SparklesIcon } from "@/components/icons";

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
    <div className="glass flex flex-wrap items-center gap-2.5 rounded-2xl px-4 py-3 text-sm">
      <span className="inline-flex items-center gap-1.5 font-semibold text-ink">
        <SparklesIcon className="h-4 w-4 text-brand" />
        AI integrations
      </span>
      <div className="flex flex-wrap items-center gap-1.5">
        {providers
          ? PROVIDER_LABELS.map((p) => (
              <span
                key={p.key}
                className={`badge ${providers[p.key] ? "badge-ok" : "badge-neutral"}`}
              >
                {providers[p.key] ? <CheckIcon className="h-3 w-3" /> : null}
                {p.label}
              </span>
            ))
          : null}
      </div>
      {providers && !anyConfigured ? (
        <span className="text-xs text-subtle-fg">
          Add keys in .env to enable question generation, web-sourced content and
          AI study help.
        </span>
      ) : null}
    </div>
  );
}
