import Link from "next/link";
import { redirect } from "next/navigation";
import type { Metadata } from "next";
import { getCurrentUser } from "@/lib/api";
import { MindsetCheckIn } from "@/components/MindsetCheckIn";
import { CheckIcon, FlagIcon, MotivationIcon, SparklesIcon, StudyIcon, TargetIcon } from "@/components/icons";

export const metadata: Metadata = { title: "Mindset — MCQure" };

const PILLARS = [
  {
    title: "Growth over ego",
    quote: "Every mistake is data, not identity.",
    practice: "After each set, log 1 error type (conceptual / careless / time) and fix the source, not the score.",
  },
  {
    title: "Process over outcome",
    quote: "You control effort and quality, not the rank list.",
    practice: "Set a process goal for the session: e.g. read every option, eliminate 2 before choosing.",
  },
  {
    title: "Consistency beats intensity",
    quote: "25 focused questions daily beats 200 crammed once.",
    practice: "Protect the daily minimum — even on low-energy days, do 10 and stop.",
  },
  {
    title: "Resilience is trained",
    quote: "Pressure is a skill, not a surprise.",
    practice: "Weekly mock in exam conditions: same time, same constraints, no pauses.",
  },
  {
    title: "Focus is a ritual",
    quote: "Attention is built, not found.",
    practice: "90-minute deep blocks: phone away, single tab, 5-minute reset between blocks.",
  },
];

const TOOLKIT = [
  {
    name: "Box breathing · 60s",
    steps: "Inhale 4s → Hold 4s → Exhale 4s → Hold 4s. Repeat 3 times before a mock or after a mistake.",
  },
  {
    name: "5-4-3-2-1 grounding · 45s",
    steps: "Name 5 things you see, 4 you touch, 3 you hear, 2 you smell, 1 you taste. Resets panic quickly.",
  },
  {
    name: "2-minute plan · before paper",
    steps: "Scan the paper: mark easy, medium, trap. Start with easy wins to build momentum.",
  },
];

const REFLECTIONS = [
  "What triggered self-doubt this week, and what did you do next?",
  "Which mistake taught you the most? What will you change in the next set?",
  "Where did you stay with the process even when the score was low?",
];

export default async function MindsetPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  return (
    <div className="flex flex-col gap-6">
      <header>
        <p className="kicker">Inner game</p>
        <h1 className="mt-2 flex items-center gap-2 text-2xl font-bold tracking-tight sm:text-3xl">
          <MotivationIcon className="h-6 w-6 text-brand" />
          Mindset
        </h1>
        <p className="mt-1 max-w-2xl text-sm text-muted-fg">
          Exam temperament is trainable — awareness, routines and reflection. Pair this with{" "}
          <Link href="/motivation" className="link">
            Motivation
          </Link>{" "}
          (streaks & achievements) and{" "}
          <Link href="/analytics" className="link">
            Analytics
          </Link>{" "}
          (progress).
        </p>
      </header>

      <MindsetCheckIn />

      <section className="card p-5 sm:p-6">
        <h2 className="section-title flex items-center gap-2">
          <TargetIcon className="h-4 w-4 text-brand" />
          Five pillars
        </h2>
        <div className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {PILLARS.map((p) => (
            <div key={p.title} className="rounded-xl border border-line bg-canvas p-4">
              <p className="text-sm font-semibold text-ink">{p.title}</p>
              <p className="mt-1 text-sm italic text-muted-fg">“{p.quote}”</p>
              <p className="mt-2 flex items-start gap-1.5 text-xs leading-relaxed text-subtle-fg">
                <CheckIcon className="mt-0.5 h-3 w-3 shrink-0 text-brand" />
                {p.practice}
              </p>
            </div>
          ))}
        </div>
      </section>

      <section className="card p-5 sm:p-6">
        <h2 className="section-title flex items-center gap-2">
          <StudyIcon className="h-4 w-4 text-brand" />
          Exam temperament toolkit
        </h2>
        <p className="mt-1 text-sm text-muted-fg">Three 1-minute resets you can use before, during and after a paper.</p>
        <ul className="mt-3 grid gap-3 sm:grid-cols-3">
          {TOOLKIT.map((t) => (
            <li key={t.name} className="rounded-xl border border-line bg-canvas p-4">
              <p className="text-sm font-semibold text-ink">{t.name}</p>
              <p className="mt-1 text-xs leading-relaxed text-muted-fg">{t.steps}</p>
            </li>
          ))}
        </ul>
      </section>

      <section className="card p-5 sm:p-6">
        <h2 className="section-title flex items-center gap-2">
          <FlagIcon className="h-4 w-4 text-warn" />
          Weekly reflection · 5 minutes
        </h2>
        <p className="mt-1 text-sm text-muted-fg">Every Sunday, answer one. Keep it in a notebook or notes app — the habit matters more than the tool.</p>
        <ul className="mt-3 list-disc space-y-2 pl-5 text-sm text-muted-fg marker:text-brand">
          {REFLECTIONS.map((q) => (
            <li key={q}>{q}</li>
          ))}
        </ul>
        <div className="mt-4 flex flex-wrap gap-2">
          <Link href="/practice" className="btn btn-primary">
            <SparklesIcon className="h-4 w-4" />
            Start a focused set
          </Link>
          <Link href="/study" className="btn btn-secondary">
            Review weak topics
          </Link>
        </div>
      </section>

      <section className="rounded-xl border border-dashed border-line bg-canvas/60 p-4">
        <p className="text-xs leading-relaxed text-muted-fg">
          <span className="font-semibold text-ink">Note:</span> Mindset is not therapy. If you feel persistent anxiety or low mood, talk to someone you trust or a professional. This page is a study aid, not a clinical tool.
        </p>
      </section>
    </div>
  );
}
