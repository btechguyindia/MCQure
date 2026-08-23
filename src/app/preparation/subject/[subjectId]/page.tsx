import Link from "next/link";
import { notFound } from "next/navigation";
import { getCurrentUser } from "@/lib/api";
import { getPrepReport } from "@/lib/tracking";
import { CheckIcon, ChevronDownIcon, FlagIcon } from "@/components/icons";

const COMPLETION_BADGE: Record<string, string> = {
  NOT_STARTED: "badge-neutral",
  STUDYING: "badge-brand",
  PRACTICED: "badge-brand",
  PROFICIENT: "badge-ok",
  MASTERED: "badge-ok",
};

function masteryBarColor(mastery: number | null): string | undefined {
  if (mastery != null && mastery >= 80) return "var(--mcq-ok)";
  return undefined;
}

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
        <nav className="flex items-center gap-1.5">
          <Link href="/preparation" className="chip transition-colors hover:border-brand hover:text-brand">
            My Preparation
          </Link>
          <ChevronDownIcon className="h-3 w-3 -rotate-90 text-subtle-fg" />
          <span className="chip">{subject.name}</span>
        </nav>
        <p className="kicker mt-4">Subject</p>
        <h1 className="mt-2 text-2xl font-bold tracking-tight sm:text-3xl">{subject.name}</h1>
        {subject.expectedShare != null ? (
          <p className="text-sm text-muted-fg">
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
        <div className="card p-5">
          <h2 className="section-title flex items-center gap-2">
            <CheckIcon className="h-4 w-4 text-ok" />
            Strongest
          </h2>
          {subject.strongestTopic ? (
            <p className="mt-2 text-sm font-semibold text-ink">
              {subject.strongestTopic.name}{" "}
              <span className="stat-num text-xs font-normal text-subtle-fg">
                {subject.strongestTopic.accuracy == null ? "—" : `${subject.strongestTopic.accuracy.toFixed(0)}%`}
              </span>
            </p>
          ) : (
            <p className="mt-2 text-sm text-subtle-fg">No accuracy data yet.</p>
          )}
        </div>
        <div className="card p-5">
          <h2 className="section-title flex items-center gap-2">
            <FlagIcon className="h-4 w-4 text-bad" />
            Weakest
          </h2>
          {subject.weakestTopic ? (
            <p className="mt-2 text-sm font-semibold text-ink">
              {subject.weakestTopic.name}{" "}
              <span className="stat-num text-xs font-normal text-subtle-fg">
                {subject.weakestTopic.accuracy == null ? "—" : `${subject.weakestTopic.accuracy.toFixed(0)}%`}
              </span>
            </p>
          ) : (
            <p className="mt-2 text-sm text-subtle-fg">No accuracy data yet.</p>
          )}
        </div>
      </section>

      <section className="card p-5">
        <h2 className="section-title">Topics</h2>
        <ul className="stagger mt-3 flex flex-col gap-2">
          {topics.map((t) => (
            <li
              key={t.id}
              className="card-hover rounded-xl border border-line px-3 py-2.5"
            >
              <div className="flex flex-wrap items-center justify-between gap-x-3 gap-y-1.5">
                <div className="flex flex-wrap items-center gap-2">
                  <Link href={`/preparation/topic/${t.id}`} className="font-semibold text-ink hover:underline">
                    {t.name}
                  </Link>
                  <span className={`badge ${COMPLETION_BADGE[t.completion] ?? "badge-neutral"}`}>
                    {t.completionLabel}
                  </span>
                  {t.revision.due ? (
                    <span className="badge badge-warn">revision due</span>
                  ) : null}
                </div>
                <span className="text-xs text-subtle-fg">
                  {t.stats.attempts} q ·{" "}
                  {t.stats.accuracy == null ? "—" : `${t.stats.accuracy.toFixed(0)}%`} · mastery{" "}
                  <span className="stat-num">{t.mastery == null ? "—" : t.mastery.toFixed(0)}</span>
                </span>
              </div>
              <div className="progress mt-2">
                <div
                  className="progress-bar"
                  style={{
                    width: `${Math.max(4, Math.min(100, t.mastery ?? 0))}%`,
                    background: masteryBarColor(t.mastery),
                  }}
                />
              </div>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}

function Tile({ label, value, sub }: { label: string; value: string; sub?: string }) {
  return (
    <div className="card p-4">
      <dt className="text-xs font-medium text-muted-fg">{label}</dt>
      <dd className="stat-num mt-1 text-lg text-ink">{value}</dd>
      {sub ? <dd className="mt-0.5 text-xs text-subtle-fg">{sub}</dd> : null}
    </div>
  );
}
