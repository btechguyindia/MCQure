import { PrismaClient } from "@prisma/client";

// Admin: reset every account back to BASIC and/or grant a specific plan.
// Usage:
//   node scripts/admin-users.mjs reset                     # all plans -> BASIC
//   node scripts/admin-users.mjs grant <email> <PLAN>     # set one account
//   node scripts/admin-users.mjs list                     # show email:plan
//
// Legacy tier names are mapped automatically: GOLD -> ROYAL, SILVER -> PREMIUM, FREE -> BASIC.

import { hash } from "bcryptjs";

const prisma = new PrismaClient();
const [, , action, email, rawPlan] = process.argv;

const PLAN_MAP = { FREE: "BASIC", SILVER: "PREMIUM", GOLD: "ROYAL" };

async function main() {
  if (action === "reset") {
    const r = await prisma.user.updateMany({ data: { tier: "BASIC" } });
    console.log(`Reset ${r.count} accounts to BASIC`);
  } else if (action === "grant") {
    const plan = PLAN_MAP[rawPlan?.toUpperCase()] ?? rawPlan?.toUpperCase();
    if (!email || !["BASIC", "PREMIUM", "PREMIUM_PLUS", "ROYAL"].includes(plan ?? "")) {
      console.log("Usage: node scripts/admin-users.mjs grant <email> <BASIC|PREMIUM|PREMIUM_PLUS|ROYAL>");
      return;
    }
    const user = await prisma.user.upsert({
      where: { email },
      update: { tier: plan },
      create: { email, name: email, tier: plan, passwordHash: await hash("ChangeMe#2026", 12) },
    });
    console.log(`${email} -> ${user.tier}`);
  } else if (action === "list") {
    const users = await prisma.user.findMany({ select: { email: true, tier: true } });
    console.log(users.map((u) => `${u.email}: ${u.tier}`).join("\n"));
  } else {
    console.log("Usage: node scripts/admin-users.mjs <reset|grant|list> [...]");
  }
}

main().finally(() => prisma.$disconnect());