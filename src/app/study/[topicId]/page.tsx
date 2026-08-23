import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import type { Metadata } from "next";
import type { ReactNode } from "react";
import { getCurrentUser } from "@/lib/api";
import {
  STUDY_KIND_META,
  bulletLines,
  getTopicStudy,
  groupNotesByKind,
  parseComparisonTable,
} from "@/lib/study";
import {
  ArrowRightIcon,
  FlagIcon,
  MockIcon,
  ProgressIcon,
  SavedIcon,
  SparklesIcon,
  StudyIcon,
} from "@/components/icons";
import { TopicPracticeButton } from "@/components/TopicPracticeButton";
import { NotebookChat } from "@/components/NotebookChat";
import { recordStudyVisit } from "@/lib/study-visit";

export async function generateMetadata({ params }: { params: Promise<{ topicId: string }> }): Promise<Metadata> {
  const { topicId } = await params;
  const study = await getTopicStudy(topicId);
  return { title: study ? `${study.topic.name} — Study` : "Study — MCQure" };
}

const KIND_STYLES: Record<string, { icon: ReactNode; wrap: string; tile: string; dot: string }> = {
  CONCEPT_NOTES: {
    icon: <StudyIcon />,
    wrap: "card p-5 sm:p-6",
    tile: "bg-brand-soft text-brand",
    dot: "bg-brand",
  },
  MNEMONICS: {
    icon: <SparklesIcon />,
    wrap: "rounded-xl border-l-2 border-accent bg-accent-soft/40 py-5 pl-5 pr-5",
    tile: "bg-card-strong text-accent shadow-soft",
    dot: "bg-accent",
  },
  COMPARISON: {
    icon: <MockIcon />,
    wrap: "card p-5 sm:p-6",
    tile: "bg-accent-soft text-accent",
    dot: "bg-accent",
  },
  EXAM_TRAPS: {
    icon: <FlagIcon />,
    wrap: "rounded-xl border-l-2 border-accent bg-accent-soft/40 py-5 pl-5 pr-5",
    tile: "bg-card-strong text-accent shadow-soft",
    dot: "bg-accent",
  },
  QUICK_SUMMARY: {
    icon: <ProgressIcon />,
    wrap: "rounded-xl border-l-2 border-brand bg-brand-soft/40 p-5",
    tile: "bg-card-strong text-brand shadow-soft",
    dot: "bg-brand",
  },
};

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
    <div className="mx-auto flex w-full max-w-prose flex-col gap-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <nav className="flex items-center gap-1.5">
            <Link href="/study" className="chip transition-colors hover:border-brand hover:text-brand">
              Study
            </Link>
            <ArrowRightIcon className="h-3 w-3 text-subtle-fg" />
            <span className="chip">{study.topic.subjectName}</span>
          </nav>
          <p className="kicker mt-4">Lesson</p>
          <h1 className="mt-2 text-2xl font-bold tracking-tight sm:text-3xl">{study.topic.name}</h1>
          <p className="text-sm text-muted-fg">{study.topic.subjectName}</p>
        </div>
        <TopicPracticeButton topicId={study.topic.id} questionCount={study.questionCount} />
      </div>

      {groups.length === 0 ? (
        <div className="card p-6 text-center">
          <p className="text-sm text-muted-fg">
            No study notes yet for this topic. Practice its questions to start the loop.
          </p>
        </div>
      ) : (
        groups.map((group) => {
          const meta = STUDY_KIND_META[group.kind];
          const styles = KIND_STYLES[group.kind] ?? KIND_STYLES.CONCEPT_NOTES;
          const isComparison = group.kind === "COMPARISON";
          return (
            <section key={group.kind} className={`rise-in ${styles.wrap}`}>
              <h2 className="flex items-center gap-2.5 text-lg font-semibold tracking-tight text-ink">
                <span className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${styles.tile}`}>
                  {styles.icon}
                </span>
                {meta.label}
              </h2>
              <div className="mt-4 space-y-5">
                {group.notes.map((note) => (
                  <article key={note.id}>
                    {note.title ? (
                      <h3 className="text-sm font-semibold text-ink">{note.title}</h3>
                    ) : null}
                    {isComparison ? (
                      <ComparisonTable body={note.body} />
                    ) : (
                      <ul className="mt-1.5 flex flex-col gap-2">
                        {bulletLines(note.body).map((line, i) => (
                          <li key={i} className="flex gap-2.5 text-sm leading-relaxed text-ink">
                            <span aria-hidden className={`mt-[9px] h-1.5 w-1.5 shrink-0 rounded-full ${styles.dot}`} />
                            <span>{line}</span>
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
        <section className="card p-5 sm:p-6">
          <h2 className="section-title flex items-center gap-2">
            <SavedIcon className="h-4 w-4 text-brand" />
            Net sources ({study.sources.length})
          </h2>
          <p className="mt-1 text-xs text-subtle-fg">
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
                  className="group flex items-start justify-between gap-3 rounded-xl border border-line px-3 py-2 transition-colors hover:border-brand hover:bg-brand-soft/40"
                >
                  <span>
                    <span className="link block text-sm">{source.title}</span>
                    {source.description ? (
                      <span className="mt-0.5 block text-xs text-subtle-fg">
                        {source.description}
                      </span>
                    ) : null}
                  </span>
                  <ArrowRightIcon
                    className="mt-0.5 h-3.5 w-3.5 shrink-0 -rotate-45 text-subtle-fg transition-colors group-hover:text-brand"
                  />
                </a>
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      <section className="card p-5 sm:p-6">
        <h2 className="section-title flex items-center gap-2">
          <SparklesIcon className="h-4 w-4 text-brand" />
          Notebook
        </h2>
        <p className="mt-1 text-xs text-subtle-fg">
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
    <div className="mt-2 overflow-x-auto rounded-xl border border-line">
      <table className="w-full min-w-[420px] text-left text-sm">
        <thead>
          <tr className="bg-brand-soft/60">
            {header.map((h, i) => (
              <th key={i} className="px-3 py-2 font-semibold tracking-tight text-ink">
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, i) => (
            <tr key={i} className="border-t border-line">
              {row.map((cell, j) => (
                <td
                  key={j}
                  className={`px-3 py-2 align-top ${j === 0 ? "font-medium text-ink" : "text-muted-fg"} ${
                    i % 2 === 1 ? "bg-canvas/60" : ""
                  }`}
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
