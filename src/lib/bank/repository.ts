// QuestionRepository abstraction for the offline question bank.
//
// The practice / adaptive / mock engines read questions through this facade
// (never raw JSON). Every returned question is tagged with its source so the
// app can always distinguish DATABASE questions (existing PostgreSQL Question
// rows) from OFFLINE_JSON (the static bank). Pure — no database access.

import { BankStore, type BankQuestionView, type BankSearchOptions } from "./store";
import { BANK_EXAM, type BankDifficulty } from "./format";

export const QUESTION_SOURCE_DATABASE = "DATABASE" as const;
export const QUESTION_SOURCE_OFFLINE = "OFFLINE_JSON" as const;
export type QuestionSourceKind = typeof QUESTION_SOURCE_DATABASE | typeof QUESTION_SOURCE_OFFLINE;

export interface RepositoryQuestion {
  id: string;
  source: typeof QUESTION_SOURCE_OFFLINE;
  subject: string;
  topic: string;
  subtopic: string | null;
  difficulty: BankDifficulty;
  sourceType: string;
  verified: boolean;
  occurrence: number | null;
  verifiedYears: number[];
  text: string;
  options: string[]; // [A, B, C, D] in display order
  correctIndex: number;
  explanation: string;
}

export type SelectionMode = "random" | "topic" | "subject" | "custom" | "marathon" | "mock";

export interface PracticeSelectionRequest {
  count: number;
  mode?: SelectionMode;
  subject?: string;
  topic?: string;
  difficulty?: BankDifficulty;
  avoid?: string[]; // question ids to skip
}

export interface MockTopicSlice {
  subject: string;
  topic: string;
  count: number;
}

export interface MockSelectionRequest {
  slices: MockTopicSlice[]; // DB blueprint-driven distribution, supplied by caller
  avoid?: string[];
}

export interface RepositoryStats {
  total: number;
  subjects: number;
  topics: number;
  perSubject: Record<string, number>;
  perTopic: Record<string, number>;
  exam: string;
}

function toRepositoryQuestion(q: BankQuestionView): RepositoryQuestion {
  return {
    id: q.id,
    source: QUESTION_SOURCE_OFFLINE,
    subject: q.subject,
    topic: q.topic,
    subtopic: q.subtopic,
    difficulty: q.difficulty,
    sourceType: q.sourceType,
    verified: q.verified,
    occurrence: q.occurrence,
    verifiedYears: q.verifiedYears,
    text: q.text,
    options: q.options,
    correctIndex: q.correctIndex,
    explanation: q.explanation,
  };
}

function shuffle<T>(arr: T[]): T[] {
  const copy = [...arr];
  for (let i = copy.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

/**
 * Spread selection across a set of topics one question at a time, so a single
 * topic is never repeated until every other available topic has been used.
 */
function spreadAcrossTopcis(buckets: Map<string, RepositoryQuestion[]>, count: number): RepositoryQuestion[] {
  const topicNames = shuffle([...buckets.keys()]);
  if (topicNames.length === 0) return [];
  const cursorByTopic = new Map<string, number>();
  for (const t of topicNames) cursorByTopic.set(t, 0);
  const selected: RepositoryQuestion[] = [];
  let cursor = 0;
  while (selected.length < count) {
    const topic = topicNames[cursor % topicNames.length];
    const bucket = buckets.get(topic) ?? [];
    const idx = cursorByTopic.get(topic) ?? 0;
    if (idx < bucket.length) {
      selected.push(bucket[idx]);
      cursorByTopic.set(topic, idx + 1);
      cursor += 1;
    } else {
      topicNames.splice(cursor % topicNames.length, 1);
      if (topicNames.length === 0) break;
      if (cursor >= topicNames.length) cursor = 0;
    }
  }
  return selected;
}

export class QuestionRepository {
  constructor(private readonly store: BankStore = new BankStore()) {}

  /** True when the offline bank has been built on disk. */
  isAvailable(): boolean {
    return this.store.exists();
  }

  manifest() {
    return this.store.manifest();
  }

  stats(): RepositoryStats {
    const s = this.store.stats();
    return { ...s, exam: BANK_EXAM };
  }

  /** All questions for one (subject, topic) pair. */
  getByTopic(subject: string, topic: string): RepositoryQuestion[] {
    return this.store.getByTopic(subject, topic).map(toRepositoryQuestion);
  }

  /** All questions for one subject. */
  getBySubject(subject: string): RepositoryQuestion[] {
    return this.store.getBySubject(subject).map(toRepositoryQuestion);
  }

  /** Questions by id, in requested order not guaranteed. */
  getByIds(ids: string[]): RepositoryQuestion[] {
    return this.store.getByIds(ids).map(toRepositoryQuestion);
  }

  getById(id: string): RepositoryQuestion | null {
    const q = this.store.getById(id);
    return q ? toRepositoryQuestion(q) : null;
  }

  /** Plain-text search (subject/topic scoped). Returns up to `limit`. */
  search(opts: BankSearchOptions): RepositoryQuestion[] {
    return this.store.search(opts).map(toRepositoryQuestion);
  }

  /**
   * Purely random draw from the whole bank (or a filtered subset). Never
   * loads more of the bank into the caller than the requested count.
   */
  getRandom(
    count: number,
    opts?: { subject?: string; topic?: string; difficulty?: BankDifficulty; avoid?: string[] }
  ): RepositoryQuestion[] {
    const pool = this.store.questions();
    const filtered = pool.filter(
      (q) =>
        (!opts?.subject || q.subject === opts.subject) &&
        (!opts?.topic || q.topic === opts.topic) &&
        (!opts?.difficulty || q.difficulty === opts.difficulty) &&
        (!opts?.avoid || !opts.avoid.includes(q.id))
    );
    return shuffle(filtered).slice(0, count).map(toRepositoryQuestion);
  }

  /**
   * Practice-session selection (random / topic / subject / custom / marathon /
   * mock modes). Spreads across topics when the request is un-scoped so a
   * session isn't dominated by a single topic. Returns ≤ requested count.
   */
  selectForPractice(req: PracticeSelectionRequest): RepositoryQuestion[] {
    const { count, subject, topic, difficulty, avoid } = req;
    if (count <= 0) return [];

    if (topic && subject) {
      return this.getByTopic(subject, topic).filter((q) => !difficulty || q.difficulty === difficulty)
        .slice(0, count);
    }
    if (subject) {
      return this.getBySubject(subject).filter((q) => !difficulty || q.difficulty === difficulty)
        .slice(0, count);
    }

    const pools = new Map<string, RepositoryQuestion[]>();
    const all = this.store.questions().filter(
      (q) =>
        (!difficulty || q.difficulty === difficulty) &&
        (!avoid || !avoid.includes(q.id))
    );
    for (const q of all) {
      const key = `${q.subject} :: ${q.topic}`;
      const bucket = pools.get(key) ?? [];
      bucket.push(toRepositoryQuestion(q));
      pools.set(key, bucket);
    }
    return spreadAcrossTopcis(pools, count);
  }

  /**
   * Mock selection from the DB blueprint-driven topic slices. The blueprint
   * (subject/topic distribution, counts, section mapping) lives in the
   * database/exam config — nothing about it is baked into the JSON bank.
   */
  selectForMock(req: MockSelectionRequest): RepositoryQuestion[] {
    const slices = [...(req.slices ?? [])].sort((a, b) => b.count - a.count);
    const selected: RepositoryQuestion[] = [];
    for (const slice of slices) {
      if (slice.count <= 0) continue;
      const bucket = this.getByTopic(slice.subject, slice.topic).filter(
        (q) => !req.avoid || !req.avoid.includes(q.id)
      );
      selected.push(...shuffle(bucket).slice(0, slice.count));
    }
    return shuffle(selected);
  }
}

export function createQuestionRepository(store?: BankStore): QuestionRepository {
  return new QuestionRepository(store);
}

export type { BankQuestionView };