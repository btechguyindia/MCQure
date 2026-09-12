import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/api";
import { prisma } from "@/lib/db";
import { QUESTION_SOURCE_META, SOURCE_TYPE_ORDER } from "@/lib/question-source";
import { BankIcon, BookmarkIcon, StudyIcon } from "@/components/icons";

export const metadata: Metadata = { title: "Sources — MCQure" };

function verifiedBadge(verified: boolean) {
  return verified ? (
    <span className="badge badge-ok">Verified</span>
  ) : (
    <span className="badge badge-neutral">Unverified</span>
  );
}

export default async function SourcesPage({ searchParams }: { searchParams: Promise<{ cat?: string }> }) {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const { cat } = await searchParams;
  const activeCat = cat?.toUpperCase() ?? "ALL";

  const [qBySource, questionSources, topicSourcesRaw, totalQuestions, totalSources] = await Promise.all([
    prisma.question.groupBy({ by: ["sourceType"], _count: { id: true } }),
    prisma.questionSource.findMany({ orderBy: { type: "asc" } }),
    prisma.topicSource.findMany({
      include: { topic: { select: { name: true, subject: { select: { name: true } } } } },
      orderBy: [{ topic: { subject: { name: "asc" } } }, { topic: { name: "asc" } }, { order: "asc" }],
    }),
    prisma.question.count(),
    prisma.topicSource.count(),
  ]);

  const countByType = new Map(qBySource.map((r) => [r.sourceType, r._count.id]));
  const questionSourceCount = questionSources.length;

  // Group TopicSources by subject -> topic
  const studyBySubject = new Map<string, Map<string, typeof topicSourcesRaw>>();
  for (const s of topicSourcesRaw) {
    const subj = s.topic.subject.name;
    const top = s.topic.name;
    if (!studyBySubject.has(subj)) studyBySubject.set(subj, new Map());
    const m = studyBySubject.get(subj)!;
    if (!m.has(top)) m.set(top, []);
    m.get(top)!.push(s);
  }

  const cats = ["ALL", ...SOURCE_TYPE_ORDER, "STUDY"] as const;

  const isQuestionCat = (c: string) =>
    (SOURCE_TYPE_ORDER as readonly string[]).includes(c);

  const filteredQuestionSources =
    activeCat === "ALL"
      ? questionSources
      : isQuestionCat(activeCat)
        ? questionSources.filter((q) => q.type === activeCat)
        : [];

  const filteredByType =
    activeCat === "ALL" || activeCat === "STUDY"
      ? null
      : activeCat;

  return (
    <div className="flex flex-col gap-6">
      <header>
        <p className="kicker">Provenance</p>
        <h1 className="mt-2 flex items-center gap-2 text-2xl font-bold tracking-tight sm:text-3xl">
          <BankIcon className="h-6 w-6 text-brand" />
          Sources
        </h1>
        <p className="mt-1 max-w-2xl text-sm text-muted-fg">
          Every question and study link is filed under an honest provenance category — no AI content is ever shown as a genuine PYQ. Browse by category to see counts, verification and curated links.
        </p>
      </header>

      {/* Stats strip */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <div className="card p-4 text-center">
          <p className="stat-num text-xl">{totalQuestions.toLocaleString()}</p>
          <p className="kicker mt-1 justify-center">Questions</p>
        </div>
        <div className="card p-4 text-center">
          <p className="stat-num text-xl">{questionSourceCount}</p>
          <p className="kicker mt-1 justify-center">Question registries</p>
        </div>
        <div className="card p-4 text-center">
          <p className="stat-num text-xl">{totalSources}</p>
          <p className="kicker mt-1 justify-center">Study links</p>
        </div>
        <div className="card p-4 text-center">
          <p className="stat-num text-xl">{studyBySubject.size}</p>
          <p className="kicker mt-1 justify-center">Subjects covered</p>
        </div>
      </div>

      {/* Category pills */}
      <div className="flex flex-wrap gap-1.5">
        {cats.map((c) => {
          const active = c === activeCat;
          const label =
            c === "ALL" ? "All" : c === "STUDY" ? "Study library" : QUESTION_SOURCE_META[c as keyof typeof QUESTION_SOURCE_META]?.shortLabel ?? c;
          return (
            <Link
              key={c}
              href={c === "ALL" ? "/sources" : `/sources?cat=${c.toLowerCase()}`}
              className={`rounded-full border px-3 py-1.5 text-xs font-semibold transition-colors ${
                active
                  ? "border-brand bg-brand text-on-brand shadow-glow"
                  : "border-line bg-card text-muted-fg hover:border-brand hover:text-brand"
              }`}
            >
              {label}
              {c !== "ALL" && c !== "STUDY" ? (
                <span className="ml-1 tabular-nums opacity-70">· {countByType.get(c as never) ?? 0}</span>
              ) : c === "STUDY" ? (
                <span className="ml-1 tabular-nums opacity-70">· {totalSources}</span>
              ) : null}
            </Link>
          );
        })}
      </div>

      {/* Category explanations when filtering */}
      {activeCat !== "ALL" && activeCat !== "STUDY" && QUESTION_SOURCE_META[activeCat as keyof typeof QUESTION_SOURCE_META] && (
        <div className="card border-brand/20 bg-brand-soft/40 p-4">
          <p className="text-sm font-semibold text-ink">
            {QUESTION_SOURCE_META[activeCat as keyof typeof QUESTION_SOURCE_META].label}
            <span className="ml-2 inline-flex items-center rounded-full bg-card px-2 py-0.5 text-xs font-bold text-brand">
              {QUESTION_SOURCE_META[activeCat as keyof typeof QUESTION_SOURCE_META].genuine ? "Genuine" : "Original / derived"}
            </span>
          </p>
          <p className="mt-1 text-sm text-muted-fg">{QUESTION_SOURCE_META[activeCat as keyof typeof QUESTION_SOURCE_META].description}</p>
          <p className="mt-2 text-xs tabular-nums text-subtle-fg">
            {countByType.get(activeCat as never) ?? 0} questions in this category · {filteredQuestionSources.length} registry entries
          </p>
        </div>
      )}

      {/* Main content: question sources + study sources */}
      {(activeCat === "ALL" || isQuestionCat(activeCat)) && (
        <section className="card p-5">
          <h2 className="section-title flex items-center gap-2">
            <BankIcon className="h-3.5 w-3.5 text-brand" />
            Question source registries
            <span className="ml-1 chip">{filteredQuestionSources.length}</span>
          </h2>
          {filteredQuestionSources.length === 0 ? (
            <p className="mt-3 text-sm text-muted-fg">No registries in this category.</p>
          ) : (
            <div className="mt-3 overflow-x-auto">
              <table className="table-clean">
                <thead>
                  <tr>
                    <th>Registry</th>
                    <th>Type</th>
                    <th>Exam / Year</th>
                    <th>Qs</th>
                    <th>Verified</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredQuestionSources.map((s) => (
                    <tr key={s.id}>
                      <td>
                        <div className="font-medium text-ink">{s.name}</div>
                        {s.url ? (
                          <a href={s.url} target="_blank" rel="noreferrer" className="link text-xs">
                            {s.url}
                          </a>
                        ) : null}
                      </td>
                      <td>
                        <span className="badge badge-neutral">{QUESTION_SOURCE_META[s.type].shortLabel}</span>
                      </td>
                      <td className="text-sm text-muted-fg">
                        {[s.examName, s.year ? String(s.year) : null, s.paper].filter(Boolean).join(" · ") || "—"}
                      </td>
                      <td className="tabular-nums">{(countByType.get(s.type as never) ?? 0).toLocaleString()}</td>
                      <td>{verifiedBadge(s.verified)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {activeCat === "ALL" && (
            <div className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-4">
              {SOURCE_TYPE_ORDER.map((t) => {
                const meta = QUESTION_SOURCE_META[t];
                const cnt = countByType.get(t) ?? 0;
                return (
                  <Link
                    key={t}
                    href={`/sources?cat=${t.toLowerCase()}`}
                    className="rounded-xl border border-line bg-canvas p-3 transition-colors hover:border-brand hover:bg-brand-soft"
                  >
                    <p className="text-xs font-bold tracking-wider text-ink">{meta.shortLabel}</p>
                    <p className="stat-num mt-1 text-lg">{cnt.toLocaleString()}</p>
                    <p className="text-xs text-muted-fg">{meta.genuine ? "Genuine" : "Original"}</p>
                  </Link>
                );
              })}
            </div>
          )}
        </section>
      )}

      {(activeCat === "ALL" || activeCat === "STUDY") && (
        <section className="card p-5">
          <h2 className="section-title flex items-center gap-2">
            <StudyIcon className="h-3.5 w-3.5 text-brand" />
            Study library — curated links per topic
            <span className="ml-1 chip">{totalSources} links</span>
          </h2>
          <p className="mt-1 text-xs text-subtle-fg">
            Hand-picked references per topic (Wikipedia, GeeksforGeeks, W3Schools, official docs). Every URL is a stable, well-known source — never fabricated.
          </p>

          <div className="mt-4 flex flex-col gap-6">
            {[...studyBySubject.entries()].map(([subject, topicMap]) => (
              <div key={subject}>
                <h3 className="text-sm font-semibold text-ink">{subject}</h3>
                <div className="mt-2 grid gap-3 sm:grid-cols-2">
                  {[...topicMap.entries()].map(([topic, links]) => (
                    <div key={topic} className="rounded-xl border border-line bg-canvas p-3">
                      <p className="flex items-center gap-1.5 text-sm font-medium text-ink">
                        <BookmarkIcon className="h-3.5 w-3.5 text-brand" />
                        {topic}
                        <span className="chip">{links.length}</span>
                      </p>
                      <ul className="mt-2 flex flex-col gap-1.5">
                        {links.map((l) => (
                          <li key={l.id} className="text-sm">
                            <a
                              href={l.url}
                              target="_blank"
                              rel="noreferrer"
                              className="link line-clamp-1"
                              title={l.url}
                            >
                              {l.title}
                            </a>
                            <span className="ml-1 text-xs text-subtle-fg">
                              {l.author ? `· ${l.author}` : ""} {l.description ? `· ${l.description}` : ""}
                            </span>
                          </li>
                        ))}
                      </ul>
                      <Link href={`/study/${links[0].topicId}`} className="mt-2 inline-flex text-xs font-semibold text-brand hover:underline">
                        Open topic →
                      </Link>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {filteredByType && !isQuestionCat(filteredByType) && filteredByType !== "STUDY" && (
        <p className="text-sm text-muted-fg">Unknown category.</p>
      )}
    </div>
  );
}
