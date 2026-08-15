import { describe, expect, it } from "vitest";
import type { AchievementCondition } from "./motivation";
import { satisfies } from "./motivation";

function condition(overrides: Partial<AchievementCondition> = {}): AchievementCondition {
  return {
    totalAnswers: 0,
    totalCorrect: 0,
    accuracy: null,
    currentStreak: 0,
    studiedTopics: 0,
    mockCount: 0,
    bestMockAccuracy: null,
    weakTopicsFixed: 0,
    ...overrides,
  };
}

describe("satisfies", () => {
  it("grants first_question and first_correct on first success", () => {
    expect(satisfies("first_question", condition({ totalAnswers: 1 }))).toBe(true);
    expect(satisfies("first_correct", condition({ totalCorrect: 1 }))).toBe(true);
  });

  it("grants milestone counts at the right thresholds", () => {
    expect(satisfies("questions_25", condition({ totalAnswers: 24 }))).toBe(false);
    expect(satisfies("questions_25", condition({ totalAnswers: 25 }))).toBe(true);
    expect(satisfies("questions_1000", condition({ totalAnswers: 1000 }))).toBe(true);
  });

  it("requires minimum volume for the accuracy badge", () => {
    expect(satisfies("accuracy_70", condition({ accuracy: 80, totalAnswers: 10 }))).toBe(false);
    expect(satisfies("accuracy_70", condition({ accuracy: 80, totalAnswers: 20 }))).toBe(true);
    expect(satisfies("accuracy_70", condition({ accuracy: 50, totalAnswers: 20 }))).toBe(false);
  });

  it("handles streak and study badges", () => {
    expect(satisfies("streak_3", condition({ currentStreak: 3 }))).toBe(true);
    expect(satisfies("streak_30", condition({ currentStreak: 29 }))).toBe(false);
    expect(satisfies("study_10", condition({ studiedTopics: 10 }))).toBe(true);
  });

  it("handles mock badges", () => {
    expect(satisfies("mock_first", condition({ mockCount: 1 }))).toBe(true);
    expect(satisfies("mock_80", condition({ bestMockAccuracy: 85 }))).toBe(true);
    expect(satisfies("mock_80", condition({ bestMockAccuracy: 79 }))).toBe(false);
  });

  it("grants weak_fixed when a weak topic recovered", () => {
    expect(satisfies("weak_fixed", condition({ weakTopicsFixed: 1 }))).toBe(true);
    expect(satisfies("weak_fixed", condition({ weakTopicsFixed: 0 }))).toBe(false);
  });

  it("returns false for unknown codes", () => {
    expect(satisfies("not_a_code", condition())).toBe(false);
  });
});
