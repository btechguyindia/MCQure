import { PrismaClient } from "@prisma/client";
const p = new PrismaClient();
async function main() {
  const exam = await p.exam.findFirst({ where: { active: true } });
  if (!exam) throw new Error("no exam");
  const subs = await p.subject.findMany({
    where: { examId: exam.id },
    orderBy: { order: "asc" },
    include: { topics: true },
  });
  for (const sub of subs) {
    if (!sub.name.includes("Reasoning")) continue;
    const res = await Promise.all(sub.topics.map(async (t) => {
      const cnt = await p.question.count({ where: { topicId: t.id } });
      return { name: t.name, cnt };
    }));
    console.log("[General Intelligence & Reasoning]");
    for (const r of res) console.log(`  ${r.name} => ${r.cnt}`);
  }
}
main().catch((e) => console.error(e)).finally(() => p.$disconnect());