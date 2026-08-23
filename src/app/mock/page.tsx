import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { getCurrentUser } from "@/lib/api";
import { MockStudio } from "@/components/MockStudio";
import { MockIcon } from "@/components/icons";

export const metadata = { title: "Mock Tests — MCQure" };

export default async function MockPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const [subjects, sections] = await Promise.all([
    prisma.subject.findMany({
      orderBy: { order: "asc" },
      include: { topics: { orderBy: { order: "asc" }, select: { id: true, name: true } } },
    }),
    prisma.section.findMany({
      orderBy: { order: "asc" },
      include: {
        paper: { select: { name: true } },
        sectionSubjects: { include: { subject: { select: { id: true, name: true } } } },
      },
    }),
  ]);

  return (
    <div className="flex flex-col gap-6">
      <section className="card relative overflow-hidden p-5 sm:p-6">
        <div className="aurora" aria-hidden />
        <div className="relative">
          <p className="kicker">
            <MockIcon /> Exam simulation
          </p>
          <h1 className="mt-2 text-2xl font-bold tracking-tight sm:text-3xl">Mock tests</h1>
          <p className="mt-2 max-w-3xl text-sm text-muted-fg">
            Blueprint-driven mock exams. Same scoring as real practice, but tracked
            separately so you can compare mock performance against casual practice.
          </p>
        </div>
      </section>

      <MockStudio
        subjects={subjects.map((s) => ({
          id: s.id,
          name: s.name,
          topics: s.topics.map((t) => ({ id: t.id, name: t.name })),
        }))}
        sections={sections.map((sec) => ({
          id: sec.id,
          name: sec.name,
          paper: sec.paper?.name ?? "Paper",
          subjects: sec.sectionSubjects.map((ss) => ss.subject.name),
        }))}
      />
    </div>
  );
}
