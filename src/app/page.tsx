import Link from "next/link";
import { getCurrentUser } from "@/lib/api";
import { ModeCardGrid } from "@/components/ModeCard";
import { TodayStatus } from "@/components/TodayStatus";
import { AiStatusBadge } from "@/components/AiStatusBadge";

export default async function HomePage() {
  const user = await getCurrentUser();
  const authed = user !== null;

  return (
    <div className="flex flex-col gap-6">
      <section className="rounded-2xl border border-zinc-200 bg-gradient-to-br from-indigo-50 to-white p-6 dark:border-zinc-800 dark:from-indigo-950/40 dark:to-zinc-900">
        <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">
          {authed ? `Welcome back${user?.name ? `, ${user.name}` : ""} 👋` : "Your personal AI exam command center"}
        </h1>
        <p className="mt-2 max-w-xl text-sm leading-relaxed text-zinc-600 dark:text-zinc-400">
          {authed
            ? "Practice adaptively, fix what you keep getting wrong, and watch your readiness grow."
            : "MCQure turns your DSSSB TGT Computer Science preparation into one connected loop: practice, learn from mistakes, and improve every day."}
        </p>
        {!authed ? (
          <div className="mt-4 flex flex-wrap gap-3">
            <Link
              href="/register"
              className="rounded-xl bg-indigo-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-indigo-500"
            >
              Get started free
            </Link>
            <Link
              href="/login"
              className="rounded-xl border border-zinc-300 px-5 py-2.5 text-sm font-semibold hover:bg-zinc-100 dark:border-zinc-700 dark:hover:bg-zinc-800"
            >
              Sign in
            </Link>
          </div>
        ) : null}
      </section>

      <ModeCardGrid />

      {authed ? (
        <>
          <TodayStatus />
          <AiStatusBadge />
        </>
      ) : null}
    </div>
  );
}
