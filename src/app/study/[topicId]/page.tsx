import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import type { Metadata } from "next";
import { getCurrentUser } from "@/lib/api";
import {
  STUDY_KIND_META,
  bulletLines,
  getTopicStudy,
  groupNotesByKind,
  parseComparisonTable,
} from "@/lib/study";
import { TopicPracticeButton } from "@/components/TopicPracticeButton";
import { NotebookChat } from "@/components/NotebookChat";
import { recordStudyVisit } from "@/lib/study-visit";

export async function generateMetadata({ params }: { params: Promise<{ topicId: string }> }): Promise<Metadata> {
  const { topicId } = await params;
  const study = await getTopicStudy(topicId);
  return { title: study ? `${study.topic.name} — Study` : "Study — MCQure" };
}

export default async function TopicStudyPage({ params }: { params: Promise<{ topicId: string }> }) {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const { topicId } = await params;
  const study = await getTopicStudy(topicId);
  if (!study) notFound();

  // Record that this topic's material was opened (drives "last studied").
  await recordStudyVisit(user.id, topicId, "STUDY");

  const groups = groupNotesByKind(study.notes);

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <Link
            href="/study"
            className="text-xs font-medium text-zinc-500 hover:text-zinc-700 dark:text-zinc-400 dark:hover:text-zinc-200"
          >
            ← All topics
          </Link>
          <h1 className="mt-1 text-2xl font-bold">{study.topic.name}</h1>
          <p className="text-sm text-zinc-500">{study.topic.subjectName}</p>
        </div>
        <TopicPracticeButton topicId={study.topic.id} questionCount={study.questionCount} />
      </div>

      {groups.length === 0 ? (
        <div className="rounded-2xl border border-zinc-200 bg-white p-6 text-center dark:border-zinc-800 dark:bg-zinc-900">
          <p className="text-sm text-zinc-500">
            No study notes yet for this topic. Practice its questions to start the loop.
          </p>
        </div>
      ) : (
        groups.map((group) => {
          const meta = STUDY_KIND_META[group.kind];
          const isSummary = group.kind === "QUICK_SUMMARY";
          const isComparison = group.kind === "COMPARISON";
          return (
            <section
              key={group.kind}
              className={`rounded-2xl border p-5 ${
                isSummary
                  ? "border-indigo-200 bg-indigo-50 dark:border-indigo-900/60 dark:bg-indigo-950/40"
                  : "border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900"
              }`}
            >
              <h2 className="text-sm font-semibold uppercase tracking-wide text-zinc-500">
                {meta.icon} {meta.label}
              </h2>
              <div className="mt-3 space-y-4">
                {group.notes.map((note) => (
                  <article key={note.id}>
                    {note.title ? (
                      <h3 className="text-sm font-semibold text-zinc-700 dark:text-zinc-200">{note.title}</h3>
                    ) : null}
                    {isComparison ? (
                      <ComparisonTable body={note.body} />
                    ) : (
                      <ul className="mt-1.5 flex flex-col gap-1.5">
                        {bulletLines(note.body).map((line, i) => (
                          <li key={i} className="flex gap-2 text-sm leading-relaxed text-zinc-700 dark:text-zinc-300">
                            <span className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-indigo-400" />
                            {line}
                          </li>
                        ))}
                      </ul>
                    )}
                  </article>
                ))}
              </div>
            </section>
          );
        })
      )}

      {study.sources.length > 0 ? (
        <section className="rounded-2xl border border-zinc-200 bg-white p-5 dark:border-zinc-800 dark:bg-zinc-900">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-zinc-500">
            🔗 Net sources ({study.sources.length})
          </h2>
          <p className="mt-1 text-xs text-zinc-500">
            Curated references to go deeper. The Notebook answers only from the notes
            above, not from these links.
          </p>
          <ul className="mt-3 flex flex-col gap-2">
            {study.sources.map((source) => (
              <li key={source.id}>
                <a
                  href={source.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="group flex items-start justify-between gap-3 rounded-lg border border-zinc-200 px-3 py-2 hover:border-indigo-300 hover:bg-indigo-50/50 dark:border-zinc-700 dark:hover:border-indigo-800 dark:hover:bg-indigo-950/30"
                >
                  <span>
                    <span className="block text-sm font-medium text-indigo-600 group-hover:underline dark:text-indigo-400">
                      {source.title}
                    </span>
                    {source.description ? (
                      <span className="mt-0.5 block text-xs text-zinc-500 dark:text-zinc-400">
                        {source.description}
                      </span>
                    ) : null}
                  </span>
                  <span className="text-xs text-zinc-400" title="Open in new tab">
                    ↗
                  </span>
                </a>
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      <section className="rounded-2xl border border-zinc-200 bg-white p-5 dark:border-zinc-800 dark:bg-zinc-900">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-zinc-500">
          🤖 Notebook
        </h2>
        <p className="mt-1 text-xs text-zinc-500">
          Chat with your study material. Grounded — it stays strictly inside this
          topic&apos;s notes.
        </p>
        <div className="mt-3">
          <NotebookChat topicId={study.topic.id} />
        </div>
      </section>
    </div>
  );
}

function ComparisonTable({ body }: { body: string }) {
  const { header, rows } = parseComparisonTable(body);
  if (header.length === 0) return null;
  return (
    <div className="mt-2 overflow-x-auto rounded-lg border border-zinc-200 dark:border-zinc-700">
      <table className="w-full min-w-[420px] text-left text-sm">
        <thead>
          <tr className="bg-zinc-50 dark:bg-zinc-800">
            {header.map((h, i) => (
              <th key={i} className="px-3 py-2 font-semibold text-zinc-700 dark:text-zinc-200">
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-zinc-200 dark:divide-zinc-700">
          {rows.map((row, i) => (
            <tr key={i}>
              {row.map((cell, j) => (
                <td
                  key={j}
                  className={`px-3 py-2 align-top text-zinc-700 dark:text-zinc-300 ${j === 0 ? "font-medium" : ""}`}
                >
                  {cell}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
