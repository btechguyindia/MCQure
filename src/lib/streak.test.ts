import { describe, expect, it } from "vitest";
import { computeStreak, dayKey } from "./streak";

function d(iso: string): Date {
  return new Date(iso);
}

describe("dayKey", () => {
  it("formats as YYYY-MM-DD using local time", () => {
    expect(dayKey(d("2026-08-09T10:00:00"))).toBe("2026-08-09");
  });
});

describe("computeStreak", () => {
  const now = d("2026-08-09T12:00:00");

  it("returns zero streak with no activity", () => {
    expect(computeStreak([], now)).toEqual({
      current: 0,
      best: 0,
      hasActivityToday: false,
    });
  });

  it("counts consecutive days ending today", () => {
    const dates = [d("2026-08-07"), d("2026-08-08"), d("2026-08-09")];
    const s = computeStreak(dates, now);
    expect(s.current).toBe(3);
    expect(s.best).toBe(3);
    expect(s.hasActivityToday).toBe(true);
  });

  it("keeps the streak alive when the last activity was yesterday", () => {
    const dates = [d("2026-08-08"), d("2026-08-07")];
    const s = computeStreak(dates, now);
    expect(s.current).toBe(2);
    expect(s.hasActivityToday).toBe(false);
  });

  it("resets the current streak when the last activity was two days ago", () => {
    const dates = [d("2026-08-06"), d("2026-08-07")];
    const s = computeStreak(dates, now);
    expect(s.current).toBe(0);
    expect(s.best).toBe(2);
  });

  it("computes the best streak across gaps", () => {
    const dates = [
      d("2026-08-01"),
      d("2026-08-02"),
      d("2026-08-03"),
      d("2026-08-05"),
      d("2026-08-06"),
    ];
    const s = computeStreak(dates, now);
    expect(s.best).toBe(3);
    expect(s.current).toBe(0);
  });
});
