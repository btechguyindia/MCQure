// Practice session logic: mode defaults, question selection and session
// helpers. Phase 1 uses randomised selection spread across topics; the
// adaptive engine (Phase 5) will replace `selectQuestions` internals.

import type { Difficulty, Prisma, QuestionSourceType } from "@prisma/client";
import { prisma } from "@/lib/db";

export { MODE_DEFAULTS, resolveCount } from "@/lib/modes";

export interface QuestionFilters {
  subjectId?: string;
  topicId?: string;
  subtopicId?: string;
  conceptId?: string;
  difficulty?: Difficulty;
  sourceType?: QuestionSourceType;
  verifiedOnly?: boolean;
  count: number;
}

/**
 * Select `count` active questions for the active exam. Selection spreads
 * questions across topics to avoid repeating a single topic, then shuffles.
 */
export async function selectQuestions(
  examId: string,
  filters: QuestionFilters
) {
  const where = {
    examId,
    isActive: true,
    qualityStatus: { not: "REJECTED" as const },
    ...(filters.subjectId ? { subjectId: filters.subjectId } : {}),
    ...(filters.topicId ? { topicId: filters.topicId } : {}),
    ...(filters.subtopicId ? { subtopicId: filters.subtopicId } : {}),
    ...(filters.conceptId ? { conceptId: filters.conceptId } : {}),
    ...(filters.difficulty ? { difficulty: filters.difficulty } : {}),
    ...(filters.sourceType ? { sourceType: filters.sourceType } : {}),
    ...(filters.verifiedOnly ? { source: { is: { verified: true } } } : {}),
  };

  const questions = await prisma.question.findMany({
    where,
    select: {
      id: true,
      text: true,
      options: true,
      difficulty: true,
      examRelevance: true,
      sourceType: true,
      topic: { select: { name: true, subject: { select: { name: true } } } },
      subtopic: { select: { name: true } },
    },
  });

  const shuffled = shuffle(questions);
  const topicCount = new Map<string, number>();
  const selected: typeof questions = [];
  const byTopic = new Map<string, typeof questions>();

  for (const q of shuffled) {
    const key = q.topic.name;
    const bucket = byTopic.get(key) ?? [];
    bucket.push(q);
    byTopic.set(key, bucket);
    topicCount.set(key, 0);
  }

  const topics = shuffle([...byTopic.keys()]);
  let cursor = 0;
  while (selected.length < filters.count) {
    const topic = topics[cursor % topics.length];
    const bucket = byTopic.get(topic) ?? [];
    const idx = topicCount.get(topic) ?? 0;
    if (idx < bucket.length) {
      selected.push(bucket[idx]);
      topicCount.set(topic, idx + 1);
      cursor += 1;
    } else {
      topics.splice(cursor % topics.length, 1);
      if (topics.length === 0) break;
      if (cursor >= topics.length) cursor = 0;
    }
  }

  return selected;
}

/**
 * Review mode: questions this user answered wrongly or skipped in past
 * sessions, most recent first, up to `count`. The mistake book — Phase 2.
 */
export async function selectMistakes(
  userId: string,
  examId: string,
  count: number
) {
  const missIds = await prisma.attempt.findMany({
    where: {
      userId,
      OR: [{ isCorrect: false }, { isCorrect: null }],
    },
    select: { questionId: true },
    orderBy: { createdAt: "desc" },
    distinct: ["questionId"],
  });

  if (missIds.length === 0) return [];

  const ids = missIds.map((a) => a.questionId);
  const questions = await prisma.question.findMany({
    where: { id: { in: ids }, examId, isActive: true },
    select: {
      id: true,
      text: true,
      options: true,
      difficulty: true,
      examRelevance: true,
      sourceType: true,
      topic: { select: { name: true, subject: { select: { name: true } } } },
      subtopic: { select: { name: true } },
    },
  });

  return shuffle(questions).slice(0, count);
}

/** Public shape sent to the client (no explanation/correct answer). */
export function toPublicQuestion(q: {
  id: string;
  text: string;
  options: Prisma.JsonValue;
  difficulty: Difficulty;
  examRelevance: number;
  sourceType: QuestionSourceType;
  topic: { name: string; subject: { name: string } };
  subtopic: { name: string } | null;
}) {
  return {
    id: q.id,
    subject: q.topic.subject.name,
    topic: q.topic.name,
    subtopic: q.subtopic?.name ?? null,
    difficulty: q.difficulty,
    sourceType: q.sourceType,
    examRelevance: q.examRelevance,
    text: q.text,
    options: q.options,
  };
}

export async function getActiveExam() {
  return prisma.exam.findFirst({ where: { active: true } });
}

export async function getScoringConfig(examId: string) {
  const config = await prisma.scoringConfig.findUnique({ where: { examId } });
  if (!config) {
    throw new Error(`No scoring configuration for exam ${examId}`);
  }
  return config;
}

function shuffle<T>(arr: T[]): T[] {
  const copy = [...arr];
  for (let i = copy.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}
