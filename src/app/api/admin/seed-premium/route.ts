import { PrismaClient } from "@prisma/client";
import { hash } from "bcryptjs";
import { activateSubscription } from "@/lib/billing";

// One-time bootstrap: provisions the premium demo accounts in a fresh
// environment with real subscription records. Guarded by SEED_KEY; safe to
// delete after first use.
const prisma = new PrismaClient();

export async function POST(request: Request) {
  const key = request.headers.get("x-seed-key");
  if (!process.env.SEED_KEY || key !== process.env.SEED_KEY) {
    return Response.json({ ok: false, message: "Forbidden" }, { status: 403 });
  }

  const accounts = [
    { email: "premium.demo@mcqure.test", name: "Premium Demo", plan: "PREMIUM", cycle: "MONTHLY", password: "Premium#2026" },
    { email: "royal.demo@mcqure.test", name: "Royal Demo", plan: "ROYAL", cycle: "YEARLY", password: "Royal#Elite2026" },
  ];

  const results = [];
  for (const a of accounts) {
    const passwordHash = await hash(a.password, 12);
    const user = await prisma.user.upsert({
      where: { email: a.email },
      update: { name: a.name, passwordHash },
      create: { email: a.email, name: a.name, passwordHash },
    });
    await activateSubscription({
      userId: user.id,
      plan: a.plan as "PREMIUM" | "ROYAL",
      cycle: a.cycle as "MONTHLY" | "YEARLY",
      provider: "MANUAL",
      providerRef: `seed:${a.email}`,
    });
    results.push({ email: user.email, plan: a.plan });
  }

  return Response.json({ ok: true, seeded: results });
}