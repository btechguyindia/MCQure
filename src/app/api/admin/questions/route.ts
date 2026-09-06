import { prisma } from "@/lib/db";
import { jsonOk, isNextResponse } from "@/lib/api";
import { requireAdmin } from "@/lib/admin";

export async function GET() {
  const admin = await requireAdmin();
  if (isNextResponse(admin)) return admin;

  const [
    totalQuestions,
    bySource,
    byDifficulty,
    byQuality,
    bySubject,
    topAttempted,
    leastAttempted,
    duplicates,
    ingestionJobs,
    reports,
  ] = await Promise.all([
    prisma.question.count(),
    prisma.question.groupBy({ by: ["sourceType"], _count: { id: true }, orderBy: { _count: { id: "desc" } } }),
    prisma.question.groupBy({ by: ["difficulty"], _count: { id: true } }),
    prisma.question.groupBy({ by: ["qualityStatus"], _count: { id: true } }),
    prisma.question.groupBy({
      by: ["subjectId"],
      _count: { id: true },
      _avg: { examRelevance: true },
      orderBy: { _count: { id: "desc" } },
      take: 20,
    }),
    prisma.question.findMany({
      orderBy: { timesAttempted: "desc" },
      take: 20,
      select: {
        id: true,
        text: true,
        difficulty: true,
        sourceType: true,
        timesAttempted: true,
        timesCorrect: true,
        timesIncorrect: true,
        avgResponseTimeMs: true,
        examRelevance: true,
        qualityStatus: true,
        subject: { select: { name: true } },
        topic: { select: { name: true } },
      },
    }),
    prisma.question.findMany({
      where: { isActive: true },
      orderBy: { timesAttempted: "asc" },
      take: 20,
      select: {
        id: true,
        text: true,
        difficulty: true,
        sourceType: true,
        timesAttempted: true,
        qualityStatus: true,
        subject: { select: { name: true } },
        topic: { select: { name: true } },
      },
    }),
    prisma.questionDuplicate.groupBy({ by: ["method"], _count: { id: true }, _avg: { similarity: true } }),
    prisma.ingestionJob.findMany({
      orderBy: { createdAt: "desc" },
      take: 20,
      select: {
        id: true,
        kind: true,
        status: true,
        requested: true,
        processed: true,
        accepted: true,
        rejected: true,
        error: true,
        createdAt: true,
        completedAt: true,
      },
    }),
    prisma.questionReport.count(),
  ]);

  // Resolve subject names for subject breakdown
  const subjectIds = bySubject.map((s) => s.subjectId);
  const subjects = await prisma.subject.findMany({
    where: { id: { in: subjectIds } },
    select: { id: true, name: true },
  });
  const subjectMap = new Map(subjects.map((s) => [s.id, s.name]));
  const subjectBreakdown = bySubject.map((s) => ({
    subject: subjectMap.get(s.subjectId) ?? s.subjectId,
    count: s._count.id,
    avgRelevance: s._avg.examRelevance ? Math.round(s._avg.examRelevance * 10) / 10 : null,
  }));

  return jsonOk({
    questions: {
      total: totalQuestions,
      bySource: bySource.map((s) => ({ source: s.sourceType, count: s._count.id })),
      byDifficulty: byDifficulty.map((d) => ({ difficulty: d.difficulty, count: d._count.id })),
      byQuality: byQuality.map((q) => ({ status: q.qualityStatus, count: q._count.id })),
      bySubject: subjectBreakdown,
      topAttempted: topAttempted.map((q) => ({
        id: q.id,
        text: q.text.slice(0, 120),
        subject: q.subject.name,
        topic: q.topic.name,
        difficulty: q.difficulty,
        sourceType: q.sourceType,
        timesAttempted: q.timesAttempted,
        timesCorrect: q.timesCorrect,
        timesIncorrect: q.timesIncorrect,
        avgResponseTimeMs: q.avgResponseTimeMs,
        examRelevance: q.examRelevance,
        qualityStatus: q.qualityStatus,
        accuracy: q.timesAttempted > 0 ? Math.round((q.timesCorrect / q.timesAttempted) * 1000) / 10 : null,
      })),
      leastAttempted: leastAttempted.map((q) => ({
        id: q.id,
        text: q.text.slice(0, 120),
        subject: q.subject.name,
        topic: q.topic.name,
        difficulty: q.difficulty,
        sourceType: q.sourceType,
        timesAttempted: q.timesAttempted,
        qualityStatus: q.qualityStatus,
      })),
      duplicates: duplicates.map((d) => ({
        method: d.method,
        count: d._count.id,
        avgSimilarity: d._avg.similarity ? Math.round(d._avg.similarity * 1000) / 1000 : null,
      })),
      totalReports: reports,
    },
    ingestionJobs: ingestionJobs.map((j) => ({
      id: j.id,
      kind: j.kind,
      status: j.status,
      requested: j.requested,
      processed: j.processed,
      accepted: j.accepted,
      rejected: j.rejected,
      error: j.error,
      createdAt: j.createdAt,
      completedAt: j.completedAt,
    })),
  });
}
