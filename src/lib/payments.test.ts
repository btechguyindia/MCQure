import { describe, expect, it } from "vitest";
import {
  isLiveMode,
  keysMatchMode,
  resolvePaymentMode,
  testCheckoutEnabled,
} from "./payments";

// Pure env-mode resolution: production is always live, non-production defaults
// to test and can opt into live, and an explicit "test" can never downgrade
// production (sandbox keys must never run in a live environment).
describe("resolvePaymentMode", () => {
  it("locks production to live regardless of explicit mode", () => {
    expect(resolvePaymentMode("production", "")).toBe("live");
    expect(resolvePaymentMode("production", "test")).toBe("live");
    expect(resolvePaymentMode("production", "live")).toBe("live");
  });

  it("defaults non-production environments to test", () => {
    expect(resolvePaymentMode("development", "")).toBe("test");
    expect(resolvePaymentMode("uat", "")).toBe("test");
    expect(resolvePaymentMode("test", "")).toBe("test");
  });

  it("allows non-production to opt into live explicitly", () => {
    expect(resolvePaymentMode("development", "live")).toBe("live");
  });
});

// In the test runner there is no .env: APP_ENV stays unset (development) and
// PAYMENT_MODE is unset, so the simulated checkout is available, non-live mode,
// and key-mode checking allows sandbox keys.
describe("test-mode defaults in tests", () => {
  it("runs the simulated test checkout by default", () => {
    expect(isLiveMode()).toBe(false);
    expect(testCheckoutEnabled()).toBe(true);
  });

  it("accepts sandbox keys while not in live mode", () => {
    expect(keysMatchMode()).toBe(true);
  });
});