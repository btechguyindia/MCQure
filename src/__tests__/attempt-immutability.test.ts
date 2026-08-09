import "dotenv/config";
import { describe, expect, it } from "vitest";
import { Prisma } from "@prisma/client";
import { prisma } from "../lib/db";

// DB-backed test proving attempts are immutable: re-answering the same
// question in the same session is rejected at the database layer.
describe("Attempt immutability", () => {
  it("rejects a duplicate (user, question, session) attempt", async () => {
    const email = `immutability-${Date.now()}@test.local`;
    const user = await prisma.user.create({
      data: { email, name: "Immutability Test", passwordHash: "x" },
    });

    const question = await prisma.question.findFirst({
      where: { isActive: true },
    });
    if (!question) throw new Error("Seed data missing: no active questions");

    const session = await prisma.practiceSession.create({
      data: { userId: user.id, mode: "quick", status: "IN_PROGRESS" },
    });

    try {
      await prisma.attempt.create({
        data: {
          userId: user.id,
          questionId: question.id,
          sessionId: session.id,
          selectedIndex: 0,
          isCorrect: true,
          score: 1,
          responseTimeMs: 1000,
        },
      });

      // Second attempt for the same (user, question, session) must fail.
      await expect(
        prisma.attempt.create({
          data: {
            userId: user.id,
            questionId: question.id,
            sessionId: session.id,
            selectedIndex: 1,
            isCorrect: false,
            score: -0.25,
            responseTimeMs: 2000,
          },
        })
      ).rejects.toBeInstanceOf(Prisma.PrismaClientKnownRequestError);
    } finally {
      await prisma.practiceSession.delete({ where: { id: session.id } });
      await prisma.user.delete({ where: { id: user.id } });
    }
  });
});
