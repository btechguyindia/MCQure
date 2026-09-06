import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { practiceAnswerSchema } from "@/lib/validation";
import { getCurrentUser, isNextResponse, jsonError } from "@/lib/api";
import { attemptScore, roundMarks } from "@/lib/scoring";
import { getScoringConfig } from "@/lib/practice";
import { nextAttemptCounters } from "@/lib/question-stats";
import { evaluateAchievements } from "@/lib/motivation";

// Records one answer. Attempts are immutable: (user, question, session) is
// unique, so re-answering the same question in the same session is rejected
// instead of overwriting the previous attempt.
export async function POST(request: Request) {
  const user = await getCurrentUser();
  if (isNextResponse(user)) return user;
  if (!user) return jsonError("Authentication required", 401);

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return jsonError("Invalid JSON body", 400);
  }

  const parsed = practiceAnswerSchema.safeParse(body);
  if (!parsed.success) {
    return jsonError("Validation failed", 400, parsed.error.flatten().fieldErrors);
  }

  const { sessionId, questionId, selectedIndex, confidence, responseTimeMs, errorType } =
    parsed.data;

  const session = await prisma.practiceSession.findFirst({
    where: { id: sessionId, userId: user.id },
  });
  if (!session) return jsonError("Session not found", 404);
  if (session.status !== "IN_PROGRESS") {
    return jsonError("This session is already completed", 409);
  }

  const question = await prisma.question.findUnique({
    where: { id: questionId },
    include: {
      source: true,
      topic: { include: { subject: true } },
      subtopic: true,
    },
  });
  if (!question) return jsonError("Question not found", 404);

  const sessionQuestions = (session.config as { questions?: Array<{ id: string }> } | null)?.questions;
  if (sessionQuestions && sessionQuestions.length > 0 && !sessionQuestions.some((q) => q.id === questionId)) {
    return jsonError("Question does not belong to this session", 400);
  }

  const existing = await prisma.attempt.findUnique({
    where: { userId_questionId_sessionId: { userId: user.id, questionId, sessionId } },
  });
  if (existing) {
    return jsonError("This question was already answered in this session", 409);
  }

  const config = await getScoringConfig(question.examId);
  const score = roundMarks(
    attemptScore(selectedIndex ?? null, question.correctIndex, config)
  );
  const isCorrect =
    selectedIndex == null ? null : selectedIndex === question.correctIndex;

  const counters = nextAttemptCounters(
    {
      timesAttempted: question.timesAttempted,
      timesCorrect: question.timesCorrect,
      timesIncorrect: question.timesIncorrect,
      timesSkipped: question.timesSkipped,
      answeredCount: question.answeredCount,
      avgResponseTimeMs: question.avgResponseTimeMs,
    },
    isCorrect,
    responseTimeMs ?? 0
  );

  const [attempt] = await prisma.$transaction([
    prisma.attempt.create({
      data: {
        userId: user.id,
        questionId,
        sessionId,
        selectedIndex: selectedIndex ?? null,
        isCorrect,
        score,
        responseTimeMs: responseTimeMs ?? 0,
        confidence: confidence ?? null,
        errorType: isCorrect === false ? (errorType ?? null) : null,
      },
    }),
    prisma.question.update({
      where: { id: questionId },
      data: {
        timesAttempted: counters.timesAttempted,
        timesCorrect: counters.timesCorrect,
        timesIncorrect: counters.timesIncorrect,
        timesSkipped: counters.timesSkipped,
        answeredCount: counters.answeredCount,
        avgResponseTimeMs: counters.avgResponseTimeMs,
        lastAttemptedAt: counters.lastAttemptedAt,
      },
    }),
  ]);

  const achievements = await evaluateAchievements(user.id);

  return NextResponse.json({
    ok: true,
    achievements,
    attempt: {
      id: attempt.id,
      isCorrect,
      score,
      correctIndex: question.correctIndex,
      explanation: question.explanation,
      source: question.source
        ? {
            name: question.source.name,
            type: question.source.type,
            examName: question.source.examName,
            year: question.source.year,
            verified: question.source.verified,
          }
        : null,
      subject: question.topic.subject.name,
      topic: question.topic.name,
      subtopic: question.subtopic?.name ?? null,
      difficulty: question.difficulty,
      examRelevance: question.examRelevance,
      responseTimeMs: attempt.responseTimeMs,
    },
  });
}
