import { PrismaClient } from "@prisma/client";
const p = new PrismaClient();
async function main() {
  const exam = await p.exam.findFirst({ where: { active: true } });
  if (!exam) throw new Error("no exam");
  const subs = await p.subject.findMany({ where: { examId: exam.id }, orderBy: { order: "asc" }, include: { topics: { include: { subtopics: true } } } });
  let zeroLeaves = 0, under50 = 0, totalQ = 0;
  for (const sub of subs) {
    let subZero = 0, subUnder = 0, subTotal = 0;
    for (const t of sub.topics) {
      let cnt = 0;
      if (t.subtopics.length === 0) cnt = await p.question.count({ where: { topicId: t.id } });
      else cnt = await p.question.count({ where: { topicId: t.id, subtopicId: { in: t.subtopics.map((s) => s.id) } } });
      totalQ += cnt; subTotal += cnt;
      if (cnt === 0) subZero++;
      else if (cnt < 50) subUnder++;
    }
    zeroLeaves += subZero; under50 += subUnder;
    if (subZero || subUnder) console.log(`[${sub.name}] total=${subTotal} zero=${subZero} under50=${subUnder}`);
  }
  console.log(`\nTOTAL questions=${totalQ} zeroLeafTopics=${zeroLeaves} under50LeafTopics=${under50}`);
}
main().catch((e) => console.error(e)).finally(() => p.$disconnect());