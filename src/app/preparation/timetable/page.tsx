import Link from "next/link";
import { redirect } from "next/navigation";
import type { Metadata } from "next";
import { getCurrentUser } from "@/lib/api";
import { getTimetableView, listTimetables, parseSlots } from "@/lib/timetable";
import { ProgressIcon } from "@/components/icons";
import { TimetableManager } from "@/components/TimetableManager";

export const metadata: Metadata = { title: "Study timetable — MCQure" };

export default async function TimetablePage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const [rows, view] = await Promise.all([listTimetables(user.id), getTimetableView(user.id)]);

  const timetables = rows.map((row) => ({
    id: row.id,
    name: row.name,
    cycle: row.cycle,
    targetQuestions: row.targetQuestions,
    slots: parseSlots(row.slots),
    isActive: row.isActive,
  }));

  return (
    <div className="flex flex-col gap-6">
      <header>
        <nav className="flex items-center gap-1.5">
          <Link href="/preparation" className="chip transition-colors hover:border-brand hover:text-brand">
            Preparation
          </Link>
        </nav>
        <p className="kicker mt-4">Command center</p>
        <h1 className="mt-2 flex items-center gap-2 text-2xl font-bold tracking-tight sm:text-3xl">
          <ProgressIcon className="h-6 w-6 text-brand" />
          Study timetable
        </h1>
        <p className="mt-1 max-w-2xl text-sm text-muted-fg">
          Plan your week as JSON — weekly, bi-weekly or monthly cycles with a question target per
          cycle. The active schedule shows today&apos;s blocks and how much of the current target
          you have already answered.
        </p>
      </header>

      <TimetableManager initialTimetables={timetables} initialView={view} />
    </div>
  );
}
