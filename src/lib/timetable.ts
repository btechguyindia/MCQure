// Study timetables: repeating weekly / bi-weekly / monthly schedules authored
// by the user as JSON. Cycle windows are computed in UTC (weeks start Monday,
// bi-weeks alternate from a fixed epoch anchor, months are calendar months)
// so progress resets are deterministic regardless of server timezone.

import { prisma } from "@/lib/db";
import type { ScheduleCycle } from "@prisma/client";

export interface TimetableSlot {
  day: number; // 0 = Monday … 6 = Sunday
  start: string; // "HH:mm" 24h
  end: string;
  activity: string;
  topicId?: string;
}

export const DAY_LABELS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"] as const;

export const CYCLE_LABELS: Record<ScheduleCycle, string> = {
  WEEKLY: "Weekly",
  BIWEEKLY: "Bi-weekly",
  MONTHLY: "Monthly",
};

/** Default per-cycle question target when the user does not set one. */
export function defaultTargetFor(cycle: ScheduleCycle): number {
  switch (cycle) {
    case "BIWEEKLY":
      return 350;
    case "MONTHLY":
      return 750;
    default:
      return 175;
  }
}

export interface CycleBounds {
  start: Date; // inclusive
  end: Date; // exclusive — next reset moment
}

function addDays(date: Date, days: number): Date {
  return new Date(date.getTime() + days * 24 * 60 * 60 * 1000);
}

/** UTC midnight of the day containing `now`. */
function dayStart(now: Date): Date {
  return new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
}

/**
 * Window of the cycle that contains `now`.
 * WEEKLY → Mon–Sun, BIWEEKLY → alternating fortnights (anchored to the first
 * Monday after the epoch so parity is stable), MONTHLY → calendar month.
 */
export function getCycleBounds(cycle: ScheduleCycle, now = new Date()): CycleBounds {
  if (cycle === "MONTHLY") {
    const start = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1));
    const end = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() + 1, 1));
    return { start, end };
  }

  const mondayOffset = (now.getUTCDay() + 6) % 7;
  const weekStart = addDays(dayStart(now), -mondayOffset);

  if (cycle === "BIWEEKLY") {
    // Week 0 begins at the first Monday of the epoch week.
    const firstMonday = Date.UTC(1970, 0, 5);
    const weeksSinceEpoch = Math.round((weekStart.getTime() - firstMonday) / (7 * 86400000));
    const biweekStart = addDays(weekStart, -(weeksSinceEpoch % 2) * 7);
    return { start: biweekStart, end: addDays(biweekStart, 14) };
  }

  return { start: weekStart, end: addDays(weekStart, 7) };
}

/** Questions answered (scored attempts) between two instants. */
export async function countAnsweredBetween(userId: string, start: Date, end: Date): Promise<number> {
  return prisma.attempt.count({
    where: {
      userId,
      createdAt: { gte: start, lt: end },
      isCorrect: { not: null },
    },
  });
}

/** Defensively parses the JSON `slots` column into typed slots. */
export function parseSlots(value: unknown): TimetableSlot[] {
  const TIME_RE = /^([01]\d|2[0-3]):[0-5]\d$/;
  if (!Array.isArray(value)) return [];
  const slots: TimetableSlot[] = [];
  for (const raw of value) {
    if (typeof raw !== "object" || raw === null) continue;
    const s = raw as Record<string, unknown>;
    if (
      typeof s.day !== "number" ||
      !Number.isInteger(s.day) ||
      s.day < 0 ||
      s.day > 6 ||
      typeof s.start !== "string" ||
      !TIME_RE.test(s.start) ||
      typeof s.end !== "string" ||
      !TIME_RE.test(s.end) ||
      s.start >= s.end ||
      typeof s.activity !== "string"
    ) {
      continue;
    }
    slots.push({
      day: s.day,
      start: s.start,
      end: s.end,
      activity: s.activity,
      ...(typeof s.topicId === "string" ? { topicId: s.topicId } : {}),
    });
  }
  return slots.sort((a, b) => a.day - b.day || a.start.localeCompare(b.start));
}

/** Slots scheduled on a given weekday (0 = Monday), sorted by start time. */
export function slotsForDay(slots: TimetableSlot[], day: number): TimetableSlot[] {
  return slots.filter((slot) => slot.day === day).sort((a, b) => a.start.localeCompare(b.start));
}

/** Weekday index of `now`, 0 = Monday … 6 = Sunday. */
export function weekdayIndex(now = new Date()): number {
  return (now.getUTCDay() + 6) % 7;
}

export type StudyTimetableRow = {
  id: string;
  name: string;
  cycle: ScheduleCycle;
  targetQuestions: number;
  slots: unknown; // Json column
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
};

export interface TimetableView {
  active: {
    id: string;
    name: string;
    cycle: ScheduleCycle;
    targetQuestions: number;
    slots: TimetableSlot[];
  } | null;
  cycleWindow: { start: string; end: string } | null;
  answeredThisCycle: number;
  today: { weekday: number; slots: TimetableSlot[] };
}

export async function listTimetables(userId: string): Promise<StudyTimetableRow[]> {
  return prisma.studyTimetable.findMany({
    where: { userId },
    orderBy: [{ isActive: "desc" }, { updatedAt: "desc" }],
  });
}

/**
 * Everything the dashboard needs for the currently active timetable: its
 * slots, the running cycle window and how much of the target is done.
 */
export async function getTimetableView(userId: string, now = new Date()): Promise<TimetableView> {
  const active = await prisma.studyTimetable.findFirst({
    where: { userId, isActive: true },
    orderBy: { updatedAt: "desc" },
  });

  if (!active) {
    return {
      active: null,
      cycleWindow: null,
      answeredThisCycle: 0,
      today: { weekday: weekdayIndex(now), slots: [] },
    };
  }

  const window = getCycleBounds(active.cycle, now);
  const [answered] = await Promise.all([countAnsweredBetween(userId, window.start, window.end)]);

  const slots = parseSlots(active.slots);
  const weekday = weekdayIndex(now);

  return {
    active: {
      id: active.id,
      name: active.name,
      cycle: active.cycle,
      targetQuestions: active.targetQuestions,
      slots,
    },
    cycleWindow: { start: window.start.toISOString(), end: window.end.toISOString() },
    answeredThisCycle: answered,
    today: { weekday, slots: slotsForDay(slots, weekday) },
  };
}

/**
 * Marks one timetable active and every other one inactive (single transaction
 * so the "exactly one active" invariant always holds).
 */
export async function activateTimetable(userId: string, id: string): Promise<void> {
  await prisma.$transaction([
    prisma.studyTimetable.updateMany({ where: { userId, isActive: true }, data: { isActive: false } }),
    prisma.studyTimetable.updateMany({ where: { userId, id }, data: { isActive: true } }),
  ]);
}
