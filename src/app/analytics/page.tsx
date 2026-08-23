import type { Metadata } from "next";
import { AnalyticsDashboard } from "@/components/AnalyticsDashboard";
import { AnalyticsIcon } from "@/components/icons";

export const metadata: Metadata = { title: "Analytics — MCQure" };

export default function AnalyticsPage() {
  return (
    <div className="flex flex-col gap-6">
      <header>
        <p className="kicker">Performance insights</p>
        <h1 className="mt-2 flex items-center gap-2.5 text-2xl font-bold tracking-tight">
          <AnalyticsIcon className="h-6 w-6 text-brand" />
          Analytics
        </h1>
        <p className="mt-1 text-sm text-muted-fg">
          Where you stand, what&apos;s improving and exactly what to fix next.
        </p>
      </header>
      <AnalyticsDashboard />
    </div>
  );
}
