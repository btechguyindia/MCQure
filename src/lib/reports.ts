// Phase 9 Reports & export: weekly/monthly aggregates derived from the
// permanent attempt history, with CSV/JSON export helpers.

import { prisma } from "@/lib/db";
import { computeStreak, dayKey } from "@/lib/streak";

export type ReportPeriod = "week" | "month";

export interface ReportTotals {
  period: ReportPeriod;
  from: Date;
  to: Date;
  total: number;
  answered: number;
  correct: number;
  incorrect: number;
  skipped: number;
  accuracy: number | null;
  netScore: number;
  avgResponseTimeMs: number;
  timeSpentMs: number;
  streak: { current: number; best: number; hasActivityToday: boolean };
}

export interface ReportSubjectRow {
  subject: string;
  total: number;
  answered: number;
  correct: number;
  incorrect: number;
  accuracy: number | null;
  netScore: number;
}

export interface ReportDay {
  day: string;
  answered: number;
  correct: number;
  accuracy: number | null;
}

export interface Report {
  totals: ReportTotals;
  bySubject: ReportSubjectRow[];
  byDay: ReportDay[];
}

export function periodRange(period: ReportPeriod, now = new Date()): { from: Date; to: Date } {
  const to = new Date(now);
  const from = new Date(now);
  if (period === "week") from.setDate(from.getDate() - 6);
  else from.setMonth(from.getMonth() - 1);
  from.setHours(0, 0, 0, 0);
  return { from, to };
}

/** Aggregated report for a user over the given period. */
export async function getReport(userId: string, period: ReportPeriod): Promise<Report> {
  const { from, to } = periodRange(period);

  const attempts = await prisma.attempt.findMany({
    where: { userId, createdAt: { gte: from, lte: to } },
    select: {
      isCorrect: true,
      score: true,
      responseTimeMs: true,
      createdAt: true,
      question: { select: { topic: { select: { subject: { select: { name: true } } } } } },
    },
  });

  const answered = attempts.filter((a) => a.isCorrect !== null);
  const correct = answered.filter((a) => a.isCorrect === true);
  const incorrect = answered.filter((a) => a.isCorrect === false);
  const skipped = attempts.length - answered.length;
  const accuracy = answered.length > 0 ? (100 * correct.length) / answered.length : null;
  const netScore = answered.reduce((s, a) => s + a.score, 0);
  const timeSpentMs = attempts.reduce((s, a) => s + a.responseTimeMs, 0);
  const avgResponseTimeMs = attempts.length > 0 ? Math.round(timeSpentMs / attempts.length) : 0;

  const bySubjectMap = new Map<string, { total: number; answered: number; correct: number; score: number }>();
  for (const a of attempts) {
    const name = a.question.topic.subject.name;
    const g = bySubjectMap.get(name) ?? { total: 0, answered: 0, correct: 0, score: 0 };
    g.total += 1;
    if (a.isCorrect !== null) {
      g.answered += 1;
      g.score += a.score;
      if (a.isCorrect) g.correct += 1;
    }
    bySubjectMap.set(name, g);
  }
  const bySubject: ReportSubjectRow[] = [...bySubjectMap.entries()]
    .map(([subject, g]) => ({
      subject,
      total: g.total,
      answered: g.answered,
      correct: g.correct,
      incorrect: g.answered - g.correct,
      accuracy: g.answered > 0 ? (100 * g.correct) / g.answered : null,
      netScore: Math.round(g.score * 100) / 100,
    }))
    .sort((a, b) => b.answered - a.answered);

  const byDayMap = new Map<string, { answered: number; correct: number }>();
  for (const a of answered) {
    const key = dayKey(a.createdAt);
    const g = byDayMap.get(key) ?? { answered: 0, correct: 0 };
    g.answered += 1;
    if (a.isCorrect) g.correct += 1;
    byDayMap.set(key, g);
  }
  const byDay: ReportDay[] = [...byDayMap.entries()]
    .sort((a, b) => (a[0] < b[0] ? -1 : 1))
    .map(([day, g]) => ({
      day,
      answered: g.answered,
      correct: g.correct,
      accuracy: g.answered > 0 ? (100 * g.correct) / g.answered : null,
    }));

  return {
    totals: {
      period,
      from,
      to,
      total: attempts.length,
      answered: answered.length,
      correct: correct.length,
      incorrect: incorrect.length,
      skipped,
      accuracy,
      netScore: Math.round(netScore * 100) / 100,
      avgResponseTimeMs,
      timeSpentMs,
      streak: computeStreak(attempts.map((a) => a.createdAt)),
    },
    bySubject,
    byDay,
  };
}

export function reportToJson(report: Report): string {
  return JSON.stringify(report, null, 2);
}

export function reportToCsv(report: Report): string {
  const rows: string[] = ["SECTION,VALUE"];
  const t = report.totals;
  rows.push(`period,${t.period}`);
  rows.push(`from,${t.from.toISOString()}`);
  rows.push(`to,${t.to.toISOString()}`);
  rows.push(`total attempts,${t.total}`);
  rows.push(`answered,${t.answered}`);
  rows.push(`correct,${t.correct}`);
  rows.push(`incorrect,${t.incorrect}`);
  rows.push(`skipped,${t.skipped}`);
  rows.push(`accuracy,${t.accuracy == null ? "" : t.accuracy}`);
  rows.push(`net score,${t.netScore}`);
  rows.push(`avg response time ms,${t.avgResponseTimeMs}`);
  rows.push(`time spent ms,${t.timeSpentMs}`);
  rows.push(`current streak,${t.streak.current}`);
  rows.push(`best streak,${t.streak.best}`);
  rows.push("");
  rows.push("SUBJECT,total,answered,correct,incorrect,accuracy,netScore");
  for (const r of report.bySubject) {
    rows.push(`${csvCell(r.subject)},${r.total},${r.answered},${r.correct},${r.incorrect},${r.accuracy ?? ""},${r.netScore}`);
  }
  rows.push("");
  rows.push("DAY,answered,correct,accuracy");
  for (const d of report.byDay) {
    rows.push(`${csvCell(d.day)},${d.answered},${d.correct},${d.accuracy ?? ""}`);
  }
  return rows.join("\r\n");
}

function csvCell(value: string): string {
  return /[",\n]/.test(value) ? `"${value.replace(/"/g, '""')}"` : value;
}
