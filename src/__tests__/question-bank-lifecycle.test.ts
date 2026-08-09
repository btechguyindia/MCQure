import "dotenv/config";
import { describe, expect, it } from "vitest";
import { prisma } from "../lib/db";
import { createQuestion, listQuestionBank } from "../lib/question-bank";
import { nextAttemptCounters } from "../lib/question-stats";

// DB-backed round trip for the large question bank: guarded creation (dedup +
// quality), running counters, explorer filtering and cursor pagination.
describe("Large question bank", () => {
  const marker = Date.now();

  async function fixtures() {
    const exam = await prisma.exam.findFirst({ where: { active: true } });
    const subject = await prisma.subject.findFirst();
    const topic = await prisma.topic.findFirst();
    if (!exam || !subject || !topic) throw new Error("Seed data missing");
    return { exam, subject, topic };
  }

  it("creates a question with quality/dedup metadata and rejects exact duplicates", async () => {
    const { exam, subject, topic } = await fixtures();
    const text = `Which operating system scheduling policy gives the highest average response time guarantee? (marker ${marker})`;
    const options = ["FCFS", "Round Robin", "Priority", "SJF"].map((t, i) => ({
      label: String.fromCharCode(65 + i),
      text: t,
    }));
    const ids: string[] = [];

    try {
      const created = await createQuestion({
        examId: exam.id,
        subjectId: subject.id,
        topicId: topic.id,
        sourceType: "USER_CREATED",
        source: { type: "USER_CREATED", name: "Lifecycle test" },
        text,
        options,
        correctIndex: 1,
        explanation:
          "Round robin bounds the worst-case wait, giving a predictable response-time guarantee across all processes.",
        difficulty: "MEDIUM",
      });
      expect(created.ok && created.created).toBe(true);
      if (!created.ok || !created.created) throw new Error("create failed");
      ids.push(created.question.id);
      expect(created.question.qualityStatus).toBe("APPROVED");

      const row = await prisma.question.findUnique({ where: { id: created.question.id } });
      expect(row).not.toBeNull();
      if (!row) throw new Error("row missing");
      expect(row.fingerprint).not.toBeNull();
      expect(row.normalizedText).not.toBeNull();
      expect(row.searchText).not.toBe("");
      expect(row.timesAttempted).toBe(0);

      const dup = await createQuestion({
        examId: exam.id,
        subjectId: subject.id,
        topicId: topic.id,
        sourceType: "USER_CREATED",
        source: { type: "USER_CREATED", name: "Lifecycle test" },
        text: `  ${text}  `, // whitespace noise — still an exact duplicate
        options,
        correctIndex: 1,
        explanation:
          "Round robin bounds the worst-case wait, giving a predictable response-time guarantee across all processes.",
        difficulty: "MEDIUM",
      });
      expect(dup.ok && !dup.created).toBe(true);
      if (!dup.ok || dup.created) throw new Error("duplicate not caught");
      expect(dup.duplicate.method).toBe("EXACT");
      expect(dup.duplicate.id).toBe(created.question.id);

      const count = await prisma.question.count({
        where: { fingerprint: row.fingerprint! },
      });
      expect(count).toBe(1);
    } finally {
      await prisma.question.deleteMany({ where: { id: { in: ids } } });
      await prisma.questionSource.deleteMany({ where: { name: "Lifecycle test" } });
    }
  });

  it("rejects questions that fail the quality gate", async () => {
    const { exam, subject, topic } = await fixtures();
    const res = await createQuestion({
      examId: exam.id,
      subjectId: subject.id,
      topicId: topic.id,
      sourceType: "AI_GENERATED",
      text: "tiny",
      options: [{ label: "A", text: "x" }],
      correctIndex: 9,
      explanation: "",
      difficulty: "MEDIUM",
    });
    expect(res.ok).toBe(false);
    if (res.ok) throw new Error("should not create");
    expect(res.reason).toBe("quality_rejected");
  });

  it("applies running attempt counters", async () => {
    const base = {
      timesAttempted: 0,
      timesCorrect: 0,
      timesIncorrect: 0,
      timesSkipped: 0,
      answeredCount: 0,
      avgResponseTimeMs: 0,
    };
    const first = nextAttemptCounters(base, true, 4000);
    expect(first.timesAttempted).toBe(1);
    expect(first.timesCorrect).toBe(1);
    expect(first.answeredCount).toBe(1);
    expect(first.avgResponseTimeMs).toBe(4000);

    const second = nextAttemptCounters(first, false, 8000);
    expect(second.timesIncorrect).toBe(1);
    expect(second.answeredCount).toBe(2);
    expect(second.avgResponseTimeMs).toBe(6000);

    const skipped = nextAttemptCounters(second, null, 0);
    expect(skipped.timesSkipped).toBe(1);
    expect(skipped.answeredCount).toBe(2); // skips don't affect accuracy denominator
    expect(skipped.timesAttempted).toBe(3);
  });

  it("lists questions with filters and paginates by cursor without overlap", async () => {
    const { exam, subject, topic } = await fixtures();
    const ids: string[] = [];
    const source = { type: "USER_CREATED" as const, name: "Pagination test" };

    try {
      const paginationTexts = [
        `What does a semaphore value of zero indicate about a counting semaphore in an operating system? (marker ${marker})`,
        `Which data structure is most commonly used to implement a priority queue inside a CPU scheduler? (marker ${marker})`,
        `In paging, what is the name of the phenomenon where program references cluster on a small set of pages? (marker ${marker})`,
      ];
      for (const text of paginationTexts) {
        const res = await createQuestion({
          examId: exam.id,
          subjectId: subject.id,
          topicId: topic.id,
          sourceType: "USER_CREATED",
          source,
          text,
          options: ["Alpha", "Beta", "Gamma", "Delta"].map((t, j) => ({
            label: String.fromCharCode(65 + j),
            text: t,
          })),
          correctIndex: 0,
          explanation:
            "This explanation is long enough to satisfy the quality gate and is specific to the cursor pagination lifecycle test.",
          difficulty: "EASY",
        });
        if (!res.ok || !res.created) throw new Error("create failed in pagination");
        ids.push(res.question.id);
      }

      const first = await listQuestionBank({ subjectId: subject.id, query: `marker ${marker}`, limit: 2 });
      expect(first.total).toBe(3);
      expect(first.items.length).toBe(2);
      expect(first.nextCursor).not.toBeNull();

      const second = await listQuestionBank({
        subjectId: subject.id,
        query: `marker ${marker}`,
        limit: 2,
        cursor: first.nextCursor!,
      });
      expect(second.items.length).toBe(1);

      const seen = [...first.items.map((q) => q.id), ...second.items.map((q) => q.id)];
      expect(new Set(seen).size).toBe(3); // no overlap, all three recovered
      for (const id of ids) expect(seen).toContain(id);
    } finally {
      await prisma.question.deleteMany({ where: { id: { in: ids } } });
      await prisma.questionSource.deleteMany({ where: { name: "Pagination test" } });
    }
  });

  it("maps a sectionId filter to its subjects without error", async () => {
    const section = await prisma.section.findFirst();
    if (!section) throw new Error("Seed data missing: no sections");
    const page = await listQuestionBank({ sectionId: section.id });
    expect(Array.isArray(page.items)).toBe(true);
    expect(page.total).toBeGreaterThanOrEqual(0);
  });
});
