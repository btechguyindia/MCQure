import Link from "next/link";
import { redirect } from "next/navigation";
import type { Difficulty, QuestionQualityStatus, QuestionSourceType } from "@prisma/client";
import { prisma } from "@/lib/db";
import { getCurrentUser } from "@/lib/api";
import { listQuestionBank } from "@/lib/question-bank";
import type { QuestionBankItem } from "@/lib/question-bank";
import {
  QUALITY_STATUS_META,
  QUESTION_SOURCE_META,
  SOURCE_TYPE_ORDER,
} from "@/lib/question-source";

export const metadata = { title: "Question Bank — MCQure" };

const DIFFICULTIES = ["EASY", "MEDIUM", "HARD", "VERY_HARD"] as const;
const QUALITY_STATUSES = ["PENDING", "APPROVED", "QUARANTINED", "REJECTED"] as const;

function badgeClass(badge: string): string {
  switch (badge) {
    case "pyq":
      return "bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300";
    case "official":
      return "bg-teal-100 text-teal-800 dark:bg-teal-950/60 dark:text-teal-300";
    case "licensed":
      return "bg-sky-100 text-sky-800 dark:bg-sky-950/60 dark:text-sky-300";
    case "variant":
      return "bg-violet-100 text-violet-800 dark:bg-violet-950/60 dark:text-violet-300";
    case "ai":
      return "bg-indigo-100 text-indigo-800 dark:bg-indigo-950/60 dark:text-indigo-300";
    case "web":
      return "bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300";
    default:
      return "bg-zinc-100 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300";
  }
}

function qualityClass(badge: string): string {
  switch (badge) {
    case "ok":
      return "text-emerald-600 dark:text-emerald-400";
    case "warn":
      return "text-amber-600 dark:text-amber-400";
    case "bad":
      return "text-rose-600 dark:text-rose-400";
    default:
      return "text-zinc-500 dark:text-zinc-400";
  }
}

function accuracy(item: QuestionBankItem): string {
  const answered = item.timesCorrect + item.timesIncorrect;
  if (answered === 0) return "—";
  return `${Math.round((item.timesCorrect / answered) * 100)}%`;
}

function selectClasses(): string {
  return "rounded-lg border border-zinc-300 bg-background px-2.5 py-1.5 text-sm dark:border-zinc-700";
}

interface SearchParams {
  [key: string]: string | string[] | undefined;
}

export default async function QuestionBankPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const raw = await searchParams;
  const single = (key: string) =>
    typeof raw[key] === "string" ? (raw[key] as string) : undefined;
  const cursor = single("cursor");
  const query = single("query");
  const subjectId = single("subjectId");
  const topicId = single("topicId");
  const difficulty = single("difficulty");
  const sourceType = single("sourceType");
  const qualityStatus = single("qualityStatus");
  const verified = single("verified");
  const relevance = single("examRelevanceMin");
  const limitRaw = single("limit");

  const page = await listQuestionBank({
    cursor,
    query,
    subjectId,
    topicId,
    difficulty: (difficulty as Difficulty | undefined) ?? undefined,
    sourceType: (sourceType as QuestionSourceType | undefined) ?? undefined,
    qualityStatus: (qualityStatus as QuestionQualityStatus | undefined) ?? undefined,
    verified: verified === undefined ? undefined : verified === "true",
    examRelevanceMin: relevance ? Number(relevance) : undefined,
    limit: limitRaw ? Number(limitRaw) : undefined,
  });

  const [subjects, topics] = await Promise.all([
    prisma.subject.findMany({ orderBy: { order: "asc" }, select: { id: true, name: true } }),
    prisma.topic.findMany({
      orderBy: [{ subject: { order: "asc" } }, { order: "asc" }],
      select: { id: true, name: true, subject: { select: { name: true } } },
    }),
  ]);

  const current = { query, subjectId, topicId, difficulty, sourceType, qualityStatus, verified, examRelevanceMin: relevance, limit: limitRaw };
  const buildUrl = (extra: Record<string, string>) => {
    const sp = new URLSearchParams();
    for (const [k, v] of Object.entries(current)) {
      if (v) sp.set(k, v);
    }
    for (const [k, v] of Object.entries(extra)) {
      if (v) sp.set(k, v);
    }
    const qs = sp.toString();
    return qs ? `/questions?${qs}` : "/questions";
  };

  const select = selectClasses();

  return (
    <div className="flex flex-col gap-6">
      <header>
        <h1 className="text-2xl font-bold">🗂 Question Bank</h1>
        <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
          Every question is classified by provenance — VERIFIED PYQ, OFFICIAL, LICENSED,
          PYQ VARIANT, AI GENERATED, etc. — and linked to the same exam hierarchy used by
          Practice, Study, Analytics and Mocks. Pages are loaded server-side with cursor
          pagination; the bank scales to 1M+ questions without loading it into the browser.
        </p>
      </header>

      <form
        method="get"
        className="flex flex-wrap items-end gap-3 rounded-xl border border-zinc-200 bg-card p-4 dark:border-zinc-800"
      >
        <label className="flex flex-col gap-1 text-xs text-zinc-500">
          Subject
          <select name="subjectId" className={select}>
            <option value="">All subjects</option>
            {subjects.map((s) => (
              <option key={s.id} value={s.id} selected={subjectId === s.id}>
                {s.name}
              </option>
            ))}
          </select>
        </label>
        <label className="flex flex-col gap-1 text-xs text-zinc-500">
          Topic
          <select name="topicId" className={select}>
            <option value="">All topics</option>
            {topics.map((t) => (
              <option key={t.id} value={t.id} selected={topicId === t.id}>
                {t.subject.name} — {t.name}
              </option>
            ))}
          </select>
        </label>
        <label className="flex flex-col gap-1 text-xs text-zinc-500">
          Difficulty
          <select name="difficulty" className={select}>
            <option value="">Any</option>
            {DIFFICULTIES.map((d) => (
              <option key={d} value={d} selected={difficulty === d}>
                {d.toLowerCase()}
              </option>
            ))}
          </select>
        </label>
        <label className="flex flex-col gap-1 text-xs text-zinc-500">
          Source
          <select name="sourceType" className={select}>
            <option value="">Any source</option>
            {SOURCE_TYPE_ORDER.map((s) => (
              <option key={s} value={s} selected={sourceType === s}>
                {QUESTION_SOURCE_META[s].label}
              </option>
            ))}
          </select>
        </label>
        <label className="flex flex-col gap-1 text-xs text-zinc-500">
          Quality
          <select name="qualityStatus" className={select}>
            <option value="">Any</option>
            {QUALITY_STATUSES.map((q) => (
              <option key={q} value={q} selected={qualityStatus === q}>
                {QUALITY_STATUS_META[q].label}
              </option>
            ))}
          </select>
        </label>
        <label className="flex flex-col gap-1 text-xs text-zinc-500">
          Verification
          <select name="verified" className={select}>
            <option value="">Any</option>
            <option value="true" selected={verified === "true"}>
              Verified only
            </option>
            <option value="false" selected={verified === "false"}>
              Not verified
            </option>
          </select>
        </label>
        <label className="flex flex-col gap-1 text-xs text-zinc-500">
          Exam relevance ≥
          <input
            name="examRelevanceMin"
            type="number"
            min={0}
            max={100}
            className={select}
            defaultValue={relevance ?? ""}
            placeholder="50"
          />
        </label>
        <label className="flex flex-col gap-1 text-xs text-zinc-500">
          Search
          <input
            name="query"
            className={select}
            defaultValue={query ?? ""}
            placeholder="search question text…"
          />
        </label>
        <button
          type="submit"
          className="rounded-lg bg-indigo-600 px-3 py-1.5 text-sm font-semibold text-white hover:bg-indigo-500"
        >
          Filter
        </button>
        <Link href="/questions" className="rounded-lg px-3 py-1.5 text-sm text-zinc-500 hover:bg-zinc-100 dark:hover:bg-zinc-800">
          Clear
        </Link>
      </form>

      <p className="text-sm text-zinc-500 dark:text-zinc-400">
        {page.total.toLocaleString()} question{page.total === 1 ? "" : "s"} match
      </p>

      {page.items.length === 0 ? (
        <p className="rounded-xl border border-dashed border-zinc-300 p-8 text-center text-sm text-zinc-500 dark:border-zinc-700">
          No questions match these filters.
        </p>
      ) : (
        <ul className="flex flex-col gap-3">
          {page.items.map((item) => {
            const src = QUESTION_SOURCE_META[item.sourceType];
            const q = QUALITY_STATUS_META[item.qualityStatus];
            return (
              <li
                key={item.id}
                className="rounded-xl border border-zinc-200 bg-card p-4 dark:border-zinc-800"
              >
                <div className="flex flex-wrap items-center gap-2 text-xs">
                  <span className={`rounded-full px-2 py-0.5 font-semibold ${badgeClass(src.badge)}`}>
                    {src.label}
                  </span>
                  <span className="text-zinc-500">{item.subject.name} · {item.topic.name}</span>
                  {item.subtopic ? <span className="text-zinc-400">· {item.subtopic.name}</span> : null}
                  {item.concept ? <span className="text-zinc-400">· {item.concept.name}</span> : null}
                  <span className="text-zinc-400">· {item.difficulty.toLowerCase()}</span>
                  <span className={`font-medium ${qualityClass(q.badge)}`}>· {q.label}</span>
                </div>
                <p className="mt-2 text-sm font-medium">{item.text}</p>
                <div className="mt-2 flex flex-wrap gap-4 text-xs text-zinc-500 dark:text-zinc-400">
                  <span>relevance {item.examRelevance}</span>
                  <span>attempted {item.timesAttempted}</span>
                  <span>accuracy {accuracy(item)}</span>
                  <span>avg {item.avgResponseTimeMs ? `${Math.round(item.avgResponseTimeMs / 1000)}s` : "—"}</span>
                  {item.source?.verified ? <span className="text-emerald-600 dark:text-emerald-400">✓ verified source</span> : null}
                  {item.source?.year ? <span>· {item.source.examName ?? ""} {item.source.year}</span> : null}
                </div>
              </li>
            );
          })}
        </ul>
      )}

      {page.nextCursor ? (
        <div className="flex justify-center">
          <Link
            href={buildUrl({ cursor: page.nextCursor })}
            className="rounded-lg bg-zinc-900 px-4 py-2 text-sm font-semibold text-white hover:bg-zinc-700 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-200"
          >
            Next page →
          </Link>
        </div>
      ) : null}
    </div>
  );
}
