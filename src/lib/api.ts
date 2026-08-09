// Shared helpers for API route handlers.

import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import type { User } from "@prisma/client";
import { prisma } from "@/lib/db";
import { SESSION_COOKIE, verifySession } from "@/lib/auth";

export function jsonOk<T>(data: T, init?: ResponseInit) {
  return NextResponse.json({ ok: true as const, ...data }, init);
}

export function jsonError(message: string, status = 400, details?: unknown) {
  return NextResponse.json({ ok: false, message, details }, { status });
}

/**
 * Reads the current user from the session cookie. Returns null when the
 * session is missing, invalid or the user no longer exists.
 */
export async function getCurrentUser(): Promise<User | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE)?.value;
  if (!token) return null;
  const session = await verifySession(token);
  if (!session) return null;
  return prisma.user.findUnique({ where: { id: session.userId } });
}

/** Requires an authenticated user; otherwise returns a 401 response. */
export async function requireUser(): Promise<User | NextResponse> {
  const user = await getCurrentUser();
  if (!user) {
    return jsonError("Authentication required", 401);
  }
  return user;
}

export function isNextResponse(
  value: unknown
): value is NextResponse {
  return value instanceof NextResponse;
}
