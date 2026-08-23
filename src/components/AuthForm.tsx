"use client";

import { useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { ArrowRightIcon, SparklesIcon } from "@/components/icons";

interface AuthFormProps {
  mode: "login" | "register";
}

export function AuthForm({ mode }: AuthFormProps) {
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
      // Full navigation: guarantees the fresh session cookie is picked up by
      // server components, even if the client router is in a bad state.
      window.location.assign(next.startsWith("/") && !next.startsWith("//") ? next : "/");
    } catch {
      setError("Network error. Please try again.");
      setSubmitting(false);
    }
  }

  return (
    <div className="relative mx-auto mt-6 w-full max-w-sm sm:mt-10">
      <div className="aurora opacity-70" aria-hidden />
      <div className="card rise-in relative p-6 sm:p-8">
        <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-brand-soft text-brand">
          <SparklesIcon className="h-5 w-5" />
        </span>
        <h1 className="mt-4 text-xl font-bold tracking-tight">
          {isLogin ? "Sign in" : "Create your account"}
        </h1>
        <p className="mt-1 text-sm text-muted-fg">
          {isLogin
            ? "Welcome back. Pick up where you left off."
            : "Start your DSSSB TGT Computer Science preparation."}
        </p>

        <form onSubmit={onSubmit} className="mt-6 flex flex-col gap-4">
          {!isLogin ? (
            <div>
              <label htmlFor="name" className="label">Name</label>
              <input
                id="name"
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                autoComplete="name"
                placeholder="Your name"
                className="input"
              />
            </div>
          ) : null}

          <div>
            <label htmlFor="email" className="label">Email</label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              autoComplete="email"
              placeholder="you@example.com"
              className="input"
            />
          </div>

          <div>
            <label htmlFor="password" className="label">Password</label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={isLogin ? 1 : 8}
              autoComplete={isLogin ? "current-password" : "new-password"}
              placeholder={isLogin ? "Your password" : "At least 8 characters"}
              className="input"
            />
          </div>

          {error ? (
            <p role="alert" className="field-error">{error}</p>
          ) : null}

          <button type="submit" disabled={submitting} className="btn btn-primary mt-1 w-full">
            {submitting ? "Please wait…" : isLogin ? "Sign in" : "Create account"}
            {!submitting ? <ArrowRightIcon /> : null}
          </button>
        </form>

        <p className="mt-5 text-center text-sm text-muted-fg">
          {isLogin ? (
            <>
              New to MCQure?{" "}
              <Link href="/register" className="link">Create an account</Link>
            </>
          ) : (
            <>
              Already have an account?{" "}
              <Link href="/login" className="link">Sign in</Link>
            </>
          )}
        </p>
      </div>
    </div>
  );
}
