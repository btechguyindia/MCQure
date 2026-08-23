"use client";

import { useState } from "react";
import { ArrowRightIcon } from "@/components/icons";

interface ChatMessage {
  role: "user" | "assistant";
  content: string;
  provider?: string;
}

interface NotebookResponse {
  ok: boolean;
  answer?: string;
  provider?: string;
  message?: string;
}

const PLACEHOLDER_QUESTIONS = [
  "Summarize the key points of this topic in 5 bullets",
  "Give me a quick revision of this topic",
  "Make 3 practice questions from this material",
];

export function NotebookChat({ topicId }: { topicId: string }) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function ask(text: string) {
    const prompt = text.trim();
    if (!prompt || busy) return;
    setBusy(true);
    setError(null);
    setMessages((m) => [...m, { role: "user", content: prompt }]);
    setInput("");
    try {
      const res = await fetch("/api/notebook", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ topicId, message: prompt }),
      });
      const data = (await res.json()) as NotebookResponse;
      if (!res.ok || !data.answer) {
        setError(data.message ?? "Something went wrong. Try again.");
        return;
      }
      setMessages((m) => [
        ...m,
        { role: "assistant", content: data.answer!, provider: data.provider },
      ]);
    } catch {
      setError("Network error. Check your connection and try again.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="card flex h-[26rem] flex-col overflow-hidden">
      <div className="min-h-0 flex-1 space-y-3 overflow-y-auto p-4">
        {messages.length === 0 ? (
          <div className="flex flex-col gap-2">
            <p className="text-sm text-muted-fg">
              Your AI study assistant. It answers only from this topic&apos;s study
              material — no invented content. Try one of these:
            </p>
            <div className="flex flex-wrap gap-2">
              {PLACEHOLDER_QUESTIONS.map((q) => (
                <button
                  key={q}
                  type="button"
                  disabled={busy}
                  onClick={() => ask(q)}
                  className="chip transition-colors hover:border-brand hover:text-brand disabled:pointer-events-none disabled:opacity-50"
                >
                  {q}
                </button>
              ))}
            </div>
          </div>
        ) : (
          messages.map((m, i) => (
            <div
              key={i}
              className={
                m.role === "user"
                  ? "self-end max-w-[85%] rounded-2xl rounded-br-sm bg-brand-soft px-4 py-2.5 text-sm text-ink"
                  : "self-start max-w-[85%] rounded-2xl rounded-bl-sm border border-line bg-card-strong px-4 py-2.5 text-sm text-ink shadow-soft"
              }
            >
              <p className="whitespace-pre-wrap">{m.content}</p>
              {m.provider ? (
                <p className="mt-1 text-[10px] uppercase tracking-wide text-subtle-fg">
                  {m.provider}
                </p>
              ) : null}
            </div>
          ))
        )}
        {busy ? (
          <div className="self-start rounded-2xl border border-line bg-card-strong px-4 py-3 shadow-soft">
            <span className="flex items-center gap-1" role="status" aria-label="Thinking">
              <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-brand [animation-delay:-0.3s]" />
              <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-brand [animation-delay:-0.15s]" />
              <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-brand" />
            </span>
          </div>
        ) : null}
        {error ? <p className="field-error">{error}</p> : null}
      </div>

      <form
        className="flex shrink-0 items-center gap-2 border-t border-line p-3"
        onSubmit={(e) => {
          e.preventDefault();
          void ask(input);
        }}
      >
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Ask about this topic..."
          disabled={busy}
          className="input flex-1"
        />
        <button type="submit" disabled={busy || !input.trim()} className="btn btn-primary btn-sm shrink-0">
          Ask
          <ArrowRightIcon className="h-3.5 w-3.5" />
        </button>
      </form>
    </div>
  );
}
