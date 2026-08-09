import { prisma } from "@/lib/db";
import { getCurrentUser, isNextResponse, jsonError, jsonOk } from "@/lib/api";
import { preparationSettingsSchema } from "@/lib/validation";

// "My Target Exam": read or update the user's persistent preparation profile.
export async function GET() {
  const user = await getCurrentUser();
  if (isNextResponse(user)) return user;
  if (!user) return jsonError("Authentication required", 401);

  const prep = await prisma.userPreparation.findUnique({
    where: { userId: user.id },
    include: { exam: { select: { id: true, name: true } } },
  });
  return jsonOk({ preparation: prep });
}

export async function PUT(request: Request) {
  const user = await getCurrentUser();
  if (isNextResponse(user)) return user;
  if (!user) return jsonError("Authentication required", 401);

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return jsonError("Invalid JSON body", 400);
  }

  const parsed = preparationSettingsSchema.safeParse(body);
  if (!parsed.success) {
    return jsonError("Validation failed", 400, parsed.error.flatten().fieldErrors);
  }

  const data = parsed.data;
  const existing = await prisma.userPreparation.findUnique({
    where: { userId: user.id },
  });

  const prep = existing
    ? await prisma.userPreparation.update({
        where: { userId: user.id },
        data: {
          examId: data.examId === undefined ? undefined : data.examId,
          examAttemptYear:
            data.examAttemptYear === undefined ? undefined : data.examAttemptYear,
          targetExamDate:
            data.targetExamDate === undefined
              ? undefined
              : data.targetExamDate
                ? new Date(data.targetExamDate)
                : null,
          targetScore: data.targetScore === undefined ? undefined : data.targetScore,
          dailyTarget: data.dailyTarget,
          weeklyTarget: data.weeklyTarget,
          stage: data.stage,
        },
      })
    : await prisma.userPreparation.create({
        data: {
          userId: user.id,
          examId: data.examId ?? null,
          examAttemptYear: data.examAttemptYear ?? null,
          targetExamDate: data.targetExamDate ? new Date(data.targetExamDate) : null,
          targetScore: data.targetScore ?? null,
          dailyTarget: data.dailyTarget ?? 25,
          weeklyTarget: data.weeklyTarget ?? 175,
          stage: data.stage ?? "starting",
        },
      });

  return jsonOk({ preparation: prep });
}
