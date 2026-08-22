import Link from "next/link";

export default function NotFound() {
  return (
    <div className="flex min-h-[50vh] flex-col items-center justify-center gap-4 text-center">
      <span className="text-6xl font-black text-indigo-600/20 dark:text-indigo-400/20">404</span>
      <h1 className="text-xl font-bold">Page not found</h1>
      <p className="max-w-md text-sm text-zinc-500 dark:text-zinc-400">
        The page you are looking for doesn&apos;t exist or may have moved.
      </p>
      <div className="flex gap-3">
        <Link href="/" className="btn btn-primary">
          Go home
        </Link>
        <Link href="/practice" className="btn btn-secondary">
          Start practicing
        </Link>
      </div>
    </div>
  );
}
