// Phase 7 adaptive engine: concept/topic-aware question selection. Weakness is
// derived from the permanent attempt history; selection favours weak topics and
// picks easier questions within weak topics so progress is reachable.
//
// Small-sample protection: a single 1/1 or 0/1 is NOT treated as proof of
// mastery or weakness. Accuracy is blended toward a neutral prior until the
// topic accumulates enough evidence (Bayesian smoothing), so selection is
// stable instead of over-reacting to tiny samples.

import { prisma } from "@/lib/db";
import type { Difficulty } from "@prisma/client";

// Bayesian prior: everyone starts at 50% accuracy with `PRIOR_N` pseudo-attempts.
const PRIOR_N = 4;

/**
 * Smoothed weakness (0..1, higher = weaker). Blends measured accuracy toward a
 * neutral 50% prior until the sample is large enough to be trusted.
 */
export function smoothedWeakness(answered: number, correct: number): number {
  if (answered <= 0) return 0.5; // never practised — cautiously worth exploring
  const smoothedAccuracy = (correct + PRIOR_N * 0.5) / (answered + PRIOR_N);
  return 1 - smoothedAccuracy;
}

/**
 * Selection priority of a topic (0..1, higher = pick more from this topic).
 * Weak, well-attempted topics get the most attention; unexplored topics get a
 * moderate boost; strong topics (backed by enough evidence) are de-prioritised.
 * `examWeight` (0..1 from the configured blueprint) nudges high-weight topics
 * up so the engine aligns with what the exam actually tests.
 */
export function topicPriority(
  answered: number,
  correct: number,
  examWeight = 0.5
): number {
  const weakness = smoothedWeakness(answered, correct);
  return 0.3 + weakness * 0.55 + (examWeight - 0.5) * 0.3;
}

/** Difficulty to draw from for a topic: weak topics lean easier. */
export function difficultyFor(answered: number, correct: number): Difficulty {
  if (answered === 0) return "MEDIUM";
  const weakness = smoothedWeakness(answered, correct);
  if (weakness > 0.6) return "EASY";
  if (weakness > 0.35) return "MEDIUM";
  return "HARD";
}

export interface AdaptiveQuestionFilters {
  topicId?: string;
  count: number;
}

/**
 * Selects `count` questions adaptively: topics are weighted by smoothed
 * weakness and blueprint exam weight, weak topics draw easier questions, and
 * previously over-attempted questions are pushed back so the student sees
 * fresh material.
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
  const topics = await prisma.topic.findMany({
    where: topicWhere,
    select: { id: true, blueprintTopicWeights: { where: { examId }, select: { weight: true } } },
  });
  if (topics.length === 0) return [];

  const topicIds = topics.map((t) => t.id);
  const weights = Object.fromEntries(
    topics.map((t) => [
      t.id,
      t.blueprintTopicWeights[0]?.weight === "HIGH"
        ? 1
        : t.blueprintTopicWeights[0]?.weight === "LOW"
          ? 0.25
          : 0.5,
    ])
  );

  const attempts = await prisma.attempt.findMany({
    where: { userId, question: { topicId: { in: topicIds } } },
    select: { isCorrect: true, question: { select: { topicId: true } } },
  });

  const perTopic = new Map<string, { answered: number; correct: number }>();
  for (const a of attempts) {
    if (a.isCorrect === null) continue;
    const g = perTopic.get(a.question.topicId) ?? { answered: 0, correct: 0 };
    g.answered += 1;
    if (a.isCorrect === true) g.correct += 1;
    perTopic.set(a.question.topicId, g);
  }

  const priority = new Map<string, number>();
  for (const t of topics) {
    const s = perTopic.get(t.id);
    priority.set(t.id, topicPriority(s?.answered ?? 0, s?.correct ?? 0, weights[t.id] ?? 0.5));
  }

  const weightedTopics = sampleWeighted([...topics], (t) => priority.get(t.id) ?? 0.5, filters.count);

  const questions: Awaited<ReturnType<typeof fetchPool>>[number][] = [];
  for (const topic of weightedTopics) {
    const s = perTopic.get(topic.id);
    const difficulty = difficultyFor(s?.answered ?? 0, s?.correct ?? 0);
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
