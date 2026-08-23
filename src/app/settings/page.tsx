import type { Metadata } from "next";
import { AppearanceSettings } from "@/components/AppearanceSettings";

export const metadata: Metadata = { title: "Appearance — MCQure" };

export default function SettingsPage() {
  return <AppearanceSettings />;
}
