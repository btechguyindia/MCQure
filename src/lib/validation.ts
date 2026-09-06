// Zod validation schemas for API request bodies.

import { z } from "zod";

export const registerSchema = z.object({
  email: z.string().trim().email("Enter a valid email address"),
  name: z.string().trim().min(1, "Name is required").max(80, "Name is too long"),
  password: z.string().min(8, "Password must be at least 8 characters").max(128),
});

export const loginSchema = z.object({
  email: z.string().trim().email("Enter a valid email address"),
  password: z.string().min(1, "Password is required").max(128),
});

export const practiceStartSchema = z.object({
  mode: z.enum(["quick", "standard", "deep", "marathon", "custom", "review", "smart"]),
  count: z.number().int().min(1).max(200).optional(),
  subjectId: z.string().min(1).optional(),
  topicId: z.string().min(1).optional(),
  subtopicId: z.string().min(1).optional(),
  conceptId: z.string().min(1).optional(),
  difficulty: z.enum(["EASY", "MEDIUM", "HARD", "VERY_HARD"]).optional(),
  sourceType: z
    .enum([
      "PYQ",
      "PYQ_VARIANT",
      "AI_GENERATED",
      "WEB_SOURCED",
      "OFFICIAL",
      "LICENSED",
      "WEB_DERIVED_ORIGINAL",
      "USER_CREATED",
    ])
    .optional(),
  verifiedOnly: z.boolean().optional(),
  timeLimitMinutes: z.number().int().min(1).max(600).optional(),
});

export const practiceAnswerSchema = z.object({
  sessionId: z.string().min(1),
  questionId: z.string().min(1),
  selectedIndex: z.number().int().min(0).max(3).nullable().optional(),
  confidence: z.number().int().min(1).max(3).nullable().optional(),
  responseTimeMs: z.number().int().min(0).max(3_600_000).optional(),
  errorType: z
    .enum([
      "CONCEPTUAL",
      "MEMORY",
      "CARELESS",
      "CALCULATION",
      "MISREAD",
      "CONFUSED_CONCEPTS",
      "GUESS",
      "TIME_PRESSURE",
      "UNKNOWN_CONCEPT",
    ])
    .optional()
    .nullable(),
});

export const practiceCompleteSchema = z.object({
  sessionId: z.string().min(1),
});

export const questionReportSchema = z.object({
  questionId: z.string().min(1),
  issue: z.string().trim().min(1, "Please describe the issue").max(500),
});

export const pyqCreateSchema = z.object({
  year: z
    .number()
    .int()
    .min(1990, "Year looks too old for this exam")
    .max(new Date().getFullYear() + 1, "Year cannot be in the future"),
  paper: z.string().trim().min(1, "Paper is required").max(120).optional(),
  questionText: z.string().trim().min(1, "Question text is required").max(1000),
  options: z
    .array(z.string().trim().min(1, "Options cannot be empty").max(300))
    .length(4, "Exactly 4 options are required"),
  correctIndex: z.number().int().min(0).max(3),
  explanation: z.string().trim().max(2000).optional(),
  source: z
    .string()
    .trim()
    .min(1, "Source is required — provenance is mandatory for PYQs")
    .max(200),
  sourceUrl: z.string().trim().url("Enter a valid URL").max(500).optional(),
});

export const PREP_STAGES = [
  "not_started",
  "starting",
  "early_prep",
  "mid_prep",
  "intensive",
  "revision",
  "mock_testing",
  "exam_ready",
] as const;

export const preparationSettingsSchema = z.object({
  examId: z.string().min(1).nullable().optional(),
  examAttemptYear: z
    .number()
    .int()
    .min(1990, "Year looks too old")
    .max(new Date().getFullYear() + 1, "Year cannot be in the future")
    .nullable()
    .optional(),
  targetExamDate: z.string().datetime("Enter a valid date").nullable().optional(),
  targetScore: z.number().min(0).max(400, "Target looks too high").nullable().optional(),
  dailyTarget: z.number().int().min(1).max(500).optional(),
  weeklyTarget: z.number().int().min(1).max(3500).optional(),
  stage: z.enum(PREP_STAGES).optional(),
});

export const studyVisitSchema = z.object({
  topicId: z.string().min(1),
  source: z.enum(["STUDY", "REVISION"]).default("STUDY"),
});

export const questionCreateSchema = z.object({
  subjectId: z.string().min(1),
  topicId: z.string().min(1),
  subtopicId: z.string().min(1).optional(),
  conceptId: z.string().min(1).optional(),
  text: z.string().trim().min(10, "Question text is too short").max(2000),
  options: z
    .array(
      z.object({
        label: z.string().trim().min(1).max(10),
        text: z.string().trim().min(1).max(500),
      })
    )
    .length(4, "Exactly 4 options are required"),
  correctIndex: z.number().int().min(0).max(3),
  explanation: z.string().trim().min(1, "Explanation is required").max(3000),
  difficulty: z
    .enum(["EASY", "MEDIUM", "HARD", "VERY_HARD"])
    .default("MEDIUM")
    .optional(),
  source: z
    .object({
      name: z.string().trim().min(1).max(200),
      url: z.string().trim().url("Enter a valid URL").max(500).optional(),
      examName: z.string().trim().max(200).optional(),
      year: z.number().int().min(1990).max(new Date().getFullYear() + 1).optional(),
    })
    .optional(),
});

export const questionReviewSchema = z.object({
  questionId: z.string().min(1),
  status: z.enum(["APPROVED", "QUARANTINED", "REJECTED"]),
  note: z.string().trim().max(500).optional(),
});

export const mockStartSchema = z.object({
  scope: z.enum(["full", "section", "topic"]),
  sectionId: z.string().min(1).optional(),
  topicId: z.string().min(1).optional(),
  count: z.number().int().min(1).max(200).optional(),
});

export const notebookSchema = z.object({
  topicId: z.string().min(1),
  message: z.string().trim().min(1, "Ask something").max(2000),
});

export const goalsSchema = z.object({
  dailyTarget: z.number().int().min(1).max(500).optional(),
  weeklyTarget: z.number().int().min(1).max(3500).optional(),
});

// ── Study timetable ──────────────────────────────────────────────────────────

export const TIMETABLE_CYCLES = ["WEEKLY", "BIWEEKLY", "MONTHLY"] as const;

const TIME_RE = /^([01]\d|2[0-3]):[0-5]\d$/;

/** Accepts WEEKLY | weekly | bi-weekly | biweekly | monthly … and normalizes. */
function normalizeCycle(value: unknown): unknown {
  if (typeof value !== "string") return value;
  const flat = value.trim().toLowerCase().replace(/[^a-z]/g, "");
  if (flat === "biweekly") return "BIWEEKLY";
  if (flat === "monthly") return "MONTHLY";
  if (flat === "weekly") return "WEEKLY";
  return value.trim().toUpperCase();
}

export const timetableSlotSchema = z
  .object({
    day: z.number().int().min(0, "day is 0 (Mon) … 6 (Sun)").max(6, "day is 0 (Mon) … 6 (Sun)"),
    start: z.string().regex(TIME_RE, "Time must be HH:mm (24h)"),
    end: z.string().regex(TIME_RE, "Time must be HH:mm (24h)"),
    activity: z.string().trim().min(1, "Activity is required").max(200),
    topicId: z.string().trim().min(1).max(100).optional(),
  })
  .refine((slot) => slot.start < slot.end, {
    message: "End must be after start",
    path: ["end"],
  });

export const timetableCreateSchema = z.object({
  name: z.string().trim().min(1, "Name is required").max(80, "Name is too long"),
  cycle: z.preprocess(normalizeCycle, z.enum(TIMETABLE_CYCLES)).default("WEEKLY"),
  targetQuestions: z.number().int().min(1, "Target must be at least 1").max(5000).optional(),
  slots: z.array(timetableSlotSchema).min(1, "Add at least one time block").max(112),
  isActive: z.boolean().optional(),
});

export const timetableUpdateSchema = z.object({
  name: z.string().trim().min(1, "Name is required").max(80, "Name is too long").optional(),
  cycle: z.preprocess(normalizeCycle, z.enum(TIMETABLE_CYCLES)).optional(),
  targetQuestions: z.number().int().min(1).max(5000).optional(),
  slots: z.array(timetableSlotSchema).min(1, "Add at least one time block").max(112).optional(),
  isActive: z.boolean().optional(),
});

export const questionBankQuerySchema = z.object({
  examId: z.string().min(1).optional(),
  sectionId: z.string().min(1).optional(),
  subjectId: z.string().min(1).optional(),
  topicId: z.string().min(1).optional(),
  subtopicId: z.string().min(1).optional(),
  conceptId: z.string().min(1).optional(),
  difficulty: z.enum(["EASY", "MEDIUM", "HARD", "VERY_HARD"]).optional(),
  sourceType: z
    .enum([
      "PYQ",
      "PYQ_VARIANT",
      "AI_GENERATED",
      "WEB_SOURCED",
      "OFFICIAL",
      "LICENSED",
      "WEB_DERIVED_ORIGINAL",
      "USER_CREATED",
    ])
    .optional(),
  verified: z.enum(["true", "false"]).optional(),
  qualityStatus: z.enum(["PENDING", "APPROVED", "QUARANTINED", "REJECTED"]).optional(),
  examRelevanceMin: z.coerce.number().int().min(0).max(100).optional(),
  query: z.string().trim().max(200).optional(),
  cursor: z.string().min(1).max(500).optional(),
  limit: z.coerce.number().int().min(1).max(100).optional(),
});

export const checkoutSchema = z.object({
  plan: z.enum(["BASIC", "PREMIUM", "PREMIUM_PLUS", "ROYAL"]),
  cycle: z.enum(["MONTHLY", "YEARLY"]),
  currency: z.enum(["INR", "USD"]).default("INR"),
});

