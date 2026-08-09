import { describe, expect, it } from "vitest";
import { VERIFICATION_STATUS_META, normalizePyqOptions } from "./pyq";
import { pyqCreateSchema } from "./validation";

describe("normalizePyqOptions", () => {
  it("maps free text to labeled options", () => {
    expect(normalizePyqOptions(["A1", "B2", "C3", "D4"])).toEqual([
      { label: "A", text: "A1" },
      { label: "B", text: "B2" },
      { label: "C", text: "C3" },
      { label: "D", text: "D4" },
    ]);
  });
});

describe("VERIFICATION_STATUS_META", () => {
  it("covers every status with a label and classes", () => {
    for (const status of ["VERIFIED", "PENDING", "UNVERIFIED", "CONFLICT"] as const) {
      expect(VERIFICATION_STATUS_META[status].label.length).toBeGreaterThan(0);
      expect(VERIFICATION_STATUS_META[status].className.length).toBeGreaterThan(0);
    }
  });
});

describe("pyqCreateSchema", () => {
  const valid = {
    year: 2019,
    paper: "Paper II",
    questionText: "Which of the following is …?",
    options: ["A", "B", "C", "D"],
    correctIndex: 2,
    source: "DSSSB TGT CS 2019 Paper II",
  };

  it("accepts a fully-specified genuine question", () => {
    const r = pyqCreateSchema.safeParse(valid);
    expect(r.success).toBe(true);
  });

  it("rejects exactly four options required", () => {
    expect(pyqCreateSchema.safeParse({ ...valid, options: ["A", "B", "C"] }).success).toBe(false);
  });

  it("rejects a future year", () => {
    expect(
      pyqCreateSchema.safeParse({ ...valid, year: new Date().getFullYear() + 5 }).success
    ).toBe(false);
  });

  it("requires provenance (source)", () => {
    const noSource = { ...valid };
    delete (noSource as { source?: string }).source;
    expect(pyqCreateSchema.safeParse(noSource).success).toBe(false);
  });
});
