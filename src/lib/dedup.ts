// Pure duplicate-detection primitives for the large question bank.
// Exact duplicates are found via a normalized-text fingerprint; near
// duplicates via character n-gram Jaccard similarity. Language-agnostic,
// deterministic and dependency-free (only node:crypto for hashing).

import { createHash } from "node:crypto";

export const NEAR_DUPLICATE_THRESHOLD = 0.8;
export const NGRAM_SIZE = 4;

/** Collapses whitespace, lowercases and strips punctuation for comparison. */
export function normalizeQuestionText(text: string): string {
  return text
    .replace(/[\r\n\t]+/g, " ")
    .replace(/[^\p{L}\p{N}\s]/gu, " ")
    .replace(/\s+/g, " ")
    .trim()
    .toLowerCase();
}

/** Deterministic sha256 of the normalized text — exact-duplicate key. */
export function questionFingerprint(text: string): string {
  return createHash("sha256").update(normalizeQuestionText(text)).digest("hex");
}

/** Character n-gram set of a string (whitespace removed). */
export function charNgrams(text: string, size = NGRAM_SIZE): Set<string> {
  const grams = new Set<string>();
  const s = text.replace(/\s+/g, "");
  if (s.length <= size) {
    if (s.length > 0) grams.add(s);
    return grams;
  }
  for (let i = 0; i <= s.length - size; i += 1) {
    grams.add(s.slice(i, i + size));
  }
  return grams;
}

/** Jaccard similarity of two strings' character n-grams (0..1). */
export function ngramSimilarity(a: string, b: string, size = NGRAM_SIZE): number {
  const ga = charNgrams(a, size);
  const gb = charNgrams(b, size);
  if (ga.size === 0 && gb.size === 0) return 1;
  if (ga.size === 0 || gb.size === 0) return 0;
  let inter = 0;
  for (const g of ga) {
    if (gb.has(g)) inter += 1;
  }
  return inter / (ga.size + gb.size - inter);
}

export type DuplicateMatch = {
  method: "EXACT" | "NEAR";
  similarity: number;
};

/** Classifies two question texts: exact, near, or not a duplicate. */
export function classifyDuplicate(a: string, b: string): DuplicateMatch | null {
  const na = normalizeQuestionText(a);
  const nb = normalizeQuestionText(b);
  if (na.length > 0 && na === nb) return { method: "EXACT", similarity: 1 };
  const sim = ngramSimilarity(na, nb);
  if (sim >= NEAR_DUPLICATE_THRESHOLD) return { method: "NEAR", similarity: sim };
  return null;
}
