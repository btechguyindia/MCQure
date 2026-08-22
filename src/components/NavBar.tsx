"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";

interface MeResponse {
  ok: boolean;
  user?: { id: string; email: string; name: string | null } | null;
  message?: string;
}

interface NavLink {
  href: string;
  label: string;
}

const NAV_LINKS: NavLink[] = [
  { href: "/", label: "Home" },
  { href: "/practice", label: "Practice" },
  { href: "/mock", label: "Mock" },
  { href: "/study", label: "Study" },
  { href: "/questions", label: "Bank" },
  { href: "/bookmarks", label: "Saved" },
  { href: "/pyq", label: "PYQ" },
  { href: "/analytics", label: "Analytics" },
  { href: "/motivation", label: "Motivation" },
  { href: "/reports", label: "Reports" },
  { href: "/preparation", label: "Progress" },
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
  const [theme, setTheme] = useState<"light" | "dark">("light");
  const [open, setOpen] = useState(false);

  useEffect(() => {
    fetch("/api/auth/me")
      .then((r) => r.json() as Promise<MeResponse>)
      .then((data) => {
        setUser(data.ok ? data.user ?? null : null);
      })
      .catch(() => setUser(null))
      .finally(() => setLoaded(true));

    // Sync with the theme applied by ThemeScript before hydration. Deferred so
    // the effect never calls setState synchronously.
    Promise.resolve().then(() =>
      setTheme(document.documentElement.classList.contains("dark") ? "dark" : "light")
    );
  }, []);

  // Mobile/tablet menu links close the menu via onClick, so no route-change
  // effect is needed here.

  function toggleTheme() {
    const next = theme === "dark" ? "light" : "dark";
    setTheme(next);
    document.documentElement.classList.toggle("dark", next === "dark");
    localStorage.setItem("mcqure-theme", next);
  }

  async function logout() {
    setOpen(false);
    await fetch("/api/auth/logout", { method: "POST" });
    setUser(null);
    router.push("/");
    router.refresh();
  }

  const linkClass = (active: boolean) =>
    `rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
      active
        ? "bg-indigo-50 text-indigo-700 dark:bg-indigo-950/60 dark:text-indigo-300"
        : "text-zinc-600 hover:bg-zinc-100 dark:text-zinc-300 dark:hover:bg-zinc-800"
    }`;

  return (
    <header className="sticky top-0 z-20 border-b border-zinc-200 bg-background/80 backdrop-blur dark:border-zinc-800">
      <nav className="mx-auto flex h-16 w-full max-w-6xl items-center justify-between gap-2 px-4">
        <Link
          href="/"
          className="flex shrink-0 items-center gap-2 font-bold tracking-tight"
          aria-label="MCQure home"
        >
          <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-500 to-violet-600 text-sm font-black text-white shadow-sm">
            M
          </span>
          <span className="text-lg">MCQure</span>
          <span className="hidden text-xs font-medium text-zinc-500 lg:inline dark:text-zinc-400">
            exam command center
          </span>
        </Link>

        {/* Desktop navigation */}
        <div className="hidden items-center gap-0.5 lg:flex">
          {NAV_LINKS.map((link) => (
            <Link key={link.href} href={link.href} className={linkClass(isActive(pathname, link.href))}>
              {link.label}
            </Link>
          ))}
        </div>

        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={toggleTheme}
            aria-label="Toggle theme"
            className="rounded-lg px-2.5 py-2 text-base transition-colors hover:bg-zinc-100 dark:text-zinc-300 dark:hover:bg-zinc-800"
          >
            {theme === "dark" ? "☀️" : "🌙"}
          </button>

          {/* Tablet overflow menu trigger */}
          <button
            type="button"
            onClick={() => setOpen((v) => !v)}
            aria-label={open ? "Close menu" : "Open menu"}
            aria-expanded={open}
            className="hidden rounded-lg px-2.5 py-2 text-lg leading-none text-zinc-600 transition-colors hover:bg-zinc-100 sm:flex lg:hidden dark:text-zinc-300 dark:hover:bg-zinc-800"
          >
            {open ? "✕" : "☰"}
          </button>

          {/* Mobile hamburger */}
          <button
            type="button"
            onClick={() => setOpen((v) => !v)}
            aria-label={open ? "Close menu" : "Open menu"}
            aria-expanded={open}
            className="rounded-lg px-2.5 py-2 text-lg leading-none text-zinc-600 transition-colors hover:bg-zinc-100 sm:hidden dark:text-zinc-300 dark:hover:bg-zinc-800"
          >
            {open ? "✕" : "☰"}
          </button>

          <div className="hidden items-center lg:flex">
            {loaded && user ? (
              <>
                <span
                  className="max-w-[10rem] truncate px-2 text-xs font-medium text-zinc-500 dark:text-zinc-400"
                  title={user.name ?? user.email}
                >
                  {user.name ?? user.email}
                </span>
                <button type="button" onClick={logout} className="btn btn-ghost !px-3 !py-2 text-sm">
                  Sign out
                </button>
              </>
            ) : loaded ? (
              <Link href="/login" className="btn btn-primary !px-4 !py-2 text-sm">
                Sign in
              </Link>
            ) : null}
          </div>
        </div>
      </nav>

      {/* Dropdown menu (tablet + mobile) */}
      {open ? (
        <div className="border-t border-zinc-200 bg-background lg:hidden dark:border-zinc-800">
          <nav className="mx-auto grid w-full max-w-6xl grid-cols-2 gap-1 px-4 py-3 sm:grid-cols-3">
            {NAV_LINKS.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setOpen(false)}
                className={linkClass(isActive(pathname, link.href))}
              >
                {link.label}
              </Link>
            ))}
            <div className="col-span-2 mt-2 border-t border-zinc-100 pt-2 sm:col-span-3 dark:border-zinc-800">
              {loaded && user ? (
                <button
                  type="button"
                  onClick={logout}
                  className="w-full rounded-lg px-3 py-2 text-left text-sm font-medium text-zinc-600 hover:bg-zinc-100 dark:text-zinc-300 dark:hover:bg-zinc-800"
                >
                  Sign out ({user.name ?? user.email})
                </button>
              ) : loaded ? (
                <Link
                  href="/login"
                  onClick={() => setOpen(false)}
                  className="block rounded-lg bg-indigo-600 px-3 py-2.5 text-center text-sm font-semibold text-white hover:bg-indigo-500"
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
