import { describe, expect, it } from "vitest";
import {
  loginSchema,
  practiceAnswerSchema,
  practiceCompleteSchema,
  practiceStartSchema,
  questionReportSchema,
  registerSchema,
  timetableCreateSchema,
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

describe("timetableCreateSchema", () => {
  const validSlot = { day: 0, start: "06:00", end: "07:30", activity: "Practice" };

  it("accepts a valid weekly timetable and defaults the cycle", () => {
    const r = timetableCreateSchema.safeParse({
      name: "Morning routine",
      slots: [validSlot],
    });
    expect(r.success).toBe(true);
    if (r.success) expect(r.data.cycle).toBe("WEEKLY");
  });

  it("normalizes cycle aliases like bi-weekly / monthly / WEEKLY", () => {
    for (const [input, expected] of [
      ["bi-weekly", "BIWEEKLY"],
      ["biweekly", "BIWEEKLY"],
      ["monthly", "MONTHLY"],
      ["WEEKLY", "WEEKLY"],
      [" weekly ", "WEEKLY"],
    ] as const) {
      const r = timetableCreateSchema.safeParse({
        name: "n",
        cycle: input,
        slots: [validSlot],
      });
      expect(r.success).toBe(true);
      if (r.success) expect(r.data.cycle).toBe(expected);
    }
  });

  it("rejects an unknown cycle", () => {
    expect(
      timetableCreateSchema.safeParse({ name: "n", cycle: "yearly", slots: [validSlot] }).success
    ).toBe(false);
  });

  it("requires at least one slot", () => {
    expect(timetableCreateSchema.safeParse({ name: "n", slots: [] }).success).toBe(false);
  });

  it("rejects a slot whose end is before its start", () => {
    expect(
      timetableCreateSchema.safeParse({
        name: "n",
        slots: [{ day: 1, start: "18:00", end: "07:00", activity: "Backwards" }],
      }).success
    ).toBe(false);
  });

  it("rejects malformed time strings and out-of-range days", () => {
    expect(
      timetableCreateSchema.safeParse({
        name: "n",
        slots: [{ ...validSlot, start: "7am" }],
      }).success
    ).toBe(false);
    expect(
      timetableCreateSchema.safeParse({
        name: "n",
        slots: [{ ...validSlot, day: 7 }],
      }).success
    ).toBe(false);
  });

  it("accepts an optional topicId on a slot", () => {
    const r = timetableCreateSchema.safeParse({
      name: "n",
      slots: [{ ...validSlot, topicId: "topic_123" }],
    });
    expect(r.success).toBe(true);
  });
});
