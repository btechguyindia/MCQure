import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getCurrentUser, isNextResponse, jsonError } from "@/lib/api";
import { questionBankQuerySchema, questionCreateSchema } from "@/lib/validation";
import { createQuestion, listQuestionBank } from "@/lib/question-bank";

// GET: cursor-paginated question-bank explorer with server-side filters.
// POST: add a USER_CREATED question (runs dedup + quality gates).
export async function GET(request: Request) {
  const user = await getCurrentUser();
  if (isNextResponse(user)) return user;
  if (!user) return jsonError("Authentication required", 401);

  const params = Object.fromEntries(new URL(request.url).searchParams);
  const parsed = questionBankQuerySchema.safeParse(params);
  if (!parsed.success) {
    return jsonError("Invalid query parameters", 400, parsed.error.flatten().fieldErrors);
  }

  const { verified, ...filters } = parsed.data;
  const page = await listQuestionBank({
    ...filters,
    verified: verified === undefined ? undefined : verified === "true",
  });

  return NextResponse.json({ ok: true, ...page });
}

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

  const parsed = questionCreateSchema.safeParse(body);
  if (!parsed.success) {
    return jsonError("Validation failed", 400, parsed.error.flatten().fieldErrors);
  }

  const exam = await prisma.exam.findFirst({ where: { active: true } });
  if (!exam) return jsonError("No active exam configured", 500);

  const { options, source, difficulty, ...rest } = parsed.data;
  const result = await createQuestion({
    examId: exam.id,
    sourceType: "USER_CREATED",
    source: source
      ? { type: "USER_CREATED", ...source }
      : { type: "USER_CREATED", name: `User-added (${user.email})` },
    options,
    difficulty: difficulty ?? "MEDIUM",
    ...rest,
  });

  if (!result.ok) {
    return NextResponse.json(
      {
        ok: false,
        message: "Question failed the quality gate",
        issues: result.issues,
      },
      { status: 422 }
    );
  }

  if (!result.created) {
    return NextResponse.json(
      {
        ok: false,
        message: "A similar question already exists in the bank",
        duplicate: result.duplicate,
      },
      { status: 409 }
    );
  }

  return NextResponse.json(
    { ok: true, question: { id: result.question.id, qualityStatus: result.question.qualityStatus } },
    { status: 201 }
  );
}
