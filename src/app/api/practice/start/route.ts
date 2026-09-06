import { NextResponse } from "next/server";
import type { PracticeSessionStatus } from "@prisma/client";
import { prisma } from "@/lib/db";
import { practiceStartSchema } from "@/lib/validation";
import { getCurrentUser, isNextResponse, jsonError } from "@/lib/api";
import { dailyQuestionsRemaining } from "@/lib/entitlements";
import {
  getActiveExam,
  getScoringConfig,
  resolveCount,
  selectMistakes,
  selectQuestions,
  toPublicQuestion,
} from "@/lib/practice";
import { selectAdaptiveQuestions } from "@/lib/adaptive";

export async function POST(request: Request) {
  const user = await getCurrentUser();
  if (isNextResponse(user)) return user;
  if (!user) return jsonError("Authentication required", 401);

  // Social contract: Basic accounts get a daily question cap; paid plans are
  // unlimited. The cap is enforced before any questions are selected so we
  // never burn selection work for a request that will be rejected.
  const remainingToday = await dailyQuestionsRemaining(user);
  if (remainingToday === 0) {
    return jsonError(
      "You have used today's free question limit. Practise again tomorrow or upgrade for unlimited questions.",
      403
    );
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return jsonError("Invalid JSON body", 400);
  }

  const parsed = practiceStartSchema.safeParse(body);
  if (!parsed.success) {
    return jsonError("Validation failed", 400, parsed.error.flatten().fieldErrors);
  }

  const { mode, count, subjectId, topicId, subtopicId, conceptId, difficulty, sourceType, verifiedOnly, timeLimitMinutes } =
    parsed.data;

  const exam = await getActiveExam();
  if (!exam) return jsonError("No active exam configured", 500);

  const requestedCount = resolveCount(mode, count);
  const selected =
    mode === "review"
      ? await selectMistakes(user.id, exam.id, requestedCount)
      : mode === "smart"
        ? await selectAdaptiveQuestions(user.id, exam.id, {
            count: requestedCount,
            topicId,
          })
        : await selectQuestions(exam.id, {
            count: requestedCount,
            subjectId,
            topicId,
            subtopicId,
            conceptId,
            difficulty,
            sourceType,
            verifiedOnly,
          });

  if (selected.length === 0) {
    const available = await prisma.question.count({
      where: {
        examId: exam.id,
        isActive: true,
        qualityStatus: { not: "REJECTED" },
        ...(subjectId ? { subjectId } : {}),
        ...(topicId ? { topicId } : {}),
        ...(subtopicId ? { subtopicId } : {}),
        ...(conceptId ? { conceptId } : {}),
        ...(difficulty ? { difficulty } : {}),
        ...(sourceType ? { sourceType } : {}),
        ...(verifiedOnly ? { source: { is: { verified: true } } } : {}),
      },
    });
    const hint = available === 0
      ? "No questions are available for these filters yet."
      : `Only ${available} question${available === 1 ? "" : "s"} available for these filters — the requested count (${requestedCount}) is larger.`;
    return jsonError(`${hint} New questions are being added continuously, so check back soon.`, 404);
  }

  const config = await getScoringConfig(exam.id);

  const publicQuestions = selected.map(toPublicQuestion);

  const session = await prisma.practiceSession.create({
    data: {
      userId: user.id,
      mode,
      status: "IN_PROGRESS" as PracticeSessionStatus,
      questionCount: selected.length,
      config: {
        count: selected.length,
        subjectId: subjectId ?? null,
        topicId: topicId ?? null,
        subtopicId: subtopicId ?? null,
        conceptId: conceptId ?? null,
        difficulty: difficulty ?? null,
        sourceType: sourceType ?? null,
        verifiedOnly: verifiedOnly ?? null,
        timeLimitMinutes: timeLimitMinutes ?? null,
        correctMarks: config.correctMarks,
        incorrectPenalty: config.incorrectPenalty,
        unattemptedMarks: config.unattemptedMarks,
        questions: publicQuestions,
      },
    },
  });

  return NextResponse.json({
    ok: true,
    session: { id: session.id, mode, questionCount: selected.length },
    questions: publicQuestions,
  });
}
