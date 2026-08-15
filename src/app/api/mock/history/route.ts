import { NextResponse } from "next/server";
import { getCurrentUser, isNextResponse, jsonError } from "@/lib/api";
import { listMockRuns } from "@/lib/mock";

export async function GET() {
  const user = await getCurrentUser();
  if (isNextResponse(user)) return user;
  if (!user) return jsonError("Authentication required", 401);

  const data = await listMockRuns(user.id);
  return NextResponse.json({ ok: true, ...data });
}
