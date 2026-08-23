import { describe, expect, it } from "vitest";
import {
  DAY_LABELS,
  defaultTargetFor,
  getCycleBounds,
  parseSlots,
  slotsForDay,
  weekdayIndex,
} from "./timetable";

describe("getCycleBounds", () => {
  it("returns the Monday–Sunday window for WEEKLY", () => {
    // Wed 2026-08-19 → week Mon 2026-08-17 … Sun 2026-08-23
    const { start, end } = getCycleBounds("WEEKLY", new Date("2026-08-19T15:30:00Z"));
    expect(start.toISOString()).toBe("2026-08-17T00:00:00.000Z");
    expect(end.toISOString()).toBe("2026-08-24T00:00:00.000Z");
  });

  it("starts the weekly window on Monday even on a Sunday", () => {
    const { start } = getCycleBounds("WEEKLY", new Date("2026-08-23T09:00:00Z"));
    expect(start.toISOString()).toBe("2026-08-17T00:00:00.000Z");
  });

  it("keeps BIWEEKLY windows inside one fortnight and alternating parity", () => {
    const first = getCycleBounds("BIWEEKLY", new Date("2026-08-19T12:00:00Z"));
    // Both weeks of the same fortnight share one window.
    const sameFortnight = getCycleBounds("BIWEEKLY", new Date("2026-08-27T23:59:00Z"));
    expect(first.start.toISOString()).toBe(sameFortnight.start.toISOString());
    // The next week after the window starts a fresh fortnight of 14 days.
    const next = getCycleBounds("BIWEEKLY", new Date(first.end.getTime() + 86400000));
    expect(next.start.getTime()).toBe(first.end.getTime());
    expect((next.end.getTime() - next.start.getTime()) / 86400000).toBe(14);
  });

  it("returns calendar-month bounds for MONTHLY", () => {
    const { start, end } = getCycleBounds("MONTHLY", new Date("2026-02-10T08:00:00Z"));
    expect(start.toISOString()).toBe("2026-02-01T00:00:00.000Z");
    expect(end.toISOString()).toBe("2026-03-01T00:00:00.000Z");
  });

  it("defaults targets scale with cycle length", () => {
    expect(defaultTargetFor("WEEKLY")).toBe(175);
    expect(defaultTargetFor("BIWEEKLY")).toBe(350);
    expect(defaultTargetFor("MONTHLY")).toBe(750);
  });
});

describe("weekdayIndex", () => {
  it("maps UTC weekdays to Monday-first indices", () => {
    expect(weekdayIndex(new Date("2026-08-17T10:00:00Z"))).toBe(0); // Mon
    expect(weekdayIndex(new Date("2026-08-22T10:00:00Z"))).toBe(5); // Sat
    expect(weekdayIndex(new Date("2026-08-23T10:00:00Z"))).toBe(6); // Sun
  });

  it("labels match the index order", () => {
    expect(DAY_LABELS[0]).toBe("Mon");
    expect(DAY_LABELS[6]).toBe("Sun");
  });
});

describe("parseSlots", () => {
  it("drops malformed entries and sorts by day then start", () => {
    const slots = parseSlots([
      { day: 2, start: "18:00", end: "19:30", activity: "Revision" },
      { day: 0, start: "06:00", end: "07:00", activity: "Practice" },
      { day: 0, start: "05:00", end: "05:45", activity: "Notes" },
      { day: 9, start: "06:00", end: "07:00", activity: "invalid day" },
      { day: 1, start: "7am", end: "8am", activity: "invalid time" },
      null,
      "nope",
    ]);
    expect(slots.map((s) => s.activity)).toEqual(["Notes", "Practice", "Revision"]);
  });

  it("returns an empty array for non-array JSON", () => {
    expect(parseSlots(null)).toEqual([]);
    expect(parseSlots({})).toEqual([]);
    expect(parseSlots(undefined)).toEqual([]);
  });
});

describe("slotsForDay", () => {
  const slots = parseSlots([
    { day: 1, start: "20:00", end: "21:00", activity: "Evening PYQs" },
    { day: 1, start: "06:00", end: "07:00", activity: "Morning drill" },
    { day: 3, start: "06:00", end: "07:00", activity: "Mock review" },
  ]);

  it("filters to the requested day sorted by start time", () => {
    expect(slotsForDay(slots, 1).map((s) => s.activity)).toEqual([
      "Morning drill",
      "Evening PYQs",
    ]);
    expect(slotsForDay(slots, 3)).toHaveLength(1);
    expect(slotsForDay(slots, 5)).toEqual([]);
  });
});
