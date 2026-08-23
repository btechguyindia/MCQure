import Link from "next/link";
import { notFound } from "next/navigation";
import { getCurrentUser } from "@/lib/api";
import { getPrepReport } from "@/lib/tracking";
import { ChevronDownIcon, ClockIcon, FlagIcon } from "@/components/icons";
import { RevisionButton } from "@/components/RevisionButton";

const COMPLETION_BADGE: Record<string, string> = {
  NOT_STARTED: "badge-neutral",
  STUDYING: "badge-brand",
  PRACTICED: "badge-brand",
  PROFICIENT: "badge-ok",
  MASTERED: "badge-ok",
};

function accuracyBarColor(acc: number | null): string {
  if (acc == null) return "var(--mcq-line-strong)";
  if (acc >= 75) return "var(--mcq-ok)";
  if (acc >= 60) return "var(--mcq-warn)";
  return "var(--mcq-bad)";
}

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
          <nav className="flex items-center gap-1.5">
            <Link href="/preparation" className="chip transition-colors hover:border-brand hover:text-brand">
              My Preparation
            </Link>
            <ChevronDownIcon className="h-3 w-3 -rotate-90 text-subtle-fg" />
            <span className="chip">{topic.subjectName}</span>
          </nav>
          <p className="kicker mt-4">Topic</p>
          <h1 className="mt-2 text-2xl font-bold tracking-tight sm:text-3xl">{topic.name}</h1>
          <p className="text-sm text-muted-fg">{topic.subjectName}</p>
        </div>
        <div className="flex items-center gap-2">
          <span className={`badge ${COMPLETION_BADGE[topic.completion] ?? "badge-neutral"}`}>
            {topic.completionLabel}
          </span>
          {topic.weight ? (
          <span
            title={topic.weightBasisNote ?? `Weight marked ${topic.weightBasis}`}
            className="chip"
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
        <section className="rounded-xl border-l-2 border-bad bg-bad-soft/40 py-4 pl-4 pr-5">
          <h2 className="section-title flex items-center gap-2 text-bad!">
            <FlagIcon className="h-4 w-4" />
            Priority: {topic.weakness.score}/100
          </h2>
          <ul className="mt-2 flex flex-col gap-1 text-sm text-muted-fg">
            {topic.weakness.reasons.map((r) => (
              <li key={r} className="flex items-start gap-1.5">
                <span aria-hidden className="mt-[7px] h-1 w-1 shrink-0 rounded-full bg-bad" />
                {r}
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      {topic.revision.due ? (
        <section className="rounded-xl border-l-2 border-warn bg-warn-soft/40 py-4 pl-4 pr-5">
          <h2 className="section-title flex items-center gap-2 text-warn!">
            <FlagIcon className="h-4 w-4" />
            Revision required
          </h2>
          <p className="mt-1 text-sm text-muted-fg">{topic.revision.reason}</p>
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
        <p className="text-center text-sm text-subtle-fg">
          No subtopic-level data yet. Questions carry subtopic/concept tags, so depth appears once
          you practice this topic.
        </p>
      ) : null}

      <section className="card p-5 text-sm text-muted-fg">
        <h2 className="section-title flex items-center gap-2">
          <ClockIcon className="h-4 w-4 text-accent" />
          Practice vs mock
        </h2>
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
    <div className="card p-4">
      <dt className="text-xs font-medium text-muted-fg">{label}</dt>
      <dd className="stat-num mt-1 text-lg text-ink">{value}</dd>
      {sub ? <dd className="mt-0.5 text-xs text-subtle-fg">{sub}</dd> : null}
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
    <div className="card p-5">
      <h2 className="section-title">{title}</h2>
      <ul className="mt-3 flex flex-col gap-2.5">
        {rows.map((r) => {
          const acc = r.accuracy;
          return (
            <li key={r.id}>
              <div className="flex items-center justify-between text-sm">
                <span className="font-medium text-ink">{r.name}</span>
                <span className="text-xs text-subtle-fg">
                  {r.attempts} q · <span className="stat-num">{acc == null ? "—" : `${acc.toFixed(0)}%`}</span>
                </span>
              </div>
              <div className="progress mt-1">
                <div
                  className="progress-bar"
                  style={{
                    width: `${Math.max(4, acc ?? 0)}%`,
                    background: accuracyBarColor(acc),
                  }}
                />
              </div>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
