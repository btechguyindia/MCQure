import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { practiceCompleteSchema } from "@/lib/validation";
import { getCurrentUser, isNextResponse, jsonError } from "@/lib/api";
import { summarizeAttempts } from "@/lib/analytics";

// Marks a session as completed and returns a summary. Scores are deterministic
// and derived from the session's recorded attempts.
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

  const parsed = practiceCompleteSchema.safeParse(body);
  if (!parsed.success) {
    return jsonError("Validation failed", 400, parsed.error.flatten().fieldErrors);
  }

  const { sessionId } = parsed.data;

  const session = await prisma.practiceSession.findFirst({
    where: { id: sessionId, userId: user.id },
  });
  if (!session) return jsonError("Session not found", 404);

  if (session.status === "IN_PROGRESS") {
    await prisma.practiceSession.update({
      where: { id: session.id },
      data: { status: "COMPLETED", endedAt: new Date() },
    });
  }

  const attempts = await prisma.attempt.findMany({
    where: { sessionId: session.id },
  });

  const config = (session.config as {
    correctMarks?: number;
    incorrectPenalty?: number;
    unattemptedMarks?: number;
  }) ?? { correctMarks: 1, incorrectPenalty: -0.25, unattemptedMarks: 0 };

  const summary = summarizeAttempts(attempts, {
    correctMarks: config.correctMarks ?? 1,
    incorrectPenalty: config.incorrectPenalty ?? -0.25,
    unattemptedMarks: config.unattemptedMarks ?? 0,
  });

  return NextResponse.json({ ok: true, summary });
}
