import "dotenv/config";
import { describe, expect, it } from "vitest";
import { prisma } from "../lib/db";
import { createPyq, listPyqs, listPyqYears } from "../lib/pyq";

// DB-backed round trip proving created PYQ entries start UNVERIFIED and are
// listed back with year filtering intact.
describe("PYQ bank lifecycle", () => {
  it("creates UNVERIFIED and round-trips through list", async () => {
    const exam = await prisma.exam.findFirst();
    if (!exam) throw new Error("Seed data missing: no exams");

    const year = 2019;
    const created = await createPyq(exam.id, exam.name, {
      year,
      paper: "Paper II",
      questionText: "Round trip question",
      options: ["A", "B", "C", "D"],
      correctIndex: 1,
      source: "Unit test source",
      sourceUrl: "https://example.test/paper",
    });

    try {
      expect(created.verificationStatus).toBe("UNVERIFIED");
      expect(created.examName).toBe(exam.name);

      const years = await listPyqYears(exam.id);
      expect(years).toContain(year);

      const all = await listPyqs(exam.id);
      expect(all.some((p) => p.id === created.id)).toBe(true);

      const filtered = await listPyqs(exam.id, year);
      expect(filtered.some((p) => p.id === created.id)).toBe(true);

      const wrongYear = await listPyqs(exam.id, 1980);
      expect(wrongYear.some((p) => p.id === created.id)).toBe(false);
    } finally {
      await prisma.pyq.delete({ where: { id: created.id } });
    }
  });
});
