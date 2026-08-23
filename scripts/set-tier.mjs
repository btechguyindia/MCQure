// Manage account tiers and demo/premium users.
//
// Usage:
//   node scripts/set-tier.mjs <email> [--tier GOLD|SILVER|FREE] [--name "Name"] [--password "pw"]
//
// Creates the user if they don't exist (requires --password), otherwise
// updates only the provided fields.

import "dotenv/config";
import { PrismaClient } from "@prisma/client";
import { hash } from "bcryptjs";

const prisma = new PrismaClient();

const args = process.argv.slice(2);
const email = args[0];

if (!email || !email.includes("@")) {
  console.error("Usage: node scripts/set-tier.mjs <email> [--tier GOLD|SILVER|FREE] [--name \"Name\"] [--password \"pw\"]");
  process.exit(1);
}

function flag(name) {
  const i = args.indexOf(name);
  return i >= 0 ? args[i + 1] : undefined;
}

const TIER = flag("--tier")?.toUpperCase();
const name = flag("--name");
const password = flag("--password");

if (TIER && !["FREE", "SILVER", "GOLD"].includes(TIER)) {
  console.error("Invalid tier. Use FREE, SILVER or GOLD.");
  process.exit(1);
}

const data = {};
if (TIER) data.tier = TIER;
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

console.log(
  `OK ${user.email} tier=${user.tier} name=${user.name ?? "-"} (${existing ? "updated" : "created"})`
);
await prisma.$disconnect();
