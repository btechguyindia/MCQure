import { describe, expect, it } from "vitest";
import { evaluateQuestionQuality, QUALITY_THRESHOLDS } from "./question-quality";

const good = {
  text: "In the round robin CPU scheduling algorithm, when a time quantum is very large, the algorithm effectively behaves like which of the following?",
  options: [
    { label: "A", text: "First come first served" },
    { label: "B", text: "Shortest job first" },
    { label: "C", text: "Priority scheduling" },
    { label: "D", text: "Multilevel feedback queue" },
  ],
  correctIndex: 0,
  explanation:
    "With an extremely large quantum every process runs until it completes, which is exactly first come first served ordering.",
};

describe("evaluateQuestionQuality", () => {
  it("approves a well-formed question", () => {
    const r = evaluateQuestionQuality(good);
    expect(r.status).toBe("APPROVED");
    expect(r.verdict).toBe("ok");
    expect(r.score).toBeGreaterThanOrEqual(QUALITY_THRESHOLDS.ok);
    expect(r.issues).toEqual([]);
  });

  it("rejects a question with no explanation", () => {
    const r = evaluateQuestionQuality({ ...good, explanation: "" });
    expect(r.status).toBe("QUARANTINED");
    expect(r.issues.some((i) => i.code === "missing_explanation")).toBe(true);
  });

  it("penalizes very short question text", () => {
    const r = evaluateQuestionQuality({ ...good, text: "short" });
    expect(r.issues.some((i) => i.code === "text_too_short")).toBe(true);
  });

  it("rejects invalid option sets", () => {
    const r = evaluateQuestionQuality({ ...good, options: [{ label: "A", text: "only one" }] });
    expect(r.issues.some((i) => i.code === "invalid_options")).toBe(true);
  });

  it("penalizes near-identical distractors", () => {
    const r = evaluateQuestionQuality({
      ...good,
      options: [
        { label: "A", text: "Round robin" },
        { label: "B", text: "Round robin" },
        { label: "C", text: "Round robin" },
        { label: "D", text: "Priority scheduling" },
      ],
    });
    expect(r.issues.some((i) => i.code === "weak_distractors")).toBe(true);
  });

  it("penalizes an out-of-range correct index", () => {
    const r = evaluateQuestionQuality({ ...good, correctIndex: 7 });
    expect(r.issues.some((i) => i.code === "invalid_correct_index")).toBe(true);
  });

  it("flags a stacked failure as REJECTED", () => {
    const r = evaluateQuestionQuality({
      text: "tiny",
      options: [{ label: "A", text: "x" }],
      correctIndex: 9,
      explanation: "",
    });
    expect(r.status).toBe("REJECTED");
    expect(r.verdict).toBe("reject");
  });
});
