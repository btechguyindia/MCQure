import { NextResponse } from "next/server";
import { getCurrentUser, isNextResponse, jsonError } from "@/lib/api";
import { getMotivationSnapshot } from "@/lib/motivation";

export async function GET() {
  const user = await getCurrentUser();
  if (isNextResponse(user)) return user;
  if (!user) return jsonError("Authentication required", 401);

  const snapshot = await getMotivationSnapshot(user.id);
  return NextResponse.json({ ok: true, ...snapshot });
}
