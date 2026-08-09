import type { Metadata } from "next";
import { Suspense } from "react";
import { AuthForm } from "@/components/AuthForm";

export const metadata: Metadata = { title: "Create account — MCQure" };

export default function RegisterPage() {
  return (
    <Suspense
      fallback={
        <div className="mx-auto mt-8 w-full max-w-sm">
          <div className="h-64 animate-pulse rounded-2xl border border-zinc-200 bg-zinc-100 dark:border-zinc-800 dark:bg-zinc-900" />
        </div>
      }
    >
      <AuthForm mode="register" />
    </Suspense>
  );
}
