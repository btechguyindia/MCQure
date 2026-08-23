"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  AnalyticsIcon,
  HomeIcon,
  MockIcon,
  PracticeIcon,
  StudyIcon,
} from "@/components/icons";

const ITEMS = [
  { href: "/", label: "Home", icon: HomeIcon },
  { href: "/practice", label: "Practice", icon: PracticeIcon },
  { href: "/mock", label: "Mock", icon: MockIcon },
  { href: "/study", label: "Study", icon: StudyIcon },
  { href: "/analytics", label: "Stats", icon: AnalyticsIcon },
];

function isActive(pathname: string, href: string): boolean {
  if (href === "/") return pathname === "/";
  return pathname === href || pathname.startsWith(`${href}/`);
}

export function MobileNav() {
  const pathname = usePathname();

  return (
    <nav
      aria-label="Primary"
      className="fixed inset-x-0 bottom-0 z-30 border-t border-line bg-raised backdrop-blur-xl lg:hidden [padding-bottom:env(safe-area-inset-bottom)]"
    >
      <div className="mx-auto grid max-w-md grid-cols-5">
        {ITEMS.map((item) => {
          const active = isActive(pathname, item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              aria-current={active ? "page" : undefined}
              className={`flex flex-col items-center gap-1 py-2.5 text-[0.65rem] font-semibold transition-colors ${
                active ? "text-brand" : "text-subtle-fg hover:text-ink"
              }`}
            >
              <span
                className={`flex h-7 w-12 items-center justify-center rounded-full transition-colors ${
                  active ? "bg-brand-soft" : ""
                }`}
              >
                <item.icon className="h-5 w-5" />
              </span>
              {item.label}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
