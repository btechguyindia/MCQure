// Session management: JWT signed with AUTH_SECRET (HS256), stored in an
// httpOnly cookie. Uses `jose` for signing/verifying (works on both Node.js
// and edge runtimes) and `bcryptjs` for password hashing.

import { SignJWT, jwtVerify } from "jose";
import { hash, compare } from "bcryptjs";

export const SESSION_COOKIE = "mcqure_session";

const secret = () =>
  new TextEncoder().encode(
    process.env.AUTH_SECRET ?? "insecure-dev-secret-do-not-use-in-production"
  );

export interface SessionPayload {
  userId: string;
  email: string;
}

const SESSION_MAX_AGE_SECONDS = 60 * 60 * 24 * 7; // 7 days

export async function signSession(payload: SessionPayload): Promise<string> {
  return new SignJWT({ email: payload.email })
    .setProtectedHeader({ alg: "HS256" })
    .setSubject(payload.userId)
    .setIssuedAt()
    .setExpirationTime(Math.floor(Date.now() / 1000) + SESSION_MAX_AGE_SECONDS)
    .sign(secret());
}

export async function verifySession(token: string): Promise<SessionPayload | null> {
  try {
    const { payload } = await jwtVerify(token, secret(), { algorithms: ["HS256"] });
    if (!payload.sub) return null;
    return {
      userId: payload.sub,
      email: typeof payload.email === "string" ? payload.email : "",
    };
  } catch {
    return null;
  }
}

export async function hashPassword(password: string): Promise<string> {
  return hash(password, 12);
}

export async function verifyPassword(
  password: string,
  passwordHash: string
): Promise<boolean> {
  return compare(password, passwordHash);
}

export function sessionCookieOptions() {
  const isProd = process.env.NODE_ENV === "production";
  return {
    httpOnly: true,
    secure: isProd,
    sameSite: "lax" as const,
    path: "/",
    maxAge: SESSION_MAX_AGE_SECONDS,
  };
}
