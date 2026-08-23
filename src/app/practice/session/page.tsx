"use client";

import { Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { PracticeRunner } from "@/components/PracticeRunner";

function PracticeSession() {
  const params = useSearchParams();
  const sessionId = params.get("sessionId") ?? "";

  return (
    <main className="mx-auto w-full max-w-3xl px-4 pb-10 pt-6">
      <PracticeRunner sessionId={sessionId} />
    </main>
  );
}

export default function PracticeSessionPage() {
  return (
    <Suspense
      fallback={
        <main className="mx-auto w-full max-w-3xl px-4 pb-10 pt-6">
          <div className="skeleton h-6 w-1/3" />
          <div className="skeleton mt-4 h-24" />
        </main>
      }
    >
      <PracticeSession />
    </Suspense>
  );
}
