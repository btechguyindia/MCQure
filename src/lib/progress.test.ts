import { describe, expect, it } from "vitest";
import type { QuestionSourceType } from "@prisma/client";
import {
  aggregateGroup,
  alignmentScore,
  buildDailyPlan,
  revisionStatus,
  syllabusCoverage,
  trendOf,
  weaknessScore,
  type TrackedAttemptLike,
} from "./progress";

function attempt(over: Partial<TrackedAttemptLike> & { createdAt?: Date }): TrackedAttemptLike {
  return {
    isCorrect: null,
    score: 0,
    responseTimeMs: 30000,
    confidence: null,
    errorType: null,
    sourceType: "AI_GENERATED" as QuestionSourceType,
    isMock: false,
    createdAt: over.createdAt ?? new Date("2026-08-09T10:00:00Z"),
    group: {
      subjectId: "s1",
      subjectName: "OS",
      topicId: "t1",
      topicName: "CPU Scheduling",
      subtopicId: null,
      subtopicName: null,
      conceptId: null,
      conceptName: null,
    },
    ...over,
  };
}

describe("aggregateGroup", () => {
  it("splits accuracy by source and mock status", () => {
    const rows = [
      attempt({ isCorrect: true, sourceType: "PYQ" }),
      attempt({ isCorrect: false, sourceType: "AI_GENERATED" }),
      attempt({ isCorrect: true, sourceType: "AI_GENERATED", isMock: true }),
      attempt({ isCorrect: null }),
    ];
    const [g] = aggregateGroup(rows, () => ({ id: "t1", name: "CPU Scheduling" }));
    expect(g.attempts).toBe(4);
    expect(g.accuracy).toBeCloseTo(66.67, 1);
    expect(g.pyqAccuracy).toBeCloseTo(100, 1);
    expect(g.practiceAccuracy).toBeCloseTo(50, 1);
    expect(g.mockAccuracy).toBeCloseTo(100, 1);
  });
});

describe("alignmentScore", () => {
  it("weights mastery most heavily", () => {
    const high = alignmentScore({ mastery: 90, completion: "MASTERED", volumeRatio: 0.5, revisionCurrent: true });
    const low = alignmentScore({ mastery: 20, completion: "STUDYING", volumeRatio: 0.5, revisionCurrent: false });
    expect(high).toBeGreaterThan(low);
  });

  it("volume alone cannot max the score", () => {
    const s = alignmentScore({ mastery: 0, completion: "NOT_STARTED", volumeRatio: 1, revisionCurrent: false });
    expect(s).toBeLessThan(50);
  });
});

describe("weaknessScore", () => {
  it("refuses to rank tiny samples", () => {
    const r = weaknessScore({ attempts: 2, accuracy: 100, repeatedMistakes: 0, pyqAccuracy: null, mockAccuracy: null, averageTimeMs: 1000, examWeight: 1, revisionDue: false });
    expect(r.insufficientData).toBe(true);
    expect(r.reasons.length).toBeGreaterThan(0);
  });

  it("flags a genuinely weak topic with reasons", () => {
    const r = weaknessScore({ attempts: 12, accuracy: 40, repeatedMistakes: 8, pyqAccuracy: 35, mockAccuracy: 45, averageTimeMs: 60000, examWeight: 1, revisionDue: true });
    expect(r.insufficientData).toBe(false);
    expect(r.score).toBeGreaterThanOrEqual(60);
    expect(r.reasons.some((x) => x.includes("Accuracy"))).toBe(true);
    expect(r.reasons.some((x) => x.includes("Repeated errors"))).toBe(true);
    expect(r.reasons.some((x) => x.includes("Revision overdue"))).toBe(true);
  });
});

describe("revisionStatus", () => {
  it("flags overdue topics", () => {
    const r = revisionStatus({ lastPracticedDays: 20, lastVisitedDays: 20, mastery: 40, repeatedMistakes: 1, recentAccuracy: 80 });
    expect(r.due).toBe(true);
  });

  it("flags recent decline even when not overdue", () => {
    const r = revisionStatus({ lastPracticedDays: 1, lastVisitedDays: 1, mastery: 50, repeatedMistakes: 4, recentAccuracy: 45 });
    expect(r.due).toBe(true);
    expect(r.reason).toContain("Recent accuracy");
  });

  it("leaves fresh strong topics alone", () => {
    const r = revisionStatus({ lastPracticedDays: 1, lastVisitedDays: 1, mastery: 85, repeatedMistakes: 0, recentAccuracy: 90 });
    expect(r.due).toBe(false);
  });
});

describe("syllabusCoverage", () => {
  it("distinguishes studied from mastered", () => {
    const c = syllabusCoverage([
      { topicId: "a", name: "A", hasStudy: false, attempts: 0, accuracy: null },
      { topicId: "b", name: "B", hasStudy: true, attempts: 20, accuracy: 90 },
      { topicId: "c", name: "C", hasStudy: true, attempts: 20, accuracy: 95 },
    ]);
    expect(c.studied).toBe(2);
    expect(c.mastered).toBe(1); // C at 95% → mastery 87.5
    expect(c.proficient).toBe(2); // B at 90% → mastery 83.3 (proficient, not mastered)
    expect(c.studiedPct).toBeCloseTo(66.67, 1);
  });
});

describe("trendOf", () => {
  it("reports improving when the second half is clearly better", () => {
    const rows = [
      ...Array.from({ length: 4 }, () => attempt({ isCorrect: false, createdAt: new Date("2026-08-01T10:00:00Z") })),
      ...Array.from({ length: 4 }, () => attempt({ isCorrect: true, createdAt: new Date("2026-08-08T10:00:00Z") })),
    ];
    expect(trendOf(rows)).toBe("improving");
  });

  it("stays stable on tiny samples", () => {
    expect(trendOf([attempt({ isCorrect: true })])).toBe("stable");
  });
});

describe("buildDailyPlan", () => {
  const topic = (id: string, score: number, revisionDue: boolean) => ({
    id,
    name: `Topic ${id}`,
    subjectName: "OS",
    weight: "HIGH" as const,
    revisionDue,
    mastery: 40,
    weakness: weaknessScore({
      attempts: 15,
      accuracy: 100 - score,
      repeatedMistakes: 3,
      pyqAccuracy: null,
      mockAccuracy: null,
      averageTimeMs: 20000,
      examWeight: 1,
      revisionDue,
    }),
  });

  it("prioritises revision-due topics first, then weakness", () => {
    const plan = buildDailyPlan([topic("a", 90, false), topic("b", 60, true)], 2);
    expect(plan.priorities[0].topicId).toBe("b");
    expect(plan.actions.length).toBe(2);
  });
});
