import { PrismaClient } from "@prisma/client";

// Admin: reset every account back to FREE and/or apply a specific tier list.
// Usage:
//   node scripts/admin-users.mjs reset                  # all tiers -> FREE
//   node scripts/admin-users.mjs grant <email> <TIER>   # set one account
//   node scripts/admin-users.mjs list                   # show email:tier (prod only if DATABASE_URL set)
import { hash } from "bcryptjs";

const prisma = new PrismaClient();
const [, , action, email, tier] = process.argv;

async function main() {
  if (action === "reset") {
    const r = await prisma.user.updateMany({ data: { tier: "FREE" } });
    console.log(`Reset ${r.count} accounts to FREE`);
  } else if (action === "grant") {
    if (!email || !["GOLD", "SILVER"].includes(tier ?? "")) {
      console.log("Usage: node scripts/admin-users.mjs grant <email> <GOLD|SILVER>");
      return;
    }
    const user = await prisma.user.upsert({
      where: { email },
      update: { tier },
      create: { email, name: email, tier, passwordHash: await hash("ChangeMe#2026", 12) },
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
