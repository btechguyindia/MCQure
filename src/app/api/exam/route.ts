import { prisma } from "@/lib/db";
import { getActiveExam, getScoringConfig } from "@/lib/practice";

// Exam configuration + syllabus, used by the Custom Practice form.
export async function GET() {
  const exam = await getActiveExam();
  if (!exam) {
    return Response.json({ ok: false, message: "No active exam configured" }, { status: 500 });
  }

  const [scoring, subjects] = await Promise.all([
    getScoringConfig(exam.id),
    prisma.subject.findMany({
      where: { examId: exam.id },
      orderBy: { order: "asc" },
      include: { topics: { orderBy: { order: "asc" }, include: { subtopics: { orderBy: { order: "asc" } } } } },
    }),
  ]);

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
        topics: s.topics.map((t) => ({
          id: t.id,
          name: t.name,
          subtopics: t.subtopics.map((st) => ({ id: st.id, name: st.name })),
        })),
      })),
    },
  });
}
