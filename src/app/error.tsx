"use client";

import { XIcon } from "@/components/icons";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="rise-in flex min-h-[50vh] flex-col items-center justify-center gap-4 text-center">
      <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-bad-soft text-bad">
        <XIcon className="h-6 w-6" />
      </span>
      <h1 className="text-xl font-bold tracking-tight">Something went wrong</h1>
      <p className="max-w-md text-sm text-muted-fg">
        {error.message || "An unexpected error occurred while rendering this page."}
      </p>
      <button type="button" onClick={reset} className="btn btn-primary">
        Try again
      </button>
    </div>
  );
}
