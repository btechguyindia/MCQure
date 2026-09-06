// Compact offline question-bank format.
//
// The entire MCQ pool (target: 50k) lives as small JSON "bundles" — one file
// per topic — instead of thousands of large DB rows. Questions carry stable,
// content-derived ids (`q_` + first 14 hex chars of the sha256 of normalized
// text), so identical text always produces the same id and the DB shells can
// be reconciled by keying on the existing `fingerprint` column.
//
// Field names are intentionally terse to keep storage tiny:
//   i  id            d  difficulty        q  question text
//   o  options[4]    c  correctIndex      x  explanation
//   u  topicName     s  provenance (sourceType)   v  verified flag
//   oc estimated occurrence      y  verified PYQ years (real source data only)
//
// Provenance follows the app's honesty contract: AI content always stays
// AI_GENERATED or PYQ_VARIANT ("original question derived from a PYQ
// concept") — it is never stamped as an authentic PYQ.

import { z } from "zod";
import { questionFingerprint } from "@/lib/dedup";

export const BANK_VERSION = 1;
export const BANK_EXAM = "dsssb-tgt-cs";

export type BankDifficulty = "EASY" | "MEDIUM" | "HARD" | "VERY_HARD";
export type BankProvenance = "AI_GENERATED" | "PYQ_VARIANT" | "WEB_SOURCED" | "USER_CREATED";

export const bankDifficultySchema = z.enum(["EASY", "MEDIUM", "HARD", "VERY_HARD"]);
export type BankDifficultyEnum = z.infer<typeof bankDifficultySchema>;

export const bankProvenanceSchema = z.enum([
  "AI_GENERATED",
  "PYQ_VARIANT",
  "WEB_SOURCED",
  "USER_CREATED",
]);

export const compactQuestionSchema = z.object({
  i: z.string().regex(/^q_[0-9a-f]{14}$/, "question id must be q_ + 14 hex"),
  d: bankDifficultySchema,
  q: z.string().trim().min(10),
  o: z.array(z.string().trim().min(1)).length(4),
  c: z.number().int().min(0).max(3),
  x: z.string().trim().min(1),
  u: z.string().trim().min(1).optional(),
  s: bankProvenanceSchema.optional(),
  v: z.boolean().optional(),
  oc: z.number().int().min(0).max(99).optional(),
  y: z.array(z.number().int().min(1900).max(2100)).max(40).optional(),
});
export type CompactBankQuestion = z.infer<typeof compactQuestionSchema>;

export const topicBankSchema = z.object({
  v: z.literal(BANK_VERSION),
  s: z.string().trim().min(1), // subject title
  t: z.string().trim().min(1), // topic title
  q: z.array(compactQuestionSchema),
});
export type TopicBank = z.infer<typeof topicBankSchema>;

export interface BankManifestTopic {
  subject: string;
  topic: string;
  path: string; // <subjectSlug>/<topicSlug>.json
  count: number;
}

export interface BankManifest {
  v: number; // dataset version
  schema: number; // format schema version (BANK_VERSION)
  exam: string;
  generatedAt: string;
  total: number;
  topics: BankManifestTopic[];
}

export const bankManifestSchema = z.object({
  v: z.number().int(),
  schema: z.number().int(),
  exam: z.string(),
  generatedAt: z.string(),
  total: z.number().int(),
  topics: z.array(
    z.object({
      subject: z.string(),
      topic: z.string(),
      path: z.string(),
      count: z.number().int(),
    })
  ),
});

/** URL-safe slug for folder/file names (keeps Hindi/Devanagari intact). */
export function slugify(value: string): string {
  return value
    .toLowerCase()
    .replace(/[^\p{L}\p{N}]+/gu, "-")
    .replace(/-+/g, "-")
    .replace(/^-+|-+$/g, "");
}

/** Stable, content-derived question id. Identical text ⇒ identical id. */
export function questionSlug(text: string): string {
  return `q_${questionFingerprint(text).slice(0, 14)}`;
}

/** Recover the normalized-text fingerprint (DB join key) from a slug. */
export function slugToFingerprint(slug: string): string | null {
  if (!slug.startsWith("q_") || slug.length !== 17) return null;
  return slug.slice(2);
}

export interface BankFileRef {
  subject: string;
  topic: string;
  subjectSlug: string;
  topicSlug: string;
  dir: string; // <subjectSlug>/
  fileName: string; // <topicSlug>.json
}

/** Relative path for a topic's bundle under the bank root. */
export function bankFileRef(subject: string, topic: string): BankFileRef {
  const subjectSlug = slugify(subject);
  const topicSlug = slugify(topic);
  return {
    subject,
    topic,
    subjectSlug,
    topicSlug,
    dir: `${subjectSlug}/`,
    fileName: `${topicSlug}.json`,
  };
}

export function bankRelPath(subject: string, topic: string): string {
  const ref = bankFileRef(subject, topic);
  return `${ref.dir}${ref.fileName}`;
}

/** Static URL the browser can fetch (public/bank is the served copy). */
export function clientBankUrl(subject: string, topic: string): string {
  return `/bank/${bankRelPath(subject, topic)}`;
}

/** Write a bundle with a fixed key order so output stays byte-stable. */
export function serializeTopicBank(bank: TopicBank): string {
  const questions = bank.q.map(({ i, d, q, o, c, x, u, s, v, oc, y }) => ({
    i,
    d,
    q,
    o: [o[0], o[1], o[2], o[3]],
    c,
    x,
    ...(u ? { u } : {}),
    ...(s ? { s } : {}),
    ...(v !== undefined ? { v } : {}),
    ...(oc !== undefined ? { oc } : {}),
    ...(y && y.length > 0 ? { y } : {}),
  }));
  return JSON.stringify({ v: BANK_VERSION, s: bank.s, t: bank.t, q: questions });
}