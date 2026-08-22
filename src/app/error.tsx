"use client";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="flex min-h-[50vh] flex-col items-center justify-center gap-4 text-center">
      <span className="text-5xl" aria-hidden>
        🛠️
      </span>
      <h1 className="text-xl font-bold">Something went wrong</h1>
      <p className="max-w-md text-sm text-zinc-500 dark:text-zinc-400">
        {error.message || "An unexpected error occurred while rendering this page."}
      </p>
      <button type="button" onClick={reset} className="btn btn-primary">
        Try again
      </button>
    </div>
  );
}
