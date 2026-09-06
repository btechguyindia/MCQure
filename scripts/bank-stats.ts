// Prints dataset statistics for the offline question bank:
//   - total questions, subjects, topics
//   - per-subject and per-topic counts
//   - difficulty / provenance distribution
//   - verified vs unverified split
//   - bytes on disk
//
// Read-only; never touches Postgres.
//
// Usage:
//   npx tsx scripts/bank-stats.ts
//   BANK_ROOT=./my-bank npx tsx scripts/bank-stats.ts

import { readFileSync, readdirSync, statSync } from "node:fs";
import path from "node:path";
import { bankManifestSchema, topicBankSchema } from "../src/lib/bank/format";

const OUT = process.env.BANK_ROOT ?? "data/bank";

function walk(dir: string): string[] {
  const out: string[] = [];
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) out.push(...walk(full));
    else if (entry.name.endsWith(".json")) out.push(full);
  }
  return out;
}

function main() {
  const root = path.join(process.cwd(), OUT);
  const manifest = bankManifestSchema.safeParse(
    JSON.parse(readFileSync(path.join(root, "manifest.json"), "utf8"))
  );
  if (!manifest.success) {
    console.error(`[stats] invalid manifest: ${manifest.error.message}`);
    process.exit(1);
  }

  const perSubject = new Map<string, number>();
  const perTopic = new Map<string, number>();
  const difficulty = new Map<string, number>();
  const provenance = new Map<string, number>();
  let verified = 0;
  let withYears = 0;
  let minPerTopic = Number.POSITIVE_INFINITY;
  let maxPerTopic = 0;
  let minTopic = "";
  let maxTopic = "";

  for (const t of manifest.data.topics) {
    const bundle = topicBankSchema.safeParse(
      JSON.parse(readFileSync(path.join(root, "questions", t.path), "utf8"))
    );
    if (!bundle.success) continue;
    perSubject.set(t.subject, (perSubject.get(t.subject) ?? 0) + bundle.data.q.length);
    perTopic.set(`${t.subject} :: ${t.topic}`, bundle.data.q.length);
    if (bundle.data.q.length < minPerTopic) {
      minPerTopic = bundle.data.q.length;
      minTopic = `${t.subject} :: ${t.topic}`;
    }
    if (bundle.data.q.length > maxPerTopic) {
      maxPerTopic = bundle.data.q.length;
      maxTopic = `${t.subject} :: ${t.topic}`;
    }
    for (const q of bundle.data.q) {
      difficulty.set(q.d, (difficulty.get(q.d) ?? 0) + 1);
      const source = q.s ?? "AI_GENERATED";
      provenance.set(source, (provenance.get(source) ?? 0) + 1);
      if (q.v) verified += 1;
      if (q.y && q.y.length > 0) withYears += 1;
    }
  }

  let bytes = 0;
  for (const f of walk(path.join(root, "questions"))) bytes += statSync(f).size;

  console.log(`Offline question bank: ${OUT}`);
  console.log(`  Exam ................. ${manifest.data.exam} (format schema v${manifest.data.schema})`);
  console.log(`  Generated ............ ${manifest.data.generatedAt}`);
  console.log(`  Total questions ...... ${manifest.data.total}`);
  console.log(`  Subjects ............. ${perSubject.size}`);
  console.log(`  Topics ............... ${perTopic.size}`);
  console.log(`  Min per topic ........ ${minPerTopic} (${minTopic})`);
  console.log(`  Max per topic ........ ${maxPerTopic} (${maxTopic})`);
  console.log(`  Verified ............. ${verified} (${withYears} with verified PYQ years)`);
  console.log(`  Bytes on disk ........ ${(bytes / 1024).toFixed(1)} KiB`);
  console.log("");

  console.log("Per subject:");
  for (const [subject, count] of [...perSubject.entries()].sort((a, b) => b[1] - a[1])) {
    console.log(`  ${String(count).padStart(5)}  ${subject}`);
  }
  console.log("");

  console.log("By difficulty:");
  for (const [d, count] of [...difficulty.entries()].sort((a, b) => b[1] - a[1])) {
    console.log(`  ${String(count).padStart(5)}  ${d}`);
  }
  console.log("");

  console.log("By provenance:");
  for (const [p, count] of [...provenance.entries()].sort((a, b) => b[1] - a[1])) {
    console.log(`  ${String(count).padStart(5)}  ${p}`);
  }
  console.log("");

  console.log("Bottom 10 topics (by count):");
  for (const [topic, count] of [...perTopic.entries()].sort((a, b) => a[1] - b[1]).slice(0, 10)) {
    console.log(`  ${String(count).padStart(5)}  ${topic}`);
  }
}

main();