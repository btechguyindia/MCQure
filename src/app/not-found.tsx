import Link from "next/link";

export default function NotFound() {
  return (
    <div className="rise-in flex min-h-[50vh] flex-col items-center justify-center gap-4 text-center">
      <span className="stat-num text-gradient text-6xl opacity-40">404</span>
      <h1 className="text-xl font-bold tracking-tight">Page not found</h1>
      <p className="max-w-md text-sm text-muted-fg">
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
