import { PrismaClient } from "@prisma/client";
const p = new PrismaClient();
async function main() {
  const exam = await p.exam.findFirst({ where: { active: true } });
  if (!exam) throw new Error("no exam");
  const subs = await p.subject.findMany({
    where: { examId: exam.id },
    orderBy: { order: "asc" },
    include: { topics: { include: { subtopics: true } } },
  });
  let zeroSubjects = 0;
  for (const sub of subs) {
    let zero = 0;
    let total = 0;
    const zeroList: string[] = [];
    for (const t of sub.topics) {
      let cnt = 0;
      if (t.subtopics.length === 0) {
        cnt = await p.question.count({ where: { topicId: t.id } });
      } else {
        cnt = await p.question.count({ where: { topicId: t.id, subtopicId: { in: t.subtopics.map((s) => s.id) } } });
      }
      total += cnt;
      if (cnt === 0) { zero += 1; zeroList.push(t.name); }
    }
    if (zero > 0) {
      zeroSubjects += 1;
      console.log(`[${sub.name}] total=${total} zero=${zero} :: ${zeroList.join(" | ")}`);
    }
  }
  console.log("\nSubjects still having zero-question topics:", zeroSubjects);
}
main().catch((e) => console.error(e)).finally(() => p.$disconnect());