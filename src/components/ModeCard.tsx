import Link from "next/link";

interface ModeCardProps {
  emoji: string;
  title: string;
  description: string;
  href: string;
  accent: string;
  badge?: string;
}

export function ModeCard({ emoji, title, description, href, accent, badge }: ModeCardProps) {
  return (
    <Link
      href={href}
      className={`group flex flex-col gap-2 rounded-2xl border p-5 transition-colors hover:border-zinc-400 dark:hover:border-zinc-600 ${accent}`}
    >
      <div className="flex items-center justify-between">
        <span className="text-3xl" aria-hidden>
          {emoji}
        </span>
        {badge ? (
          <span className="rounded-full bg-indigo-100 px-2 py-0.5 text-xs font-semibold text-indigo-700 dark:bg-indigo-900/60 dark:text-indigo-300">
            {badge}
          </span>
        ) : null}
      </div>
      <h2 className="text-xl font-bold">{title}</h2>
      <p className="text-sm leading-relaxed text-zinc-600 dark:text-zinc-400">
        {description}
      </p>
    </Link>
  );
}

export function ModeCardGrid() {
  return (
    <div className="grid gap-4 sm:grid-cols-3">
      <ModeCard
        emoji="🎯"
        title="Practice"
        description="Test yourself with adaptive MCQs, PYQs and exam-style questions."
        href="/practice"
        accent="border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900"
      />
      <ModeCard
        emoji="📚"
        title="Study"
        description="Learn concise, exam-focused concepts, important points, tricks and revision material."
        href="/study"
        accent="border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900"
        badge="Phase 3"
      />
      <ModeCard
        emoji="⚡"
        title="Motivation"
        description="Track your progress, goals, streaks and daily preparation."
        href="/motivation"
        accent="border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900"
        badge="Phase 7"
      />
    </div>
  );
}
