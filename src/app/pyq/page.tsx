import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/api";
import { getActiveExam } from "@/lib/practice";
import { listPyqs, listPyqYears } from "@/lib/pyq";
import { PyqSubmitForm } from "@/components/PyqSubmitForm";
import { PyqList } from "@/components/PyqList";
import { PyqIcon } from "@/components/icons";

export const metadata = { title: "PYQ Bank — MCQure" };

export default async function PyqPage({ searchParams }: { searchParams: Promise<{ year?: string }> }) {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const exam = await getActiveExam();
  if (!exam) redirect("/practice");

  const { year } = await searchParams;
  const selectedYear = year ? Number(year) : undefined;

  const [pyqs, years] = await Promise.all([
    listPyqs(exam.id, selectedYear && !Number.isNaN(selectedYear) ? selectedYear : undefined),
    listPyqYears(exam.id),
  ]);

  return (
    <div className="flex flex-col gap-6">
      <header className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="kicker">
            <PyqIcon /> Previous-year papers
          </p>
          <h1 className="mt-2 text-2xl font-bold tracking-tight sm:text-3xl">PYQ bank</h1>
          <p className="mt-2 max-w-2xl text-sm text-muted-fg">
            Genuine previous-year questions with disclosed provenance and verification status.
          </p>
        </div>
        <PyqSubmitForm />
      </header>

      <section className="card p-5 sm:p-6">
        <h2 className="section-title">Integrity policy</h2>
        <ul className="mt-3 list-disc space-y-1.5 pl-5 text-sm text-muted-fg marker:text-brand">
          <li>
            Only questions transcribed from an authentic paper are stored here — AI-generated
            content is <span className="font-semibold text-ink">never</span> filed as a PYQ.
          </li>
          <li>
            Every entry discloses its source; submissions start{" "}
            <span className="font-semibold text-ink">Unverified</span> until checked against the paper copy.
          </li>
          <li>
            To practice PYQ-style content now, use the{" "}
            <Link href="/practice" className="link">
              practice hub
            </Link>{" "}
            — all bundled questions are original and labeled honestly.
          </li>
        </ul>
      </section>

      <PyqList pyqs={pyqs} years={years} selectedYear={selectedYear} total={pyqs.length} />
    </div>
  );
}
