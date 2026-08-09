import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getCurrentUser, isNextResponse, jsonError } from "@/lib/api";
import { computeStreak, dayKey } from "@/lib/streak";
import { summarizeAttempts } from "@/lib/analytics";

// Homepage "Today's Status": today's numbers, streak and the single most
// important weak topic. Lightweight — computed directly from attempts.
export async function GET() {
  const user = await getCurrentUser();
  if (isNextResponse(user)) return user;
  if (!user) return jsonError("Authentication required", 401);

  const todayKey = dayKey(new Date());

  const attempts = await prisma.attempt.findMany({
    where: { userId: user.id },
    orderBy: { createdAt: "asc" },
    include: { question: { include: { topic: true } } },
  });

  const todayAttempts = attempts.filter((a) => dayKey(a.createdAt) === todayKey);

  const config = { correctMarks: 1, incorrectPenalty: -0.25, unattemptedMarks: 0 };
  const today = summarizeAttempts(todayAttempts, config);
  const streak = computeStreak(attempts.map((a) => a.createdAt));

  // Most important weak topic: lowest accuracy among topics with >= 3 attempts.
  const byTopic = new Map<string, { correct: number; total: number; name: string }>();
  for (const a of attempts) {
    if (a.isCorrect === null) continue;
    const name = a.question.topic.name;
    const entry = byTopic.get(name) ?? { correct: 0, total: 0, name };
    entry.total += 1;
    if (a.isCorrect) entry.correct += 1;
    byTopic.set(name, entry);
  }
  let weakest: { name: string; accuracy: number; attempts: number } | null = null;
  for (const entry of byTopic.values()) {
    if (entry.total < 3) continue;
    const accuracy = (entry.correct / entry.total) * 100;
    if (!weakest || accuracy < weakest.accuracy) {
      weakest = { name: entry.name, accuracy, attempts: entry.total };
    }
  }

  // Daily target: 25 questions/day until a Goal row is configured (Phase 7+).
  const dailyTarget = 25;

  return NextResponse.json({
    ok: true,
    status: {
      attemptedToday: today.total,
      accuracyToday: today.accuracy,
      netScoreToday: today.netScore,
      studyTopicsCompleted: 0,
      currentStreak: streak.current,
      hasActivityToday: streak.hasActivityToday,
      dailyTarget,
      weakestTopic: weakest,
      questionsAttemptedAllTime: attempts.length,
    },
  });
}
