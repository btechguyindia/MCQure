import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { registerSchema } from "@/lib/validation";
import { hashPassword, signSession, sessionCookieOptions, SESSION_COOKIE } from "@/lib/auth";
import { jsonError } from "@/lib/api";
import { ipKey, rateLimit } from "@/lib/rate-limit";

export async function POST(request: Request) {
  try {
    // Generous per-IP budget for account creation; a single user never hits it.
    if (!rateLimit(`register:${ipKey(request)}`, 15)) {
      return jsonError("Too many registration attempts. Try again in a minute.", 429);
    }

    let body: unknown;
    try {
      body = await request.json();
    } catch {
      return jsonError("Invalid JSON body", 400);
    }

    const parsed = registerSchema.safeParse(body);
    if (!parsed.success) {
      return jsonError("Validation failed", 400, parsed.error.flatten().fieldErrors);
    }

    const { email, name, password } = parsed.data;

    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) {
      return jsonError("An account with this email already exists", 409);
    }

    const passwordHash = await hashPassword(password);
    const user = await prisma.user.create({
      data: { email, name, passwordHash },
      select: { id: true, email: true, name: true, createdAt: true },
    });

    const token = await signSession({ userId: user.id, email: user.email });
    const response = NextResponse.json({ ok: true, user }, { status: 201 });
    response.cookies.set(SESSION_COOKIE, token, sessionCookieOptions());

    return response;
  } catch (err) {
    // A registration 500 is almost always a database/config problem
    // (unreachable DATABASE_URL, unapplied migrations, ungenerated client).
    // Log it for Vercel and surface the cause so setup issues are fixable.
    console.error("[register] failed:", err);
    return jsonError(
      err instanceof Error ? `Registration failed: ${err.message}` : "Registration failed",
      500
    );
  }
}
