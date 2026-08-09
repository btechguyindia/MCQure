import Link from "next/link";
import type { PyqListItem } from "@/lib/pyq";
import { VERIFICATION_STATUS_META } from "@/lib/pyq";

interface PyqListProps {
  pyqs: PyqListItem[];
  years: number[];
  selectedYear?: number;
  total: number;
}

export function PyqList({ pyqs, years, selectedYear, total }: PyqListProps) {
  return (
    <section>
      <div className="mb-3 flex flex-wrap items-center gap-1.5">
        <span className="mr-1 text-xs font-semibold uppercase tracking-wide text-zinc-500">
          Year:
        </span>
        <Link
          href="/pyq"
          className={`rounded-full px-3 py-1 text-xs font-medium ${
            selectedYear
              ? "bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-300"
              : "bg-indigo-600 text-white"
          }`}
        >
          All
        </Link>
        {years.map((y) => (
          <Link
            key={y}
            href={`/pyq?year=${y}`}
            className={`rounded-full px-3 py-1 text-xs font-medium ${
              selectedYear === y
                ? "bg-indigo-600 text-white"
                : "bg-zinc-100 text-zinc-600 hover:bg-zinc-200 dark:bg-zinc-800 dark:text-zinc-300 dark:hover:bg-zinc-700"
            }`}
          >
            {y}
          </Link>
        ))}
      </div>

      {pyqs.length === 0 ? (
        <div className="rounded-2xl border border-zinc-200 bg-white p-8 text-center dark:border-zinc-800 dark:bg-zinc-900">
          <p className="text-3xl">🔎</p>
          <p className="mt-2 font-semibold">
            {selectedYear ? `No PYQs recorded for ${selectedYear} yet.` : "No PYQs in the bank yet."}
          </p>
          <p className="mt-1 text-sm text-zinc-500">
            {total === 0
              ? "Verified previous-year questions appear here as authentic papers are transcribed and checked. No content is fabricated."
              : "Try a different year, or clear the filter to see everything."}
          </p>
        </div>
      ) : (
        <ul className="flex flex-col gap-3">
          {pyqs.map((pyq) => {
            const meta = VERIFICATION_STATUS_META[pyq.verificationStatus];
            return (
              <li
                key={pyq.id}
                className="rounded-2xl border border-zinc-200 bg-white p-5 dark:border-zinc-800 dark:bg-zinc-900"
              >
                <div className="flex flex-wrap items-center gap-2 text-xs text-zinc-500">
                  <span className="font-semibold text-zinc-700 dark:text-zinc-200">
                    {pyq.year}
                    {pyq.paper ? ` · ${pyq.paper}` : ""}
                  </span>
                  <span className={`rounded-full px-2 py-0.5 font-semibold ${meta.className}`}>
                    {meta.label}
                  </span>
                  {pyq.verificationStatus !== "VERIFIED" ? (
                    <span className="text-zinc-400">not presented as authoritative</span>
                  ) : null}
                </div>
                <p className="mt-2 text-sm font-medium leading-snug">{pyq.questionText}</p>
                <div className="mt-2 grid gap-1 sm:grid-cols-2">
                  {pyq.options.map((o, i) => (
                    <p key={o.label} className="text-sm text-zinc-600 dark:text-zinc-400">
                      <span className="font-bold">{o.label}.</span> {o.text}
                      {i === pyq.correctIndex && pyq.verificationStatus === "VERIFIED" ? (
                        <span className="ml-1 text-emerald-600 dark:text-emerald-400">✓</span>
                      ) : null}
                    </p>
                  ))}
                </div>
                {pyq.explanation ? (
                  <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">{pyq.explanation}</p>
                ) : null}
                <p className="mt-2 text-xs text-zinc-400">
                  Source: {pyq.source}
                  {pyq.sourceUrl ? (
                    <>
                      {" "}·{" "}
                      <a
                        href={pyq.sourceUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-indigo-600 hover:underline dark:text-indigo-400"
                      >
                        link
                      </a>
                    </>
                  ) : null}
                </p>
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}
