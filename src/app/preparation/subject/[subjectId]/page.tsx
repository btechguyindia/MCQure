import Link from "next/link";
import { notFound } from "next/navigation";
import { getCurrentUser } from "@/lib/api";
import { getPrepReport } from "@/lib/tracking";

export default async function SubjectPage({ params }: { params: Promise<{ subjectId: string }> }) {
  const user = await getCurrentUser();
  if (!user) notFound();

  const { subjectId } = await params;
  const report = await getPrepReport(user.id);
  const subject = report.subjects.find((s) => s.id === subjectId);
  if (!subject) notFound();

  const topics = report.topics.filter((t) => t.subjectName === subject.name);
  const s = subject.stats;

  return (
    <div className="flex flex-col gap-6">
      <header>
        <Link href="/preparation" className="text-sm text-indigo-600 hover:underline dark:text-indigo-400">
          ← My Preparation
        </Link>
        <h1 className="mt-1 text-2xl font-bold">{subject.name}</h1>
        {subject.expectedShare != null ? (
          <p className="text-sm text-zinc-500">
            Blueprint share: ~{subject.expectedShare} questions per paper
          </p>
        ) : null}
      </header>

      <section className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <Tile label="Mastery" value={subject.mastery == null ? "—" : `${subject.mastery.toFixed(0)}/100`} sub={subject.masteryReliable ? undefined : "insufficient data"} />
        <Tile label="Questions" value={String(s.attempts)} sub={`${s.correct} correct`} />
        <Tile label="Accuracy" value={s.accuracy == null ? "—" : `${s.accuracy.toFixed(0)}%`} />
        <Tile label="Alignment" value={`${subject.alignment}/100`} />
        <Tile label="PYQ accuracy" value={s.pyqAccuracy == null ? "—" : `${s.pyqAccuracy.toFixed(0)}%`} />
        <Tile label="Mock accuracy" value={s.mockAccuracy == null ? "—" : `${s.mockAccuracy.toFixed(0)}%`} />
        <Tile label="Avg time" value={s.attempts > 0 ? `${(s.averageTimeMs / 1000).toFixed(0)}s` : "—"} />
        <Tile label="High-conf errors" value={String(s.highConfidenceWrong)} />
      </section>

      <section className="grid gap-4 lg:grid-cols-2">
        <div className="rounded-2xl border border-zinc-200 bg-white p-5 dark:border-zinc-800 dark:bg-zinc-900">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-zinc-500">Strongest</h2>
          {subject.strongestTopic ? (
            <p className="mt-2 text-sm font-semibold">
              {subject.strongestTopic.name}{" "}
              <span className="text-xs font-normal text-zinc-400">
                {subject.strongestTopic.accuracy == null ? "—" : `${subject.strongestTopic.accuracy.toFixed(0)}%`}
              </span>
            </p>
          ) : (
            <p className="mt-2 text-sm text-zinc-400">No accuracy data yet.</p>
          )}
        </div>
        <div className="rounded-2xl border border-zinc-200 bg-white p-5 dark:border-zinc-800 dark:bg-zinc-900">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-zinc-500">Weakest</h2>
          {subject.weakestTopic ? (
            <p className="mt-2 text-sm font-semibold">
              {subject.weakestTopic.name}{" "}
              <span className="text-xs font-normal text-zinc-400">
                {subject.weakestTopic.accuracy == null ? "—" : `${subject.weakestTopic.accuracy.toFixed(0)}%`}
              </span>
            </p>
          ) : (
            <p className="mt-2 text-sm text-zinc-400">No accuracy data yet.</p>
          )}
        </div>
      </section>

      <section className="rounded-2xl border border-zinc-200 bg-white p-5 dark:border-zinc-800 dark:bg-zinc-900">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-zinc-500">Topics</h2>
        <ul className="mt-3 flex flex-col divide-y divide-zinc-100 dark:divide-zinc-800">
          {topics.map((t) => (
            <li key={t.id} className="flex items-center justify-between gap-2 py-2.5">
              <div className="flex items-center gap-2">
                <Link href={`/preparation/topic/${t.id}`} className="font-semibold hover:underline">
                  {t.name}
                </Link>
                <span className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${t.completionColor}`}>
                  {t.completionLabel}
                </span>
                {t.revision.due ? (
                  <span className="rounded-full bg-red-100 px-2 py-0.5 text-[10px] font-semibold text-red-700 dark:bg-red-900/50 dark:text-red-300">
                    revision due
                  </span>
                ) : null}
              </div>
              <span className="text-xs text-zinc-400">
                {t.stats.attempts} q ·{" "}
                {t.stats.accuracy == null ? "—" : `${t.stats.accuracy.toFixed(0)}%`} · mastery{" "}
                {t.mastery == null ? "—" : t.mastery.toFixed(0)}
              </span>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}

function Tile({ label, value, sub }: { label: string; value: string; sub?: string }) {
  return (
    <div className="rounded-2xl border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900">
      <dt className="text-xs text-zinc-500 dark:text-zinc-400">{label}</dt>
      <dd className="mt-1 text-lg font-bold">{value}</dd>
      {sub ? <dd className="text-xs text-zinc-400">{sub}</dd> : null}
    </div>
  );
}
