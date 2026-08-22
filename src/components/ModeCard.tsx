import Link from "next/link";

interface ModeCardProps {
  emoji: string;
  title: string;
  description: string;
  href: string;
  badge?: string;
  tint?: string;
}

const TINTS: Record<string, string> = {
  indigo:
    "group-hover:border-indigo-300 group-hover:bg-indigo-50/60 dark:group-hover:border-indigo-700 dark:group-hover:bg-indigo-950/30",
  violet:
    "group-hover:border-violet-300 group-hover:bg-violet-50/60 dark:group-hover:border-violet-700 dark:group-hover:bg-violet-950/30",
  emerald:
    "group-hover:border-emerald-300 group-hover:bg-emerald-50/60 dark:group-hover:border-emerald-700 dark:group-hover:bg-emerald-950/30",
  amber:
    "group-hover:border-amber-300 group-hover:bg-amber-50/60 dark:group-hover:border-amber-700 dark:group-hover:bg-amber-950/30",
  sky: "group-hover:border-sky-300 group-hover:bg-sky-50/60 dark:group-hover:border-sky-700 dark:group-hover:bg-sky-950/30",
  rose: "group-hover:border-rose-300 group-hover:bg-rose-50/60 dark:group-hover:border-rose-700 dark:group-hover:bg-rose-950/30",
};

export function ModeCard({ emoji, title, description, href, badge, tint = "indigo" }: ModeCardProps) {
  return (
    <Link
      href={href}
      className={`card group flex flex-col gap-2 p-5 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lg hover:shadow-zinc-200/60 dark:hover:shadow-black/20 ${TINTS[tint] ?? TINTS.indigo}`}
    >
      <div className="flex items-center justify-between">
        <span className="text-3xl transition-transform duration-200 group-hover:scale-110" aria-hidden>
          {emoji}
        </span>
        {badge ? (
          <span className="badge bg-indigo-100 text-indigo-700 dark:bg-indigo-900/60 dark:text-indigo-300">
            {badge}
          </span>
        ) : null}
      </div>
      <h2 className="text-lg font-bold">{title}</h2>
      <p className="text-sm leading-relaxed text-zinc-600 dark:text-zinc-400">{description}</p>
      <span className="mt-auto pt-1 text-sm font-semibold text-indigo-600 opacity-0 transition-opacity duration-200 group-hover:opacity-100 dark:text-indigo-400">
        Open →
      </span>
    </Link>
  );
}

export function ModeCardGrid() {
  const cards: ModeCardProps[] = [
    {
      emoji: "🎯",
      title: "Practice",
      description: "Adaptive MCQ sessions — quick drills to 100-question marathons, instant feedback on every answer.",
      href: "/practice",
      tint: "indigo",
      badge: "Core",
    },
    {
      emoji: "📝",
      title: "Mock tests",
      description: "Blueprint-driven sectional and full mocks under real exam timing, with mock-vs-practice comparison.",
      href: "/mock",
      tint: "violet",
    },
    {
      emoji: "📚",
      title: "Study notes",
      description: "Concise exam-focused concepts, mnemonics, traps and one-page revisions for every topic.",
      href: "/study",
      tint: "emerald",
    },
    {
      emoji: "📊",
      title: "Analytics",
      description: "Accuracy trends, per-subject strength, error types, confidence analysis and your mistake book.",
      href: "/analytics",
      tint: "sky",
    },
    {
      emoji: "🚀",
      title: "Progress",
      description: "Mastery tracking across the syllabus — completion states, revision queue and a daily plan.",
      href: "/preparation",
      tint: "amber",
      badge: "Live",
    },
    {
      emoji: "🗂",
      title: "Question bank",
      description: "Browse every question by subject, topic, difficulty and provenance with full-text search.",
      href: "/questions",
      tint: "rose",
    },
    {
      emoji: "🏛",
      title: "PYQ bank",
      description: "Genuine previous-year questions with mandatory source disclosure and a verification workflow.",
      href: "/pyq",
      tint: "indigo",
    },
    {
      emoji: "⚡",
      title: "Motivation",
      description: "Goals, streaks, achievements and daily targets that keep the preparation loop alive.",
      href: "/motivation",
      tint: "violet",
    },
    {
      emoji: "📤",
      title: "Reports",
      description: "Weekly and monthly aggregates with CSV/JSON export for offline review.",
      href: "/reports",
      tint: "emerald",
    },
  ];

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {cards.map((c) => (
        <ModeCard key={c.href} {...c} />
      ))}
    </div>
  );
}
