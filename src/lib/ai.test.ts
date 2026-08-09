import { afterEach, describe, expect, it } from "vitest";
import {
  AiNotConfiguredError,
  chatWithOpenRouter,
  generateWithGemini,
  isConfiguredKey,
  resolveProviderStatus,
} from "./ai";

const REAL_KEY = "AIzaSyExampleRealKey_0123456789abcdef";

afterEach(() => {
  delete process.env.GEMINI_API_KEY;
  delete process.env.TAVILY_API_KEY;
  delete process.env.OPENROUTER_API_KEY;
});

describe("isConfiguredKey", () => {
  it("treats missing and empty values as unconfigured", () => {
    expect(isConfiguredKey(undefined)).toBe(false);
    expect(isConfiguredKey("")).toBe(false);
    expect(isConfiguredKey("   ")).toBe(false);
  });

  it("treats scaffold placeholders as unconfigured", () => {
    expect(isConfiguredKey("your_actual_key")).toBe(false);
    expect(isConfiguredKey("your-actual-key")).toBe(false);
    expect(isConfiguredKey("replace-me-with-a-real-key")).toBe(false);
    expect(isConfiguredKey("changeme")).toBe(false);
    expect(isConfiguredKey("your_api_key_here")).toBe(false);
  });

  it("treats short values as unconfigured", () => {
    expect(isConfiguredKey("abc")).toBe(false);
  });

  it("accepts a plausible real key", () => {
    expect(isConfiguredKey(REAL_KEY)).toBe(true);
  });
});

describe("resolveProviderStatus", () => {
  it("reports all providers as unconfigured by default", () => {
    expect(resolveProviderStatus({})).toEqual({
      gemini: false,
      tavily: false,
      openRouter: false,
    });
  });

  it("reports a provider as configured only for real keys", () => {
    const status = resolveProviderStatus({
      GEMINI_API_KEY: REAL_KEY,
      TAVILY_API_KEY: "your_actual_key",
      OPENROUTER_API_KEY: undefined,
    });
    expect(status).toEqual({ gemini: true, tavily: false, openRouter: false });
  });
});

describe("client guards", () => {
  it("throws AiNotConfiguredError when the Gemini key is a placeholder", async () => {
    process.env.GEMINI_API_KEY = "your_actual_key";
    await expect(generateWithGemini({ prompt: "hi" })).rejects.toBeInstanceOf(
      AiNotConfiguredError
    );
  });

  it("throws AiNotConfiguredError when the OpenRouter key is missing", async () => {
    await expect(
      chatWithOpenRouter({ model: "openai/gpt-4o-mini", messages: [] })
    ).rejects.toBeInstanceOf(AiNotConfiguredError);
  });
});
