import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/api";
import { getStudyOverview } from "@/lib/study";

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
        <h1 className="text-2xl font-bold">📚 Study</h1>
        <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
          Concise, exam-focused notes per topic — driven by your performance.
        </p>
      </header>

      {weak.length > 0 ? (
        <section className="rounded-2xl border border-amber-300 bg-amber-50 p-5 dark:border-amber-900/60 dark:bg-amber-950/40">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-amber-700 dark:text-amber-300">
            ⚡ Priority revision
          </h2>
          <p className="mt-1 text-sm text-amber-800 dark:text-amber-200">
            Weakest topics first — read the notes, then hit the topic test.
          </p>
          <ul className="mt-3 flex flex-col gap-2">
            {weak.map((t) => (
              <li key={t.id}>
                <Link
                  href={`/study/${t.id}`}
                  className="flex items-center justify-between rounded-lg bg-white px-3 py-2 text-sm hover:bg-amber-100 dark:bg-zinc-900 dark:hover:bg-zinc-800"
                >
                  <span className="font-medium">
                    {t.subject} · {t.name}
                  </span>
                  <span className="tabular-nums text-amber-700 dark:text-amber-300">
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
          <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-zinc-500">
            {subject.name}
          </h2>
          <ul className="grid gap-3 sm:grid-cols-2">
            {subject.topics.map((topic) => (
              <li key={topic.id}>
                <Link
                  href={`/study/${topic.id}`}
                  className="flex h-full flex-col gap-2 rounded-2xl border border-zinc-200 bg-white p-4 transition-colors hover:border-indigo-400 dark:border-zinc-800 dark:bg-zinc-900 dark:hover:border-indigo-500"
                >
                  <span className="font-semibold">{topic.name}</span>
                  <span className="flex flex-wrap items-center gap-1.5 text-xs">
                    <span className="rounded-full bg-zinc-100 px-2 py-0.5 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400">
                      {topic.noteCount} notes
                    </span>
                    {topic.attempts > 0 ? (
                      <span
                        className={`rounded-full px-2 py-0.5 ${
                          topic.weak
                            ? "bg-amber-100 text-amber-700 dark:bg-amber-900/50 dark:text-amber-300"
                            : "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/50 dark:text-emerald-300"
                        }`}
                      >
                        {topic.accuracy == null ? "—" : `${Math.round(topic.accuracy)}%`} accuracy
                      </span>
                    ) : (
                      <span className="rounded-full bg-zinc-100 px-2 py-0.5 text-zinc-500 dark:bg-zinc-800 dark:text-zinc-500">
                        not practiced
                      </span>
                    )}
                    {topic.weak ? (
                      <span className="rounded-full bg-amber-100 px-2 py-0.5 font-semibold text-amber-700 dark:bg-amber-900/50 dark:text-amber-300">
                        weak
                      </span>
                    ) : null}
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
