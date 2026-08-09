import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getCurrentUser, isNextResponse, jsonError, jsonOk } from "@/lib/api";
import { getActiveExam } from "@/lib/practice";
import { pyqCreateSchema } from "@/lib/validation";
import { createPyq, listPyqs, listPyqYears } from "@/lib/pyq";

// Phase 4 PYQ bank. GET lists genuine previous-year questions (optionally
// filtered by ?year=); POST records a question transcribed from an authentic
// paper, always starting UNVERIFIED until checked against the source copy.
export async function GET(request: Request) {
  const user = await getCurrentUser();
  if (isNextResponse(user)) return user;
  if (!user) return jsonError("Authentication required", 401);

  const exam = await getActiveExam();
  if (!exam) return jsonError("No active exam configured", 500);

  const url = new URL(request.url);
  const yearParam = url.searchParams.get("year");
  const year = yearParam ? Number(yearParam) : undefined;

  const [pyqs, years, count] = await Promise.all([
    listPyqs(exam.id, year && !Number.isNaN(year) ? year : undefined),
    listPyqYears(exam.id),
    prisma.pyq.count({ where: { examId: exam.id } }),
  ]);

  return jsonOk({ pyqs, years, count });
}

export async function POST(request: Request) {
  const user = await getCurrentUser();
  if (isNextResponse(user)) return user;
  if (!user) return jsonError("Authentication required", 401);

  const exam = await getActiveExam();
  if (!exam) return jsonError("No active exam configured", 500);

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return jsonError("Invalid JSON body", 400);
  }

  const parsed = pyqCreateSchema.safeParse(body);
  if (!parsed.success) {
    return jsonError("Validation failed", 400, parsed.error.flatten().fieldErrors);
  }

  const pyq = await createPyq(exam.id, exam.name, parsed.data);
  return NextResponse.json(
    {
      ok: true,
      pyq: {
        id: pyq.id,
        year: pyq.year,
        verificationStatus: pyq.verificationStatus,
      },
    },
    { status: 201 }
  );
}
