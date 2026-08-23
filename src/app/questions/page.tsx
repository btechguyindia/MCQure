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
import {
  ArrowRightIcon,
  BankIcon,
  CheckIcon,
  ChevronDownIcon,
  XIcon,
} from "@/components/icons";

export const metadata = { title: "Question Bank — MCQure" };

const DIFFICULTIES = ["EASY", "MEDIUM", "HARD", "VERY_HARD"] as const;
const QUALITY_STATUSES = ["PENDING", "APPROVED", "QUARANTINED", "REJECTED"] as const;

function badgeClass(badge: string): string {
  switch (badge) {
    case "pyq":
      return "badge badge-ok";
    case "official":
      return "badge badge-brand";
    case "licensed":
      return "badge badge-accent";
    case "variant":
      return "badge badge-neutral";
    case "ai":
      return "badge badge-brand";
    case "web":
      return "badge badge-warn";
    default:
      return "badge badge-neutral";
  }
}

function qualityClass(badge: string): string {
  switch (badge) {
    case "ok":
      return "text-ok";
    case "warn":
      return "text-warn";
    case "bad":
      return "text-bad";
    default:
      return "text-subtle-fg";
  }
}

function difficultyClass(difficulty: string): string {
  switch (difficulty) {
    case "EASY":
      return "badge badge-ok";
    case "MEDIUM":
      return "badge badge-warn";
    default:
      return "badge badge-bad";
  }
}

function accuracy(item: QuestionBankItem): string {
  const answered = item.timesCorrect + item.timesIncorrect;
  if (answered === 0) return "—";
  return `${Math.round((item.timesCorrect / answered) * 100)}%`;
}

function selectClasses(): string {
  return "input";
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

  const activeFilters: Array<{ label: string; value: string }> = [];
  if (query) activeFilters.push({ label: "Search", value: `"${query}"` });
  if (difficulty) activeFilters.push({ label: "Difficulty", value: difficulty.toLowerCase() });
  if (sourceType) activeFilters.push({ label: "Source", value: QUESTION_SOURCE_META[sourceType as QuestionSourceType].label });
  if (qualityStatus) activeFilters.push({ label: "Quality", value: QUALITY_STATUS_META[qualityStatus as QuestionQualityStatus].label });
  if (verified === "true") activeFilters.push({ label: "Verified", value: "only" });
  if (verified === "false") activeFilters.push({ label: "Verified", value: "excluded" });
  if (relevance) activeFilters.push({ label: "Relevance ≥", value: relevance });
  const subjectName = subjects.find((s) => s.id === subjectId)?.name;
  if (subjectName) activeFilters.push({ label: "Subject", value: subjectName });
  const topicName = topics.find((t) => t.id === topicId);
  if (topicName) activeFilters.push({ label: "Topic", value: `${topicName.subject.name} — ${topicName.name}` });

  return (
    <div className="flex flex-col gap-6">
      <header>
        <p className="kicker">
          <BankIcon /> Provenance-classified bank
        </p>
        <h1 className="mt-2 text-2xl font-bold tracking-tight sm:text-3xl">Question Bank</h1>
        <p className="mt-2 max-w-3xl text-sm text-muted-fg">
          Every question is classified by provenance — VERIFIED PYQ, OFFICIAL, LICENSED,
          PYQ VARIANT, AI GENERATED, etc. — and linked to the same exam hierarchy used by
          Practice, Study, Analytics and Mocks. Cursor-paginated server-side, so the bank
          scales to 1M+ questions without loading it into the browser.
        </p>
      </header>

      <details open className="card group overflow-hidden">
        <summary className="flex cursor-pointer select-none items-center justify-between px-4 py-3 text-sm font-semibold [&::-webkit-details-marker]:hidden">
          <span>
            Filters {activeFilters.length > 0 ? `(${activeFilters.length} active)` : ""}
          </span>
          <ChevronDownIcon className="text-subtle-fg transition-transform group-open:rotate-180" />
        </summary>
        <form method="get" className="grid grid-cols-1 gap-4 border-t border-line p-4 sm:grid-cols-2 lg:grid-cols-4">
          <label className="flex flex-col">
            <span className="label">Search</span>
            <input name="query" className={select} defaultValue={query ?? ""} placeholder="search question text…" />
          </label>
          <label className="flex flex-col">
            <span className="label">Subject</span>
            <select name="subjectId" className={select}>
              <option value="">All subjects</option>
              {subjects.map((s) => (
                <option key={s.id} value={s.id} selected={subjectId === s.id}>
                  {s.name}
                </option>
              ))}
            </select>
          </label>
          <label className="flex flex-col">
            <span className="label">Topic</span>
            <select name="topicId" className={select}>
              <option value="">All topics</option>
              {topics.map((t) => (
                <option key={t.id} value={t.id} selected={topicId === t.id}>
                  {t.subject.name} — {t.name}
                </option>
              ))}
            </select>
          </label>
          <label className="flex flex-col">
            <span className="label">Difficulty</span>
            <select name="difficulty" className={select}>
              <option value="">Any</option>
              {DIFFICULTIES.map((d) => (
                <option key={d} value={d} selected={difficulty === d}>
                  {d.toLowerCase()}
                </option>
              ))}
            </select>
          </label>
          <label className="flex flex-col">
            <span className="label">Source</span>
            <select name="sourceType" className={select}>
              <option value="">Any source</option>
              {SOURCE_TYPE_ORDER.map((s) => (
                <option key={s} value={s} selected={sourceType === s}>
                  {QUESTION_SOURCE_META[s].label}
                </option>
              ))}
            </select>
          </label>
          <label className="flex flex-col">
            <span className="label">Quality</span>
            <select name="qualityStatus" className={select}>
              <option value="">Any</option>
              {QUALITY_STATUSES.map((q) => (
                <option key={q} value={q} selected={qualityStatus === q}>
                  {QUALITY_STATUS_META[q].label}
                </option>
              ))}
            </select>
          </label>
          <label className="flex flex-col">
            <span className="label">Verification</span>
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
          <div className="flex items-end gap-2">
            <label className="flex w-full flex-col">
              <span className="label">Relevance ≥</span>
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
          </div>
          <div className="flex flex-wrap items-center gap-2 sm:col-span-2 lg:col-span-4">
            <button type="submit" className="btn btn-primary !py-2">
              Apply filters
            </button>
            <Link href="/questions" className="btn btn-secondary !py-2">
              Clear all
            </Link>
          </div>
        </form>
      </details>

      {activeFilters.length > 0 ? (
        <div className="flex flex-wrap items-center gap-2">
          {activeFilters.map((f) => {
            const rest = Object.fromEntries(
              Object.entries(current).filter(([k, v]) => {
                if (!v || k === "cursor") return false;
                const matchesSearch = f.label === "Search" && k === "query";
                const matchesDifficulty = f.label === "Difficulty" && k === "difficulty";
                const matchesSource = f.label === "Source" && k === "sourceType";
                const matchesQuality = f.label === "Quality" && k === "qualityStatus";
                const matchesVerified = f.label === "Verified" && k === "verified";
                const matchesRelevance = f.label === "Relevance ≥" && k === "examRelevanceMin";
                const matchesSubject = f.label === "Subject" && k === "subjectId";
                const matchesTopic = f.label === "Topic" && k === "topicId";
                return !(matchesSearch || matchesDifficulty || matchesSource || matchesQuality || matchesVerified || matchesRelevance || matchesSubject || matchesTopic);
              })
            ) as Record<string, string | undefined>;
            const sp = new URLSearchParams();
            for (const [k, v] of Object.entries(rest)) if (v) sp.set(k, v);
            const qs = sp.toString();
            return (
              <Link
                key={`${f.label}:${f.value}`}
                href={qs ? `/questions?${qs}` : "/questions"}
                className="badge badge-brand"
                title={`Remove ${f.label} filter`}
              >
                {f.label}: {f.value} <XIcon className="h-3 w-3" />
              </Link>
            );
          })}
        </div>
      ) : null}

      <p className="text-sm text-muted-fg">
        <span className="stat-num text-ink">{page.total.toLocaleString()}</span> question
        {page.total === 1 ? "" : "s"} match
      </p>

      {page.items.length === 0 ? (
        <div className="card p-8 text-center">
          <p className="font-semibold">No questions match these filters.</p>
          <p className="mt-1 text-sm text-muted-fg">
            Try removing a few filters to widen the search.
          </p>
        </div>
      ) : (
        <ul className="stagger flex flex-col gap-3">
          {page.items.map((item) => {
            const src = QUESTION_SOURCE_META[item.sourceType];
            const q = QUALITY_STATUS_META[item.qualityStatus];
            return (
              <li key={item.id} className="card p-4 sm:p-5">
                <div className="flex flex-wrap items-center gap-2 text-xs">
                  <span className={badgeClass(src.badge)}>{src.label}</span>
                  <span className="text-muted-fg">{item.subject.name} · {item.topic.name}</span>
                  {item.subtopic ? <span className="text-subtle-fg">· {item.subtopic.name}</span> : null}
                  {item.concept ? <span className="text-subtle-fg">· {item.concept.name}</span> : null}
                  <span className={difficultyClass(item.difficulty)}>{item.difficulty.toLowerCase()}</span>
                  <span className={`font-medium ${qualityClass(q.badge)}`}>· {q.label}</span>
                </div>
                <p className="mt-2.5 text-sm font-medium">{item.text}</p>
                <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-fg">
                  <span>relevance {item.examRelevance}</span>
                  <span>attempted {item.timesAttempted}</span>
                  <span>accuracy {accuracy(item)}</span>
                  <span>avg {item.avgResponseTimeMs ? `${Math.round(item.avgResponseTimeMs / 1000)}s` : "—"}</span>
                  {item.source?.verified ? (
                    <span className="flex items-center gap-1 font-medium text-ok">
                      <CheckIcon className="h-3 w-3" /> verified source
                    </span>
                  ) : null}
                  {item.source?.year ? <span>· {item.source.examName ?? ""} {item.source.year}</span> : null}
                </div>
              </li>
            );
          })}
        </ul>
      )}

      {page.nextCursor ? (
        <div className="flex justify-center">
          <Link href={buildUrl({ cursor: page.nextCursor })} className="btn btn-secondary">
            Next page <ArrowRightIcon />
          </Link>
        </div>
      ) : null}
    </div>
  );
}
