import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { loginSchema } from "@/lib/validation";
import {
  signSession,
  sessionCookieOptions,
  verifyPassword,
  SESSION_COOKIE,
} from "@/lib/auth";
import { jsonError } from "@/lib/api";
import { ipKey, rateLimit, resetKey } from "@/lib/rate-limit";

export async function POST(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return jsonError("Invalid JSON body", 400);
  }

  const parsed = loginSchema.safeParse(body);
  if (!parsed.success) {
    return jsonError("Validation failed", 400, parsed.error.flatten().fieldErrors);
  }

  const { email, password } = parsed.data;
  const ip = ipKey(request);
  const accountKey = `login:${ip}:${email.toLowerCase()}`;

  const user = await prisma.user.findUnique({ where: { email } });
  const valid =
    user !== null && (await verifyPassword(password, user.passwordHash));

  // Same message for missing user / wrong password to avoid user enumeration.
  if (!user || !valid) {
    // Only failed attempts are counted. Successful logins are never blocked.
    const accountBlocked = !rateLimit(accountKey, 5);
    const ipBlocked = !rateLimit(`login-ip:${ip}`, 30);
    if (accountBlocked || ipBlocked) {
      return jsonError("Too many failed attempts. Try again in a minute.", 429);
    }
    return jsonError("Invalid email or password", 401);
  }

  // A successful login clears earlier failures for this account.
  resetKey(accountKey);

  const token = await signSession({ userId: user.id, email: user.email });
  const response = NextResponse.json({
    ok: true,
    user: { id: user.id, email: user.email, name: user.name },
  });
  response.cookies.set(SESSION_COOKIE, token, sessionCookieOptions());

  return response;
}
