// Set or revoke admin access for a user.
//
// Usage:
//   node scripts/set-admin.mjs <email> [--admin true|false]

import "dotenv/config";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const args = process.argv.slice(2);
const email = args[0];

if (!email || !email.includes("@")) {
  console.error("Usage: node scripts/set-admin.mjs <email> [--admin true|false]");
  process.exit(1);
}

function flag(name) {
  const i = args.indexOf(name);
  return i >= 0 ? args[i + 1] : undefined;
}

const adminStr = (flag("--admin") ?? "true").toLowerCase();
const isAdmin = adminStr === "true" || adminStr === "1" || adminStr === "yes";

const user = await prisma.user.findUnique({ where: { email } });
if (!user) {
  console.error(`User ${email} not found.`);
  process.exit(1);
}

await prisma.user.update({ where: { email }, data: { isAdmin } });
console.log(`OK ${email} isAdmin=${isAdmin}`);
await prisma.$disconnect();
