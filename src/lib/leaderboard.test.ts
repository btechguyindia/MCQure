import { describe, expect, it } from "vitest";
import { aggregateLeaderboard, isLeaderboardPeriod, periodLabel, periodRange } from "./leaderboard";

describe("isLeaderboardPeriod", () => {
  it("accepts the four known periods", () => {
    expect(["daily", "weekly", "monthly", "all_time"].every(isLeaderboardPeriod)).toBe(true);
  });

  it("rejects unknown periods", () => {
    expect(isLeaderboardPeriod("yearly")).toBe(false);
    expect(isLeaderboardPeriod("")).toBe(false);
  });
});

describe("periodLabel", () => {
  it("renders human labels", () => {
    expect(periodLabel("daily")).toBe("Daily");
    expect(periodLabel("weekly")).toBe("Weekly");
    expect(periodLabel("monthly")).toBe("Monthly");
    expect(periodLabel("all_time")).toBe("All time");
  });
});

describe("periodRange", () => {
  const now = new Date(2026, 7, 9, 15, 30, 0); // Sun Aug 09 2026 15:30 local

  it("daily starts at local midnight", () => {
    const { from, to } = periodRange("daily", now);
    expect(to).toEqual(now);
    expect(from).toEqual(new Date(2026, 7, 9, 0, 0, 0));
  });

  it("weekly spans the last 7 days", () => {
    const { from } = periodRange("weekly", now);
    expect(from).toEqual(new Date(2026, 7, 3, 0, 0, 0));
  });

  it("monthly spans one month back", () => {
    const { from } = periodRange("monthly", now);
    expect(from).not.toBeNull();
    expect(from!.getMonth()).toBe(6); // July
    expect(from!.getFullYear()).toBe(2026);
  });

  it("all time has no lower bound", () => {
    const { from, to } = periodRange("all_time", now);
    expect(from).toBeNull();
    expect(to).toEqual(now);
  });
});

function attempt(userId: string, score: number, correct: boolean | null, name = userId): Parameters<typeof aggregateLeaderboard>[0][number] {
  return { userId, isCorrect: correct, score, name, email: `${userId}@x.test`, tier: "FREE" };
}

describe("aggregateLeaderboard", () => {
  it("ranks by net score and fills in accuracy", () => {
    const rows = [
      attempt("a", 1, true),
      attempt("a", -0.25, false),
      attempt("b", 1, true),
      attempt("c", -1, false),
    ];
    const out = aggregateLeaderboard(rows);

    expect(out).toHaveLength(3);
    expect(out[0]).toMatchObject({ userId: "b", rank: 1, points: 1, answered: 1, correct: 1, accuracy: 100 });
    expect(out[1]).toMatchObject({ userId: "a", rank: 2, points: 0.75, answered: 2, correct: 1, accuracy: 50 });
    expect(out[2]).toMatchObject({ userId: "c", rank: 3, points: -1, answered: 1, correct: 0, accuracy: 0 });
  });

  it("shares a rank when points are tied, then orders ties by accuracy", () => {
    const rows = [
      attempt("a", 1, true),
      attempt("a", 1, false), // 2 points, 50%
      attempt("b", 2, true), // 2 points, 100%
      attempt("b", 0, null), // skipped
      attempt("c", 1, true), // 1 point
    ];
    const out = aggregateLeaderboard(rows);

    expect(out[0]).toMatchObject({ userId: "b", rank: 1 });
    expect(out[1]).toMatchObject({ userId: "a", rank: 1 });
    expect(out[2]).toMatchObject({ userId: "c", rank: 3 });
  });

  it("treats users with only skipped attempts as having null accuracy", () => {
    const out = aggregateLeaderboard([attempt("a", 0, null), attempt("b", 1, true)]);
    const skipped = out.find((e) => e.userId === "a");
    expect(skipped?.accuracy).toBeNull();
    expect(skipped?.answered).toBe(0);
  });

  it("falls back to email for anonymous users", () => {
    const rows = [
      { userId: "a", isCorrect: true, score: 1, name: null, email: "player@x.test", tier: "FREE" },
    ];
    expect(aggregateLeaderboard(rows)[0].name).toBe("player@x.test");
  });

  it("returns an empty list for no rows", () => {
    expect(aggregateLeaderboard([])).toEqual([]);
  });
});