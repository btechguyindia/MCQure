import { describe, expect, it } from "vitest";
import {
  loginSchema,
  practiceAnswerSchema,
  practiceCompleteSchema,
  practiceStartSchema,
  questionReportSchema,
  registerSchema,
} from "./validation";

describe("registerSchema", () => {
  it("accepts a valid payload", () => {
    const r = registerSchema.safeParse({
      email: "a@b.com",
      name: "Ada",
      password: "password123",
    });
    expect(r.success).toBe(true);
  });

  it("rejects an invalid email", () => {
    const r = registerSchema.safeParse({
      email: "nope",
      name: "Ada",
      password: "password123",
    });
    expect(r.success).toBe(false);
    if (!r.success) expect(r.error.flatten().fieldErrors.email).toBeTruthy();
  });

  it("rejects a short password", () => {
    const r = registerSchema.safeParse({
      email: "a@b.com",
      name: "Ada",
      password: "abc",
    });
    expect(r.success).toBe(false);
  });

  it("trims whitespace from name and email", () => {
    const r = registerSchema.safeParse({
      email: "  a@b.com  ",
      name: "  Ada  ",
      password: "password123",
    });
    expect(r.success).toBe(true);
    if (r.success) {
      expect(r.data.email).toBe("a@b.com");
      expect(r.data.name).toBe("Ada");
    }
  });
});

describe("loginSchema", () => {
  it("accepts email + password", () => {
    expect(loginSchema.safeParse({ email: "a@b.com", password: "x" }).success).toBe(true);
  });

  it("rejects a missing password", () => {
    expect(loginSchema.safeParse({ email: "a@b.com" }).success).toBe(false);
  });
});

describe("practiceStartSchema", () => {
  it("accepts a quick mode with no extra filters", () => {
    expect(practiceStartSchema.safeParse({ mode: "quick" }).success).toBe(true);
  });

  it("rejects an unknown mode", () => {
    expect(practiceStartSchema.safeParse({ mode: "triathlon" }).success).toBe(false);
  });

  it("rejects a count out of range", () => {
    expect(practiceStartSchema.safeParse({ mode: "custom", count: 0 }).success).toBe(false);
    expect(practiceStartSchema.safeParse({ mode: "custom", count: 999 }).success).toBe(false);
  });

  it("accepts a full custom filter set", () => {
    const r = practiceStartSchema.safeParse({
      mode: "custom",
      count: 30,
      subjectId: "s1",
      topicId: "t1",
      difficulty: "HARD",
      sourceType: "AI_GENERATED",
      timeLimitMinutes: 60,
    });
    expect(r.success).toBe(true);
  });
});

describe("practiceAnswerSchema", () => {
  it("accepts a normal answer", () => {
    const r = practiceAnswerSchema.safeParse({
      sessionId: "s",
      questionId: "q",
      selectedIndex: 2,
      confidence: 3,
      responseTimeMs: 5000,
      errorType: "GUESS",
    });
    expect(r.success).toBe(true);
  });

  it("accepts a skip (null selection)", () => {
    expect(
      practiceAnswerSchema.safeParse({
        sessionId: "s",
        questionId: "q",
        selectedIndex: null,
        confidence: null,
      }).success
    ).toBe(true);
  });

  it("rejects an out-of-range option index", () => {
    expect(
      practiceAnswerSchema.safeParse({
        sessionId: "s",
        questionId: "q",
        selectedIndex: 7,
      }).success
    ).toBe(false);
  });

  it("rejects an unknown error type", () => {
    expect(
      practiceAnswerSchema.safeParse({
        sessionId: "s",
        questionId: "q",
        selectedIndex: 0,
        errorType: "WHATEVER",
      }).success
    ).toBe(false);
  });
});

describe("practiceCompleteSchema", () => {
  it("accepts a sessionId", () => {
    expect(practiceCompleteSchema.safeParse({ sessionId: "s" }).success).toBe(true);
  });
});

describe("questionReportSchema", () => {
  it("accepts a non-empty issue", () => {
    expect(questionReportSchema.safeParse({ questionId: "q", issue: "typo" }).success).toBe(true);
  });

  it("rejects an empty issue", () => {
    expect(questionReportSchema.safeParse({ questionId: "q", issue: "   " }).success).toBe(false);
  });

  it("rejects an over-long issue", () => {
    expect(
      questionReportSchema.safeParse({ questionId: "q", issue: "x".repeat(501) }).success
    ).toBe(false);
  });
});
