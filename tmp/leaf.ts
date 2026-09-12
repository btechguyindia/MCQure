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
  // check leaves for the curiosity subjects
  const targets = ["Reasoning", "Arithmetic", "English", "Hindi", "Mathematics", "Business Communication"];
  for (const sub of subs) {
    if (!targets.some((t) => sub.name.startsWith(t))) continue;
    for (const t of sub.topics) {
      let cnt = 0;
      let leafList: string[] = [];
      if (t.subtopics.length === 0) {
        cnt = await p.question.count({ where: { topicId: t.id } });
        leafList = [t.name];
      } else {
        const rows = await p.subtopic.findMany({ where: { topicId: t.id }, select: { id: true, name: true } });
        leafList = rows.map((r) => r.name);
        cnt = await p.question.count({ where: { topicId: t.id, subtopicId: { in: rows.map((r) => r.id) } } });
      }
      if (cnt < 50) console.log(`${sub.name} :: ${leafList.join(", ")} => count=${cnt}`);
    }
  }
}
main().catch((e) => console.error(e)).finally(() => p.$disconnect());
