import { NextResponse } from "next/server";
import { getCurrentUser, isNextResponse, jsonError } from "@/lib/api";
import { requireFeature, mocksRemaining } from "@/lib/entitlements";
import { mockStartSchema } from "@/lib/validation";
import { getActiveExam } from "@/lib/practice";
import { buildMockPlan, startMock } from "@/lib/mock";

export async function POST(request: Request) {
  const user = await getCurrentUser();
  if (isNextResponse(user)) return user;
  if (!user) return jsonError("Authentication required", 401);

  // Mocks are a subscription feature with a monthly cap per plan.
  const allowed = await requireFeature(user, "mock_tests");
  if (isNextResponse(allowed)) return allowed;
  const remaining = await mocksRemaining(user);
  if (remaining === 0) {
    return jsonError(
      "You have used all the mock tests for your plan this month. Upgrade to keep practising mocks.",
      403
    );
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return jsonError("Invalid JSON body", 400);
  }

  const parsed = mockStartSchema.safeParse(body);
  if (!parsed.success) {
    return jsonError("Validation failed", 400, parsed.error.flatten().fieldErrors);
  }

  const exam = await getActiveExam();
  if (!exam) return jsonError("No active exam configured", 500);

  try {
    const plan = await buildMockPlan(exam.id, parsed.data.scope, {
      sectionId: parsed.data.sectionId,
      topicId: parsed.data.topicId,
      count: parsed.data.count,
    });
    const result = await startMock(user.id, exam.id, plan);
    return NextResponse.json({ ok: true, ...result });
  } catch (err) {
    return jsonError(err instanceof Error ? err.message : "Mock start failed", 400);
  }
}
