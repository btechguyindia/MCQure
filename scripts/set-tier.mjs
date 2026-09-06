// Manage account plans and demo users.
//
// Usage:
//   node scripts/set-tier.mjs <email> [--plan ROYAL|PREMIUM_PLUS|PREMIUM|BASIC] [--cycle MONTHLY|YEARLY] [--name "Name"] [--password "pw"]
//
// Legacy aliases (mapped automatically): GOLD -> ROYAL, SILVER -> PREMIUM, FREE -> BASIC.
// For paid plans the script also writes a Subscription record so the
// entitlements system recognises the plan. Creates the user if they don't exist
// (requires --password).

import "dotenv/config";
import { PrismaClient } from "@prisma/client";
import { hash } from "bcryptjs";

const prisma = new PrismaClient();

const args = process.argv.slice(2);
const email = args[0];

if (!email || !email.includes("@")) {
  console.error("Usage: node scripts/set-tier.mjs <email> [--plan ROYAL|PREMIUM|PREMIUM|BASIC] [--name \"Name\"] [--password \"pw\"]");
  process.exit(1);
}

function flag(name) {
  const i = args.indexOf(name);
  return i >= 0 ? args[i + 1] : undefined;
}

const PLAN_MAP = { FREE: "BASIC", SILVER: "PREMIUM", GOLD: "ROYAL" };
let plan = (flag("--plan") ?? flag("--tier") ?? "BASIC")?.toUpperCase();
if (PLAN_MAP[plan]) plan = PLAN_MAP[plan];
const cycle = (flag("--cycle") ?? "MONTHLY").toUpperCase();
const name = flag("--name");
const password = flag("--password");

if (!["BASIC", "PREMIUM", "PREMIUM_PLUS", "ROYAL"].includes(plan)) {
  console.error("Invalid plan. Use BASIC, PREMIUM, PREMIUM_PLUS or ROYAL.");
  process.exit(1);
}
if (!["MONTHLY", "YEARLY"].includes(cycle)) {
  console.error("Invalid cycle. Use MONTHLY or YEARLY.");
  process.exit(1);
}

const data = { tier: plan === "BASIC" ? "BASIC" : plan };
if (name) data.name = name;

const existing = await prisma.user.findUnique({ where: { email } });

if (!existing) {
  if (!password) {
    console.error(`User ${email} does not exist — pass --password to create it.`);
    process.exit(1);
  }
  data.passwordHash = await hash(password, 12);
}

const user = await prisma.user.upsert({
  where: { email },
  update: data,
  create: { email, ...data },
});

// For paid plans, ensure a matching Subscription record exists so the
// entitlements service recognises the plan (mock limits, feature gates etc.).
if (plan !== "BASIC") {
  await prisma.$transaction([
    prisma.subscription.updateMany({
      where: { userId: user.id, status: { in: ["ACTIVE", "PENDING"] } },
      data: { status: "EXPIRED", cancelledAt: new Date() },
    }),
    prisma.subscription.create({
      data: {
        userId: user.id,
        plan,
        cycle,
        status: "ACTIVE",
        provider: "MANUAL",
        providerRef: `script:${Date.now()}`,
        amount: 0,
        currency: "INR",
        currentPeriodEnd: (() => { const d = new Date(); d.setMonth(d.getMonth() + (cycle === "YEARLY" ? 12 : 1)); return d; })(),
      },
    }),
  ]);
}

console.log(
  `OK ${user.email} plan=${plan} name=${user.name ?? "-"} (${existing ? "updated" : "created"})`
);
await prisma.$disconnect();