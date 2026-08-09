// Mastery estimation (pure, testable). Everything here is derived from the
// permanent attempt history — nothing is stored or overwritten.
//
// Insufficient-data protection: mastery is never presented as authoritative
// below a configurable minimum sample. 2/2 correct is NOT "100% mastery".

export interface MasteryConfig {
  // Minimum answered questions before mastery is considered reliable.
  minSample: number;
  // Minimum attempts before a topic counts as "practiced" at all.
  practiceThreshold: number;
  // Bayesian prior: starts everyone at 50% with `priorN` pseudo-observations.
  priorN: number;
  priorCorrect: number;
  proficientAt: number;
  masteredAt: number;
}

export const MASTERY_DEFAULTS: MasteryConfig = {
  minSample: 10,
  practiceThreshold: 10,
  priorN: 4,
  priorCorrect: 2,
  proficientAt: 70,
  masteredAt: 85,
};

export interface MasteryEstimate {
  /** 0-100 Bayesian-smoothed mastery, or null when nothing answered. */
  mastery: number | null;
  /** Whether the sample is large enough to report mastery confidently. */
  reliable: boolean;
  answered: number;
  correct: number;
}

export function estimateMastery(
  answered: number,
  correct: number,
  config: MasteryConfig = MASTERY_DEFAULTS
): MasteryEstimate {
  if (answered <= 0) {
    return { mastery: null, reliable: false, answered, correct };
  }
  const n = answered + config.priorN;
  const mastery = (100 * (correct + config.priorCorrect)) / n;
  return {
    mastery,
    reliable: answered >= config.minSample,
    answered,
    correct,
  };
}

export type CompletionState =
  | "NOT_STARTED"
  | "STUDYING"
  | "PRACTICED"
  | "PROFICIENT"
  | "MASTERED";

export interface CompletionInput {
  hasStudy: boolean;
  attempts: number;
  mastery: number | null;
  reliable: boolean;
}

/**
 * Five completion states for a topic:
 *   NOT_STARTED → STUDYING → PRACTICED → PROFICIENT → MASTERED
 * A topic is never "complete" just because material was opened — it must be
 * practiced, and proficiency requires a reliable, recent mastery estimate.
 */
export function completionState(input: CompletionInput, config: MasteryConfig = MASTERY_DEFAULTS): CompletionState {
  const { hasStudy, attempts, mastery, reliable } = input;

  if (attempts === 0) return hasStudy ? "STUDYING" : "NOT_STARTED";
  if (attempts < config.practiceThreshold) return "STUDYING";

  if (reliable && mastery !== null && mastery >= config.masteredAt) return "MASTERED";
  if (reliable && mastery !== null && mastery >= config.proficientAt) return "PROFICIENT";
  return "PRACTICED";
}

export const COMPLETION_META: Record<CompletionState, { label: string; color: string }> = {
  NOT_STARTED: { label: "Not started", color: "bg-zinc-100 text-zinc-500 dark:bg-zinc-800 dark:text-zinc-400" },
  STUDYING: { label: "Studying", color: "bg-sky-100 text-sky-700 dark:bg-sky-900/50 dark:text-sky-300" },
  PRACTICED: { label: "Practiced", color: "bg-indigo-100 text-indigo-700 dark:bg-indigo-900/50 dark:text-indigo-300" },
  PROFICIENT: { label: "Proficient", color: "bg-amber-100 text-amber-700 dark:bg-amber-900/50 dark:text-amber-300" },
  MASTERED: { label: "Mastered", color: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/50 dark:text-emerald-300" },
};
