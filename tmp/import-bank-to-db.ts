// Fast cumulative import: data/bank JSON -> Postgres Question table.
// Uses createMany for bulk inserts. Idempotent via fingerprint skip.

import "dotenv/config";
import { PrismaClient } from "@prisma/client";
import { existsSync, readFileSync } from "node:fs";
import path from "node:path";
import { createHash } from "node:crypto";

const p = new PrismaClient();
const BANK = process.env.BANK_ROOT ?? "data/bank";

function sha256(text: string): string {
  return createHash("sha256").update(text.toLowerCase().trim()).digest("hex");
}

async function main() {
  const manifest = JSON.parse(readFileSync(path.join(BANK, "manifest.json"), "utf8"));
  const exam = await p.exam.findFirst({ where: { active: true } });
  if (!exam) { console.error("no active exam"); process.exit(1); }

  const subjects = await p.subject.findMany({ where: { examId: exam.id }, include: { topics: { include: { subtopics: true } } } });
  const topicMap = new Map<string, { subjectId: string; topicId: string; subtopicId: string | null }>();
  for (const sub of subjects) {
    for (const t of sub.topics) {
      topicMap.set(`${sub.name}::${t.name}`, { subjectId: sub.id, topicId: t.id, subtopicId: null });
      for (const st of t.subtopics) {
        topicMap.set(`${sub.name}::${t.name}::${st.name}`, { subjectId: sub.id, topicId: t.id, subtopicId: st.id });
      }
    }
  }

  const existing = await p.question.findMany({ where: { examId: exam.id }, select: { fingerprint: true } });
  const existingFP = new Set(existing.map((q) => q.fingerprint).filter(Boolean));
  console.log("existing fingerprints:", existingFP.size, "| bank total:", manifest.total);

  const rows = [];
  let skippedDup = 0, skippedNoTopic = 0;

  for (const entry of manifest.topics) {
    const tm = topicMap.get(`${entry.subject}::${entry.topic}`);
    if (!tm) { skippedNoTopic += entry.count; continue; }
    const bundlePath = path.join(BANK, "questions", entry.path);
    if (!existsSync(bundlePath)) continue;
    const bundle = JSON.parse(readFileSync(bundlePath, "utf8")) as { q: any[] };

    for (const q of bundle.q) {
      const fp = sha256(q.q);
      if (existingFP.has(fp)) { skippedDup++; continue; }
      existingFP.add(fp);
      rows.push({
        examId: exam.id,
        subjectId: tm.subjectId,
        topicId: tm.topicId,
        subtopicId: tm.subtopicId,
        text: q.q,
        options: q.o.map((text: string, i: number) => ({ label: String.fromCharCode(65 + i), text })),
        correctIndex: q.c,
        explanation: q.x,
        difficulty: q.d ?? "MEDIUM",
        sourceType: "AI_GENERATED",
        isActive: true,
        qualityStatus: "APPROVED",
        fingerprint: fp,
        searchText: `${q.q} ${q.x}`.toLowerCase(),
      });
    }
  }

  // Bulk insert in chunks.
  for (let i = 0; i < rows.length; i += 200) {
    const chunk = rows.slice(i, i + 200);
    await p.question.createMany({ data: chunk });
  }

  console.log(`imported=${rows.length} skippedDup=${skippedDup} skippedNoTopic=${skippedNoTopic}`);
  console.log("DB total now:", await p.question.count({ where: { examId: exam.id } }));
}

main().catch((e) => console.error(e)).finally(() => p.$disconnect());