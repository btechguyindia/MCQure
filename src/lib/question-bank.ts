// Question-bank layer: the single guarded insertion point (`createQuestion`)
// and the cursor-paginated explorer (`listQuestionBank`) built for a large
// pool (1M+). Every insert runs dedup + quality checks; list queries use
// keyset pagination and server-side filters so the browser never loads the
// whole bank.

import type {
  Difficulty,
  DuplicateMethod,
  Prisma,
  QuestionQualityStatus,
  QuestionSourceType,
} from "@prisma/client";
import { prisma } from "./db";
import {
  classifyDuplicate,
  ngramSimilarity,
  normalizeQuestionText,
  questionFingerprint,
  NEAR_DUPLICATE_THRESHOLD,
} from "./dedup";
import { evaluateQuestionQuality } from "./question-quality";

export const QUESTION_BANK_DEFAULTS = { limit: 20, maxLimit: 100 } as const;

// How many recent questions to scan for near duplicates. Exact duplicates are
// found via the indexed fingerprint (O(1)); near-duplicate detection at 1M+
// needs an embedding/sim index, which the recent-window scan replaces today.
const NEAR_DUP_SCAN_WINDOW = 100;

export interface QuestionOption {
  label: string;
  text: string;
}

export interface CreateQuestionInput {
  examId: string;
  subjectId: string;
  topicId: string;
  subtopicId?: string;
  conceptId?: string;
  sourceType: QuestionSourceType;
  source?: {
    name: string;
    type: QuestionSourceType;
    examName?: string;
    year?: number;
    paper?: string;
    url?: string;
    verified?: boolean;
  };
  sourceId?: string; // reuse an existing QuestionSource instead of creating one
  text: string;
  options: QuestionOption[];
  correctIndex: number;
  explanation: string;
  difficulty: Difficulty;
  examRelevance?: number;
  qualityOverride?: QuestionQualityStatus;
  qualityNote?: string;
}

export type CreateQuestionResult =
  | {
      ok: true;
      created: true;
      question: { id: string; qualityStatus: QuestionQualityStatus };
    }
  | {
      ok: true;
      created: false;
      duplicate: { id: string; method: DuplicateMethod; similarity: number };
    }
  | {
      ok: false;
      reason: "quality_rejected";
      issues: string[];
    };

function toSearchText(text: string, explanation: string): string {
  return `${text} ${explanation}`.toLowerCase();
}

export function buildSearchText(input: CreateQuestionInput): string {
  return toSearchText(input.text, input.explanation);
}

/**
 * Creates one question after dedup + quality gates. Returns the existing
 * question when a duplicate is found instead of inserting another row.
 */
export async function createQuestion(
  input: CreateQuestionInput
): Promise<CreateQuestionResult> {
  const normalized = normalizeQuestionText(input.text);
  const fingerprint = questionFingerprint(input.text);

  const exact = await prisma.question.findFirst({
    where: { fingerprint, isActive: true },
    select: { id: true },
  });
  if (exact) {
    return {
      ok: true,
      created: false,
      duplicate: { id: exact.id, method: "EXACT", similarity: 1 },
    };
  }

  const recent = await prisma.question.findMany({
    where: { examId: input.examId, isActive: true },
    select: { id: true, normalizedText: true },
    orderBy: { createdAt: "desc" },
    take: NEAR_DUP_SCAN_WINDOW,
  });
  for (const candidate of recent) {
    if (!candidate.normalizedText) continue;
    const match = classifyDuplicate(input.text, candidate.normalizedText);
    if (match) {
      return {
        ok: true,
        created: false,
        duplicate: { id: candidate.id, method: match.method, similarity: match.similarity },
      };
    }
    const sim = ngramSimilarity(normalized, candidate.normalizedText);
    if (sim >= NEAR_DUPLICATE_THRESHOLD) {
      return {
        ok: true,
        created: false,
        duplicate: { id: candidate.id, method: "NEAR", similarity: sim },
      };
    }
  }

  const quality = evaluateQuestionQuality({
    text: input.text,
    options: input.options,
    correctIndex: input.correctIndex,
    explanation: input.explanation,
  });
  const qualityStatus = input.qualityOverride ?? quality.status;
  const qualityNote =
    input.qualityNote ??
    (quality.issues.length > 0
      ? quality.issues.map((i) => `${i.code}: ${i.message}`).join("; ")
      : null);

  if (qualityStatus === "REJECTED" && !input.qualityOverride) {
    return {
      ok: false,
      reason: "quality_rejected",
      issues: quality.issues.map((i) => i.message),
    };
  }

  const sourceId = input.sourceId ??
    (input.source
      ? (
          await prisma.questionSource.create({
            data: {
              type: input.source.type,
              name: input.source.name,
              examName: input.source.examName ?? null,
              year: input.source.year ?? null,
              paper: input.source.paper ?? null,
              url: input.source.url ?? null,
              verified: input.source.verified ?? false,
            },
          })
        ).id
      : null);

  const question = await prisma.question.create({
    data: {
      examId: input.examId,
      subjectId: input.subjectId,
      topicId: input.topicId,
      subtopicId: input.subtopicId ?? null,
      conceptId: input.conceptId ?? null,
      sourceType: input.sourceType,
      sourceId,
      text: input.text,
      options: input.options as unknown as Prisma.InputJsonValue,
      correctIndex: input.correctIndex,
      explanation: input.explanation,
      difficulty: input.difficulty,
      examRelevance: input.examRelevance ?? 50,
      qualityStatus,
      qualityNote,
      normalizedText: normalized,
      fingerprint,
      searchText: toSearchText(input.text, input.explanation),
    },
    select: { id: true, qualityStatus: true },
  });

  return { ok: true, created: true, question };
}

// ── Explorer ────────────────────────────────────────────────────────────────

export interface QuestionBankFilters {
  examId?: string;
  sectionId?: string;
  subjectId?: string;
  topicId?: string;
  subtopicId?: string;
  conceptId?: string;
  difficulty?: Difficulty;
  sourceType?: QuestionSourceType;
  verified?: boolean;
  qualityStatus?: QuestionQualityStatus;
  examRelevanceMin?: number;
  query?: string;
  cursor?: string;
  limit?: number;
}

export interface QuestionBankItem {
  id: string;
  text: string;
  difficulty: Difficulty;
  examRelevance: number;
  sourceType: QuestionSourceType;
  qualityStatus: QuestionQualityStatus;
  timesAttempted: number;
  timesCorrect: number;
  timesIncorrect: number;
  timesSkipped: number;
  avgResponseTimeMs: number;
  reportCount: number;
  createdAt: Date;
  source: {
    name: string;
    type: QuestionSourceType;
    examName: string | null;
    year: number | null;
    verified: boolean;
  } | null;
  subject: { id: string; name: string };
  topic: { id: string; name: string };
  subtopic: { id: string; name: string } | null;
  concept: { id: string; name: string } | null;
}

export interface QuestionBankPage {
  items: QuestionBankItem[];
  nextCursor: string | null;
  total: number;
}

function encodeCursor(cursor: { t: string; i: string }): string {
  return Buffer.from(JSON.stringify(cursor), "utf8").toString("base64url");
}

function decodeCursor(raw: string): { t: Date; i: string } | null {
  try {
    const parsed = JSON.parse(Buffer.from(raw, "base64url").toString("utf8"));
    if (typeof parsed?.t !== "string" || typeof parsed?.i !== "string") return null;
    return { t: new Date(parsed.t), i: parsed.i };
  } catch {
    return null;
  }
}

async function buildWhere(
  filters: QuestionBankFilters
): Promise<Prisma.QuestionWhereInput> {
  const where: Prisma.QuestionWhereInput = { examId: filters.examId!, isActive: true };

  if (filters.sectionId) {
    const section = await prisma.section.findUnique({
      where: { id: filters.sectionId },
      select: { sectionSubjects: { select: { subjectId: true } } },
    });
    if (section) where.subjectId = { in: section.sectionSubjects.map((s) => s.subjectId) };
  }
  if (filters.subjectId) where.subjectId = filters.subjectId;
  if (filters.topicId) where.topicId = filters.topicId;
  if (filters.subtopicId) where.subtopicId = filters.subtopicId;
  if (filters.conceptId) where.conceptId = filters.conceptId;
  if (filters.difficulty) where.difficulty = filters.difficulty;
  if (filters.sourceType) where.sourceType = filters.sourceType;
  if (filters.verified !== undefined) {
    where.source = { is: { verified: filters.verified } };
  }
  if (filters.qualityStatus) where.qualityStatus = filters.qualityStatus;
  if (filters.examRelevanceMin !== undefined) {
    where.examRelevance = { gte: filters.examRelevanceMin };
  }
  if (filters.query) {
    where.searchText = { contains: filters.query.toLowerCase(), mode: "insensitive" };
  }
  return where;
}

const ITEM_SELECT = {
  id: true,
  text: true,
  difficulty: true,
  examRelevance: true,
  sourceType: true,
  qualityStatus: true,
  timesAttempted: true,
  timesCorrect: true,
  timesIncorrect: true,
  timesSkipped: true,
  avgResponseTimeMs: true,
  reportCount: true,
  createdAt: true,
  source: {
    select: {
      name: true,
      type: true,
      examName: true,
      year: true,
      verified: true,
    },
  },
  subject: { select: { id: true, name: true } },
  topic: { select: { id: true, name: true } },
  subtopic: { select: { id: true, name: true } },
  concept: { select: { id: true, name: true } },
} satisfies Prisma.QuestionSelect;

/**
 * Cursor-paginated question-bank listing with server-side filters. Never loads
 * the whole pool — each page is a bounded query keyed on (createdAt, id).
 */
export async function listQuestionBank(
  filters: QuestionBankFilters
): Promise<QuestionBankPage> {
  const limit = Math.min(
    Math.max(filters.limit ?? QUESTION_BANK_DEFAULTS.limit, 1),
    QUESTION_BANK_DEFAULTS.maxLimit
  );

  let examId = filters.examId;
  if (!examId) {
    const active = await prisma.exam.findFirst({ where: { active: true } });
    examId = active?.id;
  }
  if (!examId) return { items: [], nextCursor: null, total: 0 };

  const baseWhere = await buildWhere({ ...filters, examId });

  const cursor = filters.cursor ? decodeCursor(filters.cursor) : null;
  const pageWhere: Prisma.QuestionWhereInput = cursor
    ? {
        ...baseWhere,
        OR: [
          { createdAt: { lt: cursor.t } },
          { createdAt: cursor.t, id: { lt: cursor.i } },
        ],
      }
    : baseWhere;

  const [rows, total] = await Promise.all([
    prisma.question.findMany({
      where: pageWhere,
      select: ITEM_SELECT,
      orderBy: [{ createdAt: "desc" }, { id: "desc" }],
      take: limit + 1,
    }),
    prisma.question.count({ where: baseWhere }),
  ]);

  const hasMore = rows.length > limit;
  const items = hasMore ? rows.slice(0, limit) : rows;
  const last = items[items.length - 1];

  return {
    items,
    nextCursor:
      hasMore && last ? encodeCursor({ t: last.createdAt.toISOString(), i: last.id }) : null,
    total,
  };
}
