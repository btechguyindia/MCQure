// Practice mode defaults (pure — no I/O, so it is trivially testable).

export const MODE_DEFAULTS: Record<string, { count: number }> = {
  quick: { count: 10 },
  standard: { count: 25 },
  deep: { count: 50 },
  marathon: { count: 100 },
  custom: { count: 25 },
  review: { count: 20 },
  smart: { count: 20 },
};

export function resolveCount(mode: string, requested?: number): number {
  if (mode === "custom" && requested) return requested;
  return MODE_DEFAULTS[mode]?.count ?? 25;
}
