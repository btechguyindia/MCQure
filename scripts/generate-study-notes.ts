// Resumable study-note generation for the DSSSB TGT CS syllabus.
//
// Every topic without a study note gets a set of exam-focused notes
// (CONCEPT_NOTES, MNEMONICS, EXAM_TRAPS, QUICK_SUMMARY) generated via the
// Gemini provider. Notes are inserted idempotently per (topicId, kind, title).
//
// Resumability: progress is tracked per topic in .data/study-notes-state.json.
// Re-running skips topics that already have notes.
//
// Usage:
//   npx tsx scripts/generate-study-notes.ts [--workers 3] [--model gemini-3.5-flash-lite]
//
// Env:
//   GEMINI_API_KEY         required
//   WORKERS                default 3 (concurrent topic processors)
//   GEMINI_MODEL           default gemini-3.1-flash-lite

import "dotenv/config";
import { existsSync, readFileSync, mkdirSync, writeFileSync } from "node:fs";
import path from "node:path";
import { z } from "zod";
import { prisma } from "../src/lib/db";
import { generateWithGemini } from "../src/lib/ai";

const STATE_FILE = path.join(process.cwd(), ".data", "study-notes-state.json");

const noteSchema = z.object({
  kind: z.enum(["CONCEPT_NOTES", "MNEMONICS", "EXAM_TRAPS", "QUICK_SUMMARY"]),
  title: z.string().trim().min(2),
  body: z.string().trim().min(10),
});

type GeneratedNote = z.infer<typeof noteSchema>;

function parseNoteArray(text: string): GeneratedNote[] {
  const fenced = text.match(/```(?:json)?\s*([\s\S]*?)```/g);
  const body = fenced ? fenced.join("\n") : text;
  const start = body.indexOf("[");
  const end = body.lastIndexOf("]");
  if (start === -1 || end === -1 || end < start) return [];
  const parsed: unknown = JSON.parse(body.slice(start, end + 1));
  if (!Array.isArray(parsed)) return [];
  const out: GeneratedNote[] = [];
  for (const raw of parsed) {
    const r = noteSchema.safeParse(raw);
    if (r.success) out.push(r.data);
  }
  return out;
}

function buildPrompt(subjectName: string, topicName: string): string {
  return [
    "You are writing original, exam-focused study notes for a serious exam-prep product (DSSSB TGT Computer Science).",
    `Subject: ${subjectName}`,
    `Topic: ${topicName}`,
    "",
    "Write a concise set of study notes in the exact JSON array format below. No code fences, no markdown outside JSON.",
    "Return ONLY a JSON array. Each item has exactly these keys:",
    "  kind: one of CONCEPT_NOTES | MNEMONICS | EXAM_TRAPS | QUICK_SUMMARY",
    "  title: short heading",
    "  body: newline-separated bullet lines (no leading dash needed), 4-8 bullets.",
    "Produce 4 items: one of each kind.",
    "  CONCEPT_NOTES 'Key points': the core facts an exam would test.",
    "  MNEMONICS 'Memory hooks': acronyms/memory aids for the topic.",
    "  EXAM_TRAPS 'Exam traps': common misconceptions / what NOT to pick.",
    "  QUICK_SUMMARY 'One-page revision': the fastest full revision of the topic.",
  ].join("\n");
}

async function sleep(ms: number) {
  return new Promise((r) => setTimeout(r, ms));
}

async function main() {
  const args: Record<string, string> = {};
  for (let i = 0; i < process.argv.length; i += 1) {
    const a = process.argv[i];
    if (a.startsWith("--")) {
      const val = process.argv[i + 1];
      args[a.slice(2)] = val && !val.startsWith("--") ? val : "true";
    }
  }
  const workers = Math.max(1, Number(args.workers ?? process.env.WORKERS ?? 3));
  const model = args.model ?? process.env.GEMINI_MODEL ?? undefined;

  const topics = await prisma.topic.findMany({
    orderBy: [{ subject: { order: "asc" } }, { order: "asc" }],
    include: { subject: { select: { name: true } } },
  });

  const notes = await prisma.studyNote.findMany({ select: { topicId: true } });
  const hasNotes = new Set(notes.map((n) => n.topicId));
  const missing = topics.filter((t) => !hasNotes.has(t.id));
  console.log(`[notes] topics=${topics.length} withNotes=${topics.length - missing.length} missing=${missing.length} workers=${workers}`);
  if (missing.length === 0) {
    console.log("[notes] nothing to do");
    await prisma.$disconnect();
    return;
  }

  let state: Record<string, number> = {};
  if (existsSync(STATE_FILE)) {
    try {
      state = JSON.parse(readFileSync(STATE_FILE, "utf8"));
    } catch {
      state = {};
    }
  }
  const save = () => {
    mkdirSync(path.dirname(STATE_FILE), { recursive: true });
    writeFileSync(STATE_FILE, JSON.stringify(state, null, 2));
  };

  let created = 0;
  let failed = 0;

  const pending = missing.slice();
  let nextIndex = 0;

  const processTopic = async (topic: { id: string; name: string; subject: { name: string } }) => {
    if (state[topic.id] === 1) return;
    let consecutiveFailures = 0;
    while (true) {
      try {
        const text = await generateWithGemini({
          prompt: buildPrompt(topic.subject.name, topic.name),
          temperature: 0.7,
          maxOutputTokens: 4096,
          model,
        });
        const notesList = parseNoteArray(text.text);
        if (notesList.length === 0) {
          failed += 1;
          console.log(`[notes] FAILED parse (${topic.subject.name} :: ${topic.name}) raw ${text.text.length} chars`);
          return;
        }
        let added = 0;
        for (let i = 0; i < notesList.length; i += 1) {
          const n = notesList[i];
          const existing = await prisma.studyNote.findFirst({
            where: { topicId: topic.id, kind: n.kind, title: n.title },
          });
          if (existing) {
            await prisma.studyNote.update({ where: { id: existing.id }, data: { body: n.body, order: i } });
          } else {
            await prisma.studyNote.create({
              data: { topicId: topic.id, kind: n.kind, title: n.title, body: n.body, order: i },
            });
          }
          added += 1;
        }
        state[topic.id] = 1;
        created += added;
        save();
        console.log(`[notes] OK (${added} notes) ${topic.subject.name} :: ${topic.name}`);
        return;
      } catch (err) {
        consecutiveFailures += 1;
        const msg = err instanceof Error ? err.message : "unknown";
        console.log(`[notes] ERROR (${topic.subject.name} :: ${topic.name}): ${msg.slice(0, 120)}`);
        if (consecutiveFailures >= 10) {
          failed += 1;
          return;
        }
        await sleep(5000 * Math.min(consecutiveFailures, 6));
      }
    }
  };

  await Promise.all(
    Array.from({ length: workers }, async () => {
      while (nextIndex < pending.length) {
        const topic = pending[nextIndex];
        nextIndex += 1;
        try {
          await processTopic(topic);
        } catch (err) {
          failed += 1;
          const msg = err instanceof Error ? err.message : "unknown";
          console.log(`[notes] ERROR (${topic.subject.name} :: ${topic.name}): ${msg.slice(0, 160)}`);
          await sleep(3000);
        }
      }
    })
  );

  console.log(`[notes] finished. notesCreated=${created} failed=${failed}`);
  await prisma.$disconnect();
}

main().catch(async (e) => {
  console.error(e);
  await prisma.$disconnect();
  process.exit(1);
});
