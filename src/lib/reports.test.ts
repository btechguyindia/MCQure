import { describe, expect, it } from "vitest";
import type { Report } from "./reports";
import { periodRange, reportToCsv, reportToJson } from "./reports";

describe("periodRange", () => {
  it("computes the last 7 days for the week period", () => {
    const now = new Date("2026-08-09T15:00:00Z");
    const { from, to } = periodRange("week", now);
    expect(to).toEqual(now);
    expect(from.getHours()).toBe(0);
    expect(from.getMinutes()).toBe(0);
    const expected = new Date(now);
    expected.setDate(expected.getDate() - 6);
    expected.setHours(0, 0, 0, 0);
    expect(from.getTime()).toBe(expected.getTime());
  });

  it("computes a month back for the month period", () => {
    const now = new Date("2026-08-09T15:00:00Z");
    const { from } = periodRange("month", now);
    expect(from.getUTCMonth()).toBe(6); // July
  });
});

function sampleReport(): Report {
  return {
    totals: {
      period: "week",
      from: new Date("2026-08-03T00:00:00Z"),
      to: new Date("2026-08-09T00:00:00Z"),
      total: 4,
      answered: 3,
      correct: 2,
      incorrect: 1,
      skipped: 1,
      accuracy: 66.666,
      netScore: 1.75,
      avgResponseTimeMs: 7000,
      timeSpentMs: 24000,
      streak: { current: 2, best: 5, hasActivityToday: true },
    },
    bySubject: [{ subject: "Science", total: 4, answered: 3, correct: 2, incorrect: 1, accuracy: 66.666, netScore: 1.75 }],
    byDay: [{ day: "2026-08-08", answered: 2, correct: 1, accuracy: 50 }],
  };
}

describe("reportToJson", () => {
  it("serializes the full report as pretty JSON", () => {
    const json = reportToJson(sampleReport());
    expect(JSON.parse(json).totals.netScore).toBe(1.75);
    expect(json).toContain('"period": "week"');
  });
});

describe("reportToCsv", () => {
  it("emits the section header and totals rows", () => {
    const csv = reportToCsv(sampleReport());
    expect(csv).toContain("SECTION,VALUE");
    expect(csv).toContain("net score,1.75");
    expect(csv).toContain("current streak,2");
  });

  it("emits subject and day tables", () => {
    const csv = reportToCsv(sampleReport());
    expect(csv).toContain("SUBJECT,total,answered,correct,incorrect,accuracy,netScore");
    expect(csv).toContain("Science,4,3,2,1,66.666,1.75");
    expect(csv).toContain("DAY,answered,correct,accuracy");
    expect(csv).toContain("2026-08-08,2,1,50");
  });

  it("escapes commas and quotes in cells", () => {
    const report = sampleReport();
    report.bySubject[0].subject = 'Comp, "Sci"';
    const csv = reportToCsv(report);
    expect(csv).toContain('"Comp, ""Sci""",4,3,2,1,66.666,1.75');
  });
});
