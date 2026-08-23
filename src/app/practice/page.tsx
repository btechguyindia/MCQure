import type { Metadata } from "next";
import { PracticeLauncher } from "@/components/PracticeLauncher";
import { CustomPracticeForm } from "@/components/CustomPracticeForm";
import { TargetIcon } from "@/components/icons";

export const metadata: Metadata = { title: "Practice — MCQure" };

const MODES = [
  {
    key: "quick",
    title: "Quick Practice",
    description: "10 questions. A fast warm-up.",
    count: 10,
  },
  {
    key: "standard",
    title: "Standard Practice",
    description: "25 questions. The daily workout.",
    count: 25,
  },
  {
    key: "deep",
    title: "Deep Practice",
    description: "50 questions. Serious focused training.",
    count: 50,
  },
  {
    key: "marathon",
    title: "Marathon",
    description: "100+ questions. Full-length endurance run.",
    count: 100,
  },
  {
    key: "smart",
    title: "Smart Practice",
    description: "20 questions. Prioritizes your weak topics automatically.",
    count: 20,
  },
] as const;

export default function PracticePage() {
  return (
    <div className="flex flex-col gap-6">
      <header>
        <p className="kicker">Practice modes</p>
        <h1 className="mt-2 flex items-center gap-2.5 text-2xl font-bold tracking-tight">
          <TargetIcon className="h-6 w-6 text-brand" />
          Practice
        </h1>
        <p className="mt-1 text-sm text-muted-fg">
          Scoring: <strong>+1</strong> correct · <strong>-0.25</strong> incorrect ·{" "}
          <strong>0</strong> unattempted
        </p>
      </header>

      <section className="stagger grid gap-4 sm:grid-cols-2">
        {MODES.map((mode) => (
          <PracticeLauncher
            key={mode.key}
            mode={mode.key}
            title={mode.title}
            description={mode.description}
          />
        ))}
        <PracticeLauncher
          mode="review"
          title="Review Mistakes"
          description="Re-attempt the questions you got wrong or skipped."
        />
      </section>

      <CustomPracticeForm />
    </div>
  );
}
