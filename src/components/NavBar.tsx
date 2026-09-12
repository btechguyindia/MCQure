"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  AnalyticsIcon,
  BankIcon,
  BookmarkIcon,
  CheckIcon,
  ChevronDownIcon,
  CloseIcon,
  CogIcon,
  ClockIcon,
  HistoryIcon,
  MenuIcon,
  MockIcon,
  MonitorIcon,
  MoonIcon,
  MotivationIcon,
  PracticeIcon,
  ProgressIcon,
  PyqIcon,
  ReportsIcon,
  SparklesIcon,
  StudyIcon,
  SunIcon,
  LeaderboardIcon,
} from "@/components/icons";
import {
  APPEARANCES,
  THEME_COLORS,
  PICKABLE_THEMES,
  useTheme,
} from "@/components/theme";
import { GoModeControl } from "@/components/GoModeControl";
import { BoltIcon } from "@/components/icons";

interface MeResponse {
  ok: boolean;
  user?: {
    id: string;
    email: string;
    name: string | null;
    plan?: "BASIC" | "PREMIUM" | "PREMIUM_PLUS" | "ROYAL";
  } | null;
  message?: string;
}

function PlanChip({ plan }: { plan: NonNullable<MeResponse["user"]>["plan"] }) {
  if (!plan || plan === "BASIC") {
    return (
      <Link
        href="/pricing"
        className="inline-flex items-center gap-1 rounded-full border border-line bg-canvas px-2.5 py-1 text-[0.65rem] font-bold uppercase tracking-wider text-muted-fg transition-colors hover:border-brand hover:text-brand"
        title="Your plan — upgrade for more"
      >
        Free
      </Link>
    );
  }
  const label = plan === "PREMIUM_PLUS" ? "Premium+" : plan === "PREMIUM" ? "Premium" : "Royal";
  return (
    <Link
      href="/pricing"
      className="inline-flex items-center gap-1 rounded-full border border-brand/40 bg-brand-soft px-2.5 py-1 text-[0.65rem] font-bold uppercase tracking-wider text-brand transition-colors hover:bg-brand hover:text-on-brand"
      title={`Your plan: ${label} — manage`}
    >
      {plan === "ROYAL" ? <span aria-hidden>👑</span> : null}
      {label}
    </Link>
  );
}

interface NavLink {
  href: string;
  label: string;
  icon: React.ReactNode;
}

const PRACTICE_LINK: NavLink = { href: "/practice", label: "Practice", icon: <PracticeIcon /> };
const MOCK_LINK: NavLink = { href: "/mock", label: "Mock tests", icon: <MockIcon /> };
const STUDY_LINK: NavLink = { href: "/study", label: "Study notes", icon: <StudyIcon /> };

const PRIMARY_LINKS: NavLink[] = [
  PRACTICE_LINK,
  MOCK_LINK,
  STUDY_LINK,
  { href: "/pyq", label: "PYQ bank", icon: <PyqIcon /> },
];

const MORE_LINKS: NavLink[] = [
  { href: "/questions", label: "Question bank", icon: <BankIcon /> },
  { href: "/sources", label: "Sources", icon: <BookmarkIcon /> },
  { href: "/analytics", label: "Analytics", icon: <AnalyticsIcon /> },
  { href: "/preparation", label: "Progress", icon: <ProgressIcon /> },
  { href: "/leaderboard", label: "Leaderboard", icon: <LeaderboardIcon /> },
  { href: "/preparation/timetable", label: "Timetable", icon: <ClockIcon /> },
  { href: "/motivation", label: "Motivation", icon: <MotivationIcon /> },
  { href: "/mindset", label: "Mindset", icon: <SparklesIcon /> },
  { href: "/reports", label: "Reports", icon: <ReportsIcon /> },
  { href: "/bookmarks", label: "Saved", icon: <BookmarkIcon /> },
  { href: "/transactions", label: "Transactions", icon: <HistoryIcon /> },
  { href: "/pricing", label: "Plans & pricing", icon: <SparklesIcon /> },
  { href: "/settings", label: "Settings", icon: <CogIcon /> },
];

const MOBILE_GROUPS: Array<{ title: string; links: NavLink[] }> = [
  { title: "Learn", links: [PRACTICE_LINK, MOCK_LINK, STUDY_LINK] },
  {
    title: "Banks",
    links: [MORE_LINKS[0], PRIMARY_LINKS[3], MORE_LINKS[9]],
  },
  {
    title: "Insights",
    links: [MORE_LINKS[1], MORE_LINKS[2], MORE_LINKS[3], MORE_LINKS[4], MORE_LINKS[5], MORE_LINKS[6], MORE_LINKS[7], MORE_LINKS[8], MORE_LINKS[10], MORE_LINKS[11], MORE_LINKS[12]],
  },
];

function isActive(pathname: string, href: string): boolean {
  if (href === "/") return pathname === "/";
  return pathname === href || pathname.startsWith(`${href}/`);
}

export function NavBar() {
  const router = useRouter();
  const pathname = usePathname();
  const [user, setUser] = useState<MeResponse["user"] | null>(null);
  const [loaded, setLoaded] = useState(false);
  const { color, appearance, setColor, setAppearance, setAccountTier } = useTheme();
  const [open, setOpen] = useState(false);
  const [moreOpen, setMoreOpen] = useState(false);
  const [themeOpen, setThemeOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const moreRef = useRef<HTMLDivElement | null>(null);
  const themeRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    fetch("/api/auth/me")
      .then((r) => r.json() as Promise<MeResponse>)
      .then((data) => {
        const me = data.ok ? data.user ?? null : null;
        setUser(me);
        // Account-exclusive theme: a paid plan unlocks its identity, anything
        // else (logged out or BASIC) clears any stale override.
        const plan = me?.plan;
        setAccountTier(
          plan === "ROYAL" || plan === "PREMIUM_PLUS" || plan === "PREMIUM" ? plan : null
        );
      })
      .catch(() => setUser(null))
      .finally(() => setLoaded(true));
  }, [setAccountTier]);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // Close popovers on outside pointer-down or Escape. No full-screen
  // overlay: the triggering click must reach the element under it.
  useEffect(() => {
    if (!moreOpen && !themeOpen) return;
    const onPointerDown = (e: PointerEvent) => {
      const target = e.target as Node;
      if (moreOpen && moreRef.current && !moreRef.current.contains(target)) {
        setMoreOpen(false);
      }
      if (themeOpen && themeRef.current && !themeRef.current.contains(target)) {
        setThemeOpen(false);
      }
    };
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setMoreOpen(false);
        setThemeOpen(false);
      }
    };
    document.addEventListener("pointerdown", onPointerDown, true);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("pointerdown", onPointerDown, true);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [moreOpen, themeOpen]);

  async function logout() {
    setOpen(false);
    await fetch("/api/auth/logout", { method: "POST" });
    setUser(null);
    setAccountTier(null);
    router.push("/");
    router.refresh();
  }

  const linkClass = (active: boolean) =>
    `inline-flex items-center gap-2 rounded-xl px-3 py-2 text-sm font-medium transition-colors ${
      active
        ? "bg-brand-soft text-brand"
        : "text-muted-fg hover:bg-brand-soft hover:text-ink"
    }`;

  return (
    <header
      className={`sticky top-0 z-30 transition-[background-color,border-color,box-shadow] duration-300 ${
        scrolled
          ? "border-b border-line bg-raised shadow-soft backdrop-blur-xl"
          : "border-b border-transparent bg-transparent"
      }`}
    >
      <nav className="mx-auto flex h-16 w-full max-w-6xl items-center justify-between gap-2 px-4">
        <Link
          href="/"
          className="group flex shrink-0 items-center gap-2.5 tracking-tight"
          aria-label="MCQure home"
        >
          <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-brand to-accent text-sm font-black text-on-brand shadow-glow transition-transform duration-200 group-hover:scale-105">
            M
          </span>
          <span className="flex flex-col leading-none">
            <span className="text-lg font-bold">MCQure</span>
            <span className="hidden text-[0.6rem] font-semibold uppercase tracking-[0.18em] text-subtle-fg sm:block">
              Exam Command Center
            </span>
          </span>
        </Link>

        {/* Desktop navigation */}
        <div className="hidden items-center gap-1 lg:flex">
          {PRIMARY_LINKS.map((link) => (
            <Link key={link.href} href={link.href} className={linkClass(isActive(pathname, link.href))}>
              {link.icon}
              {link.label}
            </Link>
          ))}

          {/* More dropdown */}
          <div className="relative" ref={moreRef}>
            <button
              type="button"
              onClick={() => setMoreOpen((v) => !v)}
              aria-expanded={moreOpen}
              aria-haspopup="menu"
              className={`inline-flex items-center gap-2 rounded-xl px-3 py-2 text-sm font-medium transition-colors ${
                moreOpen || MORE_LINKS.some((l) => isActive(pathname, l.href))
                  ? "bg-brand-soft text-brand"
                  : "text-muted-fg hover:bg-brand-soft hover:text-ink"
              }`}
            >
              More
              <ChevronDownIcon
                className={`h-3.5 w-3.5 transition-transform duration-200 ${moreOpen ? "rotate-180" : ""}`}
              />
            </button>

            {moreOpen ? (
              <div
                role="menu"
                className="panel rise-in absolute right-0 top-full z-20 mt-2 w-56 p-1.5"
              >
                {MORE_LINKS.map((link) => (
                  <Link
                    key={link.href}
                    role="menuitem"
                    href={link.href}
                    onClick={() => setMoreOpen(false)}
                    className={`flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
                      isActive(pathname, link.href)
                        ? "bg-brand-soft text-brand"
                        : "text-muted-fg hover:bg-brand-soft hover:text-ink"
                    }`}
                  >
                    {link.icon}
                    {link.label}
                  </Link>
                ))}
              </div>
            ) : null}
          </div>
        </div>

        <div className="flex items-center gap-1.5">
          {/* Quick theme switcher */}
          <div className="relative" ref={themeRef}>
            <button
              type="button"
              onClick={() => setThemeOpen((v) => !v)}
              aria-label="Change theme"
              aria-expanded={themeOpen}
              aria-haspopup="menu"
              className="flex items-center gap-1.5 rounded-xl p-2 text-muted-fg transition-colors hover:bg-brand-soft hover:text-ink"
            >
              <span
                className="h-4 w-4 shrink-0 rounded-full ring-1 ring-line-strong"
                style={{
                  background: `linear-gradient(135deg, ${THEME_COLORS.find((t) => t.value === color)?.swatch[0]}, ${THEME_COLORS.find((t) => t.value === color)?.swatch[1]})`,
                }}
              />
              {appearance === "system" ? (
                <MonitorIcon />
              ) : appearance === "dark" ? (
                <MoonIcon />
              ) : (
                <SunIcon />
              )}
            </button>

            {themeOpen ? (
              <div
                role="menu"
                className="panel rise-in absolute right-0 top-full z-20 mt-2 w-64 p-2"
              >
                <p className="kicker px-2 pb-1.5">Color</p>
                {PICKABLE_THEMES.map((t) => (
                  <button
                    key={t.value}
                    type="button"
                    role="menuitemradio"
                    aria-checked={color === t.value}
                    onClick={() => {
                      setColor(t.value);
                      setThemeOpen(false);
                    }}
                    className={`flex w-full items-center gap-2.5 rounded-lg px-2 py-2 text-left text-sm font-medium transition-colors ${
                      color === t.value
                        ? "bg-brand-soft text-brand"
                        : "text-muted-fg hover:bg-brand-soft hover:text-ink"
                    }`}
                  >
                    <span
                      className="h-4 w-4 shrink-0 rounded-full ring-1 ring-line-strong"
                      style={{
                        background: `linear-gradient(135deg, ${t.swatch[0]}, ${t.swatch[1]} 60%, ${t.swatch[2]})`,
                      }}
                    />
                    <span className="min-w-0 flex-1 truncate">{t.label}</span>
                    {color === t.value ? <CheckIcon className="h-3.5 w-3.5" /> : null}
                  </button>
                ))}

                <div className="my-1.5 h-px bg-line" />

                <p className="kicker px-2 pb-1.5">Appearance</p>
                <div className="grid grid-cols-3 gap-1">
                  {APPEARANCES.map((a) => (
                    <button
                      key={a.value}
                      type="button"
                      role="menuitemradio"
                      aria-checked={appearance === a.value}
                      title={a.description}
                      onClick={() => {
                        setAppearance(a.value);
                        setThemeOpen(false);
                      }}
                      className={`flex flex-col items-center gap-1 rounded-lg px-1 py-2 text-[0.65rem] font-semibold transition-colors ${
                        appearance === a.value
                          ? "bg-brand-soft text-brand"
                          : "text-muted-fg hover:bg-brand-soft hover:text-ink"
                      }`}
                    >
                      {a.value === "system" ? (
                        <MonitorIcon />
                      ) : a.value === "dark" ? (
                        <MoonIcon />
                      ) : (
                        <SunIcon />
                      )}
                      {a.label}
                    </button>
                  ))}
                </div>

                <div className="my-1.5 h-px bg-line" />

                <p className="kicker px-2 pb-1.5">Go</p>
                <div className="flex items-center gap-2.5 px-2 py-1.5">
                  <BoltIcon className="h-4 w-4 text-muted-fg" />
                  <span className="min-w-0 flex-1 text-sm font-semibold text-muted-fg">Go</span>
                  <GoModeControl compact />
                </div>

                <Link
                  href="/settings"
                  onClick={() => setThemeOpen(false)}
                  className="mt-1.5 flex w-full items-center justify-center gap-1.5 rounded-lg px-2 py-2 text-xs font-semibold text-brand transition-colors hover:bg-brand-soft"
                >
                  <CogIcon className="h-3.5 w-3.5" />
                  Appearance settings
                </Link>
              </div>
            ) : null}
          </div>

          {/* Mobile hamburger */}
          <button
            type="button"
            onClick={() => setOpen((v) => !v)}
            aria-label={open ? "Close menu" : "Open menu"}
            aria-expanded={open}
            className="rounded-xl p-2.5 text-muted-fg transition-colors hover:bg-brand-soft hover:text-ink lg:hidden"
          >
            {open ? <CloseIcon /> : <MenuIcon />}
          </button>

          <div className="hidden items-center gap-2 lg:flex">
            {loaded && user ? (
              <>
                {user.plan ? <PlanChip plan={user.plan} /> : null}
                <span
                  className="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br from-brand to-accent text-xs font-bold text-on-brand"
                  title={user.name ?? user.email}
                >
                  {(user.name ?? user.email).charAt(0).toUpperCase()}
                </span>
                <button type="button" onClick={logout} className="btn btn-ghost btn-sm">
                  Sign out
                </button>
              </>
            ) : loaded ? (
              <Link href="/login" className="btn btn-primary btn-sm">
                Sign in
              </Link>
            ) : null}
          </div>
        </div>
      </nav>

      {/* Mobile / tablet menu */}
      {open ? (
        <div className="border-t border-line bg-raised backdrop-blur-xl lg:hidden">
          <nav className="mx-auto grid w-full max-w-6xl grid-cols-2 gap-x-3 gap-y-4 px-4 py-4 sm:grid-cols-3">
            {MOBILE_GROUPS.map((group) => (
              <div key={group.title} className="col-span-1">
                <p className="kicker mb-1.5">{group.title}</p>
                <div className="flex flex-col gap-0.5">
                  {group.links.map((link) => (
                    <Link
                      key={`${group.title}-${link.href}`}
                      href={link.href}
                      onClick={() => setOpen(false)}
                      className={`flex items-center gap-2.5 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors ${
                        isActive(pathname, link.href)
                          ? "bg-brand-soft text-brand"
                          : "text-muted-fg hover:bg-brand-soft hover:text-ink"
                      }`}
                    >
                      {link.icon}
                      {link.label}
                    </Link>
                  ))}
                </div>
              </div>
            ))}

            <div className="col-span-2 border-t border-line pt-3 sm:col-span-3">
              {loaded && user ? (
                <div className="flex items-center gap-3">
                  {user.plan ? <PlanChip plan={user.plan} /> : null}
                  <span
                    className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-brand to-accent text-xs font-bold text-on-brand"
                  >
                    {(user.name ?? user.email).charAt(0).toUpperCase()}
                  </span>
                  <span className="min-w-0 flex-1 truncate text-sm text-muted-fg">
                    {user.name ?? user.email}
                  </span>
                  <button type="button" onClick={logout} className="btn btn-secondary btn-sm">
                    Sign out
                  </button>
                </div>
              ) : loaded ? (
                <Link
                  href="/login"
                  onClick={() => setOpen(false)}
                  className="btn btn-primary w-full"
                >
                  Sign in
                </Link>
              ) : null}
            </div>
          </nav>
        </div>
      ) : null}
    </header>
  );
}
