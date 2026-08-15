import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getCurrentUser, isNextResponse, jsonError } from "@/lib/api";
import { goalsSchema } from "@/lib/validation";
import { getGoalProgress } from "@/lib/motivation";

export async function GET() {
  const user = await getCurrentUser();
  if (isNextResponse(user)) return user;
  if (!user) return jsonError("Authentication required", 401);

  const profile = await prisma.userPreparation.findUnique({ where: { userId: user.id } });
  const targets = { dailyTarget: profile?.dailyTarget ?? 25, weeklyTarget: profile?.weeklyTarget ?? 175 };
  const progress = await getGoalProgress(user.id, targets);
  return NextResponse.json({ ok: true, goals: progress });
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

  const parsed = goalsSchema.safeParse(body);
  if (!parsed.success) {
    return jsonError("Validation failed", 400, parsed.error.flatten().fieldErrors);
  }

  const profile = await prisma.userPreparation.upsert({
    where: { userId: user.id },
    update: {
      ...(parsed.data.dailyTarget !== undefined ? { dailyTarget: parsed.data.dailyTarget } : {}),
      ...(parsed.data.weeklyTarget !== undefined ? { weeklyTarget: parsed.data.weeklyTarget } : {}),
    },
    create: {
      userId: user.id,
      dailyTarget: parsed.data.dailyTarget ?? 25,
      weeklyTarget: parsed.data.weeklyTarget ?? 175,
    },
  });

  const progress = await getGoalProgress(user.id, {
    dailyTarget: profile.dailyTarget,
    weeklyTarget: profile.weeklyTarget,
  });
  return NextResponse.json({ ok: true, goals: progress });
}
