import Link from "next/link";
import { redirect } from "next/navigation";
import type { Metadata } from "next";
import { prisma } from "@/lib/db";
import { getCurrentUser } from "@/lib/api";
import { computeStreak } from "@/lib/streak";
import { getGoalProgress, getMotivationSnapshot } from "@/lib/motivation";
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
        <h1 className="text-2xl font-bold">⚡ Motivation</h1>
        <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
          No generic quotes — only measurable progress, streaks and achievements.
        </p>
      </header>

      <section className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <MotivationStat label="Current streak" value={`${streak.current} day${streak.current === 1 ? "" : "s"}`} />
        <MotivationStat label="Longest streak" value={`${streak.best} days`} />
        <MotivationStat label="Today" value={`${goals.today}/${goals.dailyTarget}`} />
        <MotivationStat label="This week" value={`${goals.week}/${goals.weeklyTarget}`} />
      </section>

      <section className="rounded-2xl border border-zinc-200 bg-white p-5 dark:border-zinc-800 dark:bg-zinc-900">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-zinc-500">🎯 Goals</h2>
        <p className="mt-1 text-xs text-zinc-500">
          Question targets keep the habit loop honest. Answering a question (correct or not)
          counts toward the goal.
        </p>
        <div className="mt-3">
          <GoalsSettings initial={goals} />
        </div>
      </section>

      <section className="rounded-2xl border border-zinc-200 bg-white p-5 dark:border-zinc-800 dark:bg-zinc-900">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-zinc-500">
          🏆 Achievements ({snapshot.achievements.unlocked.length}/{snapshot.achievements.unlocked.length + snapshot.achievements.locked.length})
        </h2>
        {snapshot.achievements.unlocked.length === 0 ? (
          <p className="mt-3 text-sm text-zinc-500">
            None yet. Answer your first question to start unlocking.
          </p>
        ) : null}
        <ul className="mt-3 grid gap-2 sm:grid-cols-2">
          {[...snapshot.achievements.unlocked, ...snapshot.achievements.locked].map((a) => (
            <li
              key={a.code}
              className={`flex items-start gap-3 rounded-xl border px-3 py-2 ${
                snapshot.achievements.unlocked.some((u) => u.code === a.code)
                  ? "border-emerald-200 bg-emerald-50 dark:border-emerald-800 dark:bg-emerald-950/30"
                  : "border-zinc-200 opacity-60 dark:border-zinc-700"
              }`}
            >
              <span className="text-xl">{a.icon ?? "🏅"}</span>
              <span>
                <span className="block text-sm font-semibold">{a.name}</span>
                {a.description ? (
                  <span className="block text-xs text-zinc-500 dark:text-zinc-400">{a.description}</span>
                ) : null}
              </span>
            </li>
          ))}
        </ul>
      </section>

      <section className="rounded-2xl border border-zinc-200 bg-white p-5 dark:border-zinc-800 dark:bg-zinc-900">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-zinc-500">📈 Trends</h2>
        <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
          Weekly accuracy, net-score and speed trends live in Analytics. Mock-vs-practice
          comparison lives in Mock tests.
        </p>
        <div className="mt-4 flex flex-col gap-2">
          <Link
            href="/analytics"
            className="rounded-xl bg-indigo-600 px-4 py-2.5 text-center text-sm font-semibold text-white hover:bg-indigo-500"
          >
            Open Analytics
          </Link>
          <Link
            href="/mock"
            className="rounded-xl border border-zinc-300 px-4 py-2.5 text-center text-sm font-semibold hover:bg-zinc-100 dark:border-zinc-700 dark:hover:bg-zinc-800"
          >
            Take a mock test
          </Link>
        </div>
      </section>
    </div>
  );
}

function MotivationStat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-zinc-200 bg-white p-4 text-center dark:border-zinc-800 dark:bg-zinc-900">
      <p className="text-2xl font-bold">{value}</p>
      <p className="mt-0.5 text-xs text-zinc-500 dark:text-zinc-400">{label}</p>
    </div>
  );
}
