// Streak computation over a list of attempt dates.

export interface StreakInfo {
  current: number;
  best: number;
  hasActivityToday: boolean;
}

export function dayKey(d: Date): string {
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

/**
 * Computes the current and best streaks of consecutive active days.
 * A streak is "alive" if there was activity today or yesterday.
 */
export function computeStreak(dates: Date[], now = new Date()): StreakInfo {
  const activeDays = new Set(dates.map(dayKey));
  if (activeDays.size === 0) return { current: 0, best: 0, hasActivityToday: false };

  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const dayMs = 24 * 60 * 60 * 1000;

  // Best streak: scan back from each day.
  let best = 0;
  const allKeys = [...activeDays].sort();
  let run = 0;
  let prev: Date | null = null;
  for (const key of allKeys) {
    const d = new Date(key + "T00:00:00");
    if (prev && d.getTime() - prev.getTime() === dayMs) run += 1;
    else run = 1;
    best = Math.max(best, run);
    prev = d;
  }

  // Current streak: consecutive days ending today or yesterday.
  const start = activeDays.has(dayKey(today)) ? today : new Date(today.getTime() - dayMs);
  let current = 0;
  const cursor = new Date(start);
  while (activeDays.has(dayKey(cursor))) {
    current += 1;
    cursor.setTime(cursor.getTime() - dayMs);
  }

  return {
    current,
    best,
    hasActivityToday: activeDays.has(dayKey(today)),
  };
}
