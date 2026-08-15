import { NextResponse } from "next/server";
import { getCurrentUser, isNextResponse, jsonError } from "@/lib/api";
import { getReport } from "@/lib/reports";
import type { ReportPeriod } from "@/lib/reports";

export async function GET(request: Request) {
  const user = await getCurrentUser();
  if (isNextResponse(user)) return user;
  if (!user) return jsonError("Authentication required", 401);

  const periodParam = new URL(request.url).searchParams.get("period") ?? "week";
  const period: ReportPeriod = periodParam === "month" ? "month" : "week";

  const report = await getReport(user.id, period);
  return NextResponse.json({ ok: true, report });
}
