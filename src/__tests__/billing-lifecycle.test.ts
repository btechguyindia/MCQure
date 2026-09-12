import "dotenv/config";
import { describe, expect, it } from "vitest";
import { prisma } from "../lib/db";
import {
  activateSubscription,
  createPendingCheckout,
  getCurrentSubscription,
  isActive,
  listUserSubscriptions,
} from "../lib/billing";

// DB-backed test of the payment lifecycle on the shared Neon database:
// pending checkout → payment verified (in-place activation) → another
// purchase supersedes the old row → cancellation. History must record every
// action and stay clean (one ACTIVE row at a time).
describe("Billing lifecycle", () => {
  it("runs pending → active → superseded → cancelled and keeps clean history", async () => {
    const email = `billing-${Date.now()}@test.local`;
    const user = await prisma.user.create({
      data: { email, name: "Billing Lifecycle Test", passwordHash: "x", tier: "BASIC" },
    });

    try {
      const now = Date.now();

      // 1. Checkout started — a PENDING row appears in history.
      const pending = await createPendingCheckout({
        userId: user.id,
        plan: "PREMIUM",
        cycle: "MONTHLY",
        provider: "RAZORPAY",
        providerRef: "order_test_123",
        amount: 299,
        currency: "INR",
      });
      expect(pending.status).toBe("PENDING");
      expect(
        (await listUserSubscriptions(user.id)).find((s) => s.id === pending.id)?.status
      ).toBe("PENDING");

      // 2. Payment verified — the same row upgrades to ACTIVE, tier syncs.
      const active = await activateSubscription({
        userId: user.id,
        plan: "PREMIUM",
        cycle: "MONTHLY",
        provider: "RAZORPAY",
        providerRef: "order_test_123",
        amount: 299,
        currency: "INR",
        pendingId: pending.id,
      });
      expect(active.id).toBe(pending.id);
      expect(active.status).toBe("ACTIVE");

      const afterFirst = await listUserSubscriptions(user.id);
      expect(afterFirst).toHaveLength(1);
      expect((await prisma.user.findUnique({ where: { id: user.id } }))?.tier).toBe("PREMIUM");
      expect((await getCurrentSubscription(user.id))).toMatchObject({ id: pending.id });

      const snapshot = afterFirst[0].planSnapshot as {
        plan: string;
        name: string;
        features: string[];
      };
      expect(snapshot.plan).toBe("PREMIUM");
      expect(snapshot.features).toContain("mock_tests");

      // 3. New purchase — old row is superseded (EXPIRED + cancelledAt), one ACTIVE.
      await activateSubscription({
        userId: user.id,
        plan: "PREMIUM_PLUS",
        cycle: "YEARLY",
        provider: "STRIPE",
        providerRef: "cs_test_456",
        amount: 3999,
        currency: "USD",
      });
      const afterSecond = await listUserSubscriptions(user.id);
      const actives = afterSecond.filter((s) => s.status === "ACTIVE");
      expect(actives).toHaveLength(1);
      expect(actives[0].plan).toBe("PREMIUM_PLUS");
      const superseded = afterSecond.find((s) => s.id === pending.id);
      expect(superseded?.status).toBe("EXPIRED");
      expect(superseded?.cancelledAt).not.toBeNull();
      expect((await prisma.user.findUnique({ where: { id: user.id } }))?.tier).toBe("PREMIUM_PLUS");

      // 4. Cancel — access continues until period end, tier kept for now.
      const current = (await getCurrentSubscription(user.id))!;
      await prisma.subscription.update({
        where: { id: current.id },
        data: { status: "CANCELLED", cancelledAt: new Date() },
      });
      const afterCancel = await listUserSubscriptions(user.id);
      const cancelled = afterCancel.find((s) => s.status === "CANCELLED");
      expect(cancelled?.cancelledAt).not.toBeNull();
      expect(isActive(cancelled ?? null)).toBe(false);

      // History is newest-first and rows reflect every action taken.
      expect(afterCancel[0].createdAt.getTime()).toBeGreaterThanOrEqual(now);
      expect(afterCancel.map((s) => s.status)).toEqual(
        expect.arrayContaining(["EXPIRED", "CANCELLED"])
      );
      expect(afterCancel.filter((s) => s.status === "ACTIVE")).toHaveLength(0);
    } finally {
      await prisma.subscription.deleteMany({ where: { userId: user.id } });
      await prisma.user.delete({ where: { id: user.id } });
    }
  });
});