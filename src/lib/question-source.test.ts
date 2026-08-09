import { describe, expect, it } from "vitest";
import {
  isGenuineSource,
  QUESTION_SOURCE_META,
  SOURCE_TYPE_ORDER,
  sourceLabel,
} from "./question-source";

describe("QUESTION_SOURCE_META", () => {
  it("covers every source type exactly once", () => {
    const types = [
      "PYQ",
      "PYQ_VARIANT",
      "AI_GENERATED",
      "WEB_SOURCED",
      "OFFICIAL",
      "LICENSED",
      "WEB_DERIVED_ORIGINAL",
      "USER_CREATED",
    ] as const;
    expect(SOURCE_TYPE_ORDER).toHaveLength(types.length);
    for (const t of types) {
      expect(QUESTION_SOURCE_META[t].label.length).toBeGreaterThan(0);
    }
  });

  it("labels genuine exam content as genuine and AI content as not", () => {
    expect(isGenuineSource("PYQ")).toBe(true);
    expect(isGenuineSource("OFFICIAL")).toBe(true);
    expect(isGenuineSource("LICENSED")).toBe(true);
    expect(isGenuineSource("AI_GENERATED")).toBe(false);
    expect(isGenuineSource("PYQ_VARIANT")).toBe(false);
    expect(isGenuineSource("WEB_DERIVED_ORIGINAL")).toBe(false);
    expect(isGenuineSource("USER_CREATED")).toBe(false);
  });

  it("never labels an AI question as a real PYQ", () => {
    expect(sourceLabel("AI_GENERATED")).toBe("AI GENERATED");
    expect(sourceLabel("PYQ")).toBe("VERIFIED PYQ");
    expect(QUESTION_SOURCE_META.AI_GENERATED.label).not.toContain("PYQ");
  });
});
