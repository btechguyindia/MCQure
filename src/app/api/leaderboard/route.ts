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
  const res = NextResponse.json({ ok: true, ...data });
  // Private (the payload contains the caller's standing) but short-lived, so
  // repeat views reuse the server-side ranking cache instead of a fresh scan.
  res.headers.set("Cache-Control", "private, max-age=10, stale-while-revalidate=30");
  return res;
}