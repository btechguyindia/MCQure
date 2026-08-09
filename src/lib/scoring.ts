// Deterministic scoring. Scoring configuration comes from the database
// (ScoringConfig) — it is never hard-coded here.

export interface ScoringConfigLike {
  correctMarks: number;
  incorrectPenalty: number; // stored as a negative value, e.g. -0.25
  unattemptedMarks: number;
}

export interface AttemptCounts {
  correct: number;
  incorrect: number;
  unattempted: number;
}

/**
 * Score of a single answer.
 * - correct            -> +correctMarks
 * - wrong answer chosen -> incorrectPenalty (negative)
 * - skipped (null)      -> unattemptedMarks
 */
export function attemptScore(
  selectedIndex: number | null,
  correctIndex: number,
  config: ScoringConfigLike
): number {
  if (selectedIndex === null) return config.unattemptedMarks;
  return selectedIndex === correctIndex
    ? config.correctMarks
    : config.incorrectPenalty;
}

/** Net score over a set of answers. */
export function netScore(counts: AttemptCounts, config: ScoringConfigLike): number {
  return (
    counts.correct * config.correctMarks +
    counts.incorrect * config.incorrectPenalty +
    counts.unattempted * config.unattemptedMarks
  );
}

/** Accuracy as a percentage (0-100). Returns null when nothing was answered. */
export function accuracy(answeredCorrect: number, answeredTotal: number): number | null {
  if (answeredTotal <= 0) return null;
  return (answeredCorrect / answeredTotal) * 100;
}

/** Round marks to two decimals to avoid float drift (e.g. 0.75 -> 0.75). */
export function roundMarks(value: number): number {
  return Math.round(value * 100) / 100;
}
