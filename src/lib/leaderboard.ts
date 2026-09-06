// Phase: Leaderboard — competitive standings across all users, derived from
// the permanent attempt history. Ranking is by net score (sum of attempt
// score) within a period, with accuracy and answered count as tie-breakers.
// Each entry also carries a "streak": consecutive active days inside the
// period window, so rivals can see who is on fire.

import { prisma } from "@/lib/db";
import { computeStreak } from "@/lib/streak";

export type LeaderboardPeriod = "daily" | "weekly" | "monthly" | "all_time";

export const LEADERBOARD_PERIODS: LeaderboardPeriod[] = [
  "daily",
  "weekly",
  "monthly",
  "all_time",
];

export function isLeaderboardPeriod(value: string): value is LeaderboardPeriod {
  return value === "daily" || value === "weekly" || value === "monthly" || value === "all_time";
}

export function periodLabel(period: LeaderboardPeriod): string {
  switch (period) {
    case "daily":
      return "Daily";
    case "weekly":
      return "Weekly";
    case "monthly":
      return "Monthly";
    case "all_time":
      return "All time";
  }
}

export interface LeaderboardEntry {
  rank: number;
  userId: string;
  name: string;
  tier: string;
  points: number;
  answered: number;
  correct: number;
  accuracy: number | null; // percentage, null when nothing answered
  streak: number; // consecutive active days within the period window
}

export interface LeaderboardResult {
  period: LeaderboardPeriod;
  entries: LeaderboardEntry[]; // top `limit` rows for display
  me: LeaderboardEntry | null; // current user's standing from the full ranking
  total: number; // number of ranked users in the period
}

/** Inclusive time window for a period. `from` is null for all_time. */
export function periodRange(period: LeaderboardPeriod, now = new Date()): { from: Date | null; to: Date } {
  const to = new Date(now);
  switch (period) {
    case "daily": {
      const from = new Date(now);
      from.setHours(0, 0, 0, 0);
      return { from, to };
    }
    case "weekly": {
      const from = new Date(now);
      from.setDate(from.getDate() - 6);
      from.setHours(0, 0, 0, 0);
      return { from, to };
    }
    case "monthly": {
      const from = new Date(now);
      from.setMonth(from.getMonth() - 1);
      from.setHours(0, 0, 0, 0);
      return { from, to };
    }
    case "all_time":
      return { from: null, to };
  }
}

export interface AttemptLike {
  userId: string;
  isCorrect: boolean | null;
  score: number;
  name: string | null;
  email: string;
  tier: string;
  createdAt: Date | string;
}

interface UserAccumulator {
  name: string;
  tier: string;
  points: number;
  answered: number;
  correct: number;
  dates: Date[];
}

/**
 * Aggregate attempt rows into a fully ranked leaderboard. Pure and testable.
 * Ranking uses standard competition ranking: identical points share a rank.
 */
export function aggregateLeaderboard(rows: AttemptLike[], now = new Date()): LeaderboardEntry[] {
  const byUser = new Map<string, UserAccumulator>();

  for (const row of rows) {
    const acc = byUser.get(row.userId) ?? {
      name: row.name ?? row.email,
      tier: row.tier,
      points: 0,
      answered: 0,
      correct: 0,
      dates: [],
    };
    acc.points += row.score;
    acc.dates.push(new Date(row.createdAt));
    if (row.isCorrect !== null) {
      acc.answered += 1;
      if (row.isCorrect) acc.correct += 1;
    }
    byUser.set(row.userId, acc);
  }

  const ranked = [...byUser.entries()]
    .map(([userId, acc]) => ({
      userId,
      name: acc.name,
      tier: acc.tier,
      points: Math.round(acc.points * 100) / 100,
      answered: acc.answered,
      correct: acc.correct,
      accuracy: acc.answered > 0 ? Math.round((100 * acc.correct) / acc.answered) : null,
      streak: computeStreak(acc.dates, now).current,
    }))
    .sort((a, b) => {
      if (b.points !== a.points) return b.points - a.points;
      const accuracyDiff = (b.accuracy ?? 0) - (a.accuracy ?? 0);
      if (accuracyDiff !== 0) return accuracyDiff;
      if (b.answered !== a.answered) return b.answered - a.answered;
      return a.name.localeCompare(b.name);
    });

  let rank = 0;
  return ranked.map((entry, index) => {
    if (index === 0 || ranked[index - 1].points !== entry.points) rank = index + 1;
    return { ...entry, rank };
  });
}

// The ranking query scans every attempt in the period window — the heaviest
// query behind a frequently-visited page. Stale-while-revalidate style cache:
// aggregates are recomputed at most once per TTL per period. Mirrors the
// in-memory rate limiter: fine for a single-instance deployment.
const RANKING_CACHE_TTL_MS = 10_000;
const rankingCache = new Map<string, { at: number; ranked: LeaderboardEntry[] }>();

/**
 * The full ranked list for a period, hit through the TTL cache. Standings lag
 * new answers by at most the TTL, which is invisible during a live session
 * and far cheaper than scanning the whole attempt table on every view.
 */
async function getRanked(period: LeaderboardPeriod, now: Date): Promise<LeaderboardEntry[]> {
  const hit = rankingCache.get(period);
  if (hit && now.getTime() - hit.at < RANKING_CACHE_TTL_MS) return hit.ranked;

  const { from, to } = periodRange(period, now);
  const rows = await prisma.attempt.findMany({
    where: { createdAt: from ? { gte: from, lte: to } : { lte: to } },
    select: {
      userId: true,
      isCorrect: true,
      score: true,
      createdAt: true,
      user: { select: { name: true, email: true, tier: true } },
    },
  });

  const normalized: AttemptLike[] = rows.map((r) => ({
    userId: r.userId,
    isCorrect: r.isCorrect,
    score: r.score,
    createdAt: r.createdAt,
    name: r.user.name,
    email: r.user.email,
    tier: r.user.tier,
  }));

  const ranked = aggregateLeaderboard(normalized, now);
  rankingCache.set(period, { at: now.getTime(), ranked });
  return ranked;
}

/** Standings for the given period. O(1)-ish scan of attempts for the window. */
export async function getLeaderboard(
  userId: string,
  period: LeaderboardPeriod,
  limit = 25
): Promise<LeaderboardResult> {
  const now = new Date();
  const ranked = await getRanked(period, now);
  return {
    period,
    entries: ranked.slice(0, limit),
    me: ranked.find((e) => e.userId === userId) ?? null,
    total: ranked.length,
  };
}