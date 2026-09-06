// Mirrors the offline bank (data/bank) into public/bank so Next.js serves the
// bundles statically at /bank/** — the client can fetch a topic bundle without
// any API call, keeping practice fully offline (per-project decision).
//
// Usage: node scripts/mirror-bank.mjs [source] [dest]

import { cpSync, existsSync, mkdirSync, rmSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.dirname(path.dirname(fileURLToPath(import.meta.url)));
const source = process.argv[2] || path.join(root, "data", "bank");
const dest = process.argv[3] || path.join(root, "public", "bank");

if (!existsSync(source)) {
  console.error(`[mirror] source missing: ${source}`);
  process.exit(1);
}

mkdirSync(path.dirname(dest), { recursive: true });
rmSync(dest, { recursive: true, force: true });
cpSync(source, dest, { recursive: true });
console.log(`[mirror] ${source} -> ${dest}`);