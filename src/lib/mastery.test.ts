import { describe, expect, it } from "vitest";
import { completionState, estimateMastery, MASTERY_DEFAULTS } from "./mastery";

describe("estimateMastery", () => {
  it("never reports 100% from a tiny perfect sample", () => {
    const m = estimateMastery(2, 2);
    expect(m.mastery).not.toBe(100);
    expect(m.reliable).toBe(false);
  });

  it("flags insufficient data below the min sample", () => {
    expect(estimateMastery(9, 9).reliable).toBe(false);
    expect(estimateMastery(10, 10).reliable).toBe(true);
  });

  it("applies Bayesian smoothing toward the prior", () => {
    const m = estimateMastery(10, 10, { ...MASTERY_DEFAULTS, minSample: 1 });
    // (10 + 2) / (10 + 4) * 100 = 85.7
    expect(m.mastery).toBeCloseTo(85.7, 1);
  });

  it("returns null mastery with no attempts", () => {
    const m = estimateMastery(0, 0);
    expect(m.mastery).toBeNull();
    expect(m.reliable).toBe(false);
  });
});

describe("completionState", () => {
  it("starts as NOT_STARTED without study or attempts", () => {
    expect(completionState({ hasStudy: false, attempts: 0, mastery: null, reliable: false })).toBe("NOT_STARTED");
  });

  it("is STUDYING when material was opened but practice is thin", () => {
    expect(completionState({ hasStudy: true, attempts: 0, mastery: null, reliable: false })).toBe("STUDYING");
    expect(completionState({ hasStudy: true, attempts: 5, mastery: 60, reliable: false })).toBe("STUDYING");
  });

  it("is PRACTICED once attempts are sufficient", () => {
    expect(completionState({ hasStudy: true, attempts: 10, mastery: 50, reliable: true })).toBe("PRACTICED");
  });

  it("is PROFICIENT above the proficiency threshold with a reliable sample", () => {
    const m = estimateMastery(10, 8); // 71.4, reliable
    expect(completionState({ hasStudy: true, attempts: 10, mastery: m.mastery, reliable: m.reliable })).toBe(
      "PROFICIENT"
    );
  });

  it("is MASTERED only with a reliable high estimate", () => {
    const m = estimateMastery(20, 19); // 87.5, reliable
    expect(completionState({ hasStudy: true, attempts: 20, mastery: m.mastery, reliable: m.reliable })).toBe(
      "MASTERED"
    );
  });
});
