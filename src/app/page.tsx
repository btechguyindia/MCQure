import Link from "next/link";
import { prisma } from "@/lib/db";
import { getCurrentUser } from "@/lib/api";
import { ModeCardGrid } from "@/components/ModeCard";
import { TodayStatus } from "@/components/TodayStatus";
import { AiStatusBadge } from "@/components/AiStatusBadge";
import { ArrowRightIcon, MockIcon } from "@/components/icons";

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
    <div className="flex flex-col gap-10">
      {/* Hero */}
      <section className="rise-in relative overflow-hidden rounded-3xl border border-line bg-card shadow-soft">
        <div className="aurora" aria-hidden />
        <div className="relative p-6 sm:p-10 lg:p-12">
          <p className="kicker">DSSSB TGT · Computer Science</p>
          <h1 className="display-hero mt-4 max-w-2xl text-balance">
            {authed ? (
              <>Welcome back{user?.name ? `, ${user.name}` : ""}.</>
            ) : (
              <>
                Your personal AI exam{" "}
                <span className="text-gradient">command center</span>
              </>
            )}
          </h1>
          <p className="mt-4 max-w-xl text-sm leading-relaxed text-muted-fg sm:text-base">
            {authed
              ? "Practice adaptively, fix what you keep getting wrong, and watch your readiness grow."
              : "MCQure turns your preparation into one connected loop: practice with adaptive MCQs, learn from every mistake, and improve every single day."}
          </p>
          <div className={`flex flex-wrap gap-3 ${authed ? "mt-6" : "mt-7"}`}>
            <Link href="/practice" className="btn btn-primary btn-lg">
              Start practicing
              <ArrowRightIcon />
            </Link>
            {!authed ? (
              <Link href="/register" className="btn btn-secondary btn-lg">
                Create free account
              </Link>
            ) : (
              <Link href="/mock" className="btn btn-secondary btn-lg">
                <MockIcon />
                Take a mock test
              </Link>
            )}
          </div>

          {statItems.length > 0 ? (
            <dl className="mt-9 grid grid-cols-2 gap-3 sm:gap-4 sm:grid-cols-4">
              {statItems.map((s) => (
                <div key={s.label} className="glass rounded-2xl px-4 py-3.5">
                  <dd className="stat-num text-xl sm:text-2xl">{s.value}</dd>
                  <dt className="mt-0.5 text-xs font-medium text-muted-fg">{s.label}</dt>
                </div>
              ))}
            </dl>
          ) : null}
        </div>
      </section>

      <section className="flex flex-col gap-4">
        <div className="flex items-baseline justify-between gap-4">
          <h2 className="text-lg font-bold tracking-tight">Everything in one place</h2>
          <span className="chip hidden sm:inline-flex">Practice → Study → Prepare → Mock</span>
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
