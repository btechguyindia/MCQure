import { describe, expect, it } from "vitest";
import {
  STUDY_KIND_META,
  STUDY_KIND_ORDER,
  bulletLines,
  groupNotesByKind,
  isWeakTopic,
  parseComparisonTable,
} from "./study";

describe("bulletLines", () => {
  it("splits on newlines, trims and drops empties", () => {
    expect(bulletLines("  a\nb\n\n  c  ")).toEqual(["a", "b", "c"]);
  });

  it("returns empty array for empty body", () => {
    expect(bulletLines("")).toEqual([]);
  });
});

describe("parseComparisonTable", () => {
  it("parses header then rows split by ||", () => {
    const { header, rows } = parseComparisonTable(
      "Feature || A || B\nSpeed || fast || slow\nCost || high || low"
    );
    expect(header).toEqual(["Feature", "A", "B"]);
    expect(rows).toEqual([
      ["Speed", "fast", "slow"],
      ["Cost", "high", "low"],
    ]);
  });

  it("handles an empty body", () => {
    expect(parseComparisonTable("")).toEqual({ header: [], rows: [] });
  });
});

describe("isWeakTopic", () => {
  it("flags low accuracy with enough attempts", () => {
    expect(isWeakTopic(40, 3)).toBe(true);
    expect(isWeakTopic(59.9, 3)).toBe(true);
  });

  it("does not flag high accuracy, few attempts or unknown accuracy", () => {
    expect(isWeakTopic(60, 3)).toBe(false);
    expect(isWeakTopic(40, 2)).toBe(false);
    expect(isWeakTopic(null, 5)).toBe(false);
  });
});

describe("groupNotesByKind", () => {
  const note = (kind: "CONCEPT_NOTES" | "QUICK_SUMMARY", title: string) => ({
    id: title,
    topicId: "t",
    kind,
    title,
    body: "x",
    order: 0,
    createdAt: new Date(),
  });

  it("groups and orders by STUDY_KIND_ORDER, skipping empty kinds", () => {
    const groups = groupNotesByKind([note("QUICK_SUMMARY", "s"), note("CONCEPT_NOTES", "c")]);
    expect(groups.map((g) => g.kind)).toEqual(["CONCEPT_NOTES", "QUICK_SUMMARY"]);
    expect(groups[0].notes[0].title).toBe("c");
  });

  it("sorts notes within a kind by order", () => {
    const a = note("CONCEPT_NOTES", "second");
    a.order = 2;
    const b = note("CONCEPT_NOTES", "first");
    b.order = 1;
    const groups = groupNotesByKind([a, b]);
    expect(groups[0].notes.map((n) => n.title)).toEqual(["first", "second"]);
  });
});

describe("STUDY_KIND_META", () => {
  it("covers every kind in the ordering with a label and icon", () => {
    for (const kind of STUDY_KIND_ORDER) {
      expect(STUDY_KIND_META[kind]).toBeDefined();
      expect(STUDY_KIND_META[kind].label.length).toBeGreaterThan(0);
      expect(STUDY_KIND_META[kind].icon.length).toBeGreaterThan(0);
    }
  });
});
