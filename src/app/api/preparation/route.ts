import { getCurrentUser, isNextResponse, jsonError, jsonOk } from "@/lib/api";
import { getPrepReport } from "@/lib/tracking";

// Central preparation report: scorecard, coverage, subject/topic tracking,
// strengths/weaknesses, revision queue and the daily plan — all derived from
// the permanent attempt/visit history plus the exam blueprint.
export async function GET() {
  const user = await getCurrentUser();
  if (isNextResponse(user)) return user;
  if (!user) return jsonError("Authentication required", 401);

  const report = await getPrepReport(user.id);
  return jsonOk(report);
}
