// Resumable bulk question generation for the offline DSSSB TGT CS bank.
//
// Like the exploded seed-import flow, this is a DB-free pipeline:
//
//   Source → Validate → Normalize → Deduplicate → Quality Check
//         → Partition by Topic → Generate Manifest → Offline Bank
//
// Every generated question is written into data/bank (partitioned per topic)
// as compact JSON — never into Postgres. All content is AI_GENERATED original
// content (or PYQ_VARIANT) and is never claimed to be an authentic PYQ.
//
// Scheduling is coverage-first: leaf units (subtopic, or topic-with-no-
// subtopics) are processed fewest-questions-first, so every zero-question
// topic gets seeded before any single leaf is deep-filled.
//
// Resumability: progress is tracked per leaf in .data/generation-state.json.
// Re-running skips leaves already at/above the target.
//
// Usage:
//   npx tsx scripts/generate-bank.ts [--min 200] [--batch 12]
//   npx tsx scripts/generate-bank.ts --workers 3
//   npx tsx scripts/generate-bank.ts --until <iso>   # stop after a deadline
//
// Env:
//   GEMINI_API_KEY         required (real key; placeholder keys are rejected)
//   MIN_QUESTIONS_PER_LEAF default 200
//   BANK_ROOT              default data/bank

import "dotenv/config";
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import { z } from "zod";
import { SUBJECTS } from "../prisma/seed-data/syllabus";
import { generateWithGemini } from "../src/lib/ai";
import {
  bankRelPath,
  BANK_EXAM,
  BANK_VERSION,
  questionSlug,
  serializeTopicBank,
  type BankManifest,
  type CompactBankQuestion,
} from "../src/lib/bank/format";
import { evaluateQuestionQuality } from "../src/lib/question-quality";
import { classifyDuplicate } from "../src/lib/dedup";
import type { BankDifficulty } from "../src/lib/bank/format";

const OUT = process.env.BANK_ROOT ?? "data/bank";
const STATE_FILE = path.join(process.cwd(), ".data", "generation-state.json");

interface LeafUnit {
  key: string; // "subject :: topic :: subtopic" or "subject :: topic"
  subjectName: string;
  topicName: string;
  subtopicName: string | null;
}

interface State {
  completed: Record<string, number>; // leaf key -> questions currently in bank
}

function loadState(): State {
  if (!existsSync(STATE_FILE)) return { completed: {} };
  try {
    return JSON.parse(readFileSync(STATE_FILE, "utf8")) as State;
  } catch {
    return { completed: {} };
  }
}

function saveState(state: State) {
  mkdirSync(path.dirname(STATE_FILE), { recursive: true });
  writeFileSync(STATE_FILE, JSON.stringify(state, null, 2));
}

function parseArgs(argv: string[]) {
  const args: Record<string, string> = {};
  for (let i = 0; i < argv.length; i += 1) {
    const a = argv[i];
    if (a.startsWith("--")) {
      const key = a.slice(2);
      const val = argv[i + 1];
      args[key] = val && !val.startsWith("--") ? val : "true";
    }
  }
  return args;
}

const generatedSchema = z.object({
  text: z.string().trim().min(10),
  options: z.array(z.string().trim().min(1)).length(4),
  correctIndex: z.number().int().min(0).max(3),
  explanation: z.string().trim().min(1),
  difficulty: z.enum(["EASY", "MEDIUM", "HARD", "VERY_HARD"]).default("MEDIUM"),
});

type Generated = z.infer<typeof generatedSchema>;

function parseJsonArray(text: string): Generated[] {
  const fenced = text.match(/```(?:json)?\s*([\s\S]*?)```/g);
  const body = fenced ? fenced.join("\n") : text;
  const start = body.indexOf("[");
  const end = body.lastIndexOf("]");
  if (start === -1 || end === -1 || end < start) return [];
  const parsed: unknown = JSON.parse(body.slice(start, end + 1));
  if (!Array.isArray(parsed)) return [];
  const out: Generated[] = [];
  for (const raw of parsed) {
    const r = generatedSchema.safeParse(raw);
    if (r.success) out.push(r.data);
  }
  return out;
}

const DIFFICULTY_CYCLE: BankDifficulty[] = ["EASY", "MEDIUM", "MEDIUM", "HARD"];

function buildPrompt(leaf: LeafUnit, batch: number, difficulty: BankDifficulty): string {
  const lines = [
    "You are writing original multiple-choice exam questions for a serious exam-prep product (DSSSB TGT Computer Science).",
    `Subject: ${leaf.subjectName}`,
    `Topic: ${leaf.topicName}`,
    leaf.subtopicName ? `Subtopic/concept: ${leaf.subtopicName}` : null,
    `Difficulty: ${difficulty}`,
    "",
    `Create exactly ${batch} distinct original questions. Vary the phrasing, numbers, options and scenarios between questions.`,
    "They must be technically accurate and exam-appropriate. Do not write code fences, markdown, or any text outside the JSON.",
    "",
    "Return ONLY a JSON array. Each item has exactly these keys: text (string), options (array of exactly 4 strings), correctIndex (0-3), explanation (string, 2-4 sentences), difficulty (EASY|MEDIUM|HARD|VERY_HARD).",
  ].filter((l): l is string => l !== null);
  return lines.join("\n");
}

function writeLeafBucket(leaf: LeafUnit, bucket: CompactBankQuestion[]) {
  const rel = bankRelPath(leaf.subjectName, leaf.topicName);
  const abs = path.join(OUT, "questions", rel);
  mkdirSync(path.dirname(abs), { recursive: true });
  const sorted = [...bucket].sort((a, b) => (a.i < b.i ? -1 : 1));
  writeFileSync(
    abs,
    serializeTopicBank({ v: BANK_VERSION, s: leaf.subjectName, t: leaf.topicName, q: sorted }),
    "utf8"
  );
}

async function generateBatch(
  leaf: LeafUnit,
  batch: number,
  bucket: CompactBankQuestion[],
  model?: string
): Promise<{ created: number; duplicates: number; qualityRejected: number; errors: string[] }> {
  const difficulty = DIFFICULTY_CYCLE[Math.floor(Math.random() * DIFFICULTY_CYCLE.length)];
  const res = await generateWithGemini({
    prompt: buildPrompt(leaf, batch, difficulty),
    temperature: 0.9,
    maxOutputTokens: 8192,
    model,
  });
  const questions = parseJsonArray(res.text);
  const result = { created: 0, duplicates: 0, qualityRejected: 0, errors: [] as string[] };
  if (questions.length === 0) {
    result.errors.push(`No valid questions parsed (raw ${res.text.length} chars)`);
    return result;
  }

  for (const q of questions) {
    const slug = questionSlug(q.text);
    // Exact + near dedup against everything already in the bundle.
    if (bucket.some((b) => b.i === slug)) {
      result.duplicates += 1;
      continue;
    }
    let near = false;
    for (const b of bucket) {
      if (classifyDuplicate(q.text, b.q)) {
        near = true;
        break;
      }
    }
    if (near) {
      result.duplicates += 1;
      continue;
    }

    const quality = evaluateQuestionQuality({
      text: q.text,
      options: q.options.map((text) => ({ text })),
      correctIndex: q.correctIndex,
      explanation: q.explanation,
    });
    if (quality.status === "REJECTED") {
      result.qualityRejected += 1;
      continue;
    }

    bucket.push({
      i: slug,
      d: q.difficulty,
      q: q.text,
      o: q.options as [string, string, string, string],
      c: q.correctIndex,
      x: q.explanation,
      u: leaf.subtopicName ?? undefined,
      s: "AI_GENERATED",
      v: false,
    });
    result.created += 1;
  }
  return result;
}

async function sleep(ms: number) {
  return new Promise((r) => setTimeout(r, ms));
}

function rebuildManifest(buckets: Map<string, { subject: string; topic: string; qs: CompactBankQuestion[] }>) {
  let total = 0;
  const topics: BankManifest["topics"] = [];
  for (const [, b] of [...buckets.entries()].sort(([a], [c]) => (a < c ? -1 : 1))) {
    const rel = bankRelPath(b.subject, b.topic);
    topics.push({ subject: b.subject, topic: b.topic, path: rel, count: b.qs.length });
    total += b.qs.length;
  }
  const manifest: BankManifest = {
    v: 1,
    schema: BANK_VERSION,
    exam: BANK_EXAM,
    generatedAt: new Date().toISOString(),
    total,
    topics,
  };
  mkdirSync(OUT, { recursive: true });
  writeFileSync(path.join(OUT, "manifest.json"), JSON.stringify(manifest, null, 2), "utf8");
}

function collectAllBuckets(): Map<string, { subject: string; topic: string; qs: CompactBankQuestion[] }> {
  const buckets = new Map<string, { subject: string; topic: string; qs: CompactBankQuestion[] }>();
  for (const subject of SUBJECTS) {
    for (const topic of subject.topics) {
      const rel = bankRelPath(subject.name, topic.name);
      const file = path.join(OUT, "questions", rel);
      if (!existsSync(file)) continue;
      const raw = JSON.parse(readFileSync(file, "utf8")) as { q: CompactBankQuestion[] };
      buckets.set(`${subject.name}::${topic.name}`, {
        subject: subject.name,
        topic: topic.name,
        qs: raw.q ?? [],
      });
    }
  }
  return buckets;
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  const min = Number(args.min ?? process.env.MIN_QUESTIONS_PER_LEAF ?? 200);
  const batch = Number(args.batch ?? process.env.BATCH_SIZE ?? 12);
  const workers = Number(args.workers ?? process.env.WORKERS ?? 3);
  const model = args.model ?? process.env.GEMINI_MODEL ?? undefined;
  const deadline = args.until ? new Date(args.until) : null;

  if (!process.env.GEMINI_API_KEY) {
    console.error("[gen] GEMINI_API_KEY is not set — no AI generation is possible yet.");
    console.error("[gen] Set a real key, then re-run. The pipeline, dedup and manifest logic are ready.");
    process.exit(1);
  }

  // Leaf units straight from the syllabus (DB-free).
  const leaves: LeafUnit[] = [];
  for (const subject of SUBJECTS) {
    for (const topic of subject.topics) {
      if (topic.subtopics.length === 0) {
        leaves.push({
          key: `${subject.name} :: ${topic.name}`,
          subjectName: subject.name,
          topicName: topic.name,
          subtopicName: null,
        });
      } else {
        for (const st of topic.subtopics) {
          leaves.push({
            key: `${subject.name} :: ${topic.name} :: ${st.name}`,
            subjectName: subject.name,
            topicName: topic.name,
            subtopicName: st.name,
          });
        }
      }
    }
  }

  const buckets = collectAllBuckets();
  const leafCount = (leaf: LeafUnit) => {
    const bucket = buckets.get(`${leaf.subjectName}::${leaf.topicName}`);
    if (!bucket) return 0;
    if (leaf.subtopicName) return bucket.qs.filter((q) => q.u === leaf.subtopicName).length;
    return bucket.qs.filter((q) => !q.u).length;
  };

  // Coverage-first: fewest-questions-first.
  leaves.sort((a, b) => leafCount(a) - leafCount(b));

  const state = loadState();
  console.log(`[gen] leaves=${leaves.length} min=${min} batch=${batch} workers=${workers} out=${OUT}`);

  let totalCreated = 0;
  let totalDupes = 0;
  let totalQualityRejected = 0;
  let totalErrors = 0;

  const pending = leaves.slice();
  let nextIndex = 0;

  const processLeaf = async (leaf: LeafUnit): Promise<void> => {
    const rel = `${leaf.subjectName}::${leaf.topicName}`;
    const bucket = buckets.get(rel) ?? { subject: leaf.subjectName, topic: leaf.topicName, qs: [] };
    let have = leafCount(leaf);
    state.completed[leaf.key] = have;

    if (have >= min) {
      console.log(`[gen] SKIP (${have}) ${leaf.key}`);
      return;
    }
    console.log(`[gen] START (${have}/${min}) ${leaf.key}`);

    let consecutiveFailures = 0;
    while (have < min) {
      if (deadline && Date.now() > deadline.getTime()) {
        console.log("[gen] deadline reached, stopping");
        writeLeafBucket(leaf, bucket.qs);
        saveState(state);
        process.exit(0);
      }
      try {
        const result = await generateBatch(leaf, batch, bucket.qs, model);
        have = leafCount(leaf);
        totalCreated += result.created;
        totalDupes += result.duplicates;
        totalQualityRejected += result.qualityRejected;
        totalErrors += result.errors.length;
        for (const e of result.errors) console.log(`[gen]   error: ${e}`);

        if (result.created > 0) consecutiveFailures = 0;
        else consecutiveFailures += 1;

        writeLeafBucket(leaf, bucket.qs);
        buckets.set(rel, bucket);
        rebuildManifest(buckets);
        state.completed[leaf.key] = have;
        saveState(state);
        console.log(
          `[gen]   batch -> +${result.created} (dup ${result.duplicates}, quality ${result.qualityRejected}) total ${have}/${min}`
        );
      } catch (err) {
        consecutiveFailures += 1;
        const msg = err instanceof Error ? err.message : "unknown";
        totalErrors += 1;
        console.log(`[gen]   request failed: ${msg.slice(0, 200)}`);
        if (consecutiveFailures >= 8) {
          console.log("[gen]   too many consecutive failures, skipping leaf for now");
          break;
        }
        await sleep(5000 * Math.min(consecutiveFailures, 6));
      }
    }

    if (have >= min) console.log(`[gen]   DONE (${have}) ${leaf.key}`);
    else console.log(`[gen]   PAUSED (${have}/${min}) ${leaf.key}`);
    saveState(state);
  };

  const workerCount = Math.max(1, workers);
  await Promise.all(
    Array.from({ length: workerCount }, async () => {
      while (nextIndex < pending.length) {
        if (deadline && Date.now() > deadline.getTime()) {
          saveState(state);
          process.exit(0);
        }
        const leaf = pending[nextIndex];
        nextIndex += 1;
        await processLeaf(leaf);
      }
    })
  );

  rebuildManifest(buckets);
  console.log(
    `[gen] finished. created=${totalCreated} duplicates=${totalDupes} qualityRejected=${totalQualityRejected} errors=${totalErrors}`
  );
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});