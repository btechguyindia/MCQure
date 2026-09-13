// Syncs the offline bank (data/bank) into the live Postgres Question table.
//
// The practice engine (src/lib/practice.ts) serves questions from Postgres,
// while the bulk generator (scripts/generate-bank.ts) writes JSON bundles to
// data/bank. This bridge is the only writer reconciling the two: for every
// topic bundle it inserts questions whose fingerprint is not yet present,
// then mirrors the bank to public/bank for the offline client path.
//
// Usage:
//   npx tsx scripts/sync-bank.ts
//   BANK_ROOT=/path/to/bank npx tsx scripts/sync-bank.ts

import "dotenv/config";
import { PrismaClient } from "@prisma/client";
import { existsSync, readFileSync } from "node:fs";
import * as path from "node:path";
import { createHash } from "node:crypto";
import { spawnSync } from "node:child_process";

const p = new PrismaClient();
const BANK = process.env.BANK_ROOT ?? "data/bank";

function sha256(text: string): string {
  return createHash("sha256").update(text.toLowerCase().trim()).digest("hex");
}

async function main() {
  const manifest = JSON.parse(readFileSync(path.join(BANK, "manifest.json"), "utf8"));
  const exam = await p.exam.findFirst({ where: { active: true } });
  if (!exam) {
    console.error("no active exam");
    process.exit(1);
  }

  const subjects = await p.subject.findMany({
    where: { examId: exam.id },
    include: { topics: { include: { subtopics: true } } },
  });
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
  console.log(`[sync] existing fingerprints: ${existingFP.size} | bank total: ${manifest.total}`);

  const rows: any[] = [];
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

  for (let i = 0; i < rows.length; i += 200) {
    await p.question.createMany({ data: rows.slice(i, i + 200) });
  }

  console.log(`[sync] imported=${rows.length} skippedDup=${skippedDup} skippedNoTopic=${skippedNoTopic}`);
  console.log(`[sync] DB total now: ${await p.question.count({ where: { examId: exam.id } })}`);

  const mirror = spawnSync("node", ["scripts/mirror-bank.mjs"], { stdio: "inherit", shell: true });
  console.log(`[sync] mirror exit=${mirror.status}`);
}

main().catch((e) => console.error(e)).finally(() => p.$disconnect());