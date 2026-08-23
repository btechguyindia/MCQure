import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getCurrentUser, isNextResponse, jsonError } from "@/lib/api";
import { timetableCreateSchema } from "@/lib/validation";
import {
  activateTimetable,
  defaultTargetFor,
  getTimetableView,
  listTimetables,
} from "@/lib/timetable";

export async function GET() {
  const user = await getCurrentUser();
  if (isNextResponse(user)) return user;
  if (!user) return jsonError("Authentication required", 401);

  const [timetables, view] = await Promise.all([
    listTimetables(user.id),
    getTimetableView(user.id),
  ]);
  return NextResponse.json({ ok: true, timetables, view });
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

  const parsed = timetableCreateSchema.safeParse(body);
  if (!parsed.success) {
    return jsonError("Validation failed", 400, parsed.error.flatten().fieldErrors);
  }

  const data = parsed.data;
  // A new timetable becomes the active schedule unless explicitly created dormant.
  const shouldBeActive = data.isActive !== false;

  const timetable = await prisma.studyTimetable.create({
    data: {
      userId: user.id,
      name: data.name,
      cycle: data.cycle,
      targetQuestions: data.targetQuestions ?? defaultTargetFor(data.cycle),
      slots: data.slots,
      isActive: false,
    },
  });

  if (shouldBeActive) {
    await activateTimetable(user.id, timetable.id);
  }

  const [timetables, view] = await Promise.all([
    listTimetables(user.id),
    getTimetableView(user.id),
  ]);
  return NextResponse.json({ ok: true, timetable, timetables, view }, { status: 201 });
}
