import { describe, expect, it } from "vitest";
import { resolveCount } from "./modes";

describe("resolveCount", () => {
  it("uses the mode default when no count is given", () => {
    expect(resolveCount("quick")).toBe(10);
    expect(resolveCount("standard")).toBe(25);
    expect(resolveCount("deep")).toBe(50);
    expect(resolveCount("marathon")).toBe(100);
    expect(resolveCount("custom")).toBe(25);
  });

  it("lets custom mode override the count", () => {
    expect(resolveCount("custom", 37)).toBe(37);
  });

  it("ignores a requested count for fixed modes", () => {
    expect(resolveCount("quick", 200)).toBe(10);
  });

  it("falls back to a sane default for unknown modes", () => {
    expect(resolveCount("mystery")).toBe(25);
  });
});
