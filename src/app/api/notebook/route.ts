import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getCurrentUser, isNextResponse, jsonError } from "@/lib/api";
import { notebookSchema } from "@/lib/validation";
import { answerNotebook } from "@/lib/notebook";
import { AiNotConfiguredError } from "@/lib/ai";
import { recordStudyVisit } from "@/lib/study-visit";

// Notebook: grounded LLM chat over a topic's study notes.
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

  const parsed = notebookSchema.safeParse(body);
  if (!parsed.success) {
    return jsonError("Validation failed", 400, parsed.error.flatten().fieldErrors);
  }

  const { topicId, message } = parsed.data;

  const topic = await prisma.topic.findUnique({
    where: { id: topicId },
    include: { studyNotes: { orderBy: { order: "asc" } } },
  });
  if (!topic) return jsonError("Topic not found", 404);

  try {
    const result = await answerNotebook(
      topic.name,
      topic.studyNotes,
      message
    );
    await recordStudyVisit(user.id, topicId, "STUDY").catch(() => {});
    return NextResponse.json({ ok: true, answer: result.answer, provider: result.provider });
  } catch (err) {
    if (err instanceof AiNotConfiguredError) {
      return jsonError(
        "AI is not configured yet. Add a real GEMINI_API_KEY or OPENROUTER_API_KEY in .env to use the Notebook.",
        503
      );
    }
    const messageText = err instanceof Error ? err.message : "Notebook request failed";
    return jsonError(messageText, 500);
  }
}
