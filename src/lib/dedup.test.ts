import { describe, expect, it } from "vitest";
import {
  classifyDuplicate,
  ngramSimilarity,
  normalizeQuestionText,
  questionFingerprint,
} from "./dedup";

describe("normalizeQuestionText", () => {
  it("lowercases and collapses whitespace", () => {
    expect(normalizeQuestionText("  What   is   the  CPU?  ")).toBe("what is the cpu");
  });

  it("strips punctuation and diacritic-insensitive separators", () => {
    expect(normalizeQuestionText("What is the CPU, really?")).toBe("what is the cpu really");
  });
});

describe("questionFingerprint", () => {
  it("is deterministic for identical text", () => {
    expect(questionFingerprint("What is a process?")).toBe(
      questionFingerprint("What is a process?")
    );
  });

  it("is stable across whitespace/punctuation noise", () => {
    expect(questionFingerprint("What  is a process??")).toBe(
      questionFingerprint("what is a process")
    );
  });

  it("differs for different questions", () => {
    expect(questionFingerprint("What is a process?")).not.toBe(
      questionFingerprint("What is a thread?")
    );
  });
});

describe("charNgrams / ngramSimilarity", () => {
  it("computes Jaccard similarity in range 0..1", () => {
    const a = "what is the round robin scheduling algorithm";
    const b = "what is the round robin scheduling algorithm";
    expect(ngramSimilarity(a, b)).toBe(1);
    expect(ngramSimilarity(a, "completely unrelated question text here")).toBeLessThan(0.1);
  });

  it("returns high similarity for a paraphrase", () => {
    const a = "the round robin cpu scheduling algorithm guarantees that no process waits longer than the time quantum";
    const b = "the round robin cpu scheduling algorithm guarantees that no process waits longer than the time quantum value";
    expect(ngramSimilarity(a, b)).toBeGreaterThan(0.8);
  });
});

describe("classifyDuplicate", () => {
  it("flags identical text as EXACT", () => {
    expect(classifyDuplicate("What is a thread?", "What  is a thread??")?.method).toBe("EXACT");
  });

  it("flags close paraphrases as NEAR", () => {
    const match = classifyDuplicate(
      "the round robin cpu scheduling algorithm guarantees that no process waits longer than the time quantum",
      "the round robin cpu scheduling algorithm guarantees that no process waits longer than the time quantum value"
    );
    expect(match?.method).toBe("NEAR");
    if (match) expect(match.similarity).toBeGreaterThanOrEqual(0.8);
  });

  it("returns null for unrelated questions", () => {
    expect(
      classifyDuplicate("what is a thread in operating systems", "compute the area of a triangle")
    ).toBeNull();
  });
});
