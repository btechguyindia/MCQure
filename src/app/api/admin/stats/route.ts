import { prisma } from "@/lib/db";
import { jsonOk, isNextResponse } from "@/lib/api";
import { requireAdmin } from "@/lib/admin";

export async function GET() {
  const admin = await requireAdmin();
  if (isNextResponse(admin)) return admin;

  const now = new Date();
  const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
  const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
  const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);

  const [
    totalUsers,
    usersLast30d,
    usersLast7d,
    totalQuestions,
    activeQuestions,
    totalAttempts,
    attemptsLast24h,
    attemptsLast7d,
    totalSessions,
    totalMockRuns,
    activeSubscriptions,
    totalRevenue,
    questionSources,
    difficultyBreakdown,
    qualityBreakdown,
    tierBreakdown,
    attemptsByDay,
  ] = await Promise.all([
    prisma.user.count(),
    prisma.user.count({ where: { createdAt: { gte: thirtyDaysAgo } } }),
    prisma.user.count({ where: { createdAt: { gte: sevenDaysAgo } } }),
    prisma.question.count(),
    prisma.question.count({ where: { isActive: true } }),
    prisma.attempt.count(),
    prisma.attempt.count({ where: { createdAt: { gte: oneDayAgo } } }),
    prisma.attempt.count({ where: { createdAt: { gte: sevenDaysAgo } } }),
    prisma.practiceSession.count(),
    prisma.mockRun.count(),
    prisma.subscription.count({ where: { status: "ACTIVE" } }),
    prisma.subscription.aggregate({ _sum: { amount: true }, where: { status: "ACTIVE" } }),
    prisma.question.groupBy({ by: ["sourceType"], _count: { id: true } }),
    prisma.question.groupBy({ by: ["difficulty"], _count: { id: true } }),
    prisma.question.groupBy({ by: ["qualityStatus"], _count: { id: true } }),
    prisma.user.groupBy({ by: ["tier"], _count: { id: true } }),
    // Attempts grouped by day for last 14 days
    (async () => {
      const fourteenDaysAgo = new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000);
      const rows = await prisma.attempt.findMany({
        where: { createdAt: { gte: fourteenDaysAgo } },
        select: { createdAt: true, isCorrect: true },
        orderBy: { createdAt: "asc" },
      });
      const byDay = new Map<string, { total: number; correct: number }>();
      for (const r of rows) {
        const key = r.createdAt.toISOString().slice(0, 10);
        const entry = byDay.get(key) ?? { total: 0, correct: 0 };
        entry.total += 1;
        if (r.isCorrect) entry.correct += 1;
        byDay.set(key, entry);
      }
      const points: Array<{ day: string; attempts: number; accuracy: number | null }> = [];
      for (let i = 13; i >= 0; i--) {
        const d = new Date(now.getTime() - i * 24 * 60 * 60 * 1000);
        const key = d.toISOString().slice(0, 10);
        const e = byDay.get(key);
        points.push({
          day: key,
          attempts: e?.total ?? 0,
          accuracy: e && e.total > 0 ? Math.round((e.correct / e.total) * 1000) / 10 : null,
        });
      }
      return points;
    })(),
  ]);

  return jsonOk({
    stats: {
      users: {
        total: totalUsers,
        last30d: usersLast30d,
        last7d: usersLast7d,
      },
      questions: {
        total: totalQuestions,
        active: activeQuestions,
        bySource: questionSources.map((s) => ({ source: s.sourceType, count: s._count.id })),
        byDifficulty: difficultyBreakdown.map((d) => ({ difficulty: d.difficulty, count: d._count.id })),
        byQuality: qualityBreakdown.map((q) => ({ status: q.qualityStatus, count: q._count.id })),
      },
      attempts: {
        total: totalAttempts,
        last24h: attemptsLast24h,
        last7d: attemptsLast7d,
        byDay: attemptsByDay,
      },
      sessions: { total: totalSessions },
      mockRuns: { total: totalMockRuns },
      subscriptions: {
        active: activeSubscriptions,
        totalRevenue: totalRevenue._sum.amount ?? 0,
      },
      tiers: tierBreakdown.map((t) => ({ tier: t.tier, count: t._count.id })),
    },
  });
}
