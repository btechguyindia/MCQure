import Link from "next/link";

export const metadata = { title: "Motivation — MCQure" };

// Phase 7 delivers the full Motivation module. This page is intentionally a
// roadmap, not a placeholder pretending to offer the feature.
export default function MotivationPage() {
  return (
    <div className="flex flex-col gap-6">
      <section className="rounded-2xl border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-900">
        <span className="text-3xl">⚡</span>
        <h1 className="mt-2 text-2xl font-bold">Motivation mode</h1>
        <p className="mt-2 text-sm leading-relaxed text-zinc-600 dark:text-zinc-400">
          Data-driven motivation. No generic quotes — only measurable progress,
          streaks and achievements.
        </p>
        <div className="mt-4 inline-flex items-center gap-2 rounded-full bg-indigo-100 px-3 py-1 text-xs font-semibold text-indigo-700 dark:bg-indigo-900/60 dark:text-indigo-300">
          Arriving in Phase 7
        </div>
      </section>

      <section className="rounded-2xl border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-900">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-zinc-500">
          Planned content
        </h2>
        <ul className="mt-3 space-y-2 text-sm text-zinc-700 dark:text-zinc-300">
          {[
            "Daily progress, goals and exam countdown",
            "Practice/study streaks",
            "Achievements and personal bests",
            "Weekly accuracy, net-score and speed trends",
            "A personalized daily mission",
          ].map((item) => (
            <li key={item} className="flex gap-2">
              <span className="text-indigo-500">✓</span> {item}
            </li>
          ))}
        </ul>
      </section>

      <div>
        <Link
          href="/practice"
          className="inline-flex rounded-xl bg-indigo-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-indigo-500"
        >
          Practice MCQs now
        </Link>
      </div>
    </div>
  );
}
