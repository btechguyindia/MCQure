import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/api";
import { getActiveExam } from "@/lib/practice";
import { listPyqs, listPyqYears } from "@/lib/pyq";
import { PyqSubmitForm } from "@/components/PyqSubmitForm";
import { PyqList } from "@/components/PyqList";

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
          <h1 className="text-2xl font-bold">🗂️ PYQ bank</h1>
          <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
            Genuine previous-year questions with disclosed provenance and verification status.
          </p>
        </div>
        <PyqSubmitForm />
      </header>

      <div className="rounded-2xl border border-zinc-200 bg-white p-5 dark:border-zinc-800 dark:bg-zinc-900">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-zinc-500">
          Integrity policy
        </h2>
        <ul className="mt-2 flex flex-col gap-1.5 text-sm text-zinc-600 dark:text-zinc-400">
          <li>
            • Only questions transcribed from an authentic paper are stored here — AI-generated
            content is <span className="font-semibold">never</span> filed as a PYQ.
          </li>
          <li>
            • Every entry discloses its source; submissions start{" "}
            <span className="font-semibold">Unverified</span> until checked against the paper copy.
          </li>
          <li>
            • To practice PYQ-style content now, use the{" "}
            <Link href="/practice" className="text-indigo-600 hover:underline dark:text-indigo-400">
              practice hub
            </Link>{" "}
            — all bundled questions are original and labeled honestly.
          </li>
        </ul>
      </div>

      <PyqList pyqs={pyqs} years={years} selectedYear={selectedYear} total={pyqs.length} />
    </div>
  );
}
