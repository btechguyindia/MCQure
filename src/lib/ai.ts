// AI provider integrations: Gemini (generation), Tavily (web search) and
// OpenRouter (model routing). Every function guards on a REAL key — placeholder
// values like "your_actual_key" are treated as not configured, so the app runs
// fine until you paste real credentials.

export const AI_ENV_KEYS = {
  gemini: "GEMINI_API_KEY",
  tavily: "TAVILY_API_KEY",
  openRouter: "OPENROUTER_API_KEY",
} as const;

export type AiProvider = keyof typeof AI_ENV_KEYS;

export type AiProviderStatus = Record<AiProvider, boolean>;

export class AiNotConfiguredError extends Error {
  provider: AiProvider;

  constructor(provider: AiProvider, envKey: string) {
    super(
      `AI provider "${provider}" is not configured. Set ${envKey} in .env to a real API key.`
    );
    this.name = "AiNotConfiguredError";
    this.provider = provider;
  }
}

/**
 * A key only counts as configured when it is present and does not look like a
 * scaffolded placeholder. Keeps the app usable out of the box.
 */
export function isConfiguredKey(value: string | undefined): boolean {
  if (!value) return false;
  const trimmed = value.trim();
  if (trimmed.length < 8) return false;
  const lower = trimmed.toLowerCase();
  return !(
    lower.startsWith("your_") ||
    lower.startsWith("your-") ||
    lower.includes("your_actual_key") ||
    lower.includes("your-api-key") ||
    lower.includes("changeme") ||
    lower.includes("replace-me") ||
    lower.includes("placeholder") ||
    lower.includes("xxxxx")
  );
}

/** Which providers have a real key configured, given an env-like record. */
export function resolveProviderStatus(
  env: Record<string, string | undefined>
): AiProviderStatus {
  return {
    gemini: isConfiguredKey(env[AI_ENV_KEYS.gemini]),
    tavily: isConfiguredKey(env[AI_ENV_KEYS.tavily]),
    openRouter: isConfiguredKey(env[AI_ENV_KEYS.openRouter]),
  };
}

/** Live status read from process.env. */
export function aiStatus(): AiProviderStatus {
  return resolveProviderStatus(process.env);
}

function requireKey(provider: AiProvider): string {
  const envKey = AI_ENV_KEYS[provider];
  const value = process.env[envKey];
  if (!isConfiguredKey(value)) throw new AiNotConfiguredError(provider, envKey);
  return value as string;
}

// ── Gemini ───────────────────────────────────────────────────────────────────

export interface GeminiGenerationInput {
  prompt: string;
  model?: string; // e.g. "gemini-2.0-flash"
  temperature?: number;
  maxOutputTokens?: number;
}

export interface GeminiResult {
  text: string;
  model: string;
  raw?: unknown;
}

/**
 * Single-turn text generation via the Gemini REST API.
 * Throws `AiNotConfiguredError` when GEMINI_API_KEY is missing/placeholder.
 */
export async function generateWithGemini(
  input: GeminiGenerationInput
): Promise<GeminiResult> {
  const apiKey = requireKey("gemini");
  const model = input.model ?? "gemini-3.1-flash-lite";

  const res = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${encodeURIComponent(apiKey)}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{ role: "user", parts: [{ text: input.prompt }] }],
        generationConfig: {
          temperature: input.temperature ?? 0.7,
          maxOutputTokens: input.maxOutputTokens ?? 1024,
        },
      }),
    }
  );

  if (!res.ok) {
    const detail = await res.text();
    if (res.status === 429 && isConfiguredKey(process.env[AI_ENV_KEYS.openRouter])) {
      const fallbackModel = process.env.OPENROUTER_FALLBACK_MODEL ?? "openai/gpt-4o-mini";
      const fb = await chatWithOpenRouter({
        model: fallbackModel,
        messages: [{ role: "user", content: input.prompt }],
        temperature: input.temperature ?? 0.7,
        maxOutputTokens: input.maxOutputTokens,
      });
      return { text: fb.text, model: fb.model, raw: fb.raw };
    }
    throw new Error(`Gemini request failed (${res.status}): ${detail.slice(0, 300)}`);
  }

  const data = (await res.json()) as {
    candidates?: Array<{ content?: { parts?: Array<{ text?: string }> } }>;
  };
  const text = data.candidates?.[0]?.content?.parts?.[0]?.text ?? "";
  return { text, model, raw: data };
}

// ── Tavily ───────────────────────────────────────────────────────────────────

export interface TavilySearchInput {
  query: string;
  maxResults?: number;
  searchDepth?: "basic" | "advanced";
  topic?: "general" | "news" | "finance";
  days?: number;
}

export interface TavilySearchResult {
  title: string;
  url: string;
  content: string;
  score: number;
}

export interface TavilySearchResponse {
  query: string;
  results: TavilySearchResult[];
}

/**
 * Web search via the Tavily API.
 * Throws `AiNotConfiguredError` when TAVILY_API_KEY is missing/placeholder.
 */
export async function searchWithTavily(
  input: TavilySearchInput
): Promise<TavilySearchResponse> {
  const apiKey = requireKey("tavily");

  const res = await fetch("https://api.tavily.com/search", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      api_key: apiKey,
      query: input.query,
      max_results: input.maxResults ?? 5,
      search_depth: input.searchDepth ?? "basic",
      ...(input.topic ? { topic: input.topic } : {}),
      ...(input.days ? { days: input.days } : {}),
    }),
  });

  if (!res.ok) {
    const detail = await res.text();
    throw new Error(`Tavily request failed (${res.status}): ${detail.slice(0, 300)}`);
  }

  const data = (await res.json()) as {
    query?: string;
    results?: TavilySearchResult[];
  };
  return { query: input.query, results: data.results ?? [] };
}

// ── OpenRouter ───────────────────────────────────────────────────────────────

export interface OpenRouterChatInput {
  model: string;
  messages: Array<{ role: "system" | "user" | "assistant"; content: string }>;
  temperature?: number;
  /** Completion token cap; omit to let OpenRouter use its default. */
  maxOutputTokens?: number;
}

export interface OpenRouterResult {
  text: string;
  model: string;
  raw?: unknown;
}

/**
 * Chat completion via OpenRouter's unified API.
 * Throws `AiNotConfiguredError` when OPENROUTER_API_KEY is missing/placeholder.
 */
export async function chatWithOpenRouter(
  input: OpenRouterChatInput
): Promise<OpenRouterResult> {
  const apiKey = requireKey("openRouter");

  const res = await fetch("https://openrouter.ai/api/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
      "HTTP-Referer": process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000",
      "X-Title": "MCQure",
    },
    body: JSON.stringify({
      model: input.model,
      messages: input.messages,
      temperature: input.temperature ?? 0.7,
      // Without an explicit cap OpenRouter defaults to the model's full
      // context, which low-credit accounts cannot afford (402).
      ...(input.maxOutputTokens ? { max_tokens: input.maxOutputTokens } : {}),
    }),
  });

  if (!res.ok) {
    const detail = await res.text();
    throw new Error(`OpenRouter request failed (${res.status}): ${detail.slice(0, 300)}`);
  }

  const data = (await res.json()) as {
    model?: string;
    choices?: Array<{ message?: { content?: string } }>;
  };
  const text = data.choices?.[0]?.message?.content ?? "";
  return { text, model: data.model ?? input.model, raw: data };
}
