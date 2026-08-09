import "dotenv/config";
import { describe, expect, it } from "vitest";
import { prisma } from "../lib/db";
import { recordStudyVisit } from "../lib/study-visit";
import { getPrepReport } from "../lib/tracking";

// DB-backed round trip for the preparation foundation: UserPreparation profile,
// append-only/deduplicated StudyVisit history, and the assembled PrepReport.
describe("Preparation foundation", () => {
  it("stores a UserPreparation profile and round-trips it", async () => {
    const email = `prep-${Date.now()}@test.local`;
    const user = await prisma.user.create({ data: { email, name: "Prep Test", passwordHash: "x" } });
    const exam = await prisma.exam.findFirst();
    if (!exam) throw new Error("Seed data missing: no exams");

    try {
      const prep = await prisma.userPreparation.create({
        data: {
          userId: user.id,
          examId: exam.id,
          examAttemptYear: 2026,
          targetScore: 150,
          dailyTarget: 30,
          weeklyTarget: 200,
          stage: "revision",
        },
      });
      expect(prep.targetScore).toBe(150);
      expect(prep.stage).toBe("revision");

      const updated = await prisma.userPreparation.update({
        where: { userId: user.id },
        data: { dailyTarget: 40 },
      });
      expect(updated.dailyTarget).toBe(40);
    } finally {
      await prisma.userPreparation.deleteMany({ where: { userId: user.id } });
      await prisma.user.delete({ where: { id: user.id } });
    }
  });

  it("deduplicates StudyVisit per day but keeps distinct sources", async () => {
    const email = `visit-${Date.now()}@test.local`;
    const user = await prisma.user.create({ data: { email, name: "Visit Test", passwordHash: "x" } });
    const topic = await prisma.topic.findFirst();
    if (!topic) throw new Error("Seed data missing: no topics");

    try {
      await recordStudyVisit(user.id, topic.id, "STUDY");
      await recordStudyVisit(user.id, topic.id, "STUDY"); // same day — deduplicated
      await recordStudyVisit(user.id, topic.id, "REVISION"); // different source — new row

      const visits = await prisma.studyVisit.findMany({
        where: { userId: user.id, topicId: topic.id },
      });
      expect(visits.length).toBe(2);
      expect(visits.map((v) => v.source).sort()).toEqual(["REVISION", "STUDY"]);
    } finally {
      await prisma.studyVisit.deleteMany({ where: { userId: user.id } });
      await prisma.user.delete({ where: { id: user.id } });
    }
  });

  it("assembles a PrepReport with blueprint weights and subjects", async () => {
    const email = `report-${Date.now()}@test.local`;
    const user = await prisma.user.create({ data: { email, name: "Report Test", passwordHash: "x" } });

    try {
      const report = await getPrepReport(user.id);
      expect(report.exam).not.toBeNull();
      expect(report.subjects.length).toBeGreaterThan(0);
      expect(report.topics.length).toBeGreaterThan(0);
      expect(report.coverage.totalTopics).toBe(report.topics.length);
      // Every topic carries a blueprint weight (seeded as ESTIMATED) and a state.
      for (const t of report.topics) {
        expect(t.weight).not.toBeNull();
        expect(t.completion).toBe("NOT_STARTED");
      }
      expect(report.overall.totalAttempts).toBe(0);
      expect(report.overall.mastery).toBeNull();
    } finally {
      await prisma.user.delete({ where: { id: user.id } });
    }
  });
});
