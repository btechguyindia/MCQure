// Large-scale original question generation via the configured Gemini provider,
// plus PYQ-variant generation. Everything written is labelled with its true
// source type (AI_GENERATED / PYQ_VARIANT) and passes through the same dedup +
// quality gates as any other insertion. If no real AI key is configured the
// functions report `notConfigured` and write nothing.

import { z } from "zod";
import type { Difficulty, IngestionJobKind } from "@prisma/client";
import { aiStatus, generateWithGemini } from "./ai";
import { prisma } from "./db";
import { createQuestion } from "./question-bank";

export const generatedQuestionSchema = z.object({
  text: z.string().trim().min(10),
  options: z.array(z.string().trim().min(1)).length(4),
  correctIndex: z.number().int().min(0).max(3),
  explanation: z.string().trim().min(1),
  difficulty: z.enum(["EASY", "MEDIUM", "HARD", "VERY_HARD"]).default("MEDIUM"),
  conceptHint: z.string().trim().optional(),
});

export type GeneratedQuestion = z.infer<typeof generatedQuestionSchema>;

/** Extracts the JSON array (inside or outside code fences) and validates items. */
export function parseGeneratedQuestions(text: string): {
  questions: GeneratedQuestion[];
  error?: string;
} {
  const fenced = text.match(/```(?:json)?\s*([\s\S]*?)```/g);
  const body = fenced ? fenced.join("\n") : text;
  const start = body.indexOf("[");
  const end = body.lastIndexOf("]");
  if (start === -1 || end === -1 || end < start) {
    return { questions: [], error: "No JSON array found in the model output" };
  }
  const json = body.slice(start, end + 1);
  let parsed: unknown;
  try {
    parsed = JSON.parse(json);
  } catch {
    return { questions: [], error: "Model output contained invalid JSON" };
  }
  if (!Array.isArray(parsed)) {
    return { questions: [], error: "Expected a JSON array of questions" };
  }
  const questions: GeneratedQuestion[] = [];
  for (const raw of parsed) {
    const result = generatedQuestionSchema.safeParse(raw);
    if (result.success) questions.push(result.data);
  }
  if (questions.length === 0) {
    return { questions: [], error: "No questions passed validation" };
  }
  return { questions };
}

export interface OriginalPromptInput {
  examName: string;
  topicName: string;
  conceptName?: string;
  difficulty?: Difficulty;
  syllabus?: string[]; // official syllabus / topic list
  patterns?: string[]; // observed PYQ question patterns
  misconceptions?: string[]; // common misconceptions
  relatedExams?: string[];
  weakness?: string; // optional user-weakness context
}

export function buildOriginalPrompt(input: OriginalPromptInput): string {
  const lines = [
    "You are writing original multiple-choice exam questions for a serious exam-prep product.",
    `Exam: ${input.examName}`,
    `Topic: ${input.topicName}`,
  ];
  if (input.conceptName) lines.push(`Concept: ${input.conceptName}`);
  lines.push(`Difficulty: ${input.difficulty ?? "MEDIUM"}`);
  if (input.syllabus && input.syllabus.length > 0) {
    lines.push(`Official syllabus (stay inside it): ${input.syllabus.join("; ")}`);
  }
  if (input.patterns && input.patterns.length > 0) {
    lines.push(`Typical PYQ question patterns to reflect: ${input.patterns.join("; ")}`);
  }
  if (input.misconceptions && input.misconceptions.length > 0) {
    lines.push(
      `Common misconceptions to build distractors from: ${input.misconceptions.join("; ")}`
    );
  }
  if (input.relatedExams && input.relatedExams.length > 0) {
    lines.push(`Related competitive exams to draw scenario style from: ${input.relatedExams.join("; ")}`);
  }
  if (input.weakness) lines.push(`The learner is weak at: ${input.weakness}`);
  lines.push("");
  lines.push(
    "Return ONLY a JSON array. Each item has exactly these keys: text (string), options (array of exactly 4 strings), correctIndex (0-3), explanation (string, 2-4 sentences), difficulty (EASY|MEDIUM|HARD|VERY_HARD), conceptHint (string, the underlying concept tested)."
  );
  lines.push("Write genuinely new questions. Do not reproduce any real PYQ verbatim.");
  return lines.join("\n");
}

export interface VariantPromptInput {
  examName: string;
  topicName: string;
  conceptName: string;
  pyqText: string;
  pyqExplanation: string;
  count: number;
}

export function buildVariantPrompt(input: VariantPromptInput): string {
  return [
    "You are writing NEW ORIGINAL variants of a previous-year question for exam practice.",
    `Exam: ${input.examName}`,
    `Topic: ${input.topicName}`,
    `Concept tested: ${input.conceptName}`,
    "",
    "Actual PYQ:",
    input.pyqText,
    "",
    `Official explanation: ${input.pyqExplanation}`,
    "",
    `Create ${input.count} distinct original questions. Each must test the SAME underlying concept in a different way (different numbers, scenarios, options, or reasoning). They must NOT be the original PYQ or mere paraphrases of it.`,
    "",
    "Return ONLY a JSON array. Each item has exactly these keys: text (string), options (array of exactly 4 strings), correctIndex (0-3), explanation (string, 2-4 sentences), difficulty (EASY|MEDIUM|HARD|VERY_HARD), conceptHint (string).",
  ].join("\n");
}

// ── DB write paths ──────────────────────────────────────────────────────────

export interface GenerationParams {
  userId?: string;
  exam: { id: string; name: string };
  subjectId: string;
  topicId: string;
  subtopicId?: string;
  conceptId?: string;
  count: number;
}

export interface GenerationOutcome {
  notConfigured?: boolean;
  created: number;
  duplicatesRejected: number;
  qualityRejected: number;
  errors: string[];
  jobId?: string;
}

async function runGeneration(
  params: GenerationParams,
  kind: "original" | "variant",
  prompt: string
): Promise<GenerationOutcome> {
  if (!aiStatus().gemini) {
    return { notConfigured: true, created: 0, duplicatesRejected: 0, qualityRejected: 0, errors: [] };
  }

  const job = await prisma.ingestionJob.create({
    data: {
      kind: (kind === "original"
        ? "ORIGINAL_GENERATION"
        : "VARIANT_GENERATION") as IngestionJobKind,
      status: "RUNNING",
      userId: params.userId ?? null,
      examId: params.exam.id,
      params: { count: params.count },
      requested: params.count,
      startedAt: new Date(),
    },
  });

  try {
    const result = await generateWithGemini({
      prompt,
      temperature: 0.8,
      maxOutputTokens: 4096,
    });
    const { questions, error } = parseGeneratedQuestions(result.text);
    const outcome: GenerationOutcome = { created: 0, duplicatesRejected: 0, qualityRejected: 0, errors: [] };
    if (error) outcome.errors.push(error);

    for (const q of questions) {
      const res = await createQuestion({
        examId: params.exam.id,
        subjectId: params.subjectId,
        topicId: params.topicId,
        subtopicId: params.subtopicId,
        conceptId: params.conceptId,
        sourceType: kind === "original" ? "AI_GENERATED" : "PYQ_VARIANT",
        source: {
          type: kind === "original" ? "AI_GENERATED" : "PYQ_VARIANT",
          name:
            kind === "original"
              ? `AI-generated for ${params.exam.name}`
              : `Variant of ${params.exam.name} PYQ`,
        },
        text: q.text,
        options: q.options.map((text, i) => ({ label: String.fromCharCode(65 + i), text })),
        correctIndex: q.correctIndex,
        explanation: q.explanation,
        difficulty: q.difficulty,
        qualityNote: q.conceptHint ? `Concept hint: ${q.conceptHint}` : undefined,
      });
      if (!res.ok) {
        outcome.qualityRejected += 1;
      } else if (res.created) {
        outcome.created += 1;
      } else {
        outcome.duplicatesRejected += 1;
      }
    }

    await prisma.ingestionJob.update({
      where: { id: job.id },
      data: {
        status: "COMPLETED",
        processed: questions.length,
        accepted: outcome.created,
        rejected: outcome.duplicatesRejected + outcome.qualityRejected,
        completedAt: new Date(),
      },
    });
    outcome.jobId = job.id;
    return outcome;
  } catch (err) {
    await prisma.ingestionJob.update({
      where: { id: job.id },
      data: { status: "FAILED", error: err instanceof Error ? err.message : "Unknown error" },
    });
    return {
      created: 0,
      duplicatesRejected: 0,
      qualityRejected: 0,
      errors: [err instanceof Error ? err.message : "Unknown error"],
      jobId: job.id,
    };
  }
}

/** Generates original questions from the syllabus/concept. */
export async function generateOriginalQuestions(
  params: GenerationParams & { prompt: OriginalPromptInput }
): Promise<GenerationOutcome> {
  return runGeneration(params, "original", buildOriginalPrompt(params.prompt));
}

/** Generates new original variants of a genuine PYQ concept. */
export async function generatePyqVariants(
  params: GenerationParams & { prompt: VariantPromptInput }
): Promise<GenerationOutcome> {
  return runGeneration(params, "variant", buildVariantPrompt(params.prompt));
}
