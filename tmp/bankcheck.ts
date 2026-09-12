import { PrismaClient } from "@prisma/client";
import { existsSync, readFileSync } from "node:fs";
import path from "node:path";
const p = new PrismaClient();
const BANK = "data/bank";
async function main() {
  if (!existsSync(path.join(BANK, "manifest.json"))) { console.error("no data/bank"); return; }
  const manifest = JSON.parse(readFileSync(path.join(BANK, "manifest.json"), "utf8"));
  console.log("data/bank total:", manifest.total, "topics:", manifest.topics.length);
  const exam = await p.exam.findFirst({ where: { active: true } });
  if (!exam) throw new Error("no exam");
  const subs = await p.subject.findMany({ where: { examId: exam.id }, orderBy: { order: "asc" }, include: { topics: { include: { subtopics: true } } } });
  let inPostgres = 0, inBank = 0, inBoth = 0, onlyBank = 0, onlyPostgres = 0;
  for (const sub of subs) {
    for (const t of sub.topics) {
      const bankEntry = manifest.topics.find((m) => m.subject === sub.name && m.topic === t.name);
      let pgCount = 0;
      if (t.subtopics.length === 0) pgCount = await p.question.count({ where: { topicId: t.id } });
      else pgCount = await p.question.count({ where: { topicId: t.id, subtopicId: { in: t.subtopics.map((s) => s.id) } } });
      const bkCount = bankEntry?.count ?? 0;
      if (pgCount > 0) inPostgres++;
      if (bkCount > 0) inBank++;
      if (pgCount > 0 && bkCount > 0) inBoth++;
      if (pgCount === 0 && bkCount > 0) onlyBank++;
      if (pgCount > 0 && bkCount === 0) onlyPostgres++;
    }
  }
  console.log("inPostgres:", inPostgres, "inBank:", inBank, "inBoth:", inBoth, "onlyBank:", onlyBank, "onlyPostgres:", onlyPostgres);
  console.log("Bank topics needing import to Postgres:", onlyBank);
}
main().catch((e) => console.error(e)).finally(() => p.$disconnect());
