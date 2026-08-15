import { NextResponse } from "next/server";
import { getCurrentUser, isNextResponse, jsonError } from "@/lib/api";
import { z } from "zod";
import { completeMock } from "@/lib/mock";
import { evaluateAchievements } from "@/lib/motivation";

const finalizeSchema = z.object({ sessionId: z.string().min(1) });

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

  const parsed = finalizeSchema.safeParse(body);
  if (!parsed.success) {
    return jsonError("Validation failed", 400, parsed.error.flatten().fieldErrors);
  }

  try {
    const { run, results } = await completeMock(user.id, parsed.data.sessionId);
    const achievements = await evaluateAchievements(user.id);
    return NextResponse.json({ ok: true, run, results, achievements });
  } catch (err) {
    return jsonError(err instanceof Error ? err.message : "Mock finalize failed", 400);
  }
}
