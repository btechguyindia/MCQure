// Pure running-stat update for the denormalized Question counters. Attempts
// themselves stay immutable — only these derived counters are refreshed.

export interface QuestionCounters {
  timesAttempted: number;
  timesCorrect: number;
  timesIncorrect: number;
  timesSkipped: number;
  answeredCount: number;
  avgResponseTimeMs: number;
}

export interface NextCounters extends QuestionCounters {
  lastAttemptedAt: Date;
}

/**
 * Computes the next counter state after one answer.
 * - isCorrect === null → skipped (no timing/correctness recorded).
 * - otherwise answered, and avgResponseTimeMs is a running mean.
 */
export function nextAttemptCounters(
  current: QuestionCounters,
  isCorrect: boolean | null,
  responseTimeMs: number
): NextCounters {
  const timesAttempted = current.timesAttempted + 1;
  let timesCorrect = current.timesCorrect;
  let timesIncorrect = current.timesIncorrect;
  let timesSkipped = current.timesSkipped;
  let answeredCount = current.answeredCount;
  let avgResponseTimeMs = current.avgResponseTimeMs;

  if (isCorrect === null) {
    timesSkipped += 1;
  } else {
    answeredCount += 1;
    if (isCorrect) timesCorrect += 1;
    else timesIncorrect += 1;
    avgResponseTimeMs =
      answeredCount === 1
        ? responseTimeMs
        : Math.round(
            (current.avgResponseTimeMs * (answeredCount - 1) + responseTimeMs) /
              answeredCount
          );
  }

  return {
    timesAttempted,
    timesCorrect,
    timesIncorrect,
    timesSkipped,
    answeredCount,
    avgResponseTimeMs,
    lastAttemptedAt: new Date(),
  };
}

export function accuracy(counters: QuestionCounters): number | null {
  if (counters.answeredCount === 0) return null;
  return (counters.timesCorrect / counters.answeredCount) * 100;
}
