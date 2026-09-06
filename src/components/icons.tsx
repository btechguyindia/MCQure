import type { SVGProps } from "react";

type IconProps = SVGProps<SVGSVGElement>;

function Svg({ children, ...props }: IconProps) {
  return (
    <svg
      viewBox="0 0 24 24"
      width={16}
      height={16}
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="h-4 w-4 shrink-0"
      aria-hidden
      {...props}
    >
      {children}
    </svg>
  );
}

export function PracticeIcon(props: IconProps) {
  return (
    <Svg {...props}>
      <circle cx="12" cy="12" r="9" />
      <circle cx="12" cy="12" r="4" />
      <circle cx="12" cy="12" r="0.5" fill="currentColor" />
    </Svg>
  );
}

export function MockIcon(props: IconProps) {
  return (
    <Svg {...props}>
      <path d="M9 3h6a1 1 0 0 1 1 1v2H8V4a1 1 0 0 1 1-1Z" />
      <path d="M7 6H6a2 2 0 0 0-2 2v11a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8a2 2 0 0 0-2-2h-1" />
      <path d="M9 12h6M9 16h4" />
    </Svg>
  );
}

export function StudyIcon(props: IconProps) {
  return (
    <Svg {...props}>
      <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20V4a1 1 0 0 0-1-1H6.5A2.5 2.5 0 0 0 4 5.5v14Z" />
      <path d="M4 19.5A2.5 2.5 0 0 0 6.5 22H20v-5" />
    </Svg>
  );
}

export function BankIcon(props: IconProps) {
  return (
    <Svg {...props}>
      <path d="m12 2-10 5 10 5 10-5-10-5Z" />
      <path d="m2 12 10 5 10-5M2 17l10 5 10-5" />
    </Svg>
  );
}

export function PyqIcon(props: IconProps) {
  return (
    <Svg {...props}>
      <path d="M3 21h18M4 18h16V6l-8-3-8 3v12Z" />
      <path d="M9 10h.01M13 10h.01M9 14h.01M15 14h.01" />
    </Svg>
  );
}

export function ProgressIcon(props: IconProps) {
  return (
    <Svg {...props}>
      <path d="m3 17 6-6 4 4 8-8" />
      <path d="M21 7v5h-5" />
    </Svg>
  );
}

export function AnalyticsIcon(props: IconProps) {
  return (
    <Svg {...props}>
      <path d="M4 20V10M10 20V4M16 20v-7M20 20H2" />
    </Svg>
  );
}

export function MotivationIcon(props: IconProps) {
  return (
    <Svg {...props}>
      <path d="M12 2S7 6.5 7 11a5 5 0 0 0 10 0c0-4.5-5-9-5-9Z" />
      <path d="M9 13a3 3 0 0 0 6 0c0-2-3-5-3-5s-3 3-3 5Z" />
    </Svg>
  );
}

export function ReportsIcon(props: IconProps) {
  return (
    <Svg {...props}>
      <path d="M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8l-5-5Z" />
      <path d="M14 3v5h5M12 18v-6m0 6-3-3m3 3 3-3" />
    </Svg>
  );
}

export function SavedIcon(props: IconProps) {
  return (
    <Svg {...props}>
      <path d="M6 4a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v18l-6-4-6 4V4Z" />
    </Svg>
  );
}

export function HomeIcon(props: IconProps) {
  return (
    <Svg {...props}>
      <path d="m3 10 9-7 9 7v10a1 1 0 0 1-1 1h-5v-6h-6v6H4a1 1 0 0 1-1-1V10Z" />
    </Svg>
  );
}

export function MonitorIcon(props: IconProps) {
  return (
    <Svg {...props}>
      <rect x="2" y="4" width="20" height="13" rx="2" />
      <path d="M8 21h8m-4-4v4" />
    </Svg>
  );
}

export function CogIcon(props: IconProps) {
  return (
    <Svg {...props}>
      <circle cx="12" cy="12" r="3" />
      <path d="M19.4 15a1.7 1.7 0 0 0 .34 1.87l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.7 1.7 0 0 0-1.87-.34 1.7 1.7 0 0 0-1 1.55V21a2 2 0 1 1-4 0v-.09a1.7 1.7 0 0 0-1.11-1.55 1.7 1.7 0 0 0-1.87.34l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06A1.7 1.7 0 0 0 4.86 15a1.7 1.7 0 0 0-1.55-1H3a2 2 0 1 1 0-4h.09c.7 0 1.31-.44 1.55-1.11a1.7 1.7 0 0 0-.34-1.87l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06c.5.5 1.23.63 1.87.34H9c.62-.26 1.04-.84 1.04-1.5V3a2 2 0 1 1 4 0v.09c0 .66.42 1.24 1.05 1.5.61.26 1.32.14 1.81-.34l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06c-.48.49-.6 1.2-.34 1.81v.05c.26.63.84 1.05 1.5 1.05H21a2 2 0 1 1 0 4h-.09c-.66 0-1.24.42-1.51 1.01Z" />
    </Svg>
  );
}

export function SunIcon(props: IconProps) {
  return (
    <Svg {...props}>
      <circle cx="12" cy="12" r="4" />
      <path d="M12 2v2m0 16v2M4.9 4.9l1.4 1.4m11.4 11.4 1.4 1.4M2 12h2m16 0h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4" />
    </Svg>
  );
}

export function MoonIcon(props: IconProps) {
  return (
    <Svg {...props}>
      <path d="M21 12.8A9 9 0 1 1 11.2 3 7 7 0 0 0 21 12.8Z" />
    </Svg>
  );
}

export function MenuIcon(props: IconProps) {
  return (
    <Svg {...props}>
      <path d="M4 7h16M4 12h16M4 17h10" />
    </Svg>
  );
}

export function CloseIcon(props: IconProps) {
  return (
    <Svg {...props}>
      <path d="M18 6 6 18M6 6l12 12" />
    </Svg>
  );
}

export function ChevronDownIcon(props: IconProps) {
  return (
    <Svg {...props}>
      <path d="m6 9 6 6 6-6" />
    </Svg>
  );
}

export function ArrowRightIcon(props: IconProps) {
  return (
    <Svg {...props}>
      <path d="M5 12h14m-6-6 6 6-6 6" />
    </Svg>
  );
}

export function CheckIcon(props: IconProps) {
  return (
    <Svg {...props}>
      <path d="M20 6 9 17l-5-5" />
    </Svg>
  );
}

export function XIcon(props: IconProps) {
  return (
    <Svg {...props}>
      <path d="M18 6 6 18M6 6l12 12" />
    </Svg>
  );
}

export function ClockIcon(props: IconProps) {
  return (
    <Svg {...props}>
      <circle cx="12" cy="12" r="9" />
      <path d="M12 7v5l3 3" />
    </Svg>
  );
}

export function FlagIcon(props: IconProps) {
  return (
    <Svg {...props}>
      <path d="M5 22V4c4-2 6 2 10 0v9c-4 2-6-2-10 0" />
    </Svg>
  );
}

export function BookmarkIcon(props: IconProps) {
  return (
    <Svg {...props}>
      <path d="M6 4a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v18l-6-4-6 4V4Z" />
    </Svg>
  );
}

export function SparklesIcon(props: IconProps) {
  return (
    <Svg {...props}>
      <path d="M12 3l1.9 5.1L19 10l-5.1 1.9L12 17l-1.9-5.1L5 10l5.1-1.9L12 3Z" />
      <path d="M19 15l.9 2.1L22 18l-2.1.9L19 21l-.9-2.1L16 18l2.1-.9L19 15Z" />
    </Svg>
  );
}

export function TargetIcon(props: IconProps) {
  return (
    <Svg {...props}>
      <circle cx="12" cy="12" r="9" />
      <circle cx="12" cy="12" r="4" />
      <circle cx="12" cy="12" r="0.5" fill="currentColor" />
    </Svg>
  );
}

export function LeaderboardIcon(props: IconProps) {
  return (
    <Svg {...props}>
      <path d="M8 21h8m-4-5v5" />
      <path d="M8 4h8a4 4 0 0 1 0 8H8a4 4 0 0 1 0-8Z" />
      <path d="m7 6-2.5-1.5L2 7l3.5 4" />
      <path d="m9 15.5 3-10" />
      <path d="M17 6l2.5-1.5L22 7l-3.5 4" />
    </Svg>
  );
}

export function CrownIcon(props: IconProps) {
  return (
    <Svg {...props}>
      <path d="M11.562 3.266a.5.5 0 0 1 .876 0l2.952 5.604a1 1 0 0 0 1.516.294l4.279-3.664a.5.5 0 0 1 .798.52l-2.834 10.246a1 1 0 0 1-.956.734H5.808a1 1 0 0 1-.957-.734L2.017 6.169a.5.5 0 0 1 .798-.52l4.28 3.665a1 1 0 0 0 1.515-.294Z" />
      <path d="M5 21h14" />
    </Svg>
  );
}

export function FlameIcon(props: IconProps) {
  return (
    <Svg {...props}>
      <path d="M8.5 14.5A2.5 2.5 0 0 0 11 12c0-1.38-.5-2-1-3-1.072-2.143-.224-4.054 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 1 1-14 0c0-1.153.433-2.294 1-3a2.5 2.5 0 0 0 2.5 2.5Z" />
    </Svg>
  );
}

export function LockIcon(props: IconProps) {
  return (
    <Svg {...props}>
      <rect x="5" y="11" width="14" height="9" rx="2" />
      <path d="M8 11V7.5a4 4 0 0 1 8 0V11" />
    </Svg>
  );
}

export function HistoryIcon(props: IconProps) {
  return (
    <Svg {...props}>
      <path d="M3 12a9 9 0 1 0 3-6.7" />
      <path d="M3 4v4h4" />
      <path d="M12 7v5l3 2" />
    </Svg>
  );
}
