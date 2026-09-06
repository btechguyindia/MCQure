"use client";

import { useEffect, useState } from "react";
import { CrownIcon, FlameIcon, LeaderboardIcon, TargetIcon } from "@/components/icons";
import type {
  LeaderboardEntry,
  LeaderboardPeriod,
  LeaderboardResult,
} from "@/lib/leaderboard";

const PERIODS: Array<{ value: LeaderboardPeriod; label: string }> = [
  { value: "daily", label: "Daily" },
  { value: "weekly", label: "Weekly" },
  { value: "monthly", label: "Monthly" },
  { value: "all_time", label: "All time" },
];

const MEDAL_STYLES: Record<number, { badge: string; ring: string; label: string } | undefined> = {
  1: {
    badge: "bg-amber-300 text-amber-900 dark:bg-amber-400/80 dark:text-amber-950",
    ring: "ring-amber-300/70 dark:ring-amber-400/40",
    label: "bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300",
  },
  2: {
    badge: "bg-slate-300 text-slate-800 dark:bg-slate-500/70 dark:text-slate-100",
    ring: "ring-slate-300/70 dark:ring-slate-400/40",
    label: "bg-slate-100 text-slate-700 dark:bg-slate-800/50 dark:text-slate-300",
  },
  3: {
    badge: "bg-orange-300 text-orange-900 dark:bg-orange-500/70 dark:text-orange-50",
    ring: "ring-orange-300/70 dark:ring-orange-400/40",
    label: "bg-orange-100 text-orange-800 dark:bg-orange-900/40 dark:text-orange-300",
  },
};

function formatPoints(points: number): string {
  return points > 0 ? `+${points.toFixed(0)}` : points.toFixed(0);
}

function initialOf(name: string): string {
  return name.trim().charAt(0).toUpperCase() || "?";
}

/** Eased count-up used to land each player's points with a small flourish. */
function useCountUp(target: number, duration = 650): number {
  const [value, setValue] = useState(0);
  useEffect(() => {
    let raf = 0;
    const start = performance.now();
    const tick = (t: number) => {
      const p = Math.min((t - start) / duration, 1);
      const eased = 1 - Math.pow(1 - p, 3);
      setValue(Math.round(target * eased));
      if (p < 1) raf = requestAnimationFrame(tick);
      else setValue(target);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [target, duration]);
  return value;
}

function AnimatedPoints({ value, className = "" }: { value: number; className?: string }) {
  const display = useCountUp(Math.round(value));
  return <span className={className}>{formatPoints(display)}</span>;
}

/** Metallic pill for paid tiers; BASIC players get no chip. */
function tierChip(tier: string): string | null {
  if (tier === "ROYAL") return "tier-royal";
  if (tier === "PREMIUM_PLUS") return "tier-gold";
  if (tier === "PREMIUM") return "tier-silver";
  return null;
}

export function Leaderboard({ userId }: { userId: string }) {
  const [period, setPeriod] = useState<LeaderboardPeriod>("daily");
  const [data, setData] = useState<LeaderboardResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    fetch(`/api/leaderboard?period=${period}&limit=25`)
      .then(async (res) => {
        const json = await res.json();
        if (!res.ok || !json.ok) throw new Error(json.message ?? "Could not load the leaderboard.");
        return json as LeaderboardResult;
      })
      .then((result) => {
        if (cancelled) return;
        setError(null);
        setData(result);
      })
      .catch((e) => {
        if (cancelled) return;
        setError(e instanceof Error ? e.message : "Could not load the leaderboard.");
        setData(null);
      });
    return () => {
      cancelled = true;
    };
  }, [period]);

  const loading = !data || data.period !== period;
  const top3 = (data?.entries ?? []).slice(0, 3);
  const isInTop = data?.entries.some((e) => e.userId === userId) ?? false;

  return (
    <div className="stagger flex flex-col gap-6">
      <header>
        <p className="kicker">Competitive standings</p>
        <h1 className="mt-2 flex items-center gap-2.5 text-2xl font-bold tracking-tight">
          <LeaderboardIcon className="h-6 w-6 text-brand" />
          Leaderboard
        </h1>
        <p className="mt-1 max-w-2xl text-sm text-muted-fg">
        Ranked by net score from your permanent attempt history. The top three take the podium; top 25 make the board.
        </p>
      </header>

      {/* Period tabs */}
      <div role="tablist" aria-label="Leaderboard period" className="panel inline-flex w-fit flex-wrap gap-1 p-1">
        {PERIODS.map(({ value, label }) => {
          const active = period === value;
          return (
            <button
              key={value}
              type="button"
              role="tab"
              aria-selected={active}
              onClick={() => setPeriod(value)}
              className={`rounded-xl px-3.5 py-1.5 text-sm font-semibold transition-colors ${
                active
                  ? "bg-brand-soft text-brand"
                  : "text-muted-fg hover:bg-brand-soft hover:text-ink"
              }`}
            >
              {label}
            </button>
          );
        })}
      </div>

      {error ? (
        <div className="card p-6 text-sm text-bad">{error}</div>
      ) : loading ? (
        <LeaderboardSkeleton />
      ) : data.entries.length === 0 ? (
        <div className="card flex flex-col items-center gap-3 p-10 text-center">
          <LeaderboardIcon className="h-8 w-8 text-subtle-fg" />
          <p className="text-sm font-semibold text-ink">No activity in this period yet</p>
          <p className="max-w-sm text-sm text-muted-fg">
            Answer questions to climb the {periodLabel(period)} standings and make the top 25.
          </p>
        </div>
      ) : (
        <>
          {/* Your standing — crown, podium, or the gap you need to close */}
          {data.me ? (
            <MeBanner me={data.me} entries={data.entries} isInTop={isInTop} period={period} />
          ) : null}

          {/* Podium */}
          <Podium top3={top3} userId={userId} />

          {/* Top 25 */}
          <section aria-label="Top 25" className="card p-4 sm:p-5">
            <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
              <h2 className="section-title">Top {Math.min(25, data.total)}</h2>
              <span className="text-xs font-medium text-subtle-fg">
                {data.total} ranked player{data.total === 1 ? "" : "s"} · {periodLabel(period)}
              </span>
            </div>

            <div className="mb-2 hidden grid-cols-[2.5rem_1fr_auto_auto_auto_3.5rem] items-center gap-3 border-b border-line px-3 pb-2 text-[0.65rem] font-semibold uppercase tracking-[0.14em] text-subtle-fg sm:grid">
              <span>Rank</span>
              <span>Player</span>
              <span className="text-right">Answered</span>
              <span className="text-right">Correct</span>
              <span className="text-right md:block">Accuracy</span>
              <span className="text-right">Points</span>
            </div>

            <div className="flex flex-col gap-1.5">
              {data.entries.map((entry) => (
                <RankRow key={entry.userId} entry={entry} isMe={entry.userId === userId} />
              ))}

              {/* Current user standing when below the cut */}
              {data.me && !isInTop ? (
                <>
                  <div className="my-1.5 flex items-center gap-2 text-[0.65rem] font-semibold uppercase tracking-[0.14em] text-subtle-fg">
                    <span className="h-px flex-1 bg-line" />
                    Your standing
                    <span className="h-px flex-1 bg-line" />
                  </div>
                  <RankRow entry={data.me} isMe highlight />
                </>
              ) : null}
            </div>
          </section>
        </>
      )}
    </div>
  );
}

function MeBanner({
  me,
  entries,
  isInTop,
  period,
}: {
  me: LeaderboardEntry;
  entries: LeaderboardEntry[];
  isInTop: boolean;
  period: LeaderboardPeriod;
}) {
  if (me.rank === 1) {
    return (
      <div className="card flex items-center gap-3 p-4 ring-1 ring-gold/40">
        <CrownIcon className="crown-live h-7 w-7 shrink-0 text-gold" />
        <div>
          <p className="text-sm font-bold text-ink">
            You&apos;re #1 in the {periodLabel(period)} standings.
          </p>
          <p className="mt-0.5 text-xs text-muted-fg">Hold the top spot — everyone else is chasing you.</p>
        </div>
      </div>
    );
  }

  if (me.rank <= 3) {
    return (
      <div className="card flex items-center gap-3 p-4">
        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-brand-soft text-sm font-black text-brand">
          {me.rank}
        </span>
        <div>
          <p className="text-sm font-bold text-ink">You&apos;re on the podium at #{me.rank}.</p>
          <p className="mt-0.5 text-xs text-muted-fg">One more push and the crown is within reach.</p>
        </div>
      </div>
    );
  }

  const cut = isInTop ? entries[2] : entries[entries.length - 1];
  const goal = isInTop ? "points from the podium" : entries.length === 25 ? "points from the top 25" : "points from the next player";
  if (!cut) return null;
  const gap = cut.points - me.points;
  if (gap <= 0) return null;
  const pct = Math.max(0, Math.min(1, me.points / cut.points));

  return (
    <div className="card p-4">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3">
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-brand-soft text-sm font-black text-brand">
            {me.rank}
          </span>
          <div>
            <p className="text-sm font-bold text-ink">
              You&apos;re #{me.rank} — {Math.ceil(gap)} {goal}.
            </p>
            <p className="mt-0.5 text-xs text-muted-fg">A few more correct answers could move you up.</p>
          </div>
        </div>
        <TargetIcon className="h-5 w-5 shrink-0 text-accent" />
      </div>
      <div className="progress mt-3">
        <div className="progress-bar" style={{ width: `${Math.round(pct * 100)}%` }} />
      </div>
      <p className="mt-1.5 text-[0.7rem] font-medium tabular-nums text-subtle-fg">
        {Math.round(pct * 100)}% of the way there
      </p>
    </div>
  );
}

function Podium({ top3, userId }: { top3: LeaderboardEntry[]; userId: string }) {
  const [second, first, third] = [top3[1], top3[0], top3[2]];

  return (
    <section aria-label="Podium" className="stagger">
    <div className="grid grid-cols-1 items-end gap-3 sm:mx-auto sm:grid-cols-3 sm:max-w-2xl sm:gap-4">
        {second ? (
          <PodiumCard entry={second} medal={2} isMe={second.userId === userId} className="sm:order-1 sm:pb-2" />
        ) : null}
        {first ? (
          <PodiumCard entry={first} medal={1} isMe={first.userId === userId} className="sm:order-2" />
        ) : null}
        {third ? (
          <PodiumCard entry={third} medal={3} isMe={third.userId === userId} className="sm:order-3 sm:pb-4" />
        ) : null}
      </div>
    </section>
  );
}

function PodiumCard({
  entry,
  medal,
  isMe = false,
  className = "",
}: {
  entry: LeaderboardEntry;
  medal: 1 | 2 | 3;
  isMe?: boolean;
  className?: string;
}) {
  const style = MEDAL_STYLES[medal];
  const heights = {
    1: "pt-6 pb-5",
    2: "pt-5 pb-4",
    3: "pt-4 pb-3",
  }[medal];
  const chip = tierChip(entry.tier);
  return (
    <div
      className={`card-hover flex flex-col items-center gap-2.5 rounded-2xl border-2 p-4 shadow-soft ring-offset-2 ${heights} ${style?.ring} ${className}`}
    >
      {medal === 1 ? (
        <CrownIcon className="crown-live h-7 w-7 text-gold" aria-label="Current leader" />
      ) : null}
      <span
        className={`flex h-10 w-10 items-center justify-center rounded-full font-black shadow-soft ${style?.badge}`}
        aria-label={`Rank ${medal}`}
      >
        {medal}
      </span>
      <div className="flex flex-col items-center gap-1 text-center">
        <span className="max-w-full truncate text-sm font-bold text-ink">{entry.name}</span>
        <div className="flex min-h-4 flex-wrap items-center justify-center gap-1.5">
          {entry.streak > 1 ? (
            <span className="inline-flex items-center gap-0.5 text-[0.65rem] font-bold tabular-nums text-warn">
              <FlameIcon className="h-3.5 w-3.5" />
              {entry.streak}-day
            </span>
          ) : null}
          {chip ? <span className={`badge text-[0.6rem] ${chip}`}>{entry.tier}</span> : null}
        </div>
        <AnimatedPoints value={entry.points} className="stat-num text-lg text-brand" />
        <span className={`inline-flex rounded-full px-2 py-0.5 text-[0.65rem] font-bold ${style?.label}`}>
          {entry.accuracy == null ? "—" : `${entry.accuracy}% accuracy`}
        </span>
        {isMe ? <span className="badge badge-brand">You</span> : null}
      </div>
    </div>
  );
}

function RankRow({
  entry,
  isMe,
  highlight = false,
}: {
  entry: LeaderboardEntry;
  isMe?: boolean;
  highlight?: boolean;
}) {
  const style = MEDAL_STYLES[entry.rank];
  return (
    <div
      className={`grid grid-cols-[2rem_1fr_auto] items-center gap-3 rounded-xl px-3 py-2.5 transition-colors sm:grid-cols-[2.5rem_1fr_auto_auto_auto_3.5rem] ${
        highlight || isMe
          ? "bg-brand-soft/70 ring-1 ring-brand/25"
          : "hover:bg-brand-soft/40"
      }`}
    >
      <span
        className={`flex h-7 w-7 items-center justify-center rounded-lg text-[0.7rem] font-black ${
          style?.badge ?? "bg-line-strong/60 text-muted-fg"
        }`}
      >
        {entry.rank}
      </span>

      <div className="flex min-w-0 items-center gap-2.5">
        <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-brand to-accent text-[0.7rem] font-bold text-on-brand">
          {initialOf(entry.name)}
        </span>
        <span className="min-w-0 truncate text-sm font-semibold text-ink">
          {entry.name}
        </span>
        {isMe ? (
          <span className="badge badge-brand hidden sm:inline-flex">You</span>
        ) : null}
        {tierChip(entry.tier) ? (
          <span className={`badge hidden text-[0.6rem] lg:inline-flex ${tierChip(entry.tier)}`}>
            {entry.tier}
          </span>
        ) : null}
        {entry.streak > 1 ? (
          <span
            className="hidden items-center gap-0.5 text-[0.7rem] font-bold tabular-nums text-warn sm:inline-flex"
            title="Active-day streak"
          >
            <FlameIcon className="h-3.5 w-3.5" />
            {entry.streak}
          </span>
        ) : null}
      </div>

      <span className="stat-num hidden text-right text-sm tabular-nums text-muted-fg sm:block">
        {entry.answered}
      </span>
      <span className="stat-num hidden text-right text-sm tabular-nums text-ok sm:block">
        {entry.correct}
      </span>
      <span className="stat-num hidden text-right text-sm tabular-nums text-muted-fg md:block">
        {entry.accuracy == null ? "—" : `${entry.accuracy}%`}
      </span>
      <AnimatedPoints value={entry.points} className="stat-num text-right text-sm font-bold tabular-nums text-brand" />
    </div>
  );
}

function LeaderboardSkeleton() {
  return (
    <div className="flex flex-col gap-4">
      <div className="grid grid-cols-1 gap-3 sm:mx-auto sm:grid-cols-3 sm:max-w-2xl sm:gap-4">
        <div className="skeleton h-40 rounded-2xl" />
        <div className="skeleton h-48 rounded-2xl" />
        <div className="skeleton h-36 rounded-2xl" />
      </div>
      <div className="card p-5">
        <div className="skeleton mb-4 h-4 w-24" />
        <div className="flex flex-col gap-2">
          {[...Array(8)].map((_, i) => (
            <div key={i} className="skeleton h-12 rounded-xl" />
          ))}
        </div>
      </div>
    </div>
  );
}

function periodLabel(period: LeaderboardPeriod): string {
  switch (period) {
    case "daily":
      return "daily";
    case "weekly":
      return "weekly";
    case "monthly":
      return "monthly";
    case "all_time":
      return "all-time";
  }
}