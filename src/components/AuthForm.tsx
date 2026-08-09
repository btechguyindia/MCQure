"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";

interface AuthFormProps {
  mode: "login" | "register";
}

export function AuthForm({ mode }: AuthFormProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const next = searchParams.get("next") ?? "/";

  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const isLogin = mode === "login";

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      const res = await fetch(`/api/auth/${isLogin ? "login" : "register"}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(isLogin ? { email, password } : { email, name, password }),
      });
      const data = (await res.json()) as {
        ok: boolean;
        message?: string;
        details?: Record<string, unknown>;
      };
      if (!res.ok || !data.ok) {
        setError(data.message ?? "Something went wrong");
        setSubmitting(false);
        return;
      }
      router.push(next.startsWith("/") && !next.startsWith("//") ? next : "/");
      router.refresh();
    } catch {
      setError("Network error. Please try again.");
      setSubmitting(false);
    }
  }

  return (
    <div className="mx-auto mt-8 w-full max-w-sm">
      <div className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
        <h1 className="text-xl font-bold">
          {isLogin ? "Sign in" : "Create your account"}
        </h1>
        <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
          {isLogin
            ? "Welcome back. Pick up where you left off."
            : "Start your DSSSB TGT Computer Science preparation."}
        </p>

        <form onSubmit={onSubmit} className="mt-6 flex flex-col gap-4">
          {!isLogin ? (
            <label className="flex flex-col gap-1.5 text-sm font-medium">
              Name
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                autoComplete="name"
                className="rounded-lg border border-zinc-300 px-3 py-2.5 text-sm outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 dark:border-zinc-700 dark:bg-zinc-800 dark:focus:ring-indigo-900"
              />
            </label>
          ) : null}

          <label className="flex flex-col gap-1.5 text-sm font-medium">
            Email
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              autoComplete="email"
              className="rounded-lg border border-zinc-300 px-3 py-2.5 text-sm outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 dark:border-zinc-700 dark:bg-zinc-800 dark:focus:ring-indigo-900"
            />
          </label>

          <label className="flex flex-col gap-1.5 text-sm font-medium">
            Password
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={isLogin ? 1 : 8}
              autoComplete={isLogin ? "current-password" : "new-password"}
              className="rounded-lg border border-zinc-300 px-3 py-2.5 text-sm outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 dark:border-zinc-700 dark:bg-zinc-800 dark:focus:ring-indigo-900"
            />
          </label>

          {error ? (
            <p role="alert" className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700 dark:bg-red-950/60 dark:text-red-300">
              {error}
            </p>
          ) : null}

          <button
            type="submit"
            disabled={submitting}
            className="rounded-xl bg-indigo-600 py-2.5 text-sm font-semibold text-white hover:bg-indigo-500 disabled:opacity-60"
          >
            {submitting ? "Please wait…" : isLogin ? "Sign in" : "Create account"}
          </button>
        </form>

        <p className="mt-5 text-center text-sm text-zinc-500 dark:text-zinc-400">
          {isLogin ? (
            <>
              New to MCQure?{" "}
              <Link href="/register" className="font-semibold text-indigo-600 dark:text-indigo-400">
                Create an account
              </Link>
            </>
          ) : (
            <>
              Already have an account?{" "}
              <Link href="/login" className="font-semibold text-indigo-600 dark:text-indigo-400">
                Sign in
              </Link>
            </>
          )}
        </p>
      </div>
    </div>
  );
}
