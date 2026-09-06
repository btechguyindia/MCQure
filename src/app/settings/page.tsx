import type { Metadata } from "next";
import { AppearanceSettings } from "@/components/AppearanceSettings";
import { SubscriptionPanel } from "@/components/SubscriptionPanel";

export const metadata: Metadata = { title: "Settings — MCQure" };

export default function SettingsPage() {
  return (
    <div className="mx-auto flex max-w-3xl flex-col gap-8 py-8">
      <SubscriptionPanel />
      <AppearanceSettings />
    </div>
  );
}