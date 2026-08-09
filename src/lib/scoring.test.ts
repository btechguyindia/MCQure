import { describe, expect, it } from "vitest";
import {
  accuracy,
  attemptScore,
  netScore,
  roundMarks,
  type ScoringConfigLike,
} from "./scoring";

const DSSSB: ScoringConfigLike = {
  correctMarks: 1,
  incorrectPenalty: -0.25,
  unattemptedMarks: 0,
};

describe("attemptScore", () => {
  it("awards +1 for a correct answer", () => {
    expect(attemptScore(2, 2, DSSSB)).toBe(1);
  });

  it("penalises a wrong answer by -0.25", () => {
    expect(attemptScore(1, 3, DSSSB)).toBe(-0.25);
  });

  it("gives 0 for an unattempted question", () => {
    expect(attemptScore(null, 0, DSSSB)).toBe(0);
  });
});

describe("netScore", () => {
  it("combines counts with the scoring config", () => {
    const score = netScore({ correct: 120, incorrect: 30, unattempted: 50 }, DSSSB);
    // 120*1 + 30*(-0.25) + 50*0 = 120 - 7.5 = 112.5
    expect(score).toBe(112.5);
  });

  it("rounds to two decimals", () => {
    expect(roundMarks(112.5)).toBe(112.5);
    expect(roundMarks(0.7500000000000001)).toBe(0.75);
  });
});

describe("accuracy", () => {
  it("returns percentage of answered correct", () => {
    expect(accuracy(25, 40)).toBe(62.5);
  });

  it("returns null when nothing was answered", () => {
    expect(accuracy(0, 0)).toBeNull();
  });
});
