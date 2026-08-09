// Analytics helpers over attempt rows. Pure functions (testable, no I/O).

import { dayKey } from "./streak";

export interface AttemptLike {
  isCorrect: boolean | null;
  score: number;
  responseTimeMs: number;
  confidence: number | null;
}

export function mean(values: number[]): number {
  if (values.length === 0) return 0;
  return values.reduce((a, b) => a + b, 0) / values.length;
}

export function median(values: number[]): number {
  if (values.length === 0) return 0;
  const sorted = [...values].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  if (sorted.length % 2 === 1) return sorted[mid];
  return (sorted[mid - 1] + sorted[mid]) / 2;
}

export interface AttemptSummary {
  total: number;
  answered: number;
  correct: number;
  incorrect: number;
  unattempted: number;
  accuracy: number | null; // percentage, null when nothing answered
  netScore: number;
  averageTimeMs: number;
  medianTimeMs: number;
  highConfidenceCorrect: number;
  highConfidenceWrong: number;
  lowConfidenceCorrect: number;
  lowConfidenceWrong: number;
}

/**
 * Summarise a list of attempts. `config` is required to compute net score.
 */
export function summarizeAttempts(
  attempts: AttemptLike[],
  config: {
    correctMarks: number;
    incorrectPenalty: number;
    unattemptedMarks: number;
  }
): AttemptSummary {
  let correct = 0;
  let incorrect = 0;
  let unattempted = 0;
  const times: number[] = [];
  let highConfidenceCorrect = 0;
  let highConfidenceWrong = 0;
  let lowConfidenceCorrect = 0;
  let lowConfidenceWrong = 0;

  for (const a of attempts) {
    if (a.isCorrect === null) unattempted += 1;
    else if (a.isCorrect) correct += 1;
    else incorrect += 1;

    times.push(a.responseTimeMs);

    if (a.confidence != null && a.isCorrect != null) {
      const high = a.confidence >= 3;
      if (high && a.isCorrect) highConfidenceCorrect += 1;
      else if (high && !a.isCorrect) highConfidenceWrong += 1;
      else if (!high && a.isCorrect) lowConfidenceCorrect += 1;
      else lowConfidenceWrong += 1;
    }
  }

  const answered = correct + incorrect;
  return {
    total: attempts.length,
    answered,
    correct,
    incorrect,
    unattempted,
    accuracy: answered > 0 ? (correct / answered) * 100 : null,
    netScore:
      correct * config.correctMarks +
      incorrect * config.incorrectPenalty +
      unattempted * config.unattemptedMarks,
    averageTimeMs: Math.round(mean(times)),
    medianTimeMs: Math.round(median(times)),
    highConfidenceCorrect,
    highConfidenceWrong,
    lowConfidenceCorrect,
    lowConfidenceWrong,
  };
}

// ── Dashboard helpers (pure, testable) ──────────────────────────────────────

export interface GroupedStats {
  group: string;
  attempts: number;
  correct: number;
  accuracy: number | null; // percentage
  avgTimeMs: number;
}

/**
 * Aggregate attempts into per-group stats (e.g. per subject or per topic).
 * Skips unattempted rows when computing accuracy, like summarizeAttempts.
 */
export function summarizeByGroup(
  attempts: Array<AttemptLike & { group: string }>
): GroupedStats[] {
  const byGroup = new Map<string, AttemptLike[]>();
  for (const a of attempts) {
    const list = byGroup.get(a.group) ?? [];
    list.push(a);
    byGroup.set(a.group, list);
  }

  const out: GroupedStats[] = [];
  for (const [group, list] of byGroup) {
    const answered = list.filter((a) => a.isCorrect !== null);
    const correct = list.filter((a) => a.isCorrect === true).length;
    out.push({
      group,
      attempts: list.length,
      correct,
      accuracy: answered.length > 0 ? (correct / answered.length) * 100 : null,
      avgTimeMs: Math.round(mean(list.map((a) => a.responseTimeMs))),
    });
  }
  return out;
}

export interface ErrorTypeCount {
  type: string;
  count: number;
}

/** Count attempts by error type, most frequent first, excluding unknowns. */
export function errorTypeCounts(
  attempts: Array<{ errorType: string | null }>
): ErrorTypeCount[] {
  const counts = new Map<string, number>();
  for (const a of attempts) {
    if (!a.errorType) continue;
    counts.set(a.errorType, (counts.get(a.errorType) ?? 0) + 1);
  }
  return [...counts.entries()]
    .map(([type, count]) => ({ type, count }))
    .sort((a, b) => b.count - a.count);
}

export interface DayTrendPoint {
  day: string; // YYYY-MM-DD
  attempts: number;
  netScore: number;
}

/** Daily net score + attempt counts for the last `days` days (oldest first). */
export function trendByDay(
  attempts: Array<{ createdAt: Date; score: number }>,
  days: number,
  now = new Date()
): DayTrendPoint[] {
  const dayMs = 24 * 60 * 60 * 1000;
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const points: DayTrendPoint[] = [];

  for (let offset = days - 1; offset >= 0; offset -= 1) {
    const day = new Date(today.getTime() - offset * dayMs);
    const key = dayKey(day);
    const dayAttempts = attempts.filter((a) => dayKey(a.createdAt) === key);
    points.push({
      day: key,
      attempts: dayAttempts.length,
      netScore: Math.round(dayAttempts.reduce((s, a) => s + a.score, 0) * 100) / 100,
    });
  }
  return points;
}
