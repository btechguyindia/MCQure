import { NextResponse } from "next/server";
import { getCurrentUser, jsonError } from "@/lib/api";
import {
  isLeaderboardPeriod,
  getLeaderboard,
  type LeaderboardPeriod,
} from "@/lib/leaderboard";

export async function GET(request: Request) {
  const user = await getCurrentUser();
  if (!user) return jsonError("Authentication required", 401);

  const params = new URL(request.url).searchParams;
  const periodParam = params.get("period") ?? "daily";
  const period: LeaderboardPeriod = isLeaderboardPeriod(periodParam) ? periodParam : "daily";

  const limitParam = Number.parseInt(params.get("limit") ?? "25", 10);
  const limit = Number.isFinite(limitParam) ? Math.min(Math.max(limitParam, 1), 50) : 25;

  const data = await getLeaderboard(user.id, period, limit);
  return NextResponse.json({ ok: true, ...data });
}