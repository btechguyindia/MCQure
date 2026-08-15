"use client";

import { useState } from "react";

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
    <div className="flex flex-col">
      <div className="flex max-h-96 flex-1 flex-col gap-3 overflow-y-auto pr-1">
        {messages.length === 0 ? (
          <div className="flex flex-col gap-2">
            <p className="text-sm text-zinc-500 dark:text-zinc-400">
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
                  className="rounded-lg border border-zinc-200 px-3 py-1.5 text-xs text-zinc-600 hover:bg-zinc-50 disabled:opacity-50 dark:border-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-800"
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
                  ? "self-end max-w-[85%] rounded-2xl rounded-br-sm bg-indigo-600 px-4 py-2 text-sm text-white"
                  : "self-start max-w-[85%] rounded-2xl rounded-bl-sm border border-zinc-200 bg-zinc-50 px-4 py-2 text-sm text-zinc-800 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100"
              }
            >
              <p className="whitespace-pre-wrap">{m.content}</p>
              {m.provider ? (
                <p className="mt-1 text-[10px] uppercase tracking-wide text-zinc-400">
                  {m.provider}
                </p>
              ) : null}
            </div>
          ))
        )}
        {error ? (
          <p className="rounded-lg bg-amber-50 px-3 py-2 text-xs text-amber-700 dark:bg-amber-900/40 dark:text-amber-300">
            {error}
          </p>
        ) : null}
      </div>

      <form
        className="mt-4 flex gap-2"
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
          className="flex-1 rounded-xl border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900 outline-none focus:border-indigo-500 disabled:opacity-50 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100"
        />
        <button
          type="submit"
          disabled={busy || !input.trim()}
          className="rounded-xl bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-500 disabled:opacity-50"
        >
          {busy ? "…" : "Ask"}
        </button>
      </form>
    </div>
  );
}
