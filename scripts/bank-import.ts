// Builds the offline question bank (data/bank) from the project's own
// original AI-generated seed questions (prisma/seed-data/questions.ts).
//
// Replicates the seed ingestion semantics exactly — questions are mapped
// topic-by-topic, subtopic is best-effort, and every question passes the same
// quality gate. Question ids are content-derived (sha256 of normalized text),
// so exact duplicates collapse to one id and re-running is idempotent.
//
// Database-free: reads TS source, writes partitioned JSON + a manifest. It
// never touches, migrates or overwrites the question tables in Postgres.
//
// Usage:
//   npx tsx scripts/bank-import.ts               # writes data/bank (default)
//   BANK_ROOT=./my-bank npx tsx scripts/bank-import.ts

import { mkdirSync, writeFileSync, existsSync } from "node:fs";
import path from "node:path";
import { SUBJECTS } from "../prisma/seed-data/syllabus";
import { QUESTIONS } from "../prisma/seed-data/questions";
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

const OUT = process.env.BANK_ROOT ?? "data/bank";

type TopicLink = { subject: string; topic: string; subtopics: Set<string> };

function buildTopicMap(): Map<string, TopicLink> {
  const map = new Map<string, TopicLink>();
  for (const subject of SUBJECTS) {
    for (const topic of subject.topics) {
      map.set(topic.name, {
        subject: subject.name,
        topic: topic.name,
        subtopics: new Set(topic.subtopics.map((st) => st.name)),
      });
    }
  }
  return map;
}

/** Map each seed question to its compact form + subject link. */
function seedQuestionsToCompact(): { q: CompactBankQuestion; link: TopicLink }[] {
  const topicMap = buildTopicMap();
  const out: { q: CompactBankQuestion; link: TopicLink }[] = [];
  const skipped: string[] = [];

  for (const q of QUESTIONS) {
    const link = topicMap.get(q.topic);
    if (!link) {
      skipped.push(q.topic);
      continue;
    }
    const subtopic = q.subtopic && link.subtopics.has(q.subtopic) ? q.subtopic : undefined;
    const quality = evaluateQuestionQuality({
      text: q.text,
      options: q.options.map((text) => ({ text })),
      correctIndex: q.correctIndex,
      explanation: q.explanation,
    });
    if (quality.status === "REJECTED") {
      skipped.push(`${link.topic} (REJECTED)`);
      continue;
    }
    out.push({
      link,
      q: {
        i: questionSlug(q.text),
        d: q.difficulty,
        q: q.text,
        o: [...q.options] as [string, string, string, string],
        c: q.correctIndex,
        x: q.explanation,
        u: subtopic,
        s: "AI_GENERATED",
        v: false,
      },
    });
  }

  if (skipped.length > 0) {
    console.warn(`[import] skipped ${skipped.length} seed entries (unknown topic / quality):`);
    for (const s of [...new Set(skipped)]) console.warn(`  - ${s}`);
  }
  return out;
}

function main() {
  const entries = seedQuestionsToCompact();

  // Partition by (subject, topic) from the topic link.
  const buckets = new Map<string, { subject: string; topic: string; qs: CompactBankQuestion[] }>();
  const seenIds = new Set<string>();
  let dupes = 0;

  for (const { q, link } of entries) {
    if (seenIds.has(q.i)) {
      dupes += 1;
      continue;
    }
    seenIds.add(q.i);
    const key = `${link.subject}::${link.topic}`;
    const bucket = buckets.get(key) ?? { subject: link.subject, topic: link.topic, qs: [] };
    bucket.qs.push(q);
    buckets.set(key, bucket);
  }

  const topics: BankManifest["topics"] = [];
  for (const [, b] of [...buckets.entries()].sort(([a], [c]) => (a < c ? -1 : 1))) {
    const rel = bankRelPath(b.subject, b.topic);
    const sorted = [...b.qs].sort((a, c) => (a.i < c.i ? -1 : 1));
    const abs = path.join(OUT, "questions", rel);
    mkdirSync(path.dirname(abs), { recursive: true });
    writeFileSync(
      abs,
      serializeTopicBank({ v: BANK_VERSION, s: b.subject, t: b.topic, q: sorted }),
      "utf8"
    );
    topics.push({ subject: b.subject, topic: b.topic, path: rel, count: sorted.length });
  }

  const manifest: BankManifest = {
    v: 1,
    schema: BANK_VERSION,
    exam: BANK_EXAM,
    generatedAt: new Date().toISOString(),
    total: entries.length - dupes,
    topics,
  };
  mkdirSync(OUT, { recursive: true });
  writeFileSync(path.join(OUT, "manifest.json"), JSON.stringify(manifest, null, 2), "utf8");

  console.log(
    `[import] wrote ${topics.length} topic bundles — ${entries.length - dupes} questions (${dupes} exact dupes dropped)`
  );
  console.log(`  root:     ${path.join(process.cwd(), OUT)}`);
  console.log(`  manifest: ${path.join(OUT, "manifest.json")}`);
  if (!existsSync(path.join(OUT, "manifest.json"))) process.exitCode = 1;
}

main();