import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getCurrentUser, isNextResponse, jsonError } from "@/lib/api";
import { questionReviewSchema } from "@/lib/validation";

// Review endpoint for the quality pipeline: move a question to APPROVED,
// QUARANTINED or REJECTED (optionally with a note). Building block for a
// future admin/review role — every API route still guards on session.
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

  const parsed = questionReviewSchema.safeParse(body);
  if (!parsed.success) {
    return jsonError("Validation failed", 400, parsed.error.flatten().fieldErrors);
  }

  const { questionId, status, note } = parsed.data;

  const question = await prisma.question.findUnique({ where: { id: questionId } });
  if (!question) return jsonError("Question not found", 404);

  const updated = await prisma.question.update({
    where: { id: questionId },
    data: {
      qualityStatus: status,
      qualityNote: note !== undefined ? (note || null) : question.qualityNote,
    },
    select: { id: true, qualityStatus: true, qualityNote: true },
  });

  return NextResponse.json({ ok: true, question: updated });
}
