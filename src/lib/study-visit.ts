import type { VisitSource } from "@prisma/client";
import { prisma } from "./db";

// Record a topic engagement (studying material or a targeted revision).
// Append-only history, deduplicated to one row per (user, topic, source, day)
// so "last studied" stays meaningful without unbounded row growth.
export async function recordStudyVisit(
  userId: string,
  topicId: string,
  source: VisitSource
): Promise<void> {
  const start = new Date();
  start.setHours(0, 0, 0, 0);
  const end = new Date(start.getTime() + 24 * 60 * 60 * 1000);

  const existing = await prisma.studyVisit.findFirst({
    where: { userId, topicId, source, createdAt: { gte: start, lt: end } },
  });
  if (existing) return;

  await prisma.studyVisit.create({ data: { userId, topicId, source } });
}
