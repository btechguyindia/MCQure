// Unit tests for the offline bank store + repository. These run purely on a
// temp-bank fixture on disk — no database, no network.

import { mkdirSync, writeFileSync, rmSync } from "node:fs";
import os from "node:os";
import path from "node:path";
import { describe, expect, it, beforeEach, afterEach, vi } from "vitest";
import { BankStore } from "./store";
import { QuestionRepository, QUESTION_SOURCE_OFFLINE } from "./repository";
import { bankRelPath, serializeTopicBank, BANK_VERSION } from "./format";

function makeBankRoot(): string {
  return path.join(os.tmpdir(), `mcqure-bank-test-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`);
}

function writeTopic(root: string, subject: string, topic: string, qs: Array<{ i: string; t: string }>) {
  const rel = bankRelPath(subject, topic);
  const abs = path.join(root, "questions", rel);
  mkdirSync(path.dirname(abs), { recursive: true });
  const bundle = {
    v: BANK_VERSION as 1,
    s: subject,
    t: topic,
    q: qs.map(({ i, t: text }, idx) => ({
      i,
      d: (["EASY", "MEDIUM", "HARD", "VERY_HARD"] as const)[idx % 4],
      q: text,
      o: ["option A", "option B", "option C", "option D"] as [string, string, string, string],
      c: idx % 4,
      x: "A solid explanation used to pass the schema.",
      u: undefined,
      s: "AI_GENERATED" as const,
      v: false,
    })),
  };
  writeFileSync(abs, serializeTopicBank(bundle), "utf8");
}

function writeManifest(root: string, topics: { subject: string; topic: string }[]) {
  writeFileSync(
    path.join(root, "manifest.json"),
    JSON.stringify(
      {
        v: 1,
        schema: BANK_VERSION,
        exam: "dsssb-tgt-cs",
        generatedAt: new Date().toISOString(),
        total: topics.length * 3,
        topics: topics
          .sort((a, b) => `${a.subject}::${a.topic}`.localeCompare(`${b.subject}::${b.topic}`))
          .map((t) => ({ ...t, path: bankRelPath(t.subject, t.topic), count: 3 })),
      },
      null,
      2
    ),
    "utf8"
  );
}

describe("BankStore", () => {
  let root: string;
  let store: BankStore;

  beforeEach(() => {
    root = makeBankRoot();
    writeTopic(root, "Operating Systems", "Process Management", [
      { i: "q_aaaaaaaaaaaaaa", t: "What is a process?" },
      { i: "q_bbbbbbbbbbbbbb", t: "What is a thread?" },
      { i: "q_cccccccccccccc", t: "What is context switching?" },
    ]);
    writeTopic(root, "Operating Systems", "Deadlocks", [
      { i: "q_dddddddddddddd", t: "What are the four deadlock conditions?" },
      { i: "q_eeeeeeeeeeeeee", t: "What is the banker's algorithm?" },
      { i: "q_ffffffffffffff", t: "What is circular wait?" },
    ]);
    writeManifest(root, [
      { subject: "Operating Systems", topic: "Deadlocks" },
      { subject: "Operating Systems", topic: "Process Management" },
    ]);
    store = new BankStore(root);
  });

  afterEach(() => {
    rmSync(root, { recursive: true, force: true });
  });

  it("reads the manifest and derives counts", () => {
    expect(store.exists()).toBe(true);
    const stats = store.stats();
    expect(stats.total).toBe(6);
    expect(stats.subjects).toBe(1);
    expect(stats.topics).toBe(2);
    expect(stats.perSubject["Operating Systems"]).toBe(6);
  });

  it("filters by topic and subject", () => {
    const pm = store.getByTopic("Operating Systems", "Process Management");
    expect(pm).toHaveLength(3);
    expect(pm[0].id).toBe("q_aaaaaaaaaaaaaa");
    expect(pm[0].subject).toBe("Operating Systems");
    expect(pm[0].topic).toBe("Process Management");
    expect(store.getBySubject("Operating Systems")).toHaveLength(6);
    expect(store.getByTopic("Operating Systems", "Physiology")).toHaveLength(0);
  });

  it("looks up by id", () => {
    expect(store.getById("q_dddddddddddddd")?.text).toContain("deadlock");
    expect(store.getById("q_nonexistent")).toBeNull();
    expect(store.getByIds(["q_eeeeeeeeeeeeee", "q_nope"])).toHaveLength(1);
  });

  it("searches text case-insensitively with subject/topic scope", () => {
    const all = store.search({ query: "deadlock" });
    expect(all.length).toBeGreaterThanOrEqual(1);
    const scoped = store.search({ query: "deadlock", subject: "Operating Systems", topic: "Deadlocks" });
    expect(scoped).toHaveLength(1);
    expect(store.search({ query: "zzz-not-there" })).toHaveLength(0);
  });

  it("throws a clear error when the bank is missing", () => {
    const empty = new BankStore(path.join(root, "missing"));
    expect(() => empty.manifest()).toThrow(/not built/);
  });

  it("caches the index until invalidated", () => {
    const before = store.questions().length;
    expect(before).toBe(6);
    store.invalidate();
    expect(store.questions().length).toBe(6);
  });

  it("memoises the index (single flat array, no reload)", () => {
    const a = store.questions();
    const b = store.questions();
    expect(a).toBe(b);
  });
});

describe("QuestionRepository", () => {
  let root: string;
  let repo: QuestionRepository;

  beforeEach(() => {
    root = makeBankRoot();
    writeTopic(root, "DBMS", "SQL", [
      { i: "q_a1a1a1a1a1a1a1", t: "What is a primary key?" },
      { i: "q_b2b2b2b2b2b2b2", t: "What is a foreign key?" },
      { i: "q_c3c3c3c3c3c3c3", t: "What is an index?" },
    ]);
    writeTopic(root, "DBMS", "Normalization", [
      { i: "q_d4d4d4d4d4d4d4", t: "What is 1NF?" },
      { i: "q_e5e5e5e5e5e5e5", t: "What is BCNF?" },
      { i: "q_f6f6f6f6f6f6f6", t: "What is a functional dependency?" },
    ]);
    writeManifest(root, [
      { subject: "DBMS", topic: "Normalization" },
      { subject: "DBMS", topic: "SQL" },
    ]);
    repo = new QuestionRepository(new BankStore(root));
    vi.spyOn(Math, "random").mockReturnValue(0.1);
  });

  afterEach(() => {
    vi.restoreAllMocks();
    rmSync(root, { recursive: true, force: true });
  });

  it("tags offline questions with OFFLINE_JSON source", () => {
    const q = repo.getById("q_a1a1a1a1a1a1a1");
    expect(q).not.toBeNull();
    expect(q!.source).toBe(QUESTION_SOURCE_OFFLINE);
    expect(q!.options).toHaveLength(4);
    expect(q!.verified).toBe(false);
  });

  it("provides topic/subject/random/byIds/search", () => {
    expect(repo.getByTopic("DBMS", "SQL")).toHaveLength(3);
    expect(repo.getBySubject("DBMS")).toHaveLength(6);
    expect(repo.getRandom(2)).toHaveLength(2);
    expect(repo.getByIds(["q_a1a1a1a1a1a1a1", "q_d4d4d4d4d4d4d4"])).toHaveLength(2);
    expect(repo.search({ query: "primary key" })).toHaveLength(1);
  });

  it("selectForPractice spreads across topics and caps at count", () => {
    const sel = repo.selectForPractice({ count: 4 });
    expect(sel).toHaveLength(4);
    const topics = new Set(sel.map((q) => q.topic));
    expect(topics.size).toBeGreaterThanOrEqual(2);
    const short = repo.selectForPractice({ count: 100 });
    expect(short).toHaveLength(6);
  });

  it("selectForPractice honors subject/topic/difficulty scoping", () => {
    const sql = repo.selectForPractice({ count: 2, subject: "DBMS", topic: "SQL" });
    expect(sql.every((q) => q.topic === "SQL")).toBe(true);
    const hard = repo.selectForPractice({ count: 5, difficulty: "HARD" });
    expect(hard.every((q) => q.difficulty === "HARD")).toBe(true);
  });

  it("selectForMock respects per-topic slices", () => {
    const sel = repo.selectForMock({
      slices: [
        { subject: "DBMS", topic: "SQL", count: 1 },
        { subject: "DBMS", topic: "Normalization", count: 2 },
      ],
    });
    expect(sel).toHaveLength(3);
    const byTopic = new Map<string, number>();
    for (const q of sel) byTopic.set(q.topic, (byTopic.get(q.topic) ?? 0) + 1);
    expect(byTopic.get("SQL")).toBe(1);
    expect(byTopic.get("Normalization")).toBe(2);
  });

  it("avoids listed ids in random draws", () => {
    const avoid = ["q_a1a1a1a1a1a1a1", "q_b2b2b2b2b2b2b2", "q_c3c3c3c3c3c3c3", "q_d4d4d4d4d4d4d4", "q_e5e5e5e5e5e5e5"];
    const sel = repo.getRandom(10, { avoid });
    const got = sel.map((q) => q.id);
    for (const a of avoid) expect(got).not.toContain(a);
    expect(sel).toHaveLength(1);
    expect(got).toContain("q_f6f6f6f6f6f6f6");
  });
});