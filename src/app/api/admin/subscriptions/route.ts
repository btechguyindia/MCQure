import { prisma } from "@/lib/db";
import { jsonOk, isNextResponse } from "@/lib/api";
import { requireAdmin } from "@/lib/admin";

export async function GET() {
  const admin = await requireAdmin();
  if (isNextResponse(admin)) return admin;

  const [subscriptions, byPlan, byStatus, byProvider, activeSubscriptionsByPlan] = await Promise.all([
    prisma.subscription.findMany({
      orderBy: { createdAt: "desc" },
      take: 100,
      select: {
        id: true,
        plan: true,
        cycle: true,
        status: true,
        provider: true,
        providerRef: true,
        amount: true,
        currency: true,
        currentPeriodEnd: true,
        cancelledAt: true,
        createdAt: true,
        user: { select: { id: true, email: true, name: true } },
      },
    }),
    prisma.subscription.groupBy({ by: ["plan"], _count: { id: true }, _sum: { amount: true } }),
    prisma.subscription.groupBy({ by: ["status"], _count: { id: true } }),
    prisma.subscription.groupBy({ by: ["provider"], _count: { id: true }, _sum: { amount: true } }),
    prisma.subscription.groupBy({
      by: ["plan"],
      _sum: { amount: true },
      _count: { id: true },
      where: { status: "ACTIVE" },
    }),
  ]);

  return jsonOk({
    subscriptions: subscriptions.map((s) => ({
      id: s.id,
      plan: s.plan,
      cycle: s.cycle,
      status: s.status,
      provider: s.provider,
      providerRef: s.providerRef,
      amount: s.amount,
      currency: s.currency,
      currentPeriodEnd: s.currentPeriodEnd,
      cancelledAt: s.cancelledAt,
      createdAt: s.createdAt,
      user: { id: s.user.id, email: s.user.email, name: s.user.name },
    })),
    breakdown: {
      byPlan: byPlan.map((p) => ({ plan: p.plan, count: p._count.id, totalAmount: p._sum.amount ?? 0 })),
      byStatus: byStatus.map((s) => ({ status: s.status, count: s._count.id })),
      byProvider: byProvider.map((p) => ({
        provider: p.provider,
        count: p._count.id,
        totalAmount: p._sum.amount ?? 0,
      })),
      revenueByPlan: activeSubscriptionsByPlan.map((r) => ({
        plan: r.plan,
        activeCount: r._count.id,
        revenue: r._sum.amount ?? 0,
      })),
    },
  });
}
