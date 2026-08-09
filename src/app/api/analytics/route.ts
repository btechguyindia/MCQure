import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getCurrentUser, isNextResponse, jsonError } from "@/lib/api";
import { getActiveExam, getScoringConfig } from "@/lib/practice";
import { computeStreak } from "@/lib/streak";
import {
  errorTypeCounts,
  summarizeAttempts,
  summarizeByGroup,
  trendByDay,
} from "@/lib/analytics";

// Phase 2 analytics dashboard: overall summary, daily trend, per-subject and
// per-topic breakdown, error-type distribution, confidence analysis and the
// recent mistake book (wrong/skipped questions available for review).
export async function GET() {
  const user = await getCurrentUser();
  if (isNextResponse(user)) return user;
  if (!user) return jsonError("Authentication required", 401);

  const exam = await getActiveExam();
  const config = exam
    ? await getScoringConfig(exam.id)
    : { correctMarks: 1, incorrectPenalty: -0.25, unattemptedMarks: 0 };

  const attempts = await prisma.attempt.findMany({
    where: { userId: user.id },
    orderBy: { createdAt: "asc" },
    include: {
      question: {
        include: { topic: { include: { subject: true } } },
      },
    },
  });

  const summary = summarizeAttempts(attempts, {
    correctMarks: config.correctMarks,
    incorrectPenalty: config.incorrectPenalty,
    unattemptedMarks: config.unattemptedMarks,
  });
  const streak = computeStreak(attempts.map((a) => a.createdAt));

  const bySubject = summarizeByGroup(
    attempts.map((a) => ({
      isCorrect: a.isCorrect,
      score: a.score,
      responseTimeMs: a.responseTimeMs,
      confidence: a.confidence,
      group: a.question.topic.subject.name,
    }))
  );

  const byTopic = summarizeByGroup(
    attempts.map((a) => ({
      isCorrect: a.isCorrect,
      score: a.score,
      responseTimeMs: a.responseTimeMs,
      confidence: a.confidence,
      group: a.question.topic.name,
    }))
  ).sort((a, b) => {
    const accA = a.accuracy ?? 101;
    const accB = b.accuracy ?? 101;
    return accA - accB;
  });

  const errorTypes = errorTypeCounts(attempts);

  const highAccuracy =
    summary.highConfidenceCorrect + summary.highConfidenceWrong > 0
      ? (summary.highConfidenceCorrect /
          (summary.highConfidenceCorrect + summary.highConfidenceWrong)) *
        100
      : null;
  const lowAccuracy =
    summary.lowConfidenceCorrect + summary.lowConfidenceWrong > 0
      ? (summary.lowConfidenceCorrect /
          (summary.lowConfidenceCorrect + summary.lowConfidenceWrong)) *
        100
      : null;

  const mistakes = attempts
    .filter((a) => a.isCorrect === false || a.isCorrect === null)
    .slice(-50)
    .reverse()
    .map((a) => ({
      id: a.id,
      questionId: a.questionId,
      text: a.question.text,
      subject: a.question.topic.subject.name,
      topic: a.question.topic.name,
      difficulty: a.question.difficulty,
      isCorrect: a.isCorrect,
      createdAt: a.createdAt,
    }));

  return NextResponse.json({
    ok: true,
    analytics: {
      summary,
      streak: {
        current: streak.current,
        best: streak.best,
        hasActivityToday: streak.hasActivityToday,
      },
      trend: trendByDay(attempts, 14),
      bySubject,
      byTopic,
      errorTypes,
      confidence: {
        highCorrect: summary.highConfidenceCorrect,
        highWrong: summary.highConfidenceWrong,
        lowCorrect: summary.lowConfidenceCorrect,
        lowWrong: summary.lowConfidenceWrong,
        highAccuracy,
        lowAccuracy,
      },
      mistakes,
    },
  });
}
