// Progress / alignment / weakness computation (pure, testable). Takes attempt
// rows and blueprint data and derives everything else. Nothing here stores
// state — all analytics are recomputable from the permanent attempt history.

import type { QuestionSourceType } from "@prisma/client";
import { median } from "./analytics";
import {
  completionState,
  estimateMastery,
  MASTERY_DEFAULTS,
  type CompletionState,
  type MasteryConfig,
} from "./mastery";

export { completionState, estimateMastery, MASTERY_DEFAULTS, type CompletionState, type MasteryConfig };

export interface AttemptGroup {
  subjectId: string;
  subjectName: string;
  topicId: string;
  topicName: string;
  subtopicId: string | null;
  subtopicName: string | null;
  conceptId: string | null;
  conceptName: string | null;
}

export interface TrackedAttemptLike {
  isCorrect: boolean | null;
  score: number;
  responseTimeMs: number;
  confidence: number | null;
  errorType: string | null;
  sourceType: QuestionSourceType;
  isMock: boolean; // attempt belongs to a mock session
  createdAt: Date;
  questionId?: string | null; // distinct-question metrics (repeatedMistakes)
  group: AttemptGroup;
}

export interface GroupStats {
  id: string;
  name: string;
  attempts: number;
  correct: number;
  incorrect: number;
  unattempted: number;
  answered: number;
  accuracy: number | null;
  netScore: number;
  averageTimeMs: number;
  medianTimeMs: number;
  highConfidenceWrong: number;
  repeatedMistakes: number; // distinct questions answered wrong at least once
  mistakeCount: number; // total wrong attempts
  pyqAttempts: number;
  pyqAccuracy: number | null;
  practiceAttempts: number;
  practiceAccuracy: number | null;
  mockAttempts: number;
  mockAccuracy: number | null;
  lastAttemptAt: Date | null;
}

export function aggregateGroup(
  attempts: TrackedAttemptLike[],
  key: (a: TrackedAttemptLike) => { id: string; name: string }
): GroupStats[] {
  const map = new Map<string, TrackedAttemptLike[]>();
  for (const a of attempts) {
    const k = key(a);
    const list = map.get(k.id) ?? [];
    list.push(a);
    map.set(k.id, list);
  }

  const out: GroupStats[] = [];
  for (const [id, list] of map) {
    const answeredRows = list.filter((a) => a.isCorrect !== null);
    const correct = list.filter((a) => a.isCorrect === true).length;
    const incorrect = list.filter((a) => a.isCorrect === false).length;
    const unattempted = list.filter((a) => a.isCorrect === null).length;
    const times = list.map((a) => a.responseTimeMs);
    const wrongIds = new Set(
      list
        .filter((a) => a.isCorrect === false)
        .map((a) => a.questionId ?? a.group.subtopicId ?? a.group.conceptId ?? a.group.topicId)
    );

    const pyqRows = list.filter((a) => a.sourceType === "PYQ" || a.sourceType === "PYQ_VARIANT");
    const pyqAnswered = pyqRows.filter((a) => a.isCorrect !== null);
    const practiceRows = list.filter((a) => !a.isMock);
    const practiceAnswered = practiceRows.filter((a) => a.isCorrect !== null);
    const mockRows = list.filter((a) => a.isMock);
    const mockAnswered = mockRows.filter((a) => a.isCorrect !== null);

    out.push({
      id,
      name: key(list[0]).name,
      attempts: list.length,
      correct,
      incorrect,
      unattempted,
      answered: answeredRows.length,
      accuracy: answeredRows.length > 0 ? (correct / answeredRows.length) * 100 : null,
      netScore: list.reduce((s, a) => s + a.score, 0),
      averageTimeMs: times.length > 0 ? Math.round(times.reduce((a, b) => a + b, 0) / times.length) : 0,
      medianTimeMs: median(times),
      highConfidenceWrong: list.filter((a) => a.isCorrect === false && a.confidence != null && a.confidence >= 3).length,
      repeatedMistakes: wrongIds.size,
      mistakeCount: incorrect,
      pyqAttempts: pyqRows.length,
      pyqAccuracy:
        pyqAnswered.length > 0
          ? (pyqAnswered.filter((a) => a.isCorrect === true).length / pyqAnswered.length) * 100
          : null,
      practiceAttempts: practiceRows.length,
      practiceAccuracy:
        practiceAnswered.length > 0
          ? (practiceAnswered.filter((a) => a.isCorrect === true).length / practiceAnswered.length) * 100
          : null,
      mockAttempts: mockRows.length,
      mockAccuracy:
        mockAnswered.length > 0
          ? (mockAnswered.filter((a) => a.isCorrect === true).length / mockAnswered.length) * 100
          : null,
      lastAttemptAt: list.length > 0 ? new Date(Math.max(...list.map((a) => a.createdAt.getTime()))) : null,
    });
  }
  return out.sort((a, b) => a.name.localeCompare(b.name));
}

// ── Mastery & coverage ──────────────────────────────────────────────────────

/** Overall mastery across all answered attempts (Bayesian-smoothed). */
export function overallMastery(answered: number, correct: number, config: MasteryConfig = MASTERY_DEFAULTS) {
  return estimateMastery(answered, correct, config);
}

export interface TopicCompletionRow {
  topicId: string;
  name: string;
  hasStudy: boolean;
  attempts: number;
  answered?: number; // answered rows (accuracy is over answered, not attempts)
  accuracy: number | null;
}

export interface SyllabusCoverage {
  totalTopics: number;
  studied: number; // NOT_STARTED is the only non-studied state
  practiced: number; // PRACTICED or better
  proficient: number; // PROFICIENT or MASTERED
  mastered: number;
  studiedPct: number;
  masteredPct: number;
  states: Array<{ topicId: string; name: string; state: CompletionState }>;
}

/** Syllabus coverage from per-topic rows: studied vs mastered kept distinct. */
export function syllabusCoverage(
  topics: TopicCompletionRow[],
  config: MasteryConfig = MASTERY_DEFAULTS
): SyllabusCoverage {
  const states = topics.map((t) => {
    const answered = t.answered ?? t.attempts;
    const correct =
      answered > 0 && t.accuracy !== null
        ? Math.round((t.accuracy / 100) * answered)
        : 0;
    const mastery = estimateMastery(answered, correct, config);
    return {
      topicId: t.topicId,
      name: t.name,
      state: completionState(
        {
          hasStudy: t.hasStudy,
          attempts: t.attempts,
          mastery: mastery.mastery,
          reliable: mastery.reliable,
        },
        config
      ),
    };
  });

  return {
    totalTopics: states.length,
    studied: states.filter((s) => s.state !== "NOT_STARTED").length,
    practiced: states.filter((s) => ["PRACTICED", "PROFICIENT", "MASTERED"].includes(s.state)).length,
    proficient: states.filter((s) => ["PROFICIENT", "MASTERED"].includes(s.state)).length,
    mastered: states.filter((s) => s.state === "MASTERED").length,
    studiedPct: states.length > 0 ? (states.filter((s) => s.state !== "NOT_STARTED").length / states.length) * 100 : 0,
    masteredPct: states.length > 0 ? (states.filter((s) => s.state === "MASTERED").length / states.length) * 100 : 0,
    states,
  };
}

// ── Alignment ───────────────────────────────────────────────────────────────

const COMPLETION_COVERAGE: Record<CompletionState, number> = {
  NOT_STARTED: 0,
  STUDYING: 40,
  PRACTICED: 75,
  PROFICIENT: 90,
  MASTERED: 100,
};

export interface AlignmentInput {
  mastery: number | null;
  completion: CompletionState;
  volumeRatio: number; // attempts / expected target attempts, capped at 1
  revisionCurrent: boolean;
}

/** 0-100 exam-alignment for one topic/subject. Mastery carries most weight;
 *  raw volume alone can never inflate the score. */
export function alignmentScore(input: AlignmentInput): number {
  const mastery = input.mastery ?? 0;
  const coverage = COMPLETION_COVERAGE[input.completion];
  const volume = Math.min(1, Math.max(0, input.volumeRatio)) * 100;
  const revision = input.revisionCurrent ? 100 : 0;
  return Math.round(
    0.4 * mastery + 0.25 * coverage + 0.2 * volume + 0.15 * revision
  );
}

// ── Weakness engine ─────────────────────────────────────────────────────────

export interface WeaknessInput {
  attempts: number;
  accuracy: number | null;
  repeatedMistakes: number;
  pyqAccuracy: number | null;
  mockAccuracy: number | null;
  averageTimeMs: number | null;
  examWeight: number; // 0-1 (HIGH=1, MEDIUM=0.5, LOW=0.25)
  revisionDue: boolean;
}

export interface WeaknessResult {
  score: number; // 0-100, higher = weaker / more urgent
  reasons: string[];
  insufficientData: boolean;
}

const weightToExamWeight = (weight: "HIGH" | "MEDIUM" | "LOW") =>
  weight === "HIGH" ? 1 : weight === "MEDIUM" ? 0.5 : 0.25;

export function weaknessScore(input: WeaknessInput, minSample = MASTERY_DEFAULTS.minSample): WeaknessResult {
  if (input.attempts < minSample) {
    return {
      score: 10,
      reasons: [`Only ${input.attempts} attempt(s) — insufficient data for a reliable priority`],
      insufficientData: true,
    };
  }

  const acc = input.accuracy == null ? 50 : 100 - input.accuracy;
  const mistakes = Math.min(1, input.repeatedMistakes / 10);
  const pyq = input.pyqAccuracy == null ? 50 : 100 - input.pyqAccuracy;
  const mock = input.mockAccuracy == null ? 50 : 100 - input.mockAccuracy;
  const avgMs = input.averageTimeMs ?? 0;
  const timePressure =
    avgMs >= 60000 ? 100 : avgMs >= 40000 ? 60 : avgMs >= 25000 ? 30 : 10;
  const examWeight = (input.examWeight ?? 0.5) * 100;
  const revision = input.revisionDue ? 100 : 0;

  const score = Math.round(
    0.3 * acc +
      0.2 * mistakes * 100 +
      0.1 * pyq +
      0.1 * mock +
      0.05 * timePressure +
      0.15 * examWeight +
      0.1 * revision
  );

  const reasons: string[] = [];
  if (input.accuracy !== null && input.accuracy < 60) reasons.push(`Accuracy: ${input.accuracy.toFixed(0)}%`);
  if (input.repeatedMistakes >= 5) reasons.push(`Repeated errors: ${input.repeatedMistakes}`);
  if (input.pyqAccuracy !== null && input.pyqAccuracy < 60) reasons.push(`PYQ accuracy: ${input.pyqAccuracy.toFixed(0)}%`);
  if (input.mockAccuracy !== null && input.mockAccuracy < 60) reasons.push(`Mock accuracy: ${input.mockAccuracy.toFixed(0)}%`);
  if (input.revisionDue) reasons.push("Revision overdue");
  if (input.examWeight >= 0.9) reasons.push("High exam relevance");

  return { score, reasons, insufficientData: false };
}

// ── Revision engine ─────────────────────────────────────────────────────────

export interface RevisionInput {
  lastPracticedDays: number | null;
  lastVisitedDays: number | null;
  mastery: number | null;
  repeatedMistakes: number;
  recentAccuracy: number | null; // accuracy over the last 7 days of attempts
}

export interface RevisionResult {
  due: boolean;
  intervalDays: number;
  daysSince: number;
  reason: string;
}

/** Spaced-repetition interval grows with mastery; drops when recent accuracy
 *  collapses or mistakes accumulate. */
export function revisionStatus(input: RevisionInput): RevisionResult {
  const m = input.mastery;
  const intervalDays = Math.round(7 + ((m ?? 0) / 100) * 14); // 7..21 days
  const activityDays = [input.lastPracticedDays, input.lastVisitedDays]
    .filter((d): d is number => d !== null);
  const daysSince = activityDays.length > 0 ? Math.min(...activityDays) : Number.POSITIVE_INFINITY;

  const recentDecline =
    input.recentAccuracy !== null && input.recentAccuracy < 60 && input.repeatedMistakes > 0;
  const overdue = daysSince > intervalDays;

  if (recentDecline) {
    return {
      due: true,
      intervalDays,
      daysSince,
      reason: `Recent accuracy ${input.recentAccuracy?.toFixed(0)}% with ${input.repeatedMistakes} repeated mistake(s)`,
    };
  }
  if (overdue) {
    return {
      due: true,
      intervalDays,
      daysSince,
      reason: `Last activity ${Math.round(daysSince)} days ago (interval ${intervalDays})`,
    };
  }
  return { due: false, intervalDays, daysSince, reason: "Revision not due" };
}

// ── Daily recommendation engine ─────────────────────────────────────────────

export interface DailyPlanTopic {
  id: string;
  name: string;
  subjectName: string;
  weight: "HIGH" | "MEDIUM" | "LOW";
  weakness: WeaknessResult;
  revisionDue: boolean;
  mastery: number | null;
}

export interface DailyPlanAction {
  type: "revision" | "practice" | "mock";
  minutes: number;
  questions: number;
  note: string;
}

export interface DailyPlan {
  priorities: Array<{
    topicId: string;
    topicName: string;
    subjectName: string;
    weaknessScore: number;
    reasons: string[];
  }>;
  actions: DailyPlanAction[];
}

/** Sort topics by weakness priority (revision-due first), then build a
 *  time-budgeted action plan. Evidence-based — derived only from measured
 *  performance and the blueprint weight. */
export function buildDailyPlan(
  topics: DailyPlanTopic[],
  limit = 3
): DailyPlan {
  const ranked = [...topics].sort((a, b) => {
    if (a.revisionDue !== b.revisionDue) return a.revisionDue ? -1 : 1;
    return b.weakness.score - a.weakness.score;
  });

  const priorities = ranked.slice(0, limit).map((t) => ({
    topicId: t.id,
    topicName: t.name,
    subjectName: t.subjectName,
    weaknessScore: t.weakness.score,
    reasons: t.weakness.reasons,
  }));

  const actions: DailyPlanAction[] = [];
  for (const t of ranked.slice(0, limit)) {
    const gap = Math.max(0, 100 - t.weakness.score);
    const minutes = Math.round(Math.min(30, Math.max(10, 12 + gap / 8)));
    if (t.revisionDue) {
      actions.push({
        type: "revision",
        minutes,
        questions: 10,
        note: `${minutes} min — ${t.name} revision`,
      });
    } else {
      actions.push({
        type: "practice",
        minutes,
        questions: Math.round(Math.min(20, Math.max(10, 10 + gap / 6))),
        note: `${minutes} min — ${t.name} practice`,
      });
    }
  }
  return { priorities, actions };
}

export { weightToExamWeight };

export type Trend = "improving" | "stable" | "declining";

/** Compare accuracy in the first half vs second half of a chronologically
 *  ordered attempt set. Needs >= 6 answered rows before it reports a trend. */
export function trendOf(attempts: TrackedAttemptLike[]): Trend {
  const answered = attempts
    .filter((a) => a.isCorrect !== null)
    .sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime());
  if (answered.length < 6) return "stable";
  const mid = Math.floor(answered.length / 2);
  const first = answered.slice(0, mid);
  const second = answered.slice(mid);
  const accuracy = (rows: TrackedAttemptLike[]) =>
    (rows.filter((r) => r.isCorrect === true).length / Math.max(1, rows.length)) * 100;
  const diff = accuracy(second) - accuracy(first);
  if (diff >= 5) return "improving";
  if (diff <= -5) return "declining";
  return "stable";
}
