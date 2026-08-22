import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getCurrentUser, isNextResponse, jsonError } from "@/lib/api";

// GET /api/questions/bookmarks?ids=<id,id,…>
// Review endpoint for locally saved (bookmarked) questions: returns full
// detail including the correct answer and explanation — this is explicitly a
// post-practice study view.
const ID_RE = /^[a-z0-9]{8,40}$/i; // cuid / uuid / cuid2
const MAX_IDS = 200;

export async function GET(request: Request) {
  const user = await getCurrentUser();
  if (isNextResponse(user)) return user;
  if (!user) return jsonError("Authentication required", 401);

  const raw = new URL(request.url).searchParams.get("ids") ?? "";
  const ids = [
    ...new Set(
      raw
        .split(",")
        .map((s) => s.trim())
        .filter((s) => ID_RE.test(s))
    ),
  ].slice(0, MAX_IDS);

  if (ids.length === 0) {
    return NextResponse.json({ ok: true, questions: [] });
  }

  const exam = await prisma.exam.findFirst({ where: { active: true } });
  if (!exam) return jsonError("No active exam configured", 500);

  const rows = await prisma.question.findMany({
    where: { id: { in: ids }, examId: exam.id, isActive: true },
    select: {
      id: true,
      text: true,
      options: true,
      correctIndex: true,
      explanation: true,
      difficulty: true,
      sourceType: true,
      topic: { select: { name: true, subject: { select: { name: true } } } },
      subtopic: { select: { name: true } },
    },
  });

  // Preserve the caller's order (most recently bookmarked first).
  const byId = new Map(rows.map((r) => [r.id, r]));
  const questions = ids
    .map((id) => byId.get(id))
    .filter((r) => r !== undefined)
    .map((r) => ({
      id: r.id,
      text: r.text,
      options: r.options,
      correctIndex: r.correctIndex,
      explanation: r.explanation,
      difficulty: r.difficulty,
      sourceType: r.sourceType,
      subject: r.topic.subject.name,
      topic: r.topic.name,
      subtopic: r.subtopic?.name ?? null,
    }));

  return NextResponse.json({ ok: true, questions });
}
