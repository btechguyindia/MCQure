import { NextResponse } from "next/server";
import type { User } from "@prisma/client";
import { getCurrentUser, jsonError } from "@/lib/api";

export async function requireAdmin(): Promise<User | NextResponse> {
  const user = await getCurrentUser();
  if (!user) return jsonError("Authentication required", 401);
  if (!user.isAdmin) return jsonError("Admin access required", 403);
  return user;
}
