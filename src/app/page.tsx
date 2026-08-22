import Link from "next/link";
import { prisma } from "@/lib/db";
import { getCurrentUser } from "@/lib/api";
import { ModeCardGrid } from "@/components/ModeCard";
import { TodayStatus } from "@/components/TodayStatus";
import { AiStatusBadge } from "@/components/AiStatusBadge";

export const dynamic = "force-dynamic";

async function getBankStats() {
  try {
    const [questions, topics, notes] = await Promise.all([
      prisma.question.count({ where: { isActive: true } }),
      prisma.topic.count(),
      prisma.studyNote.count().catch(() => 0),
    ]);
    return { questions, topics, notes };
  } catch {
    return null;
  }
}

export default async function HomePage() {
  const user = await getCurrentUser();
  const authed = user !== null;
  const stats = await getBankStats();

  const statItems = stats
    ? [
        { label: "Questions in bank", value: stats.questions.toLocaleString() },
        { label: "Syllabus topics", value: stats.topics.toLocaleString() },
        { label: "Study notes", value: stats.notes.toLocaleString() },
        { label: "Practice modes", value: "5+" },
      ]
    : [];

  return (
    <div className="flex flex-col gap-8">
      {/* Hero */}
      <section className="rise-in relative overflow-hidden rounded-2xl border border-zinc-200 bg-gradient-to-br from-indigo-50 via-white to-violet-50 p-6 sm:p-10 dark:border-zinc-800 dark:from-indigo-950/40 dark:via-zinc-900 dark:to-violet-950/30">
        <div
          aria-hidden
          className="pointer-events-none absolute -right-20 -top-20 h-64 w-64 rounded-full bg-indigo-400/10 blur-3xl"
        />
        <div
          aria-hidden
          className="pointer-events-none absolute -bottom-24 left-1/3 h-64 w-64 rounded-full bg-violet-400/10 blur-3xl"
        />
        <div className="relative">
          <p className="text-xs font-semibold uppercase tracking-widest text-indigo-600 dark:text-indigo-400">
            DSSSB TGT Computer Science
          </p>
          <h1 className="mt-2 max-w-2xl text-3xl font-black tracking-tight sm:text-4xl">
            {authed ? (
              <>
                Welcome back{user?.name ? `, ${user.name}` : ""} 👋
              </>
            ) : (
              <>
                Your personal AI exam{" "}
                <span className="bg-gradient-to-r from-indigo-600 to-violet-600 bg-clip-text text-transparent dark:from-indigo-400 dark:to-violet-400">
                  command center
                </span>
              </>
            )}
          </h1>
          <p className="mt-3 max-w-xl text-sm leading-relaxed text-zinc-600 sm:text-base dark:text-zinc-400">
            {authed
              ? "Practice adaptively, fix what you keep getting wrong, and watch your readiness grow."
              : "MCQure turns your preparation into one connected loop: practice with adaptive MCQs, learn from every mistake, and improve every single day."}
          </p>
          <div className={`flex flex-wrap gap-3 ${authed ? "mt-5" : "mt-6"}`}>
            <Link href="/practice" className="btn btn-primary">
              🎯 Start practicing
            </Link>
            {!authed ? (
              <Link href="/register" className="btn btn-secondary">
                Create free account
              </Link>
            ) : (
              <Link href="/mock" className="btn btn-secondary">
                📝 Take a mock test
              </Link>
            )}
          </div>

          {statItems.length > 0 ? (
            <dl className="mt-8 grid grid-cols-2 gap-4 sm:grid-cols-4">
              {statItems.map((s) => (
                <div key={s.label} className="rounded-xl border border-zinc-200/70 bg-white/60 px-4 py-3 backdrop-blur dark:border-zinc-700/60 dark:bg-zinc-900/50">
                  <dd className="text-xl font-black tabular-nums sm:text-2xl">{s.value}</dd>
                  <dt className="mt-0.5 text-xs text-zinc-500 dark:text-zinc-400">{s.label}</dt>
                </div>
              ))}
            </dl>
          ) : null}
        </div>
      </section>

      <section className="flex flex-col gap-4">
        <div className="flex items-baseline justify-between">
          <h2 className="section-title">Everything in one place</h2>
          <span className="text-xs text-zinc-400">Practice → Study → Prepare → Mock</span>
        </div>
        <ModeCardGrid />
      </section>

      {authed ? (
        <>
          <TodayStatus />
          <AiStatusBadge />
        </>
      ) : null}
    </div>
  );
}
