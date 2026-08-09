// Pure question-quality evaluation used by the ingestion pipeline. Low-quality
// questions are quarantined or rejected before they reach the practice pool.

export type QualityVerdict = "ok" | "review" | "reject";

export interface QualityIssue {
  code: string;
  message: string;
  penalty: number;
}

export interface QuestionQualityInput {
  text: string;
  options: unknown;
  correctIndex: number;
  explanation?: string | null;
}

export interface QuestionQualityResult {
  score: number; // 0..100
  verdict: QualityVerdict;
  status: "APPROVED" | "QUARANTINED" | "REJECTED";
  issues: QualityIssue[];
}

export const QUALITY_THRESHOLDS = {
  ok: 70, // APPROVED
  review: 40, // QUARANTINED (below this → REJECTED)
} as const;

const MAX_SCORE = 100;

function penalty(issues: QualityIssue[], code: string, message: string, p: number) {
  issues.push({ code, message, penalty: p });
}

function asOptions(value: unknown): Array<{ text: string }> | null {
  if (!Array.isArray(value) || value.length !== 4) return null;
  const out: Array<{ text: string }> = [];
  for (const o of value) {
    if (typeof o !== "object" || o === null) return null;
    const text = (o as { text?: unknown }).text;
    if (typeof text !== "string" || text.trim().length === 0) return null;
    out.push({ text: text.trim() });
  }
  return out;
}

export function evaluateQuestionQuality(
  input: QuestionQualityInput
): QuestionQualityResult {
  const issues: QualityIssue[] = [];
  const text = input.text.trim();

  if (text.length < 20) {
    penalty(issues, "text_too_short", "Question text is too short to be useful", 40);
  }

  const options = asOptions(input.options);
  if (!options) {
    penalty(issues, "invalid_options", "Exactly four non-empty options are required", 40);
  } else {
    const distinct = new Set(
      options.map((o) => o.text.toLowerCase().replace(/\s+/g, " "))
    );
    if (distinct.size < 3) {
      penalty(issues, "weak_distractors", "Options are too similar to each other", 15);
    }
  }

  if (input.correctIndex < 0 || input.correctIndex > 3) {
    penalty(issues, "invalid_correct_index", "Correct answer index is out of range", 50);
  }

  const explanation = (input.explanation ?? "").trim();
  if (explanation.length === 0) {
    penalty(issues, "missing_explanation", "No explanation provided", 40);
  } else if (explanation.length < 20) {
    penalty(issues, "short_explanation", "Explanation is very brief", 10);
  }

  const score = Math.max(0, MAX_SCORE - issues.reduce((sum, i) => sum + i.penalty, 0));
  const verdict: QualityVerdict =
    score >= QUALITY_THRESHOLDS.ok ? "ok" : score >= QUALITY_THRESHOLDS.review ? "review" : "reject";
  const status =
    verdict === "ok" ? "APPROVED" : verdict === "review" ? "QUARANTINED" : "REJECTED";

  return { score, verdict, status, issues };
}
