// Phase 8 Motivation: goals, streak, achievements. Achievement evaluation is
// idempotent — calling it repeatedly only inserts rows that were not yet earned.

import { prisma } from "@/lib/db";
import { computeStreak } from "@/lib/streak";

export interface GoalProgress {
  today: number;
  dailyTarget: number;
  week: number;
  weeklyTarget: number;
}

/** Questions answered since `from` (UTC). */
export async function countAnsweredSince(userId: string, from: Date): Promise<number> {
  return prisma.attempt.count({
    where: { userId, createdAt: { gte: from }, isCorrect: { not: null } },
  });
}

export async function getGoalProgress(
  userId: string,
  targets: { dailyTarget: number; weeklyTarget: number },
  now = new Date()
): Promise<GoalProgress> {
  const dayStart = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
  const weekStart = new Date(dayStart.getTime() - (now.getUTCDay() || 7) * 24 * 60 * 60 * 1000);
  const [today, week] = await Promise.all([
    countAnsweredSince(userId, dayStart),
    countAnsweredSince(userId, weekStart),
  ]);
  return { today, dailyTarget: targets.dailyTarget, week, weeklyTarget: targets.weeklyTarget };
}

/** Set of achievement codes the user already owns. */
async function unlockedCodes(userId: string): Promise<Set<string>> {
  const rows = await prisma.userAchievement.findMany({
    where: { userId },
    select: { achievement: { select: { code: true } } },
  });
  return new Set(rows.map((r) => r.achievement.code));
}

export interface AchievementCondition {
  totalAnswers: number;
  totalCorrect: number;
  accuracy: number | null; // over answered questions
  currentStreak: number;
  studiedTopics: number;
  mockCount: number;
  bestMockAccuracy: number | null;
  weakTopicsFixed: number;
}

/**
 * Evaluates which catalog achievements the user now qualifies for and grants
 * (idempotently) any that are missing. Returns the newly unlocked ones.
 */
export async function evaluateAchievements(userId: string): Promise<
  { code: string; name: string; icon: string | null }[]
> {
  const [attempts, streakDates, studyVisits, mocks] = await Promise.all([
    prisma.attempt.findMany({
      where: { userId },
      select: { isCorrect: true, createdAt: true, question: { select: { topicId: true } } },
    }),
    prisma.attempt.findMany({ where: { userId }, select: { createdAt: true } }),
    prisma.studyVisit.findMany({ where: { userId }, select: { topicId: true } }),
    prisma.mockRun.findMany({ where: { userId }, select: { accuracy: true } }),
  ]);

  const answered = attempts.filter((a) => a.isCorrect !== null);
  const totalAnswers = answered.length;
  const totalCorrect = answered.filter((a) => a.isCorrect === true).length;
  const accuracy = totalAnswers > 0 ? (100 * totalCorrect) / totalAnswers : null;

  // Weak topics previously below 60% accuracy now above 70%.
  const perTopic = new Map<string, { answered: number; correct: number }>();
  for (const a of attempts) {
    if (a.isCorrect === null) continue;
    const g = perTopic.get(a.question.topicId) ?? { answered: 0, correct: 0 };
    g.answered += 1;
    if (a.isCorrect) g.correct += 1;
    perTopic.set(a.question.topicId, g);
  }
  const weakTopicsFixed = [...perTopic.values()].filter(
    (g) => g.answered >= 3 && (100 * g.correct) / g.answered >= 70
  ).length;

  const condition: AchievementCondition = {
    totalAnswers,
    totalCorrect,
    accuracy,
    currentStreak: computeStreak(streakDates.map((s) => s.createdAt)).current,
    studiedTopics: new Set(studyVisits.map((v) => v.topicId)).size,
    mockCount: mocks.length,
    bestMockAccuracy: mocks.length > 0 ? Math.max(...mocks.map((m) => m.accuracy)) : null,
    weakTopicsFixed,
  };

  const catalog = await prisma.achievement.findMany();
  const already = await unlockedCodes(userId);
  const newly: { code: string; name: string; icon: string | null }[] = [];

  for (const ach of catalog) {
    if (already.has(ach.code)) continue;
    if (!satisfies(ach.code, condition)) continue;
    await prisma.userAchievement.create({
      data: { userId, achievementId: ach.id },
    });
    newly.push({ code: ach.code, name: ach.name, icon: ach.icon });
  }

  return newly;
}

/** Pure rule table — easily unit tested. */
export function satisfies(code: string, c: AchievementCondition): boolean {
  switch (code) {
    case "first_question":
      return c.totalAnswers >= 1;
    case "first_correct":
      return c.totalCorrect >= 1;
    case "questions_25":
      return c.totalAnswers >= 25;
    case "questions_100":
      return c.totalAnswers >= 100;
    case "questions_500":
      return c.totalAnswers >= 500;
    case "questions_1000":
      return c.totalAnswers >= 1000;
    case "streak_3":
      return c.currentStreak >= 3;
    case "streak_7":
      return c.currentStreak >= 7;
    case "streak_30":
      return c.currentStreak >= 30;
    case "accuracy_70":
      return c.accuracy !== null && c.accuracy >= 70 && c.totalAnswers >= 20;
    case "study_10":
      return c.studiedTopics >= 10;
    case "mock_first":
      return c.mockCount >= 1;
    case "mock_80":
      return c.bestMockAccuracy !== null && c.bestMockAccuracy >= 80;
    case "weak_fixed":
      return c.weakTopicsFixed >= 1;
    default:
      return false;
  }
}

export interface MotivationSnapshot {
  streak: ReturnType<typeof computeStreak>;
  goals: GoalProgress;
  achievements: {
    unlocked: { code: string; name: string; description: string | null; icon: string | null; unlockedAt: Date }[];
    locked: { code: string; name: string; description: string | null; icon: string | null }[];
  };
}

/** Aggregated motivation state for the dashboard (evaluates achievements too). */
export async function getMotivationSnapshot(userId: string): Promise<MotivationSnapshot> {
  const [profile, attempts, unlocks] = await Promise.all([
    prisma.userPreparation.findUnique({ where: { userId } }),
    prisma.attempt.findMany({ where: { userId }, select: { createdAt: true } }),
    prisma.userAchievement.findMany({
      where: { userId },
      include: { achievement: true },
    }),
  ]);

  await evaluateAchievements(userId);

  const unlockedMap = new Map(unlocks.map((u) => [u.achievement.code, u.unlockedAt]));
  const catalog = await prisma.achievement.findMany({ orderBy: { code: "asc" } });

  const targets = {
    dailyTarget: profile?.dailyTarget ?? 25,
    weeklyTarget: profile?.weeklyTarget ?? 175,
  };

  return {
    streak: computeStreak(attempts.map((a) => a.createdAt)),
    goals: await getGoalProgress(userId, targets),
    achievements: {
      unlocked: catalog
        .filter((a) => unlockedMap.has(a.code))
        .map((a) => ({
          code: a.code,
          name: a.name,
          description: a.description,
          icon: a.icon,
          unlockedAt: unlockedMap.get(a.code)!,
        })),
      locked: catalog
        .filter((a) => !unlockedMap.has(a.code))
        .map((a) => ({ code: a.code, name: a.name, description: a.description, icon: a.icon })),
    },
  };
}
