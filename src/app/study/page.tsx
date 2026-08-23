import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/api";
import { getStudyOverview } from "@/lib/study";
import { ArrowRightIcon, FlagIcon, StudyIcon } from "@/components/icons";

export const metadata = { title: "Study — MCQure" };

export default async function StudyPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const subjects = await getStudyOverview(user.id);
  const weak = subjects
    .flatMap((s) => s.topics.map((t) => ({ subject: s.name, ...t })))
    .filter((t) => t.weak)
    .sort((a, b) => (a.accuracy ?? 0) - (b.accuracy ?? 0));

  return (
    <div className="flex flex-col gap-8">
      <header>
        <p className="kicker">Library</p>
        <h1 className="mt-2 flex items-center gap-2 text-2xl font-bold tracking-tight sm:text-3xl">
          <StudyIcon className="h-6 w-6 text-brand" />
          Study
        </h1>
        <p className="mt-1 max-w-2xl text-sm text-muted-fg">
          Concise, exam-focused notes per topic — driven by your performance.
        </p>
      </header>

      {weak.length > 0 ? (
        <section className="rounded-xl border-l-2 border-warn bg-warn-soft/40 py-4 pl-4 pr-5">
          <h2 className="section-title flex items-center gap-2 text-warn!">
            <FlagIcon className="h-4 w-4" />
            Priority revision
          </h2>
          <p className="mt-1 text-sm text-muted-fg">
            Weakest topics first — read the notes, then hit the topic test.
          </p>
          <ul className="mt-3 flex flex-col gap-2">
            {weak.map((t) => (
              <li key={t.id}>
                <Link
                  href={`/study/${t.id}`}
                  className="flex items-center justify-between gap-3 rounded-lg border border-line bg-card px-3 py-2 text-sm transition-colors hover:border-warn"
                >
                  <span className="font-medium text-ink">
                    {t.subject} · {t.name}
                  </span>
                  <span className="stat-num shrink-0 text-xs text-warn">
                    {t.accuracy == null ? "—" : `${Math.round(t.accuracy)}%`} · {t.attempts} attempts
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      {subjects.map((subject) => (
        <section key={subject.id}>
          <h2 className="section-title mb-3">{subject.name}</h2>
          <ul className="stagger grid gap-3 sm:grid-cols-2">
            {subject.topics.map((topic) => (
              <li key={topic.id} className="h-full">
                <Link
                  href={`/study/${topic.id}`}
                  className="card card-hover group flex h-full flex-col gap-3 p-4"
                >
                  <div className="flex items-start justify-between gap-2">
                    <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-brand-soft text-brand">
                      <StudyIcon />
                    </span>
                    <span className="flex translate-x-1 items-center gap-1 text-xs font-semibold text-brand opacity-0 transition-all duration-200 group-hover:translate-x-0 group-hover:opacity-100">
                      Open
                      <ArrowRightIcon className="h-3.5 w-3.5" />
                    </span>
                  </div>
                  <span className="font-semibold leading-snug text-ink">{topic.name}</span>
                  <span className="mt-auto flex flex-wrap items-center gap-1.5">
                    <span className="badge badge-neutral">{topic.noteCount} notes</span>
                    {topic.sourceCount > 0 ? (
                      <span className="badge badge-accent">{topic.sourceCount} sources</span>
                    ) : null}
                    {topic.attempts > 0 ? (
                      <span className={`badge ${topic.weak ? "badge-warn" : "badge-ok"}`}>
                        {topic.accuracy == null ? "—" : `${Math.round(topic.accuracy)}%`} accuracy
                      </span>
                    ) : (
                      <span className="badge badge-neutral">not practiced</span>
                    )}
                    {topic.weak ? <span className="badge badge-warn font-bold">weak</span> : null}
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        </section>
      ))}
    </div>
  );
}
