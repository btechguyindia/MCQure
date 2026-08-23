import { PrismaClient } from "@prisma/client";
import { hash } from "bcryptjs";

// One-time bootstrap: provisions the premium demo accounts in a fresh
// environment. Guarded by SEED_KEY; safe to delete after first use.
const prisma = new PrismaClient();

export async function POST(request: Request) {
  const key = request.headers.get("x-seed-key");
  if (!process.env.SEED_KEY || key !== process.env.SEED_KEY) {
    return Response.json({ ok: false, message: "Forbidden" }, { status: 403 });
  }

  const accounts = [
    { email: "gold.demo@mcqure.test", name: "Gold Demo", tier: "GOLD" as const, password: "Gold#Premium2026" },
    { email: "silver.demo@mcqure.test", name: "Silver Demo", tier: "SILVER" as const, password: "Silver#Member2026" },
  ];

  const results = [];
  for (const a of accounts) {
    const passwordHash = await hash(a.password, 12);
    const user = await prisma.user.upsert({
      where: { email: a.email },
      update: { tier: a.tier, name: a.name, passwordHash },
      create: { email: a.email, name: a.name, tier: a.tier, passwordHash },
    });
    results.push({ email: user.email, tier: user.tier });
  }

  return Response.json({ ok: true, seeded: results });
}
