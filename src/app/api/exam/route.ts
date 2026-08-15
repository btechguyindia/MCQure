import { prisma } from "@/lib/db";
import { getActiveExam, getScoringConfig } from "@/lib/practice";

// Exam configuration + syllabus, used by the Custom Practice form.
export async function GET() {
  const exam = await getActiveExam();
  if (!exam) {
    return Response.json({ ok: false, message: "No active exam configured" }, { status: 500 });
  }

  const [scoring, subjects, counts] = await Promise.all([
    getScoringConfig(exam.id),
    prisma.subject.findMany({
      where: { examId: exam.id },
      orderBy: { order: "asc" },
      include: { topics: { orderBy: { order: "asc" }, include: { subtopics: { orderBy: { order: "asc" } } } } },
    }),
    prisma.question.groupBy({
      by: ["topicId", "subtopicId"],
      where: { examId: exam.id, isActive: true },
      _count: true,
    }),
  ]);

  const countBy = new Map<string, number>();
  for (const c of counts) {
    const key = c.subtopicId ? `s:${c.subtopicId}` : `t:${c.topicId}`;
    countBy.set(key, (countBy.get(key) ?? 0) + c._count);
  }

  return Response.json({
    ok: true,
    exam: {
      id: exam.id,
      slug: exam.slug,
      name: exam.name,
      scoring: {
        totalMarks: scoring.totalMarks,
        correctMarks: scoring.correctMarks,
        incorrectPenalty: scoring.incorrectPenalty,
        unattemptedMarks: scoring.unattemptedMarks,
        timeLimitMinutes: scoring.timeLimitMinutes,
      },
      subjects: subjects.map((s) => ({
        id: s.id,
        name: s.name,
        topics: s.topics.map((t) => {
          const topicCount = countBy.get(`t:${t.id}`) ?? 0;
          const subtopicTotal = t.subtopics.reduce((sum, st) => sum + (countBy.get(`s:${st.id}`) ?? 0), 0);
          return {
            id: t.id,
            name: t.name,
            questionCount: topicCount + subtopicTotal,
            subtopics: t.subtopics.map((st) => ({
              id: st.id,
              name: st.name,
              questionCount: countBy.get(`s:${st.id}`) ?? 0,
            })),
          };
        }),
      })),
    },
  });
}
