import { describe, expect, it } from "vitest";
import { isMockMode, MOCK_SESSION_MODES } from "./tracking";

describe("isMockMode", () => {
  it("recognises every mock session mode", () => {
    for (const mode of MOCK_SESSION_MODES) {
      expect(isMockMode(mode)).toBe(true);
    }
  });

  it("rejects real practice modes", () => {
    expect(isMockMode("practice")).toBe(false);
    expect(isMockMode("adaptive")).toBe(false);
    expect(isMockMode("revision")).toBe(false);
    expect(isMockMode("")).toBe(false);
  });

  it("matches any future mock_* scope without special-casing the list", () => {
    // The old bug hardcoded a list; the new implementation must stay open
    // to new scopes (e.g. mock_subtopic) so mocks never leech into practice.
    expect(isMockMode("mock_subtopic")).toBe(true);
    expect(isMockMode("mock_quickfire")).toBe(true);
  });
});