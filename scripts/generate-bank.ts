// Resumable bulk question generation for the DSSSB TGT CS bank.
//
// Goal (configurable): every leaf unit (subtopic, or topic-with-no-subtopics)
// reaches MIN_QUESTIONS questions via the Gemini provider, capped at
// MAX_QUESTIONS. All generated questions pass through the same dedup + quality
// gates as any other insertion (createQuestion), so duplicates are never
// stored twice.
//
// Scheduling is coverage-first: leaves are processed fewest-questions-first,
// so every zero-question topic gets seeded before any single leaf is
// deep-filled.
//
// Resumability: progress is tracked per leaf unit in a JSON state file
// (.data/generation-state.json). Re-running the script skips leaves that are
// already at/above the target, so it can be stopped and continued across many
// sessions.
//
// Usage:
//   npx tsx scripts/generate-bank.ts [--min 1000] [--max 5000] [--batch 12]
//   npx tsx scripts/generate-bank.ts --workers 3   # concurrent leaf processors
//   npx tsx scripts/generate-bank.ts --resume        # continue from state file
//   npx tsx scripts/generate-bank.ts --until <iso>   # stop after a wall-clock deadline
//
// Env:
//   GEMINI_API_KEY         required (real key; placeholder keys are rejected)
//   MIN_QUESTIONS_PER_LEAF default 1000
//   MAX_QUESTIONS_PER_LEAF default 5000
//   BATCH_SIZE             default 12 (questions requested per Gemini call)
//   WORKERS                default 3 (concurrent leaf processors)

import "dotenv/config";
import { existsSync, readFileSync, mkdirSync, writeFileSync } from "node:fs";
import path from "node:path";
import { z } from "zod";
import type { Difficulty } from "@prisma/client";
import { prisma } from "../src/lib/db";
import { generateWithGemini } from "../src/lib/ai";
import { createQuestion } from "../src/lib/question-bank";

const STATE_FILE = path.join(process.cwd(), ".data", "generation-state.json");

interface LeafUnit {
  key: string; // "subject :: topic :: subtopic" or "subject :: topic"
  subjectId: string;
  subjectName: string;
  topicId: string;
  topicName: string;
  subtopicId: string | null;
  subtopicName: string | null;
}

interface State {
  completed: Record<string, number>; // leaf key -> questions currently in DB
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

const DIFFICULTY_CYCLE: Difficulty[] = ["EASY", "MEDIUM", "MEDIUM", "HARD"];

function buildPrompt(leaf: LeafUnit, batch: number, difficulty: Difficulty): string {
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

async function countForLeaf(leaf: LeafUnit, examId: string): Promise<number> {
  return prisma.question.count({
    where: {
      examId,
      subjectId: leaf.subjectId,
      topicId: leaf.topicId,
      subtopicId: leaf.subtopicId,
    },
  });
}

interface BatchResult {
  created: number;
  duplicates: number;
  qualityRejected: number;
  errors: string[];
}

async function generateBatch(
  leaf: LeafUnit,
  batch: number,
  sourceId: string,
  examId: string,
  model?: string
): Promise<BatchResult> {
  const difficulty = DIFFICULTY_CYCLE[Math.floor(Math.random() * DIFFICULTY_CYCLE.length)];
  const res = await generateWithGemini({
    prompt: buildPrompt(leaf, batch, difficulty),
    temperature: 0.9,
    maxOutputTokens: 8192,
    model,
  });
  const questions = parseJsonArray(res.text);
  const result: BatchResult = { created: 0, duplicates: 0, qualityRejected: 0, errors: [] };
  if (questions.length === 0) {
    result.errors.push(`No valid questions parsed (raw ${res.text.length} chars)`);
    return result;
  }
  for (const q of questions) {
    const out = await createQuestion({
      examId,
      subjectId: leaf.subjectId,
      topicId: leaf.topicId,
      subtopicId: leaf.subtopicId ?? undefined,
      sourceType: "AI_GENERATED",
      sourceId,
      text: q.text,
      options: q.options.map((text, i) => ({ label: String.fromCharCode(65 + i), text })),
      correctIndex: q.correctIndex,
      explanation: q.explanation,
      difficulty: q.difficulty,
    });
    if (!out.ok) {
      result.qualityRejected += 1;
    } else if (out.created) {
      result.created += 1;
    } else {
      result.duplicates += 1;
    }
  }
  return result;
}

async function sleep(ms: number) {
  return new Promise((r) => setTimeout(r, ms));
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  const min = Number(args.min ?? process.env.MIN_QUESTIONS_PER_LEAF ?? 1000);
  const max = Number(args.max ?? process.env.MAX_QUESTIONS_PER_LEAF ?? 5000);
  const batch = Number(args.batch ?? process.env.BATCH_SIZE ?? 12);
  const workers = Number(args.workers ?? process.env.WORKERS ?? 3);
  const model = args.model ?? process.env.GEMINI_MODEL ?? undefined;
  const deadline = args.until ? new Date(args.until) : null;

  // Optional subject scoping. Both are comma-separated substrings matched
  // (case-insensitive) against each subject name.
  //   --only "Programming,Operating Systems"     generate only matching subjects
  //   --exclude "General Awareness,English"      generate everything except these
  // Omitting both generates the whole exam (previous behaviour).
  const only = (args.only ?? "")
    .split(",")
    .map((s) => s.trim().toLowerCase())
    .filter(Boolean);
  const exclude = (args.exclude ?? "")
    .split(",")
    .map((s) => s.trim().toLowerCase())
    .filter(Boolean);

  const exam = await prisma.exam.findFirst({ where: { active: true } });
  if (!exam) {
    console.error("[gen] no active exam found");
    process.exit(1);
  }

  const source = await prisma.questionSource.create({
    data: {
      type: "AI_GENERATED",
      name: `Bulk AI-generated for ${exam.name}`,
      verified: false,
    },
  });

  let subjects = await prisma.subject.findMany({
    where: { examId: exam.id },
    orderBy: { order: "asc" },
    include: { topics: { orderBy: { order: "asc" }, include: { subtopics: { orderBy: { order: "asc" } } } } },
  });

  if (only.length > 0) {
    subjects = subjects.filter((s) => only.some((f) => s.name.toLowerCase().includes(f)));
  }
  if (exclude.length > 0) {
    subjects = subjects.filter((s) => !exclude.some((f) => s.name.toLowerCase().includes(f)));
  }

  const leaves: LeafUnit[] = [];
  for (const subject of subjects) {
    for (const topic of subject.topics) {
      if (topic.subtopics.length === 0) {
        leaves.push({
          key: `${subject.name} :: ${topic.name}`,
          subjectId: subject.id,
          subjectName: subject.name,
          topicId: topic.id,
          topicName: topic.name,
          subtopicId: null,
          subtopicName: null,
        });
      } else {
        for (const st of topic.subtopics) {
          leaves.push({
            key: `${subject.name} :: ${topic.name} :: ${st.name}`,
            subjectId: subject.id,
            subjectName: subject.name,
            topicId: topic.id,
            topicName: topic.name,
            subtopicId: st.id,
            subtopicName: st.name,
          });
        }
      }
    }
  }

  // Coverage-first ordering: one groupBy gives current counts for every leaf;
  // sorting ascending (stable) means zero-question topics are seeded first
  // while ties keep the syllabus order.
  const countRows = await prisma.question.groupBy({
    by: ["topicId", "subtopicId"],
    where: { examId: exam.id },
    _count: { id: true },
  });
  const counts = new Map<string, number>();
  for (const row of countRows) {
    counts.set(`${row.topicId}::${row.subtopicId ?? ""}`, row._count.id);
  }
  leaves.sort(
    (a, b) =>
      (counts.get(`${a.topicId}::${a.subtopicId ?? ""}`) ?? 0) -
      (counts.get(`${b.topicId}::${b.subtopicId ?? ""}`) ?? 0)
  );

  const state = loadState();
  console.log(
    `[gen] exam=${exam.name} leaves=${leaves.length} min=${min} max=${max} batch=${batch} workers=${workers}`
  );

  let totalCreated = 0;
  let totalDupes = 0;
  let totalQualityRejected = 0;
  let totalErrors = 0;

  // Pending leaves to process, ordered fewest-questions-first.
  const pending: LeafUnit[] = leaves.slice();
  let nextIndex = 0;

  const processLeaf = async (leaf: LeafUnit): Promise<void> => {
    const current = await countForLeaf(leaf, exam.id);
    state.completed[leaf.key] = current;

    if (current >= min) {
      console.log(`[gen] SKIP (${current}) ${leaf.key}`);
      return;
    }

    console.log(`[gen] START (${current}/${min}) ${leaf.key}`);

    let have = current;
    let consecutiveFailures = 0;
    while (have < min && have < max) {
      if (deadline && Date.now() > deadline.getTime()) {
        console.log(`[gen] deadline reached, stopping`);
        saveState(state);
        process.exit(0);
      }
      const target = Math.min(batch, max - have);
      try {
        const result = await generateBatch(leaf, target, source.id, exam.id, model);
        have += result.created;
        totalCreated += result.created;
        totalDupes += result.duplicates;
        totalQualityRejected += result.qualityRejected;
        totalErrors += result.errors.length;
        for (const e of result.errors) console.log(`[gen]   error: ${e}`);

        if (result.created > 0) consecutiveFailures = 0;
        else consecutiveFailures += 1;

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
        // Back off on transient API errors; bail after too many consecutive
        // failures so the script can be re-run later without infinite loops.
        if (consecutiveFailures >= 8) {
          console.log(`[gen]   too many consecutive failures, skipping leaf for now`);
          break;
        }
        await sleep(5000 * Math.min(consecutiveFailures, 6));
      }
    }

    if (have >= min) console.log(`[gen]   DONE (${have}) ${leaf.key}`);
    else console.log(`[gen]   PAUSED (${have}/${min}) ${leaf.key}`);
    saveState(state);
  };

  // Worker pool: pull leaves off the queue as workers free up.
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

  console.log(
    `[gen] finished. created=${totalCreated} duplicates=${totalDupes} qualityRejected=${totalQualityRejected} errors=${totalErrors}`
  );
  await prisma.$disconnect();
}

main().catch(async (e) => {
  console.error(e);
  await prisma.$disconnect();
  process.exit(1);
});
