import { describe, expect, it } from "vitest";
import { difficultyFor, sampleWeighted, topicPriority } from "./adaptive";

describe("topicPriority", () => {
  it("returns a mild boost for unexplored topics", () => {
    expect(topicPriority(null, 0)).toBe(0.5);
  });

  it("weak topics get the highest priority", () => {
    expect(topicPriority(40, 12)).toBeGreaterThan(topicPriority(80, 12));
  });

  it("stays within the 0.35..1.0 range", () => {
    expect(topicPriority(0, 12)).toBe(1);
    expect(topicPriority(100, 12)).toBe(0.35);
  });

  it("handles low-attempt topics cautiously", () => {
    expect(topicPriority(50, 1)).toBeLessThanOrEqual(1);
    expect(topicPriority(50, 1)).toBeGreaterThanOrEqual(0.35);
  });
});

describe("difficultyFor", () => {
  it("maps weak topics to easier difficulty", () => {
    expect(difficultyFor(40)).toBe("EASY");
    expect(difficultyFor(60)).toBe("MEDIUM");
    expect(difficultyFor(80)).toBe("HARD");
  });

  it("defaults to MEDIUM without stats", () => {
    expect(difficultyFor(null)).toBe("MEDIUM");
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
