import { describe, expect, it } from "vitest";
import { ipKey, rateLimit, resetKey } from "./rate-limit";

describe("rateLimit", () => {
  it("allows requests up to the window max", () => {
    const key = `test-allowed-${Date.now()}`;
    for (let i = 0; i < 10; i += 1) {
      expect(rateLimit(key, 10)).toBe(true);
    }
  });

  it("rejects once the max is exceeded", () => {
    const key = `test-blocked-${Date.now()}`;
    for (let i = 0; i < 10; i += 1) rateLimit(key, 10);
    expect(rateLimit(key, 10)).toBe(false);
  });

  it("treats distinct keys independently", () => {
    const a = `test-a-${Date.now()}`;
    const b = `test-b-${Date.now()}`;
    rateLimit(a, 1);
    expect(rateLimit(b, 1)).toBe(true);
    expect(rateLimit(a, 1)).toBe(false);
  });

  it("resets a key so requests are allowed again", () => {
    const key = `test-reset-${Date.now()}`;
    for (let i = 0; i < 5; i += 1) rateLimit(key, 5);
    expect(rateLimit(key, 5)).toBe(false);
    resetKey(key);
    expect(rateLimit(key, 5)).toBe(true);
  });
});

describe("ipKey", () => {
  it("uses the first x-forwarded-for address", () => {
    const req = new Request("http://localhost/api", {
      headers: { "x-forwarded-for": "203.0.113.9, 10.0.0.1" },
    });
    expect(ipKey(req)).toBe("ip:203.0.113.9");
  });

  it("falls back to a local key without forwarding headers", () => {
    const req = new Request("http://localhost/api");
    expect(ipKey(req)).toBe("ip:local");
  });
});
