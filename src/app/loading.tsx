export default function Loading() {
  return (
    <div className="flex flex-col gap-6" role="status" aria-label="Loading">
      <div className="h-40 animate-pulse rounded-2xl bg-zinc-200/70 dark:bg-zinc-800/70" />
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 6 }, (_, i) => (
          <div key={i} className="h-36 animate-pulse rounded-2xl bg-zinc-200/70 dark:bg-zinc-800/70" />
        ))}
      </div>
    </div>
  );
}
