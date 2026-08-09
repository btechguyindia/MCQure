import { prisma } from "@/lib/db";
import { getCurrentUser, isNextResponse, jsonError, jsonOk } from "@/lib/api";
import { studyVisitSchema } from "@/lib/validation";
import { recordStudyVisit } from "@/lib/study-visit";

// Record that the user studied or revised a topic. Used by the study page
// (STUDY) and revision CTAs (REVISION) to drive "last studied"/revision health.
export async function POST(request: Request) {
  const user = await getCurrentUser();
  if (isNextResponse(user)) return user;
  if (!user) return jsonError("Authentication required", 401);

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return jsonError("Invalid JSON body", 400);
  }

  const parsed = studyVisitSchema.safeParse(body);
  if (!parsed.success) {
    return jsonError("Validation failed", 400, parsed.error.flatten().fieldErrors);
  }

  const topic = await prisma.topic.findUnique({
    where: { id: parsed.data.topicId },
  });
  if (!topic) return jsonError("Topic not found", 404);

  await recordStudyVisit(user.id, parsed.data.topicId, parsed.data.source);
  return jsonOk({ ok: true });
}
