import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { questionReportSchema } from "@/lib/validation";
import { getCurrentUser, isNextResponse, jsonError } from "@/lib/api";

// Let users flag a question as broken/wrong. Stored in QuestionReport.
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

  const parsed = questionReportSchema.safeParse(body);
  if (!parsed.success) {
    return jsonError("Validation failed", 400, parsed.error.flatten().fieldErrors);
  }

  const { questionId, issue } = parsed.data;

  const question = await prisma.question.findUnique({ where: { id: questionId } });
  if (!question) return jsonError("Question not found", 404);

  const existing = await prisma.questionReport.findUnique({
    where: { userId_questionId: { userId: user.id, questionId } },
  });

  if (existing) {
    return jsonError("You already reported this question", 409);
  }

  await prisma.$transaction([
    prisma.questionReport.create({
      data: { userId: user.id, questionId, issue },
    }),
    prisma.question.update({
      where: { id: questionId },
      data: { reportCount: { increment: 1 } },
    }),
  ]);

  return NextResponse.json({ ok: true, reported: true }, { status: 201 });
}
