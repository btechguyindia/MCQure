import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getCurrentUser, isNextResponse, jsonError } from "@/lib/api";
import { timetableUpdateSchema } from "@/lib/validation";
import {
  activateTimetable,
  getTimetableView,
  listTimetables,
} from "@/lib/timetable";

interface RouteContext {
  params: Promise<{ id: string }>;
}

async function loadOwned(userId: string, id: string) {
  return prisma.studyTimetable.findFirst({ where: { id, userId } });
}

export async function PUT(request: Request, context: RouteContext) {
  const user = await getCurrentUser();
  if (isNextResponse(user)) return user;
  if (!user) return jsonError("Authentication required", 401);

  const { id } = await context.params;
  const existing = await loadOwned(user.id, id);
  if (!existing) return jsonError("Timetable not found", 404);

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return jsonError("Invalid JSON body", 400);
  }

  const parsed = timetableUpdateSchema.safeParse(body);
  if (!parsed.success) {
    return jsonError("Validation failed", 400, parsed.error.flatten().fieldErrors);
  }

  const data = parsed.data;
  if (data.isActive === true) {
    await activateTimetable(user.id, id);
  }

  await prisma.studyTimetable.update({
    where: { id },
    data: {
      ...(data.name !== undefined ? { name: data.name } : {}),
      ...(data.cycle !== undefined ? { cycle: data.cycle } : {}),
      ...(data.targetQuestions !== undefined ? { targetQuestions: data.targetQuestions } : {}),
      ...(data.slots !== undefined ? { slots: data.slots } : {}),
      ...(data.isActive === false ? { isActive: false } : {}),
    },
  });

  const [timetables, view] = await Promise.all([
    listTimetables(user.id),
    getTimetableView(user.id),
  ]);
  return NextResponse.json({ ok: true, timetables, view });
}

export async function DELETE(_request: Request, context: RouteContext) {
  const user = await getCurrentUser();
  if (isNextResponse(user)) return user;
  if (!user) return jsonError("Authentication required", 401);

  const { id } = await context.params;
  const existing = await loadOwned(user.id, id);
  if (!existing) return jsonError("Timetable not found", 404);

  await prisma.studyTimetable.delete({ where: { id } });

  const [timetables, view] = await Promise.all([
    listTimetables(user.id),
    getTimetableView(user.id),
  ]);
  return NextResponse.json({ ok: true, timetables, view });
}
