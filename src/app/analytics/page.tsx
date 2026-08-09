import type { Metadata } from "next";
import { AnalyticsDashboard } from "@/components/AnalyticsDashboard";

export const metadata: Metadata = { title: "Analytics — MCQure" };

export default function AnalyticsPage() {
  return (
    <div className="flex flex-col gap-6">
      <header>
        <h1 className="text-2xl font-bold">📊 Analytics</h1>
        <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
          Where you stand, what&apos;s improving and exactly what to fix next.
        </p>
      </header>
      <AnalyticsDashboard />
    </div>
  );
}
