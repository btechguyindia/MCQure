import { prisma } from "@/lib/db";
import { requireAdmin, jsonOk, isNextResponse } from "@/lib/api";

export async function GET() {
  const admin = await requireAdmin();
  if (isNextResponse(admin)) return admin;

  const users = await prisma.user.findMany({
    select: {
      id: true,
      email: true,
      name: true,
      tier: true,
      isAdmin: true,
      createdAt: true,
      updatedAt: true,
      _count: {
        select: {
          attempts: true,
          practiceSessions: true,
          mockRuns: true,
        },
      },
      attempts: {
        select: { isCorrect: true },
      },
      subscriptions: {
        where: { status: "ACTIVE" },
        select: { plan: true, amount: true, currency: true, provider: true, currentPeriodEnd: true },
        take: 1,
      },
    },
    orderBy: { createdAt: "desc" },
  });

  const result = users.map((u) => {
    const answered = u.attempts.filter((a) => a.isCorrect !== null).length;
    const correct = u.attempts.filter((a) => a.isCorrect === true).length;
    const sub = u.subscriptions[0] ?? null;
    return {
      id: u.id,
      email: u.email,
      name: u.name,
      tier: u.tier,
      isAdmin: u.isAdmin,
      createdAt: u.createdAt,
      updatedAt: u.updatedAt,
      attemptCount: u._count.attempts,
      sessionCount: u._count.practiceSessions,
      mockCount: u._count.mockRuns,
      accuracy: answered > 0 ? Math.round((correct / answered) * 1000) / 10 : null,
      subscription: sub
        ? { plan: sub.plan, amount: sub.amount, currency: sub.currency, provider: sub.provider, expiresAt: sub.currentPeriodEnd }
        : null,
    };
  });

  return jsonOk({ users: result });
}
