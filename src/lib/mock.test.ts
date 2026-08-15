import { describe, expect, it } from "vitest";
import { MOCK_DEFAULT_COUNT, computeMockResults } from "./mock";

describe("MOCK_DEFAULT_COUNT", () => {
  it("defines sensible default question counts per scope", () => {
    expect(MOCK_DEFAULT_COUNT.full).toBe(30);
    expect(MOCK_DEFAULT_COUNT.section).toBe(20);
    expect(MOCK_DEFAULT_COUNT.topic).toBe(15);
  });
});

describe("computeMockResults", () => {
  const attempts = [
    { isCorrect: true, score: 1, responseTimeMs: 5000 },
    { isCorrect: false, score: -0.25, responseTimeMs: 7000 },
    { isCorrect: null, score: 0, responseTimeMs: 3000 },
    { isCorrect: true, score: 1, responseTimeMs: 9000 },
  ];

  it("tallies answered/correct/incorrect/skipped correctly", () => {
    const r = computeMockResults(attempts, 4, 4);
    expect(r.answered).toBe(3);
    expect(r.correct).toBe(2);
    expect(r.incorrect).toBe(1);
    expect(r.skipped).toBe(1);
  });

  it("computes accuracy over answered questions only", () => {
    const r = computeMockResults(attempts, 4, 4);
    expect(r.accuracy).toBeCloseTo(66.666, 1);
  });

  it("sums score and time", () => {
    const r = computeMockResults(attempts, 4, 4);
    expect(r.score).toBeCloseTo(1.75);
    expect(r.timeSpentMs).toBe(24000);
  });

  it("reports a zero accuracy when nothing was answered", () => {
    const r = computeMockResults(
      [
        { isCorrect: null, score: 0, responseTimeMs: 1000 },
        { isCorrect: null, score: 0, responseTimeMs: 2000 },
      ],
      2,
      2
    );
    expect(r.accuracy).toBe(0);
    expect(r.answered).toBe(0);
  });
});
