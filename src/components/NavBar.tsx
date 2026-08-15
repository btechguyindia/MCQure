"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

interface MeResponse {
  ok: boolean;
  user?: { id: string; email: string; name: string | null } | null;
  message?: string;
}

interface NavLink {
  href: string;
  label: string;
  accent?: boolean;
}

const NAV_LINKS: NavLink[] = [
  { href: "/", label: "Home" },
  { href: "/practice", label: "Practice" },
  { href: "/mock", label: "Mock" },
  { href: "/study", label: "Study" },
  { href: "/motivation", label: "Motivation" },
  { href: "/analytics", label: "Analytics" },
  { href: "/reports", label: "Reports" },
  { href: "/preparation", label: "Progress", accent: true },
];

export function NavBar() {
  const router = useRouter();
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
  }

  const linkClass =
    "rounded-lg px-3 py-2 text-sm font-medium text-zinc-600 hover:bg-zinc-100 dark:text-zinc-300 dark:hover:bg-zinc-800";
  const accentClass =
    "rounded-lg px-3 py-2 text-sm font-medium text-indigo-600 hover:bg-indigo-50 dark:text-indigo-400 dark:hover:bg-indigo-950/40";

  return (
    <header className="sticky top-0 z-20 border-b border-zinc-200 bg-background/80 backdrop-blur dark:border-zinc-800">
      <nav className="mx-auto flex h-14 w-full max-w-3xl items-center justify-between px-4">
        <Link href="/" className="flex items-baseline gap-1 font-bold tracking-tight">
          <span className="text-lg">MCQure</span>
          <span className="hidden text-xs font-medium text-zinc-500 sm:inline dark:text-zinc-400">
            exam command center
          </span>
        </Link>

        {/* Desktop navigation */}
        <div className="hidden items-center gap-1 sm:flex sm:gap-2">
          {NAV_LINKS.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className={link.accent ? accentClass : linkClass}
            >
              {link.label}
            </Link>
          ))}
          <button
            type="button"
            onClick={toggleTheme}
            aria-label="Toggle theme"
            className="rounded-lg px-2.5 py-2 text-sm text-zinc-600 hover:bg-zinc-100 dark:text-zinc-300 dark:hover:bg-zinc-800"
          >
            {theme === "dark" ? "☀" : "☾"}
          </button>

          {loaded && user ? (
            <button
              type="button"
              onClick={logout}
              className="rounded-lg px-3 py-2 text-sm font-medium text-zinc-600 hover:bg-zinc-100 dark:text-zinc-300 dark:hover:bg-zinc-800"
            >
              Sign out
            </button>
          ) : loaded ? (
            <Link
              href="/login"
              className="rounded-lg bg-indigo-600 px-3 py-2 text-sm font-semibold text-white hover:bg-indigo-500"
            >
              Sign in
            </Link>
          ) : null}
        </div>

        {/* Mobile controls */}
        <div className="flex items-center gap-1 sm:hidden">
          <button
            type="button"
            onClick={toggleTheme}
            aria-label="Toggle theme"
            className="rounded-lg px-2.5 py-2 text-sm text-zinc-600 hover:bg-zinc-100 dark:text-zinc-300 dark:hover:bg-zinc-800"
          >
            {theme === "dark" ? "☀" : "☾"}
          </button>
          <button
            type="button"
            onClick={() => setOpen((v) => !v)}
            aria-label={open ? "Close menu" : "Open menu"}
            aria-expanded={open}
            className="rounded-lg px-2.5 py-2 text-lg leading-none text-zinc-600 hover:bg-zinc-100 dark:text-zinc-300 dark:hover:bg-zinc-800"
          >
            {open ? "✕" : "☰"}
          </button>
        </div>
      </nav>

      {/* Mobile menu */}
      {open ? (
        <div className="border-t border-zinc-200 bg-background sm:hidden dark:border-zinc-800">
          <nav className="mx-auto flex w-full max-w-3xl flex-col px-4 py-3">
            {NAV_LINKS.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setOpen(false)}
                className={link.accent ? accentClass : linkClass}
              >
                {link.label}
              </Link>
            ))}
            <div className="mt-2 border-t border-zinc-100 pt-2 dark:border-zinc-800">
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
                  className="block rounded-lg bg-indigo-600 px-3 py-2 text-center text-sm font-semibold text-white hover:bg-indigo-500"
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
