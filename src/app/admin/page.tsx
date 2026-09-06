import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/api";
import { isNextResponse } from "@/lib/api";
import { AdminDashboard } from "@/components/AdminDashboard";

export const metadata: Metadata = { title: "Admin — MCQure" };

export default async function AdminPage() {
  const user = await getCurrentUser();
  if (!user || isNextResponse(user) || !user.isAdmin) {
    redirect("/login");
  }

  return (
    <div className="flex flex-col gap-6">
      <header>
        <p className="kicker">Admin panel</p>
        <h1 className="mt-2 text-2xl font-bold tracking-tight text-ink">
          MCQure Dashboard
        </h1>
        <p className="mt-1 text-sm text-muted-fg">
          Platform-wide analytics, user data, question bank health, and revenue.
        </p>
      </header>
      <AdminDashboard />
    </div>
  );
}
