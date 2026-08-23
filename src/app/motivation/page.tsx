import Link from "next/link";
import { redirect } from "next/navigation";
import type { Metadata } from "next";
import { prisma } from "@/lib/db";
import { getCurrentUser } from "@/lib/api";
import { computeStreak } from "@/lib/streak";
import { getGoalProgress, getMotivationSnapshot } from "@/lib/motivation";
import { CheckIcon, MotivationIcon, SparklesIcon, TargetIcon } from "@/components/icons";
import { GoalsSettings } from "@/components/GoalsSettings";

export const metadata: Metadata = { title: "Motivation — MCQure" };

export default async function MotivationPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const [snapshot, profile] = await Promise.all([
    getMotivationSnapshot(user.id),
    prisma.userPreparation.findUnique({ where: { userId: user.id } }),
  ]);

  const targets = {
    dailyTarget: profile?.dailyTarget ?? 25,
    weeklyTarget: profile?.weeklyTarget ?? 175,
  };

  const streak = computeStreak(
    await prisma.attempt.findMany({ where: { userId: user.id }, select: { createdAt: true } }).then((a) =>
      a.map((x) => x.createdAt)
    )
  );

  const goals = await getGoalProgress(user.id, targets);

  return (
    <div className="flex flex-col gap-6">
      <header>
        <p className="kicker">Momentum</p>
        <h1 className="mt-2 flex items-center gap-2 text-2xl font-bold tracking-tight sm:text-3xl">
          <SparklesIcon className="h-6 w-6 text-brand" />
          Motivation
        </h1>
        <p className="mt-1 max-w-2xl text-sm text-muted-fg">
          No generic quotes — only measurable progress, streaks and achievements.
        </p>
      </header>

      <section className="card relative overflow-hidden p-6">
        <div aria-hidden className="aurora" />
        <div className="relative flex flex-wrap items-center gap-5">
          <span className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-brand-soft text-brand shadow-glow">
            <MotivationIcon className="h-7 w-7" />
          </span>
          <div>
            <p className="kicker">Current streak</p>
            <p className="stat-num mt-1 text-4xl text-ink sm:text-5xl">
              {streak.current}
              <span className="ml-1.5 text-lg font-semibold tracking-normal text-muted-fg">
                day{streak.current === 1 ? "" : "s"} running
              </span>
            </p>
            <p className="mt-1 text-xs text-subtle-fg">Keep the flame alive — answer questions every day.</p>
          </div>
          <span className="badge badge-gold ml-auto self-start sm:self-center">Best: {streak.best} days</span>
        </div>
      </section>

      <section className="grid grid-cols-2 gap-3">
        <ProgressStat label="Today" value={goals.today} total={goals.dailyTarget} />
        <ProgressStat label="This week" value={goals.week} total={goals.weeklyTarget} />
      </section>

      <section className="card p-5 sm:p-6">
        <h2 className="section-title flex items-center gap-2">
          <TargetIcon className="h-4 w-4 text-brand" />
          Goals
        </h2>
        <p className="mt-1 text-xs text-subtle-fg">
          Question targets keep the habit loop honest. Answering a question (correct or not)
          counts toward the goal.
        </p>
        <div className="mt-3">
          <GoalsSettings initial={goals} />
        </div>
      </section>

      <section className="card p-5 sm:p-6">
        <h2 className="section-title flex items-center gap-2">
          <SparklesIcon className="h-4 w-4 text-gold" />
          Achievements ({snapshot.achievements.unlocked.length}/{snapshot.achievements.unlocked.length + snapshot.achievements.locked.length})
        </h2>
        {snapshot.achievements.unlocked.length === 0 ? (
          <p className="mt-3 text-sm text-muted-fg">
            None yet. Answer your first question to start unlocking.
          </p>
        ) : null}
        <ul className="stagger mt-3 grid gap-2 sm:grid-cols-2">
          {[...snapshot.achievements.unlocked, ...snapshot.achievements.locked].map((a) => {
            const unlocked = snapshot.achievements.unlocked.some((u) => u.code === a.code);
            return (
              <li
                key={a.code}
                className={`flex items-start gap-3 rounded-xl border px-3 py-2 ${
                  unlocked ? "border-gold/40 bg-gold-soft" : "border-dashed border-line opacity-60"
                }`}
              >
                {unlocked ? (
                  <span className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-gold text-on-brand shadow-glow">
                    <CheckIcon className="h-3.5 w-3.5" />
                  </span>
                ) : (
                  <span className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full border border-dashed border-line-strong" />
                )}
                <span>
                  <span className={`block text-sm font-semibold ${unlocked ? "text-ink" : "text-muted-fg"}`}>
                    {a.name}
                  </span>
                  {a.description ? (
                    <span className="block text-xs text-subtle-fg">{a.description}</span>
                  ) : null}
                </span>
              </li>
            );
          })}
        </ul>
      </section>

      <section className="card p-5 sm:p-6">
        <h2 className="section-title flex items-center gap-2">
          <SparklesIcon className="h-4 w-4 text-accent" />
          Trends
        </h2>
        <p className="mt-1 text-sm text-muted-fg">
          Weekly accuracy, net-score and speed trends live in Analytics. Mock-vs-practice
          comparison lives in Mock tests.
        </p>
        <div className="mt-4 flex flex-col gap-2 sm:flex-row">
          <Link href="/analytics" className="btn btn-primary flex-1">
            Open Analytics
          </Link>
          <Link href="/mock" className="btn btn-secondary flex-1">
            Take a mock test
          </Link>
        </div>
      </section>
    </div>
  );
}

function ProgressStat({ label, value, total }: { label: string; value: number; total: number }) {
  return (
    <div className="card p-4">
      <dt className="text-xs font-medium text-muted-fg">{label}</dt>
      <dd className="stat-num mt-1 text-xl text-ink">
        {value}
        <span className="text-sm font-medium text-subtle-fg">/{total}</span>
      </dd>
      <div className="progress mt-2">
        <div
          className="progress-bar"
          style={{ width: `${Math.min(100, (value / Math.max(1, total)) * 100)}%` }}
        />
      </div>
    </div>
  );
}
