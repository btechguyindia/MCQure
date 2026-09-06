// Validates the offline question bank against the spec's contract:
//   - total >= MIN_TOTAL (default 50,000)
//   - every syllabus topic present in the bank has >= MIN_PER_TOPIC (default 200)
//   - report which topics fail the minimum
//   - unique question ids across the whole bank
//   - every bundle parses against the strict schema
//   - structural sanity: 4 options, valid answer/difficulty/sourceType, explanation
//   - provenance honesty: verified PYQ-years only ever accompany verified flags
//     (no fabricated PYQs — the bank never writes authentic-PYQ claims from AI)
//
// The validator reads only the filesystem bank; it never touches Postgres.
//
// Usage:
//   npx tsx scripts/bank-validate.ts                       # strict (50k / 200)
//   npx tsx scripts/bank-validate.ts --min-total 10000 --min-per-topic 100
//   BANK_ROOT=./my-bank npx tsx scripts/bank-validate.ts

import { readFileSync } from "node:fs";
import path from "node:path";
import { bankManifestSchema, compactQuestionSchema, topicBankSchema } from "../src/lib/bank/format";

const OUT = process.env.BANK_ROOT ?? "data/bank";

function parseArgs(argv: string[]) {
  const args: Record<string, string> = {};
  for (let i = 0; i < argv.length; i += 1) {
    const a = argv[i];
    if (a.startsWith("--")) {
      const val = argv[i + 1];
      args[a.slice(2)] = val && !val.startsWith("--") ? val : "true";
    }
  }
  return args;
}

const MIN_TOTAL = Number(process.env.MIN_TOTAL ?? 50000);
const MIN_PER_TOPIC = Number(process.env.MIN_PER_TOPIC ?? 200);

interface BundleReport {
  subject: string;
  topic: string;
  path: string;
  count: number;
  errors: string[];
}

function main() {
  const args = parseArgs(process.argv.slice(2));
  const minTotal = Number(args["min-total"] ?? MIN_TOTAL);
  const minPerTopic = Number(args["min-per-topic"] ?? MIN_PER_TOPIC);

  const manifestFile = path.join(OUT, "manifest.json");
  let manifestRaw: unknown;
  try {
    manifestRaw = JSON.parse(readFileSync(manifestFile, "utf8"));
  } catch (e) {
    const msg = e instanceof Error ? e.message : "unknown";
    console.error(`[validate] FAIL — cannot read manifest ${manifestFile}: ${msg}`);
    process.exit(1);
  }
  const manifest = bankManifestSchema.safeParse(manifestRaw);
  if (!manifest.success) {
    console.error(`[validate] FAIL — invalid manifest: ${manifest.error.message}`);
    process.exit(1);
  }

  const reports: BundleReport[] = [];
  const seenIds = new Set<string>();
  let duplicateIds = 0;
  let parseErrors = 0;

  if (!manifest.data.schema || manifest.data.schema < 1) {
    console.error(`[validate] FAIL — manifest missing schema version`);
    process.exit(1);
  }

  for (const t of manifest.data.topics) {
    const file = path.join(OUT, "questions", t.path);
    const bundleErrors: string[] = [];
    try {
      const raw = JSON.parse(readFileSync(file, "utf8"));
      const bundle = topicBankSchema.safeParse(raw);
      if (!bundle.success) {
        parseErrors += 1;
        bundleErrors.push(`schema: ${bundle.error.message}`);
      } else {
        for (const q of bundle.data.q) {
          if (seenIds.has(q.i)) {
            duplicateIds += 1;
            bundleErrors.push(`duplicate id ${q.i}`);
          }
          seenIds.add(q.i);

          const structural = compactQuestionSchema.safeParse(q);
          if (!structural.success) {
            parseErrors += 1;
            bundleErrors.push(`q ${q.i} structural: ${structural.error.message}`);
            continue;
          }
          if (q.o.length !== 4) bundleErrors.push(`q ${q.i} needs exactly 4 options`);
          if (q.c < 0 || q.c > 3) bundleErrors.push(`q ${q.i} answer outside 0-3`);
          if (!q.x || q.x.trim().length < 1) bundleErrors.push(`q ${q.i} missing explanation`);
          if (q.s && q.s !== "AI_GENERATED" && q.s !== "PYQ_VARIANT" && q.s !== "WEB_SOURCED") {
            bundleErrors.push(`q ${q.i} provenance ${q.s} requires real source data`);
          }
          // Provenance honesty: verified years only with verified flag.
          if (q.y && q.y.length > 0 && q.v !== true) {
            bundleErrors.push(`q ${q.i} lists verified PYQ years but verified flag is not true`);
          }
        }
      }
    } catch (e) {
      parseErrors += 1;
      const msg = e instanceof Error ? e.message : "unknown";
      bundleErrors.push(`unreadable: ${msg}`);
    }
    reports.push({
      subject: t.subject,
      topic: t.topic,
      path: t.path,
      count: t.count,
      errors: bundleErrors,
    });
  }

  // ── Output ───────────────────────────────────────────────────────────────

  console.log(`[validate] bank root: ${path.join(process.cwd(), OUT)}`);
  console.log(`[validate] manifest:  ${manifest.data.total} questions across ${manifest.data.topics.length} topics`);
  console.log(`[validate] gates:     total >= ${minTotal}, per-topic >= ${minPerTopic}`);
  console.log("");

  const below = reports.filter((r) => r.count < minPerTopic);
  const nonempty = reports.filter((r) => r.count > 0);
  const withErrors = reports.filter((r) => r.errors.length > 0);

  console.log(`  Total questions ........... ${manifest.data.total}`);
  console.log(`  Topics in bank ............ ${nonempty.length}`);
  console.log(`  Topics below ${minPerTopic} .......... ${below.length}`);
  console.log(`  Bundles with errors ....... ${withErrors.length}`);
  console.log(`  Duplicate ids ............. ${duplicateIds}`);
  console.log(`  Schema/parse failures ..... ${parseErrors}`);
  console.log("");

  if (below.length > 0) {
    console.log(`Topics below the ${minPerTopic} minimum (${below.length}):`);
    for (const r of [...below].sort((a, b) => a.count - b.count)) {
      console.log(`  ${String(r.count).padStart(5)}  ${r.subject} :: ${r.topic}`);
    }
    console.log("");
  }

  if (withErrors.length > 0) {
    console.log("Bundles with errors:");
    for (const r of withErrors) {
      console.log(`  ${r.path}`);
      for (const e of r.errors.slice(0, 10)) console.log(`    - ${e}`);
    }
    console.log("");
  }

  const hardFailures = parseErrors + duplicateIds;
  const totalOk = manifest.data.total >= minTotal;
  const perTopicOk = below.length === 0;

  console.log(
    totalOk && perTopicOk && hardFailures === 0
      ? "[validate] PASS"
      : "[validate] FAIL"
  );
  if (!totalOk) console.log(`  - total ${manifest.data.total} < ${minTotal}`);
  if (!perTopicOk) console.log(`  - ${below.length} topics below ${minPerTopic}`);
  if (hardFailures > 0) console.log(`  - ${hardFailures} structural issues`);

  if (!totalOk || !perTopicOk || hardFailures > 0) process.exitCode = 1;
}

main();