// Tracking data-fetch layer: assembles the full preparation report from the
// permanent attempt/visit/blueprint records. Pure computation happens in
// mastery.ts / progress.ts; this module only shapes DB rows into those inputs.

import type { QuestionSourceType, WeightClass } from "@prisma/client";
import { prisma } from "./db";
import { computeStreak, dayKey } from "./streak";
import { trendByDay } from "./analytics";
import {
  aggregateGroup,
  alignmentScore,
  buildDailyPlan,
  completionState,
  estimateMastery,
  overallMastery,
  revisionStatus,
  syllabusCoverage,
  trendOf,
  weaknessScore,
  weightToExamWeight,
  type TrackedAttemptLike,
  type GroupStats,
  type DailyPlan,
  type Trend,
  type WeaknessResult,
} from "./progress";
import {
  MASTERY_DEFAULTS,
  COMPLETION_META,
  type CompletionState,
} from "./mastery";

export const MOCK_MODES = [
  "sectional_mock",
  "full_mock",
  "topic_mock",
  "subtopic_mock",
] as const;

export type MockMode = (typeof MOCK_MODES)[number];

export function isMockMode(mode: string): boolean {
  return (MOCK_MODES as readonly string[]).includes(mode);
}

export interface PersonalBests {
  highestMockScore: number | null;
  bestDailyAccuracy: number | null;
  longestStreak: number;
  mostQuestionsInADay: number;
  bestDay: string | null;
}

export interface OverallReport {
  totalAttempts: number;
  answered: number;
  correct: number;
  accuracy: number | null;
  netScore: number;
  mastery: number | null;
  masteryReliable: boolean;
  pyqAccuracy: number | null;
  practiceAccuracy: number | null;
  mockAccuracy: number | null;
  completedMocks: number;
  averageTimeMs: number;
  medianTimeMs: number;
  highConfidenceWrong: number;
  questionsPerDay7d: number;
  personalBests: PersonalBests;
}

export interface SubtopicReport {
  id: string;
  name: string;
  attempts: number;
  accuracy: number | null;
  mastery: number | null;
}

export interface TopicReport {
  id: string;
  name: string;
  subjectName: string;
  order: number;
  stats: GroupStats;
  mastery: number | null;
  masteryReliable: boolean;
  completion: CompletionState;
  completionLabel: string;
  completionColor: string;
  weight: WeightClass | null;
  weightBasis: string | null;
  weightBasisNote: string | null;
  alignment: number;
  revision: { due: boolean; intervalDays: number; daysSince: number | null; reason: string };
  lastPracticedDays: number | null;
  lastVisitedDays: number | null;
  recentAccuracy: number | null;
  subtopics: SubtopicReport[];
  concepts: SubtopicReport[];
  weakness: WeaknessResult;
  trend: Trend;
}

export interface SubjectReport {
  id: string;
  name: string;
  order: number;
  stats: GroupStats;
  mastery: number | null;
  masteryReliable: boolean;
  completion: CompletionState;
  completionLabel: string;
  completionColor: string;
  alignment: number;
  expectedShare: number | null;
  strongestTopic: { name: string; accuracy: number | null } | null;
  weakestTopic: { name: string; accuracy: number | null } | null;
  trend: Trend;
  lastPracticedDays: number | null;
  lastVisitedDays: number | null;
}

export interface RevisionDueItem {
  topicId: string;
  topicName: string;
  subjectName: string;
  mastery: number | null;
  reason: string;
  intervalDays: number;
  daysSince: number | null;
}

export interface PrepReport {
  exam: { id: string; name: string } | null;
  preparation: {
    targetScore: number | null;
    dailyTarget: number;
    weeklyTarget: number;
    targetExamDate: string | null;
    examAttemptYear: number | null;
    stage: string;
    prepStartDate: string;
  } | null;
  overall: OverallReport;
  coverage: ReturnType<typeof syllabusCoverage>;
  subjects: SubjectReport[];
  topics: TopicReport[];
  strengths: Array<{ id: string; name: string; subjectName: string; mastery: number | null; accuracy: number | null }>;
  weaknesses: Array<{ id: string; name: string; subjectName: string; weakness: WeaknessResult }>;
  revisionDue: RevisionDueItem[];
  dailyPlan: DailyPlan;
  trend: ReturnType<typeof trendByDay>;
  alignment: number;
}

function toTrackedAttempt(row: {
  isCorrect: boolean | null;
  score: number;
  responseTimeMs: number;
  confidence: number | null;
  errorType: string | null;
  createdAt: Date;
  session: { mode: string };
  question: {
    sourceType: QuestionSourceType;
    topic: { id: string; name: string; subject: { id: string; name: string } };
    subtopic: { id: string; name: string } | null;
    concept: { id: string; name: string } | null;
  };
}): TrackedAttemptLike {
  return {
    isCorrect: row.isCorrect,
    score: row.score,
    responseTimeMs: row.responseTimeMs,
    confidence: row.confidence,
    errorType: row.errorType,
    sourceType: row.question.sourceType,
    isMock: isMockMode(row.session.mode),
    createdAt: row.createdAt,
    group: {
      subjectId: row.question.topic.subject.id,
      subjectName: row.question.topic.subject.name,
      topicId: row.question.topic.id,
      topicName: row.question.topic.name,
      subtopicId: row.question.subtopic?.id ?? null,
      subtopicName: row.question.subtopic?.name ?? null,
      conceptId: row.question.concept?.id ?? null,
      conceptName: row.question.concept?.name ?? null,
    },
  };
}

function daysAgo(date: Date | null, now = new Date()): number | null {
  if (!date) return null;
  return Math.max(0, Math.floor((now.getTime() - date.getTime()) / (24 * 60 * 60 * 1000)));
}

export async function getPrepReport(userId: string): Promise<PrepReport> {
  const exam = await prisma.exam.findFirst({ where: { active: true } });

  const [attemptRows, visitRows, weightRows, shareRows, prep, mockSessions] =
    await Promise.all([
      prisma.attempt.findMany({
        where: { userId },
        orderBy: { createdAt: "asc" },
        include: {
          session: { select: { mode: true } },
          question: {
            include: {
              topic: { include: { subject: true } },
              subtopic: true,
              concept: true,
            },
          },
        },
      }),
      prisma.studyVisit.findMany({ where: { userId } }),
      exam
        ? prisma.blueprintTopicWeight.findMany({ where: { examId: exam.id } })
        : [],
      exam
        ? prisma.sectionSubject.findMany({
            where: { section: { paper: { examId: exam.id } } },
            include: { subject: { select: { id: true, name: true } } },
          })
        : [],
      prisma.userPreparation.findUnique({
        where: { userId },
        include: { exam: true },
      }),
      prisma.practiceSession.findMany({
        where: { userId, mode: { in: [...MOCK_MODES] }, status: "COMPLETED" },
        select: { id: true, mode: true },
      }),
    ]);

  const attempts = attemptRows.map(toTrackedAttempt);

  const weightByTopic = new Map(
    (weightRows ?? []).map((w) => [w.topicId, w])
  );
  const shareBySubject = new Map(
    (shareRows ?? []).map((s) => [s.subject.id, s.questionShare])
  );
  const lastVisitByTopic = new Map<string, Date>();
  for (const v of visitRows) {
    const prev = lastVisitByTopic.get(v.topicId);
    if (!prev || v.createdAt > prev) lastVisitByTopic.set(v.topicId, v.createdAt);
  }

  // ── Aggregates ──────────────────────────────────────────────────────────
  const subjectStats = aggregateGroup(attempts, (a) => ({
    id: a.group.subjectId,
    name: a.group.subjectName,
  }));
  const topicStats = aggregateGroup(attempts, (a) => ({
    id: a.group.topicId,
    name: a.group.topicName,
  }));

  const subtopicStats = aggregateGroup(
    attempts.filter((a) => a.group.subtopicId),
    (a) => ({ id: a.group.subtopicId!, name: a.group.subtopicName! })
  );
  const conceptStats = aggregateGroup(
    attempts.filter((a) => a.group.conceptId),
    (a) => ({ id: a.group.conceptId!, name: a.group.conceptName! })
  );

  const now = new Date();

  // ── Overall ─────────────────────────────────────────────────────────────
  const answered = attempts.filter((a) => a.isCorrect !== null).length;
  const correct = attempts.filter((a) => a.isCorrect === true).length;
  const mastery = overallMastery(answered, correct);
  const pyqRows = attempts.filter((a) => a.sourceType === "PYQ" || a.sourceType === "PYQ_VARIANT");
  const pyqAnswered = pyqRows.filter((a) => a.isCorrect !== null);
  const practiceRows = attempts.filter((a) => !a.isMock);
  const practiceAnswered = practiceRows.filter((a) => a.isCorrect !== null);
  const mockRows = attempts.filter((a) => a.isMock);
  const mockAnswered = mockRows.filter((a) => a.isCorrect !== null);

  const acc = (rows: TrackedAttemptLike[]) =>
    rows.length > 0 ? (rows.filter((r) => r.isCorrect === true).length / rows.length) * 100 : null;
  const mockScoreBySession = new Map<string, number>();
  for (const a of attemptRows.filter((r) => isMockMode(r.session.mode))) {
    mockScoreBySession.set(a.sessionId, (mockScoreBySession.get(a.sessionId) ?? 0) + a.score);
  }
  let highestMockScore: number | null = null;
  for (const s of mockSessions) {
    const score = mockScoreBySession.get(s.id) ?? 0;
    if (highestMockScore === null || score > highestMockScore) highestMockScore = score;
  }

  const perDay = new Map<string, { answered: number; correct: number }>();
  for (const a of attempts) {
    const key = dayKey(a.createdAt);
    const entry = perDay.get(key) ?? { answered: 0, correct: 0 };
    if (a.isCorrect !== null) {
      entry.answered += 1;
      if (a.isCorrect) entry.correct += 1;
    }
    perDay.set(key, entry);
  }
  let bestDailyAccuracy: number | null = null;
  let bestDay: string | null = null;
  let mostInADay = 0;
  for (const [key, entry] of perDay) {
    if (entry.answered > mostInADay) mostInADay = entry.answered;
    const accuracy = (entry.correct / entry.answered) * 100;
    if (entry.answered >= 5 && (bestDailyAccuracy === null || accuracy > bestDailyAccuracy)) {
      bestDailyAccuracy = accuracy;
      bestDay = key;
    }
  }

  const last7 = attempts.filter((a) => a.createdAt.getTime() > now.getTime() - 7 * 24 * 60 * 60 * 1000);

  const overall: OverallReport = {
    totalAttempts: attempts.length,
    answered,
    correct,
    accuracy: acc(attempts.filter((a) => a.isCorrect !== null)),
    netScore: attempts.reduce((s, a) => s + a.score, 0),
    mastery: mastery.mastery,
    masteryReliable: mastery.reliable,
    pyqAccuracy: acc(pyqAnswered),
    practiceAccuracy: acc(practiceAnswered),
    mockAccuracy: acc(mockAnswered),
    completedMocks: mockSessions.length,
    averageTimeMs:
      attempts.length > 0 ? Math.round(attempts.reduce((s, a) => s + a.responseTimeMs, 0) / attempts.length) : 0,
    medianTimeMs:
      attempts.length > 0
        ? attempts.map((a) => a.responseTimeMs).sort((a, b) => a - b)[Math.floor(attempts.length / 2)]
        : 0,
    highConfidenceWrong: attempts.filter(
      (a) => a.isCorrect === false && a.confidence != null && a.confidence >= 3
    ).length,
    questionsPerDay7d: Math.round((last7.length / 7) * 10) / 10,
    personalBests: {
      highestMockScore,
      bestDailyAccuracy,
      longestStreak: computeStreak(attempts.map((a) => a.createdAt)).current,
      mostQuestionsInADay: mostInADay,
      bestDay,
    },
  };

  // ── Topics ──────────────────────────────────────────────────────────────
  const topicRows = await prisma.topic.findMany({
    orderBy: [{ subject: { order: "asc" } }, { order: "asc" }],
    include: { subject: { select: { id: true, name: true } }, _count: { select: { studyNotes: true } } },
  });

  const topics: TopicReport[] = topicRows.map((t) => {
    const stats = topicStats.find((s) => s.id === t.id) ?? emptyStats(t.id, t.name);
    const m = estimateMastery(stats.answered, stats.correct);
    const visited = lastVisitByTopic.get(t.id) ?? null;
    const lastPracticed = daysAgo(stats.lastAttemptAt, now);
    const lastVisited = daysAgo(visited, now);
    const weight = weightByTopic.get(t.id);
    const examW = weight ? weightToExamWeight(weight.weight) : 0.5;

    const topicAttempts = attempts.filter((a) => a.group.topicId === t.id);
    const recent7 = topicAttempts.filter(
      (a) => a.createdAt.getTime() > now.getTime() - 7 * 24 * 60 * 60 * 1000
    );
    const recentAnswered = recent7.filter((a) => a.isCorrect !== null);
    const recentAccuracy =
      recentAnswered.length > 0
        ? (recentAnswered.filter((a) => a.isCorrect === true).length / recentAnswered.length) * 100
        : null;

    const revision = revisionStatus({
      lastPracticedDays: lastPracticed,
      lastVisitedDays: lastVisited,
      mastery: m.mastery,
      repeatedMistakes: stats.repeatedMistakes,
      recentAccuracy,
    });

    const completion = completionState({
      hasStudy: visited !== null,
      attempts: stats.attempts,
      mastery: m.mastery,
      reliable: m.reliable,
    });

    const expectedShare = shareBySubject.get(t.subjectId) ?? null;
    const volumeTarget = (expectedShare ?? 5) * 10;
    const alignment = alignmentScore({
      mastery: m.mastery,
      completion,
      volumeRatio: volumeTarget > 0 ? stats.attempts / volumeTarget : 0,
      revisionCurrent: !revision.due,
    });

    const subtopics = subtopicStats
      .filter((s) => topicAttempts.some((a) => a.group.subtopicId === s.id))
      .map((s) => ({
        id: s.id,
        name: s.name,
        attempts: s.attempts,
        accuracy: s.accuracy,
        mastery: estimateMastery(s.answered, s.correct).mastery,
      }));

    const concepts = conceptStats
      .filter((s) => topicAttempts.some((a) => a.group.conceptId === s.id))
      .map((s) => ({
        id: s.id,
        name: s.name,
        attempts: s.attempts,
        accuracy: s.accuracy,
        mastery: estimateMastery(s.answered, s.correct).mastery,
      }));

    return {
      id: t.id,
      name: t.name,
      subjectName: t.subject.name,
      order: t.order,
      stats,
      mastery: m.mastery,
      masteryReliable: m.reliable,
      completion,
      completionLabel: COMPLETION_META[completion].label,
      completionColor: COMPLETION_META[completion].color,
      weight: weight?.weight ?? null,
      weightBasis: weight?.basis ?? null,
      weightBasisNote: weight?.basisNote ?? null,
      alignment,
      revision: { ...revision, daysSince: Number.isFinite(revision.daysSince) ? Math.round(revision.daysSince) : null },
      lastPracticedDays: lastPracticed,
      lastVisitedDays: lastVisited,
      recentAccuracy,
      subtopics,
      concepts,
      weakness: weaknessScore({
        attempts: stats.attempts,
        accuracy: stats.accuracy,
        repeatedMistakes: stats.repeatedMistakes,
        pyqAccuracy: stats.pyqAccuracy,
        mockAccuracy: stats.mockAccuracy,
        averageTimeMs: stats.averageTimeMs,
        examWeight: examW,
        revisionDue: revision.due,
      }),
      trend: trendOf(topicAttempts),
    };
  });

  // ── Subjects ────────────────────────────────────────────────────────────
  const subjectRows = await prisma.subject.findMany({
    orderBy: { order: "asc" },
    include: { topics: { orderBy: { order: "asc" } } },
  });

  const subjects: SubjectReport[] = subjectRows.map((s) => {
    const stats = subjectStats.find((x) => x.id === s.id) ?? emptyStats(s.id, s.name);
    const m = estimateMastery(stats.answered, stats.correct);
    const sTopics = topics.filter((t) => t.subjectName === s.name);
    const visited = sTopics.some((t) => t.lastVisitedDays !== null);
    const completion = completionState({
      hasStudy: visited,
      attempts: stats.attempts,
      mastery: m.mastery,
      reliable: m.reliable,
    });
    const expectedShare = shareBySubject.get(s.id) ?? null;
    const sAttempts = attempts.filter((a) => a.group.subjectId === s.id);
    const strongest = [...sTopics]
      .filter((t) => t.stats.accuracy !== null)
      .sort((a, b) => (b.stats.accuracy ?? 0) - (a.stats.accuracy ?? 0))[0];
    const weakest = [...sTopics]
      .filter((t) => t.stats.accuracy !== null)
      .sort((a, b) => (a.stats.accuracy ?? 0) - (b.stats.accuracy ?? 0))[0];

    return {
      id: s.id,
      name: s.name,
      order: s.order,
      stats,
      mastery: m.mastery,
      masteryReliable: m.reliable,
      completion,
      completionLabel: COMPLETION_META[completion].label,
      completionColor: COMPLETION_META[completion].color,
      alignment: sTopics.length > 0 ? Math.round(sTopics.reduce((sum, t) => sum + t.alignment, 0) / sTopics.length) : 0,
      expectedShare,
      strongestTopic: strongest ? { name: strongest.name, accuracy: strongest.stats.accuracy } : null,
      weakestTopic: weakest ? { name: weakest.name, accuracy: weakest.stats.accuracy } : null,
      trend: trendOf(sAttempts),
      lastPracticedDays: daysAgo(stats.lastAttemptAt, now),
      lastVisitedDays: daysAgo(
        sTopics.reduce<Date | null>((acc, t) => {
          const d = lastVisitByTopic.get(t.id) ?? null;
          return d && (!acc || d > acc) ? d : acc;
        }, null),
        now
      ),
    };
  });

  // ── Coverage, strengths, weaknesses, revision, plan ─────────────────────
  const coverage = syllabusCoverage(
    topics.map((t) => ({
      topicId: t.id,
      name: t.name,
      hasStudy: t.lastVisitedDays !== null,
      attempts: t.stats.attempts,
      accuracy: t.stats.accuracy,
    }))
  );

  const practicedTopics = topics.filter((t) => t.stats.attempts >= MASTERY_DEFAULTS.minSample);
  const strengths = [...practicedTopics]
    .sort((a, b) => (b.mastery ?? 0) - (a.mastery ?? 0))
    .slice(0, 5)
    .map((t) => ({
      id: t.id,
      name: t.name,
      subjectName: t.subjectName,
      mastery: t.mastery,
      accuracy: t.stats.accuracy,
    }));

  const weaknesses = [...topics]
    .filter((t) => !t.weakness.insufficientData)
    .sort((a, b) => b.weakness.score - a.weakness.score)
    .slice(0, 5)
    .map((t) => ({ id: t.id, name: t.name, subjectName: t.subjectName, weakness: t.weakness }));

  const revisionDue: RevisionDueItem[] = topics
    .filter((t) => t.revision.due)
    .sort((a, b) => (a.revision.daysSince ?? Number.MAX_SAFE_INTEGER) - (b.revision.daysSince ?? Number.MAX_SAFE_INTEGER))
    .map((t) => ({
      topicId: t.id,
      topicName: t.name,
      subjectName: t.subjectName,
      mastery: t.mastery,
      reason: t.revision.reason,
      intervalDays: t.revision.intervalDays,
      daysSince: t.revision.daysSince,
    }));

  const dailyPlan = buildDailyPlan(
    topics.map((t) => ({
      id: t.id,
      name: t.name,
      subjectName: t.subjectName,
      weight: t.weight ?? "MEDIUM",
      weakness: t.weakness,
      revisionDue: t.revision.due,
      mastery: t.mastery,
    }))
  );

  const alignment =
    subjects.length > 0
      ? Math.round(
          subjects.reduce((sum, s) => sum + s.alignment, 0) / subjects.length
        )
      : 0;

  return {
    exam: exam ? { id: exam.id, name: exam.name } : null,
    preparation: prep
      ? {
          targetScore: prep.targetScore,
          dailyTarget: prep.dailyTarget,
          weeklyTarget: prep.weeklyTarget,
          targetExamDate: prep.targetExamDate?.toISOString() ?? null,
          examAttemptYear: prep.examAttemptYear,
          stage: prep.stage,
          prepStartDate: prep.prepStartDate.toISOString(),
        }
      : null,
    overall,
    coverage,
    subjects,
    topics,
    strengths,
    weaknesses,
    revisionDue,
    dailyPlan,
    trend: trendByDay(attempts, 14, now),
    alignment,
  };
}

function emptyStats(id: string, name: string): GroupStats {
  return {
    id,
    name,
    attempts: 0,
    correct: 0,
    incorrect: 0,
    unattempted: 0,
    answered: 0,
    accuracy: null,
    netScore: 0,
    averageTimeMs: 0,
    medianTimeMs: 0,
    highConfidenceWrong: 0,
    repeatedMistakes: 0,
    mistakeCount: 0,
    pyqAttempts: 0,
    pyqAccuracy: null,
    practiceAttempts: 0,
    practiceAccuracy: null,
    mockAttempts: 0,
    mockAccuracy: null,
    lastAttemptAt: null,
  };
}
