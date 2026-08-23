import Link from "next/link";
import type { PyqListItem } from "@/lib/pyq";
import { VERIFICATION_STATUS_META } from "@/lib/pyq";
import { BankIcon, CheckIcon } from "@/components/icons";

interface PyqListProps {
  pyqs: PyqListItem[];
  years: number[];
  selectedYear?: number;
  total: number;
}

function statusBadgeClass(status: PyqListItem["verificationStatus"]): string {
  switch (status) {
    case "VERIFIED":
      return "badge badge-ok";
    case "PENDING":
    case "UNVERIFIED":
      return "badge badge-warn";
    default:
      return "badge badge-bad";
  }
}

export function PyqList({ pyqs, years, selectedYear, total }: PyqListProps) {
  return (
    <section>
      <div className="mb-3 flex flex-wrap items-center gap-1.5">
        <span className="section-title mr-1">Year:</span>
        <Link
          href="/pyq"
          className={
            selectedYear
              ? "chip"
              : "inline-flex items-center rounded-full border border-brand bg-brand-soft px-3 py-1 text-xs font-semibold text-brand"
          }
        >
          All
        </Link>
        {years.map((y) => (
          <Link
            key={y}
            href={`/pyq?year=${y}`}
            className={
              selectedYear === y
                ? "inline-flex items-center rounded-full border border-brand bg-brand-soft px-3 py-1 text-xs font-semibold text-brand"
                : "chip"
            }
          >
            {y}
          </Link>
        ))}
      </div>

      {pyqs.length === 0 ? (
        <div className="card p-8 text-center">
          <div className="mx-auto flex h-11 w-11 items-center justify-center rounded-full bg-brand-soft">
            <BankIcon className="h-5 w-5 text-brand" />
          </div>
          <p className="mt-3 font-semibold">
            {selectedYear ? `No PYQs recorded for ${selectedYear} yet.` : "No PYQs in the bank yet."}
          </p>
          <p className="mt-1 text-sm text-muted-fg">
            {total === 0
              ? "Verified previous-year questions appear here as authentic papers are transcribed and checked. No content is fabricated."
              : "Try a different year, or clear the filter to see everything."}
          </p>
        </div>
      ) : (
        <ul className="stagger flex flex-col gap-3">
          {pyqs.map((pyq) => {
            const meta = VERIFICATION_STATUS_META[pyq.verificationStatus];
            return (
              <li key={pyq.id} className="card p-4 sm:p-5">
                <div className="flex flex-wrap items-center gap-2 text-xs">
                  <span className="badge badge-neutral">{pyq.year}</span>
                  {pyq.paper ? <span className="font-semibold text-muted-fg">{pyq.paper}</span> : null}
                  <span className={statusBadgeClass(pyq.verificationStatus)}>
                    {pyq.verificationStatus === "VERIFIED" ? <CheckIcon className="h-3 w-3" /> : null}
                    {meta.label}
                  </span>
                  {pyq.verificationStatus !== "VERIFIED" ? (
                    <span className="text-subtle-fg">not presented as authoritative</span>
                  ) : null}
                </div>
                <p className="mt-2.5 text-sm font-medium leading-snug">{pyq.questionText}</p>
                <div className="mt-2 grid gap-1 sm:grid-cols-2">
                  {pyq.options.map((o, i) => (
                    <p key={o.label} className="text-sm text-muted-fg">
                      <span className="font-bold text-ink">{o.label}.</span> {o.text}
                      {i === pyq.correctIndex && pyq.verificationStatus === "VERIFIED" ? (
                        <span className="ml-1 inline-flex items-center align-middle text-ok">
                          <CheckIcon className="h-3.5 w-3.5" />
                        </span>
                      ) : null}
                    </p>
                  ))}
                </div>
                {pyq.explanation ? (
                  <p className="mt-2.5 border-l-2 border-line-strong pl-3 text-sm text-muted-fg">
                    {pyq.explanation}
                  </p>
                ) : null}
                <p className="mt-2.5 text-xs text-subtle-fg">
                  Source: {pyq.source}
                  {pyq.sourceUrl ? (
                    <>
                      {" "}·{" "}
                      <a
                        href={pyq.sourceUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="link"
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
