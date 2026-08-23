import type { Metadata } from "next";
import { Suspense } from "react";
import { AuthForm } from "@/components/AuthForm";

export const metadata: Metadata = { title: "Sign in — MCQure" };

export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <div className="mx-auto mt-8 w-full max-w-sm sm:mt-10">
          <div className="skeleton h-72 w-full rounded-2xl" />
        </div>
      }
    >
      <AuthForm mode="login" />
    </Suspense>
  );
}
