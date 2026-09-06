import { describe, expect, it } from "vitest";
import { difficultyFor, sampleWeighted, smoothedWeakness, topicPriority } from "./adaptive";

describe("smoothedWeakness", () => {
  it("is neutral for unexplored topics", () => {
    expect(smoothedWeakness(0, 0)).toBe(0.5);
  });

  it("beats a single perfect attempt — this is not proof of mastery", () => {
    // 4/4 perfect: (4 + 2)/(4 + 4) = 0.75 accuracy → weakness 0.25
    expect(smoothedWeakness(4, 4)).toBe(0.25);
  });

  it("does not treat a single miss as proof of weakness either", () => {
    // 1/5: (1 + 2)/(5 + 4) = 0.333 → weakness ~0.667
    expect(smoothedWeakness(5, 1)).toBeCloseTo(0.6666667);
  });

  it("converges toward raw accuracy as evidence grows", () => {
    // 20/20 → (20 + 2)/(20 + 4) = 0.9167 → weakness ~0.083 (approaching 0)
    expect(smoothedWeakness(20, 20)).toBeLessThan(smoothedWeakness(4, 4));
    // long-run 50% stays near 0.5
    expect(smoothedWeakness(100, 50)).toBeCloseTo(0.5, 1);
  });
});

describe("topicPriority", () => {
  it("returns a mild boost for unexplored topics", () => {
    // Never practised: cautiously explorable, not top-priority.
    expect(topicPriority(0, 0)).toBeCloseTo(0.575, 3);
  });

  it("weak topics get the highest priority once evidence supports it", () => {
    expect(topicPriority(12, 4)).toBeGreaterThan(topicPriority(12, 9));
  });

  it("stays within the plausible 0.25..0.85 band", () => {
    expect(topicPriority(100, 100)).toBeGreaterThanOrEqual(0.25);
    expect(topicPriority(0, 0)).toBeLessThanOrEqual(0.85);
    expect(topicPriority(100, 100)).toBeLessThanOrEqual(0.85);
  });

  it("does not over-react to tiny samples", () => {
    // One perfect attempt pulls priority below unexplored only slightly —
    // it is not treated as proof of mastery.
    const perfect = topicPriority(1, 1);
    const unexplored = topicPriority(0, 0);
    expect(perfect).toBeLessThan(unexplored);
    expect(unexplored - perfect).toBeLessThan(0.1);
  });

  it("blueprint exam weight nudges priority up", () => {
    const base = topicPriority(12, 6, 0.5);
    expect(topicPriority(12, 6, 1)).toBeGreaterThan(base);
    expect(topicPriority(12, 6, 0)).toBeLessThan(base);
  });
});

describe("difficultyFor", () => {
  it("maps weak topics to easier difficulty", () => {
    expect(difficultyFor(0, 0)).toBe("MEDIUM");
    expect(difficultyFor(5, 1)).toBe("EASY");
    expect(difficultyFor(12, 6)).toBe("MEDIUM");
    expect(difficultyFor(20, 18)).toBe("HARD");
  });

  it("defaults to MEDIUM without stats", () => {
    expect(difficultyFor(0, 0)).toBe("MEDIUM");
  });
});

describe("sampleWeighted", () => {
  it("respects the count and returns only available items", () => {
    const out = sampleWeighted([{ id: "a" }, { id: "b" }], () => 1, 5);
    expect(out.length).toBe(2);
  });

  it("favors high-weight items on average", () => {
    const items = [{ id: "heavy" }, { id: "light" }];
    let heavyCount = 0;
    for (let i = 0; i < 200; i += 1) {
      const picked = sampleWeighted(items, (it) => (it.id === "heavy" ? 0.99 : 0.01), 1)[0];
      if (picked.id === "heavy") heavyCount += 1;
    }
    expect(heavyCount).toBeGreaterThan(150);
  });

  it("does not duplicate items", () => {
    const out = sampleWeighted([{ id: "a" }, { id: "b" }, { id: "c" }], () => 1, 3);
    expect(new Set(out.map((x) => x.id)).size).toBe(3);
  });
});
