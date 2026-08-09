import { NextResponse } from "next/server";
import { aiStatus } from "@/lib/ai";
import { getCurrentUser, isNextResponse, jsonError } from "@/lib/api";

// Reports which AI providers have real keys configured. Returns booleans only
// so no secret material ever leaves the server.
export async function GET() {
  const user = await getCurrentUser();
  if (isNextResponse(user)) return user;
  if (!user) return jsonError("Authentication required", 401);

  return NextResponse.json({ ok: true, providers: aiStatus() });
}
