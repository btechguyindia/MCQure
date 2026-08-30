import { prisma } from "@/lib/db";
import { jsonError, jsonOk } from "@/lib/api";
import type { AccountTier } from "@prisma/client";

/**
 * Shared guard + handler for the tier-grant admin APIs. Requests must carry
 * `x-admin-key` matching the SEED_KEY environment variable.
 */
export async function handleTierGrant(
  request: Request,
  tier: AccountTier
): Promise<Response> {
  const key = request.headers.get("x-admin-key");
  if (!process.env.SEED_KEY || key !== process.env.SEED_KEY) {
    return jsonError("Forbidden", 403);
  }

  let body: { email?: unknown };
  try {
    body = (await request.json()) as { email?: unknown };
  } catch {
    return jsonError("Invalid JSON body", 400);
  }

  const email = typeof body.email === "string" ? body.email.trim().toLowerCase() : "";
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return jsonError("A valid email is required", 400);
  }

  if (request.method === "DELETE") {
    const revoked = await prisma.user.updateMany({
      where: { email },
      data: { tier: "FREE" },
    });
    return jsonOk({ ok: true, email, tier: "FREE", updated: revoked.count });
  }

  try {
    const user = await prisma.user.update({
      where: { email },
      data: { tier },
      select: { email: true, name: true, tier: true },
    });
    return jsonOk({ ok: true, ...user });
  } catch {
    return jsonError("No account found with that email", 404);
  }
}
