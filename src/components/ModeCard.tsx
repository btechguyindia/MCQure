import Link from "next/link";
import type { ComponentType, SVGProps } from "react";
import {
  AnalyticsIcon,
  ArrowRightIcon,
  BankIcon,
  MockIcon,
  MotivationIcon,
  PracticeIcon,
  ProgressIcon,
  PyqIcon,
  ReportsIcon,
  StudyIcon,
} from "@/components/icons";

interface ModeCardProps {
  icon: ComponentType<SVGProps<SVGSVGElement>>;
  title: string;
  description: string;
  href: string;
  badge?: string;
  tone?: "brand" | "accent";
}

const TONES: Record<"brand" | "accent", string> = {
  brand: "bg-brand-soft text-brand",
  accent: "bg-accent-soft text-accent",
};

export function ModeCard({ icon: Icon, title, description, href, badge, tone = "brand" }: ModeCardProps) {
  return (
    <Link
      href={href}
      className="card card-hover group relative flex flex-col gap-3 p-5"
    >
      <div className="flex items-start justify-between">
        <span
          className={`flex h-11 w-11 items-center justify-center rounded-2xl transition-transform duration-200 group-hover:scale-105 ${TONES[tone]}`}
        >
          <Icon className="h-5 w-5" />
        </span>
        {badge ? <span className="badge badge-brand">{badge}</span> : null}
      </div>
      <h2 className="text-base font-bold tracking-tight">{title}</h2>
      <p className="text-sm leading-relaxed text-muted-fg">{description}</p>
      <span className="mt-auto inline-flex items-center gap-1.5 pt-1 text-sm font-semibold text-brand opacity-0 transition-opacity duration-200 group-hover:opacity-100">
        Open
        <ArrowRightIcon className="h-3.5 w-3.5 transition-transform duration-200 group-hover:translate-x-0.5" />
      </span>
    </Link>
  );
}

export function ModeCardGrid() {
  const cards: ModeCardProps[] = [
    {
      icon: PracticeIcon,
      title: "Practice",
      description: "Adaptive MCQ sessions — quick drills to 100-question marathons, instant feedback on every answer.",
      href: "/practice",
      tone: "brand",
      badge: "Core",
    },
    {
      icon: MockIcon,
      title: "Mock tests",
      description: "Blueprint-driven sectional and full mocks under real exam timing, with mock-vs-practice comparison.",
      href: "/mock",
      tone: "accent",
    },
    {
      icon: StudyIcon,
      title: "Study notes",
      description: "Concise exam-focused concepts, mnemonics, traps and one-page revisions for every topic.",
      href: "/study",
      tone: "brand",
    },
    {
      icon: AnalyticsIcon,
      title: "Analytics",
      description: "Accuracy trends, per-subject strength, error types, confidence analysis and your mistake book.",
      href: "/analytics",
      tone: "accent",
    },
    {
      icon: ProgressIcon,
      title: "Progress",
      description: "Mastery tracking across the syllabus — completion states, revision queue and a daily plan.",
      href: "/preparation",
      tone: "brand",
      badge: "Live",
    },
    {
      icon: BankIcon,
      title: "Question bank",
      description: "Browse every question by subject, topic, difficulty and provenance with full-text search.",
      href: "/questions",
      tone: "accent",
    },
    {
      icon: PyqIcon,
      title: "PYQ bank",
      description: "Genuine previous-year questions with mandatory source disclosure and a verification workflow.",
      href: "/pyq",
      tone: "brand",
    },
    {
      icon: MotivationIcon,
      title: "Motivation",
      description: "Goals, streaks, achievements and daily targets that keep the preparation loop alive.",
      href: "/motivation",
      tone: "accent",
    },
    {
      icon: ReportsIcon,
      title: "Reports",
      description: "Weekly and monthly aggregates with CSV/JSON export for offline review.",
      href: "/reports",
      tone: "brand",
    },
  ];

  return (
    <div className="stagger grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {cards.map((c) => (
        <ModeCard key={c.href} {...c} />
      ))}
    </div>
  );
}
