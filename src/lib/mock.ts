// Phase 6 mock system: blueprint-driven mock tests (full / sectional / topic)
// built on the existing immutable practice sessions, plus history and a
// mock-vs-practice comparison.

import { prisma } from "@/lib/db";
import { getScoringConfig, selectQuestions, toPublicQuestion } from "@/lib/practice";

export type MockScope = "full" | "section" | "topic";

export const MOCK_DEFAULT_COUNT: Record<MockScope, number> = {
  full: 30,
  section: 20,
  topic: 15,
};

export interface MockPlan {
  scope: MockScope;
  label: string;
  count: number;
  paperId: string | null;
  sectionId: string | null;
  topicId: string | null;
  filters: Parameters<typeof selectQuestions>[1];
}

export async function buildMockPlan(
  examId: string,
  scope: MockScope,
  opts: { sectionId?: string; topicId?: string; count?: number }
): Promise<MockPlan> {
  const requested = opts.count ?? MOCK_DEFAULT_COUNT[scope];

  if (scope === "section" && opts.sectionId) {
    const section = await prisma.section.findUnique({
      where: { id: opts.sectionId },
      include: { sectionSubjects: { select: { subjectId: true } }, paper: true },
    });
    if (!section) throw new Error("Section not found");
    return {
      scope,
      label: section.name,
      count: requested,
      paperId: section.paperId,
      sectionId: section.id,
      topicId: null,
      filters: { subjectIds: section.sectionSubjects.map((s) => s.subjectId), count: requested },
    };
  }

  if (scope === "topic" && opts.topicId) {
    const topic = await prisma.topic.findUnique({ where: { id: opts.topicId } });
    if (!topic) throw new Error("Topic not found");
    return {
      scope,
      label: topic.name,
      count: requested,
      paperId: null,
      sectionId: null,
      topicId: topic.id,
      filters: { topicId: topic.id, count: requested },
    };
  }

  const paper = await prisma.paper.findFirst({
    where: { examId, isActive: true },
    orderBy: { order: "asc" },
  });
  return {
    scope: "full",
    label: "Full Mock",
    count: requested,
    paperId: paper?.id ?? null,
    sectionId: null,
    topicId: null,
    filters: { count: requested },
  };
}

export async function startMock(userId: string, examId: string, plan: MockPlan) {
  const selected = await selectQuestions(examId, plan.filters);
  if (selected.length === 0) throw new Error("No questions match the mock scope");

  const config = await getScoringConfig(examId);
  const publicQuestions = selected.map(toPublicQuestion);

  const session = await prisma.practiceSession.create({
    data: {
      userId,
      mode: `mock_${plan.scope}`,
      status: "IN_PROGRESS",
      questionCount: selected.length,
      config: {
        mock: true,
        scope: plan.scope,
        label: plan.label,
        paperId: plan.paperId,
        sectionId: plan.sectionId,
        topicId: plan.topicId,
        count: selected.length,
        correctMarks: config.correctMarks,
        incorrectPenalty: config.incorrectPenalty,
        unattemptedMarks: config.unattemptedMarks,
        questions: publicQuestions,
      },
    },
  });

  return {
    session: { id: session.id, mode: session.mode, questionCount: selected.length },
    questions: publicQuestions,
  };
}

/** Pure scoring summary of a mock from its attempts. */
export function computeMockResults(
  attempts: { isCorrect: boolean | null; score: number; responseTimeMs: number }[],
  questionCount: number,
  maxScore: number
) {
  let answered = 0;
  let correct = 0;
  let incorrect = 0;
  let skipped = 0;
  let score = 0;
  let timeSpentMs = 0;
  for (const a of attempts) {
    timeSpentMs += a.responseTimeMs;
    if (a.isCorrect === null) {
      skipped += 1;
    } else {
      answered += 1;
      score += a.score;
      if (a.isCorrect) correct += 1;
      else incorrect += 1;
    }
  }
  const accuracy = answered > 0 ? (100 * correct) / answered : 0;
  return { answered, correct, incorrect, skipped, score, accuracy, timeSpentMs, questionCount, maxScore };
}

export async function completeMock(userId: string, sessionId: string) {
  const session = await prisma.practiceSession.findFirst({
    where: { id: sessionId, userId },
  });
  if (!session) throw new Error("Session not found");
  if (!session.mode.startsWith("mock_")) throw new Error("Not a mock session");

  const cfg = (session.config ?? {}) as {
    scope?: MockScope;
    label?: string;
    paperId?: string | null;
    sectionId?: string | null;
    topicId?: string | null;
    correctMarks?: number;
  };
  const attempts = await prisma.attempt.findMany({
    where: { sessionId },
    select: { isCorrect: true, score: true, responseTimeMs: true },
  });

  const questionCount = session.questionCount;
  const maxScore = Math.round(questionCount * (cfg.correctMarks ?? 1) * 100) / 100;
  const results = computeMockResults(attempts, questionCount, maxScore);

  await prisma.practiceSession.update({
    where: { id: sessionId },
    data: { status: "COMPLETED", endedAt: new Date() },
  });

  const scope = cfg.scope ?? "full";
  const run = await prisma.mockRun.upsert({
    where: { sessionId },
    update: { ...results, label: cfg.label ?? "Mock" },
    create: {
      userId,
      sessionId,
      scope,
      label: cfg.label ?? "Mock",
      paperId: cfg.paperId ?? null,
      sectionId: cfg.sectionId ?? null,
      topicId: cfg.topicId ?? null,
      ...results,
    },
  });

  return { run, results };
}

export interface MockRunItem {
  id: string;
  scope: string;
  label: string;
  questionCount: number;
  correct: number;
  incorrect: number;
  skipped: number;
  score: number;
  maxScore: number;
  accuracy: number;
  timeSpentMs: number;
  createdAt: Date;
}

export async function listMockRuns(userId: string): Promise<{
  runs: MockRunItem[];
  comparison: { mockAverage: number | null; practiceAverage: number | null };
}> {
  const runs = await prisma.mockRun.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
    take: 50,
  });

  const agg = await prisma.mockRun.aggregate({
    where: { userId },
    _avg: { accuracy: true },
  });

  const practiceSessions = await prisma.practiceSession.findMany({
    where: { userId, status: "COMPLETED", mode: { not: { startsWith: "mock_" } } },
    select: { id: true, questionCount: true },
    take: 100,
  });

  const practiceIds = practiceSessions.map((s) => s.id);
  const practiceAttempts =
    practiceIds.length > 0
      ? await prisma.attempt.findMany({
          where: { sessionId: { in: practiceIds } },
          select: { sessionId: true, isCorrect: true, score: true, responseTimeMs: true },
        })
      : [];
  const attemptsBySession = new Map<string, typeof practiceAttempts>();
  for (const a of practiceAttempts) {
    const list = attemptsBySession.get(a.sessionId) ?? [];
    list.push(a);
    attemptsBySession.set(a.sessionId, list);
  }

  let practiceAccuracySum = 0;
  let practiceN = 0;
  for (const s of practiceSessions) {
    if (s.questionCount === 0) continue;
    const attempts = attemptsBySession.get(s.id) ?? [];
    if (attempts.length === 0) continue;
    const res = computeMockResults(attempts, s.questionCount, s.questionCount);
    practiceAccuracySum += res.accuracy;
    practiceN += 1;
  }

  return {
    runs: runs.map((r) => ({
      id: r.id,
      scope: r.scope,
      label: r.label,
      questionCount: r.questionCount,
      correct: r.correct,
      incorrect: r.incorrect,
      skipped: r.skipped,
      score: r.score,
      maxScore: r.maxScore,
      accuracy: r.accuracy,
      timeSpentMs: r.timeSpentMs,
      createdAt: r.createdAt,
    })),
    comparison: {
      mockAverage: agg._avg.accuracy ?? null,
      practiceAverage: practiceN > 0 ? practiceAccuracySum / practiceN : null,
    },
  };
}
