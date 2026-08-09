import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getCurrentUser, isNextResponse, jsonError } from "@/lib/api";

// Resumes a practice session: returns the question snapshot stored at start
// time plus any attempts already recorded, so a reload doesn't lose progress.
export async function GET(request: Request) {
  const user = await getCurrentUser();
  if (isNextResponse(user)) return user;
  if (!user) return jsonError("Authentication required", 401);

  const { searchParams } = new URL(request.url);
  const sessionId = searchParams.get("sessionId");
  if (!sessionId) return jsonError("Missing sessionId", 400);

  const session = await prisma.practiceSession.findFirst({
    where: { id: sessionId, userId: user.id },
  });
  if (!session) return jsonError("Session not found", 404);

  const config = (session.config ?? {}) as {
    questions?: Array<{
      id: string;
      subject: string;
      topic: string;
      subtopic: string | null;
      difficulty: string;
      sourceType: string;
      examRelevance: number;
      text: string;
      options: unknown;
    }>;
  };

  const attempts = await prisma.attempt.findMany({
    where: { sessionId: session.id },
    select: { questionId: true, isCorrect: true, score: true },
  });

  const attemptMap = new Map(attempts.map((a) => [a.questionId, a]));

  const payload: Record<string, unknown> = {
    ok: true,
    session: {
      id: session.id,
      mode: session.mode,
      status: session.status,
      questionCount: session.questionCount,
      startedAt: session.startedAt,
    },
    questions: config.questions ?? [],
    attempts: Object.fromEntries(attemptMap),
  };

  if (session.status === "COMPLETED") {
    const raw = await prisma.attempt.findMany({
      where: { sessionId: session.id },
    });
    const scoring = (session.config as {
      correctMarks?: number;
      incorrectPenalty?: number;
      unattemptedMarks?: number;
    }) ?? { correctMarks: 1, incorrectPenalty: -0.25, unattemptedMarks: 0 };
    const { summarizeAttempts } = await import("@/lib/analytics");
    payload.summary = summarizeAttempts(raw, {
      correctMarks: scoring.correctMarks ?? 1,
      incorrectPenalty: scoring.incorrectPenalty ?? -0.25,
      unattemptedMarks: scoring.unattemptedMarks ?? 0,
    });
  }

  return NextResponse.json(payload);
}
