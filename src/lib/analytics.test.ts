import { describe, expect, it } from "vitest";
import {
  errorTypeCounts,
  mean,
  median,
  summarizeAttempts,
  summarizeByGroup,
  trendByDay,
} from "./analytics";

describe("mean", () => {
  it("returns 0 for empty input", () => {
    expect(mean([])).toBe(0);
  });

  it("computes the average", () => {
    expect(mean([10, 20, 30])).toBe(20);
  });
});

describe("median", () => {
  it("returns 0 for empty input", () => {
    expect(median([])).toBe(0);
  });

  it("returns the middle value for odd counts", () => {
    expect(median([3, 1, 2])).toBe(2);
  });

  it("averages the middle two for even counts", () => {
    expect(median([1, 2, 3, 4])).toBe(2.5);
  });
});

describe("summarizeAttempts", () => {
  const config = { correctMarks: 1, incorrectPenalty: -0.25, unattemptedMarks: 0 };

  it("counts correct/incorrect/unattempted and derives score", () => {
    const s = summarizeAttempts(
      [
        { isCorrect: true, score: 1, responseTimeMs: 5000, confidence: 3 },
        { isCorrect: false, score: -0.25, responseTimeMs: 7000, confidence: 2 },
        { isCorrect: null, score: 0, responseTimeMs: 9000, confidence: null },
      ],
      config
    );

    expect(s.total).toBe(3);
    expect(s.answered).toBe(2);
    expect(s.correct).toBe(1);
    expect(s.incorrect).toBe(1);
    expect(s.unattempted).toBe(1);
    expect(s.accuracy).toBe(50);
    expect(s.netScore).toBe(0.75);
    expect(s.averageTimeMs).toBe(7000);
    expect(s.medianTimeMs).toBe(7000);
  });

  it("groups confidence buckets", () => {
    const s = summarizeAttempts(
      [
        { isCorrect: true, score: 1, responseTimeMs: 1000, confidence: 3 },
        { isCorrect: false, score: -0.25, responseTimeMs: 1000, confidence: 3 },
        { isCorrect: true, score: 1, responseTimeMs: 1000, confidence: 1 },
        { isCorrect: false, score: -0.25, responseTimeMs: 1000, confidence: 2 },
      ],
      config
    );

    expect(s.highConfidenceCorrect).toBe(1);
    expect(s.highConfidenceWrong).toBe(1);
    expect(s.lowConfidenceCorrect).toBe(1);
    expect(s.lowConfidenceWrong).toBe(1);
  });

  it("returns null accuracy when nothing is answered", () => {
    const s = summarizeAttempts(
      [
        { isCorrect: null, score: 0, responseTimeMs: 1000, confidence: null },
        { isCorrect: null, score: 0, responseTimeMs: 1000, confidence: null },
      ],
      config
    );
    expect(s.accuracy).toBeNull();
  });
});

describe("summarizeByGroup", () => {
  it("groups attempts and computes per-group accuracy", () => {
    const out = summarizeByGroup([
      { group: "GK", isCorrect: true, score: 1, responseTimeMs: 1000, confidence: 3 },
      { group: "GK", isCorrect: false, score: -0.25, responseTimeMs: 3000, confidence: 2 },
      { group: "GK", isCorrect: null, score: 0, responseTimeMs: 5000, confidence: null },
      { group: "Maths", isCorrect: true, score: 1, responseTimeMs: 2000, confidence: 3 },
    ]);

    const gk = out.find((g) => g.group === "GK");
    const maths = out.find((g) => g.group === "Maths");
    expect(gk?.attempts).toBe(3);
    expect(gk?.correct).toBe(1);
    expect(gk?.accuracy).toBe(50);
    expect(gk?.avgTimeMs).toBe(3000);
    expect(maths?.attempts).toBe(1);
    expect(maths?.accuracy).toBe(100);
  });

  it("returns null accuracy for groups with only skipped attempts", () => {
    const out = summarizeByGroup([
      { group: "GK", isCorrect: null, score: 0, responseTimeMs: 1000, confidence: null },
    ]);
    expect(out[0].accuracy).toBeNull();
    expect(out[0].attempts).toBe(1);
  });
});

describe("errorTypeCounts", () => {
  it("counts by type, most frequent first", () => {
    const out = errorTypeCounts([
      { errorType: "content_mistake" },
      { errorType: "calculation_error" },
      { errorType: "content_mistake" },
      { errorType: null },
    ]);
    expect(out).toEqual([
      { type: "content_mistake", count: 2 },
      { type: "calculation_error", count: 1 },
    ]);
  });

  it("returns empty array when nothing classified", () => {
    expect(errorTypeCounts([{ errorType: null }, { errorType: null }])).toEqual([]);
  });
});

describe("trendByDay", () => {
  const now = new Date(2026, 7, 9, 12, 0, 0); // Sun Aug 09 2026

  it("returns 7 buckets oldest first with daily totals", () => {
    const attempts = [
      // today (Aug 9)
      { createdAt: new Date(2026, 7, 9, 9, 0, 0), score: 1 },
      { createdAt: new Date(2026, 7, 9, 10, 0, 0), score: -0.25 },
      // yesterday (Aug 8)
      { createdAt: new Date(2026, 7, 8, 23, 0, 0), score: 2 },
    ];
    const out = trendByDay(attempts, 7, now);

    expect(out).toHaveLength(7);
    expect(out[0].day).toBe("2026-08-03");
    expect(out[6].day).toBe("2026-08-09");
    expect(out[6].attempts).toBe(2);
    expect(out[6].netScore).toBe(0.75);
    expect(out[5].attempts).toBe(1);
    expect(out[5].netScore).toBe(2);
    expect(out[0].attempts).toBe(0);
  });

  it("handles an empty attempt list", () => {
    const out = trendByDay([], 3, now);
    expect(out).toHaveLength(3);
    expect(out.every((p) => p.attempts === 0 && p.netScore === 0)).toBe(true);
  });
});
