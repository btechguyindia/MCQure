import Link from "next/link";
import { notFound } from "next/navigation";
import { getCurrentUser } from "@/lib/api";
import { getPrepReport } from "@/lib/tracking";
import { RevisionButton } from "@/components/RevisionButton";

export default async function TopicPage({ params }: { params: Promise<{ topicId: string }> }) {
  const user = await getCurrentUser();
  if (!user) notFound();

  const { topicId } = await params;
  const report = await getPrepReport(user.id);
  const topic = report.topics.find((t) => t.id === topicId);
  if (!topic) notFound();

  const s = topic.stats;
  const weightLabel = topic.weight
    ? topic.weight === "HIGH"
      ? "High"
      : topic.weight === "MEDIUM"
        ? "Medium"
        : "Low"
    : null;

  return (
    <div className="flex flex-col gap-6">
      <header className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <Link
            href="/preparation"
            className="text-sm text-indigo-600 hover:underline dark:text-indigo-400"
          >
            ← My Preparation
          </Link>
          <h1 className="mt-1 text-2xl font-bold">{topic.name}</h1>
          <p className="text-sm text-zinc-500">{topic.subjectName}</p>
        </div>
        <div className="flex items-center gap-2">
          <span className={`rounded-full px-3 py-1 text-xs font-semibold ${topic.completionColor}`}>
            {topic.completionLabel}
          </span>
          {topic.weight ? (
          <span
            title={topic.weightBasisNote ?? `Weight marked ${topic.weightBasis}`}
            className="rounded-full bg-zinc-100 px-3 py-1 text-xs font-semibold text-zinc-600 dark:bg-zinc-800 dark:text-zinc-300"
          >
              Exam weight: {weightLabel}
              {topic.weightBasis === "ESTIMATED" ? " (est.)" : topic.weightBasis === "UNKNOWN" ? " (unknown)" : ""}
            </span>
          ) : null}
        </div>
      </header>

      <section className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <StatTile label="Mastery" value={topic.mastery == null ? "—" : `${topic.mastery.toFixed(0)}/100`} sub={topic.masteryReliable ? undefined : "insufficient data"} />
        <StatTile label="Questions" value={String(s.attempts)} sub={`${s.correct} correct`} />
        <StatTile label="Accuracy" value={s.accuracy == null ? "—" : `${s.accuracy.toFixed(0)}%`} />
        <StatTile label="Avg time" value={s.attempts > 0 ? `${(s.averageTimeMs / 1000).toFixed(0)}s` : "—"} />
        <StatTile label="Net score" value={s.netScore > 0 ? `+${s.netScore.toFixed(1)}` : s.netScore.toFixed(1)} />
        <StatTile label="PYQ accuracy" value={s.pyqAccuracy == null ? "—" : `${s.pyqAccuracy.toFixed(0)}%`} />
        <StatTile label="Practice accuracy" value={s.practiceAccuracy == null ? "—" : `${s.practiceAccuracy.toFixed(0)}%`} />
        <StatTile label="Mock accuracy" value={s.mockAccuracy == null ? "—" : `${s.mockAccuracy.toFixed(0)}%`} />
      </section>

      {topic.weakness.reasons.length > 0 ? (
        <section className="rounded-2xl border border-red-200 bg-red-50 p-5 dark:border-red-900/50 dark:bg-red-950/30">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-red-600 dark:text-red-400">
            Priority: {topic.weakness.score}/100
          </h2>
          <ul className="mt-2 flex flex-col gap-1 text-sm text-zinc-700 dark:text-zinc-300">
            {topic.weakness.reasons.map((r) => (
              <li key={r}>• {r}</li>
            ))}
          </ul>
        </section>
      ) : null}

      {topic.revision.due ? (
        <section className="rounded-2xl border border-amber-200 bg-amber-50 p-5 dark:border-amber-900/50 dark:bg-amber-950/30">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-amber-700 dark:text-amber-400">
            🔴 Revision required
          </h2>
          <p className="mt-1 text-sm text-zinc-700 dark:text-zinc-300">{topic.revision.reason}</p>
          <div className="mt-3">
            <RevisionButton topicId={topic.id} />
          </div>
        </section>
      ) : null}

      <section className="grid gap-4 lg:grid-cols-2">
        <BreakdownCard title="Subtopic breakdown" rows={topic.subtopics} />
        <BreakdownCard title="Concept breakdown" rows={topic.concepts} />
      </section>

      {topic.subtopics.length === 0 && topic.concepts.length === 0 ? (
        <p className="text-center text-sm text-zinc-400">
          No subtopic-level data yet. Questions carry subtopic/concept tags, so depth appears once
          you practice this topic.
        </p>
      ) : null}

      <section className="rounded-2xl border border-zinc-200 bg-white p-5 text-sm text-zinc-600 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-400">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-zinc-500">Practice vs mock</h2>
        <p className="mt-2">
          Practice accuracy {s.practiceAccuracy == null ? "—" : `${s.practiceAccuracy.toFixed(0)}%`} vs mock
          accuracy {s.mockAccuracy == null ? "—" : `${s.mockAccuracy.toFixed(0)}%`}.
          {s.practiceAccuracy !== null && s.mockAccuracy !== null && s.practiceAccuracy - s.mockAccuracy >= 15
            ? " Your accuracy drops meaningfully under timed conditions — prioritize timed practice here."
            : " No large gap between relaxed and timed performance so far."}
        </p>
      </section>
    </div>
  );
}

function StatTile({ label, value, sub }: { label: string; value: string; sub?: string }) {
  return (
    <div className="rounded-2xl border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900">
      <dt className="text-xs text-zinc-500 dark:text-zinc-400">{label}</dt>
      <dd className="mt-1 text-lg font-bold">{value}</dd>
      {sub ? <dd className="text-xs text-zinc-400">{sub}</dd> : null}
    </div>
  );
}

function BreakdownCard({
  title,
  rows,
}: {
  title: string;
  rows: Array<{ id: string; name: string; attempts: number; accuracy: number | null; mastery: number | null }>;
}) {
  if (rows.length === 0) return null;
  return (
    <div className="rounded-2xl border border-zinc-200 bg-white p-5 dark:border-zinc-800 dark:bg-zinc-900">
      <h2 className="text-sm font-semibold uppercase tracking-wide text-zinc-500">{title}</h2>
      <ul className="mt-3 flex flex-col gap-2.5">
        {rows.map((r) => {
          const acc = r.accuracy;
          const color =
            acc == null ? "bg-zinc-200 dark:bg-zinc-700" : acc >= 75 ? "bg-emerald-500" : acc >= 60 ? "bg-amber-500" : "bg-red-500";
          return (
            <li key={r.id}>
              <div className="flex items-center justify-between text-sm">
                <span className="font-medium">{r.name}</span>
                <span className="text-xs text-zinc-400">
                  {r.attempts} q · {acc == null ? "—" : `${acc.toFixed(0)}%`}
                </span>
              </div>
              <div className="mt-1 h-2 w-full overflow-hidden rounded-full bg-zinc-100 dark:bg-zinc-800">
                <div
                  className={`h-full rounded-full ${color}`}
                  style={{ width: `${Math.max(4, acc ?? 0)}%` }}
                />
              </div>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
