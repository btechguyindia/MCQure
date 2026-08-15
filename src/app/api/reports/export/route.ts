import { getCurrentUser, isNextResponse, jsonError } from "@/lib/api";
import { getReport, reportToCsv, reportToJson } from "@/lib/reports";
import type { ReportPeriod } from "@/lib/reports";

export async function GET(request: Request) {
  const user = await getCurrentUser();
  if (isNextResponse(user)) return user;
  if (!user) return jsonError("Authentication required", 401);

  const url = new URL(request.url);
  const periodParam = url.searchParams.get("period") ?? "week";
  const format = url.searchParams.get("format") ?? "json";
  const period: ReportPeriod = periodParam === "month" ? "month" : "week";

  const report = await getReport(user.id, period);
  const stamp = new Date().toISOString().slice(0, 10);

  if (format === "csv") {
    return new Response(reportToCsv(report), {
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename="mcqure-report-${period}-${stamp}.csv"`,
      },
    });
  }

  return new Response(reportToJson(report), {
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      "Content-Disposition": `attachment; filename="mcqure-report-${period}-${stamp}.json"`,
    },
  });
}
