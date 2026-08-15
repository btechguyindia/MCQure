import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { getCurrentUser } from "@/lib/api";
import { MockStudio } from "@/components/MockStudio";

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
      <header>
        <h1 className="text-2xl font-bold">📝 Mock tests</h1>
        <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
          Blueprint-driven mock exams. Same scoring as real practice, but tracked
          separately so you can compare mock performance against casual practice.
        </p>
      </header>

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
