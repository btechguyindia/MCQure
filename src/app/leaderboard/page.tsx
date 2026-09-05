import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/api";
import { Leaderboard } from "@/components/Leaderboard";

export const metadata: Metadata = { title: "Leaderboard — MCQure" };

export default async function LeaderboardPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  return <Leaderboard userId={user.id} />;
}