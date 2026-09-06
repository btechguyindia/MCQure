// Filesystem-backed store for the offline question bank.
//
// The bank lives on disk as small partitioned JSON "bundles" — one file per
// topic — plus a manifest summarising counts. This module loads the manifest
// and bundles on demand, memoising the flat in-memory index once per process.
// No database is touched; the bank is a pure, additive static content source.
//
// The store is read-only by design. Writing partitions is the job of the build
// pipeline (scripts/) which is the only writer.

import { existsSync, readFileSync } from "node:fs";
import path from "node:path";
import {
  bankManifestSchema,
  topicBankSchema,
  type BankManifest,
  type CompactBankQuestion,
  type TopicBank,
} from "./format";

export const DEFAULT_BANK_ROOT = path.join(process.cwd(), "data", "bank");

export interface BankQuestionView {
  id: string;
  subject: string;
  topic: string;
  subtopic: string | null;
  text: string;
  options: string[];
  correctIndex: number;
  explanation: string;
  difficulty: "EASY" | "MEDIUM" | "HARD" | "VERY_HARD";
  sourceType: string;
  verified: boolean;
  occurrence: number | null;
  verifiedYears: number[];
}

export interface BankSearchOptions {
  query: string;
  subject?: string;
  topic?: string;
  limit?: number;
}

export interface BankStats {
  total: number;
  subjects: number;
  topics: number;
  perSubject: Record<string, number>;
  perTopic: Record<string, number>;
}

/**
 * Loads the manifest + bundles from a bank root directory. Deterministic and
 * memoised: the full index is built lazily once and cached for the process.
 */
export class BankStore {
  private readonly root: string;
  private manifestCache: BankManifest | null = null;
  private indexCache: BankQuestionView[] | null = null;

  constructor(root: string = process.env.BANK_ROOT ?? DEFAULT_BANK_ROOT) {
    this.root = root;
  }

  get rootDir(): string {
    return this.root;
  }

  exists(): boolean {
    const manifestPath = path.join(this.root, "manifest.json");
    if (!existsSync(manifestPath)) return false;
    return existsSync(path.join(this.root, "questions"));
  }

  /** Manifest path on disk (also where a writer would emit it). */
  manifestPath(): string {
    return path.join(this.root, "manifest.json");
  }

  manifest(): BankManifest {
    if (this.manifestCache) return this.manifestCache;
    if (!this.exists()) {
      throw new Error(`Offline question bank not built at ${this.root}. Run "npm run questions:build" first.`);
    }
    const raw = JSON.parse(readFileSync(this.manifestPath(), "utf8")) as unknown;
    const parsed = bankManifestSchema.safeParse(raw);
    if (!parsed.success) {
      throw new Error(`Invalid bank manifest at ${this.manifestPath()}: ${parsed.error.message}`);
    }
    this.manifestCache = parsed.data;
    return parsed.data;
  }

  /**
   * All questions flattened into a single view, with subject/topic derived
   * from the bundle file structure (never repeated per question).
   */
  questions(): BankQuestionView[] {
    if (this.indexCache) return this.indexCache;
    const manifest = this.manifest();
    const index: BankQuestionView[] = [];
    for (const entry of manifest.topics) {
      const bundle = this.readTopicBundle(entry.path);
      for (const q of bundle.q) {
        index.push(toView(q, bundle.s, bundle.t));
      }
    }
    this.indexCache = index;
    return index;
  }

  private readTopicBundle(relPath: string): TopicBank {
    const file = path.join(this.root, "questions", relPath);
    const raw = JSON.parse(readFileSync(file, "utf8")) as unknown;
    const parsed = topicBankSchema.safeParse(raw);
    if (!parsed.success) {
      throw new Error(`Invalid bundle ${file}: ${parsed.error.message}`);
    }
    return parsed.data;
  }

  /** Invalidate caches (mainly used by tests / after writers replace files). */
  invalidate(): void {
    this.manifestCache = null;
    this.indexCache = null;
  }

  // ── Queries ───────────────────────────────────────────────────────────────

  getByTopic(subject: string, topic: string): BankQuestionView[] {
    const entry = this.manifest().topics.find(
      (t) => t.subject === subject && t.topic === topic
    );
    if (!entry) return [];
    const bundle = this.readTopicBundle(entry.path);
    return bundle.q.map((q) => toView(q, bundle.s, bundle.t));
  }

  getBySubject(subject: string): BankQuestionView[] {
    return this.questions().filter((q) => q.subject === subject);
  }

  getByIds(ids: string[]): BankQuestionView[] {
    if (ids.length === 0) return [];
    const wanted = new Set(ids);
    return this.questions().filter((q) => wanted.has(q.id));
  }

  getById(id: string): BankQuestionView | null {
    return this.getByIds([id])[0] ?? null;
  }

  search(opts: BankSearchOptions): BankQuestionView[] {
    const needle = opts.query.trim().toLowerCase();
    if (!needle) return this.questions();
    const limit = opts.limit ?? 50;
    const out: BankQuestionView[] = [];
    for (const q of this.questions()) {
      if (opts.subject && q.subject !== opts.subject) continue;
      if (opts.topic && q.topic !== opts.topic) continue;
      const hay = `${q.text} ${q.explanation}`.toLowerCase();
      if (hay.includes(needle)) {
        out.push(q);
        if (out.length >= limit) break;
      }
    }
    return out;
  }

  stats(): BankStats {
    const manifest = this.manifest();
    const perSubject: Record<string, number> = {};
    const perTopic: Record<string, number> = {};
    let topics = 0;
    for (const t of manifest.topics) {
      perSubject[t.subject] = (perSubject[t.subject] ?? 0) + t.count;
      perTopic[`${t.subject} :: ${t.topic}`] = t.count;
      topics += 1;
    }
    return {
      total: manifest.total,
      subjects: Object.keys(perSubject).length,
      topics,
      perSubject,
      perTopic,
    };
  }
}

function toView(q: CompactBankQuestion, subject: string, topic: string): BankQuestionView {
  return {
    id: q.i,
    subject,
    topic,
    subtopic: q.u ?? null,
    text: q.q,
    options: [q.o[0], q.o[1], q.o[2], q.o[3]],
    correctIndex: q.c,
    explanation: q.x,
    difficulty: q.d,
    sourceType: q.s ?? "AI_GENERATED",
    verified: q.v ?? false,
    occurrence: q.oc ?? null,
    verifiedYears: q.y ?? [],
  };
}