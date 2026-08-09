import { describe, expect, it } from "vitest";
import {
  buildOriginalPrompt,
  buildVariantPrompt,
  parseGeneratedQuestions,
} from "./generation";

describe("parseGeneratedQuestions", () => {
  it("extracts a JSON array from a fenced block", () => {
    const text = `Here you go:
\`\`\`json
[{"text":"What is a process?","options":["a","b","c","d"],"correctIndex":0,"explanation":"A process is a program in execution.","difficulty":"EASY","conceptHint":"process"}]
\`\`\`
`;
    const { questions, error } = parseGeneratedQuestions(text);
    expect(error).toBeUndefined();
    expect(questions).toHaveLength(1);
    expect(questions[0].correctIndex).toBe(0);
  });

  it("skips invalid items but keeps valid ones", () => {
    const text = `[
      {"text":"A valid question?","options":["1","2","3","4"],"correctIndex":1,"explanation":"This explanation is long enough to pass.","difficulty":"MEDIUM"},
      {"options":["missing","text"]}
    ]`;
    const { questions } = parseGeneratedQuestions(text);
    expect(questions).toHaveLength(1);
    expect(questions[0].difficulty).toBe("MEDIUM");
  });

  it("reports a missing array", () => {
    const { questions, error } = parseGeneratedQuestions("no json here at all");
    expect(questions).toHaveLength(0);
    expect(error).toBeTruthy();
  });

  it("rejects malformed JSON", () => {
    const { error } = parseGeneratedQuestions("[{broken");
    expect(error).toBeTruthy();
  });
});

describe("prompt builders", () => {
  it("buildOriginalPrompt carries the exam, topic and honesty rules", () => {
    const p = buildOriginalPrompt({
      examName: "DSSSB TGT CS",
      topicName: "Operating Systems",
      conceptName: "Round Robin",
      difficulty: "HARD",
    });
    expect(p).toContain("DSSSB TGT CS");
    expect(p).toContain("Round Robin");
    expect(p).toContain("Do not reproduce any real PYQ verbatim");
  });

  it("buildVariantPrompt includes the concept and PYQ, and asks for distinct variants", () => {
    const p = buildVariantPrompt({
      examName: "DSSSB TGT CS",
      topicName: "Operating Systems",
      conceptName: "Round Robin",
      pyqText: "What is the average turnaround time of these processes under RR with quantum 2?",
      pyqExplanation: "Compute per-process completion times then average.",
      count: 3,
    });
    expect(p).toContain("Round Robin");
    expect(p).toContain("average turnaround time");
    expect(p).toContain("Create 3 distinct original questions");
  });
});
