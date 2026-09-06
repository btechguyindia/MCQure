import { describe, expect, it } from "vitest";
import { isActive, msUntilPeriodEnd, periodEnd, planSnapshot } from "./billing";
import { hasFeature, PLANS } from "./plans";

describe("periodEnd", () => {
  it("adds 1 month for a monthly cycle", () => {
    const start = new Date("2026-01-15T10:00:00Z");
    const end = periodEnd(start, "MONTHLY");
    expect(end.getUTCFullYear()).toBe(2026);
    expect(end.getUTCMonth()).toBe(1);
    expect(end.getUTCDate()).toBe(15);
  });

  it("adds 12 months for a yearly cycle", () => {
    const start = new Date("2026-03-01T00:00:00Z");
    const end = periodEnd(start, "YEARLY");
    expect(end.getUTCFullYear()).toBe(2027);
    expect(end.getUTCMonth()).toBe(2);
    expect(end.getUTCDate()).toBe(1);
  });
});

describe("msUntilPeriodEnd", () => {
  it("is the wall-clock difference clamped at zero", () => {
    const now = new Date("2026-06-01T00:00:00Z");
    expect(msUntilPeriodEnd(new Date("2026-06-10T00:00:00Z"), now)).toBe(9 * 86_400_000);
    expect(msUntilPeriodEnd(new Date("2026-05-01T00:00:00Z"), now)).toBe(0);
  });
});

describe("isActive", () => {
  const now = new Date("2026-06-01T00:00:00Z");

  it("requires status ACTIVE and a future period end", () => {
    expect(
      isActive({ status: "ACTIVE", currentPeriodEnd: new Date("2026-07-01T00:00:00Z") } as never, now)
    ).toBe(true);
    expect(
      isActive({ status: "ACTIVE", currentPeriodEnd: new Date("2026-05-01T00:00:00Z") } as never, now)
    ).toBe(false);
    expect(
      isActive({ status: "CANCELLED", currentPeriodEnd: new Date("2026-07-01T00:00:00Z") } as never, now)
    ).toBe(false);
    expect(isActive(null, now)).toBe(false);
  });
});

describe("planSnapshot / plan catalog coherence", () => {
  it("snapshots name, limits and features for every plan", () => {
    for (const id of Object.keys(PLANS) as Array<keyof typeof PLANS>) {
      const snap = planSnapshot(id);
      expect(snap.name).toBe(PLANS[id].name);
      expect(snap.limits).toEqual(PLANS[id].limits);
      expect(snap.features).toEqual([...PLANS[id].features]);
    }
  });

  it("paid plans are strictly superior to Basic on features", () => {
    const basic = new Set(PLANS.BASIC.features);
    for (const id of ["PREMIUM", "PREMIUM_PLUS", "ROYAL"] as const) {
      for (const f of basic) {
        expect(hasFeature(id, f)).toBe(true);
      }
    }
  });
});