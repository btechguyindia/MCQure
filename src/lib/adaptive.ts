// Phase 7 adaptive engine: concept/topic-aware question selection. Weakness is
// derived from the permanent attempt history; selection favours weak topics and
// picks easier questions within weak topics so progress is reachable.

import { prisma } from "@/lib/db";
import type { Difficulty } from "@prisma/client";

/**
 * Selection priority of a topic (0..1, higher = pick more from this topic).
 * Unexplored topics get a mild boost; weak, well-attempted topics get the most
 * attention; strong topics are de-prioritised. Pure and deterministic.
 */
export function topicPriority(accuracy: number | null, attempts: number): number {
  if (attempts === 0) return 0.5; // never practised — worth exploring
  if (accuracy === null) return 0.55; // attempted but unanswered? treat cautiously
  const exposure = Math.min(attempts, 12) / 12; // 0..1
  const weakFactor = 1 - accuracy / 100; // 0..1
  return 0.35 + weakFactor * exposure * 0.65; // 0.35 (mastered) .. 1.0 (weak)
}

/** Difficulty to draw from for a topic: weak topics lean easier. */
export function difficultyFor(accuracy: number | null): Difficulty {
  if (accuracy === null) return "MEDIUM";
  if (accuracy < 50) return "EASY";
  if (accuracy < 75) return "MEDIUM";
  return "HARD";
}

export interface AdaptiveQuestionFilters {
  topicId?: string;
  count: number;
}

/**
 * Selects `count` questions adaptively: topics are weighted by weakness, weak
 * topics draw easier questions, and previously over-attempted questions are
 * pushed back so the student sees fresh material.
 */
export async function selectAdaptiveQuestions(
  userId: string,
  examId: string,
  filters: AdaptiveQuestionFilters
) {
  const topicWhere = {
    subject: { examId },
    ...(filters.topicId ? { id: filters.topicId } : {}),
  };
  const topics = await prisma.topic.findMany({ where: topicWhere, select: { id: true } });
  if (topics.length === 0) return [];

  const topicIds = topics.map((t) => t.id);
  const attempts = await prisma.attempt.findMany({
    where: { userId, question: { topicId: { in: topicIds } } },
    select: { isCorrect: true, question: { select: { topicId: true } } },
  });

  const perTopic = new Map<string, { answered: number; correct: number }>();
  for (const a of attempts) {
    const g = perTopic.get(a.question.topicId) ?? { answered: 0, correct: 0 };
    g.answered += 1;
    if (a.isCorrect === true) g.correct += 1;
    perTopic.set(a.question.topicId, g);
  }

  const priority = new Map<string, number>();
  for (const t of topics) {
    const s = perTopic.get(t.id);
    const accuracy = s && s.answered > 0 ? (100 * s.correct) / s.answered : null;
    priority.set(t.id, topicPriority(accuracy, s?.answered ?? 0));
  }

  const weightedTopics = sampleWeighted([...topics], (t) => priority.get(t.id) ?? 0.5, filters.count);

  const questions: Awaited<ReturnType<typeof fetchPool>>[number][] = [];
  for (const topic of weightedTopics) {
    const accuracy = (() => {
      const s = perTopic.get(topic.id);
      return s && s.answered > 0 ? (100 * s.correct) / s.answered : null;
    })();
    const difficulty = difficultyFor(accuracy);
    const pool = await fetchPool(examId, topic.id, difficulty, filters.count * 2);
    const fresh = pool
      .filter((q) => !questions.some((x) => x.id === q.id))
      .sort((a, b) => a.timesAttempted - b.timesAttempted);
    if (fresh.length > 0) questions.push(fresh[0]);
    if (questions.length >= filters.count) break;
  }

  return questions.slice(0, filters.count);
}

async function fetchPool(
  examId: string,
  topicId: string,
  difficulty: Difficulty,
  take: number
) {
  return prisma.question.findMany({
    where: {
      examId,
      topicId,
      isActive: true,
      qualityStatus: { not: "REJECTED" },
      difficulty,
    },
    select: {
      id: true,
      text: true,
      options: true,
      difficulty: true,
      examRelevance: true,
      sourceType: true,
      timesAttempted: true,
      topic: { select: { name: true, subject: { select: { name: true } } } },
      subtopic: { select: { name: true } },
    },
    orderBy: { timesAttempted: "asc" },
    take,
  });
}

/** Weighted sampling without replacement. Deterministic for identical inputs. */
export function sampleWeighted<T>(
  items: T[],
  weight: (item: T) => number,
  k: number
): T[] {
  const pool = items.map((item) => ({ item, w: Math.max(weight(item), 0.01) }));
  const result: T[] = [];
  while (pool.length > 0 && result.length < k) {
    const total = pool.reduce((s, p) => s + p.w, 0);
    let r = Math.random() * total;
    let i = 0;
    for (; i < pool.length - 1; i += 1) {
      r -= pool[i].w;
      if (r <= 0) break;
    }
    result.push(pool[i].item);
    pool.splice(i, 1);
  }
  return result;
}
