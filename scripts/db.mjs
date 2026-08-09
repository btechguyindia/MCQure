// Local PostgreSQL lifecycle for development.
// Uses the PostgreSQL binaries bundled by the `@embedded-postgres/windows-x64`
// package, but drives them with `pg_ctl` so the server runs as a detached
// daemon (independent of this script's lifetime).
//
// Usage:
//   npm run db:start   -> initialise (once) + start + create app database
//   npm run db:stop    -> stop the cluster
//   npm run db:restart -> stop then start
//   npm run db:status  -> report whether the cluster is accepting connections
//   npm run db:wipe    -> stop and delete all local data (fresh start)
//
// `npm run dev` calls `db:ensure` first so the database is always available.

import { spawnSync } from "node:child_process";
import { existsSync, mkdirSync, openSync, rmSync, writeFileSync } from "node:fs";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";
import pg from "pg";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const DB_DIR = path.join(ROOT, ".data", "postgres");
const LOG_FILE = path.join(ROOT, ".data", "postgres.log");

const { initdb, pg_ctl } = await import("@embedded-postgres/windows-x64");

const USER = "postgres";
const PASSWORD = "postgres";
const PORT = 5433;
const DATABASE = "mcqure";

function run(cmd, args) {
  // Redirect all child output to a file (not inherited pipes) so that a
  // long-lived server daemon started by the command never keeps the caller's
  // stdout pipe open.
  const outFd = openSync(path.join(ROOT, ".data", "db-cmd.log"), "a");
  const res = spawnSync(cmd, args, { stdio: ["ignore", outFd, outFd] });
  if (res.error) throw res.error;
  if (res.status !== 0) {
    console.error(`[db] command failed (${res.status}): ${cmd} ${args.join(" ")}`);
    process.exit(res.status ?? 1);
  }
}

async function isUp() {
  const client = new pg.Client({
    host: "127.0.0.1",
    port: PORT,
    user: USER,
    password: PASSWORD,
    database: "postgres",
    connectionTimeoutMillis: 2000,
  });
  try {
    await client.connect();
    await client.end();
    return true;
  } catch {
    return false;
  }
}

function initCluster() {
  console.log(`[db] initialising cluster at ${DB_DIR}`);
  mkdirSync(DB_DIR, { recursive: true });
  const passwordFile = path.join(
    os.tmpdir(),
    `mcqure-pg-pw-${process.pid}.txt`
  );
  writeFileSync(passwordFile, `${PASSWORD}\n`);
  try {
    run(initdb, [
      `--pgdata=${DB_DIR}`,
      `--auth=password`,
      `--username=${USER}`,
      `--pwfile=${passwordFile}`,
      "--encoding=UTF8",
      "--locale=C",
      "--no-instructions",
    ]);
  } finally {
    try {
      rmSync(passwordFile, { force: true });
    } catch {}
  }
}

async function ensureDatabase() {
  const client = new pg.Client({
    host: "127.0.0.1",
    port: PORT,
    user: USER,
    password: PASSWORD,
    database: "postgres",
  });
  await client.connect();
  const res = await client.query(
    "SELECT 1 FROM pg_database WHERE datname = $1",
    [DATABASE]
  );
  if (res.rowCount === 0) {
    await client.query(
      `CREATE DATABASE "${DATABASE}" OWNER "${USER}" ENCODING 'UTF8'`
    );
    console.log(`[db] created database "${DATABASE}"`);
  } else {
    console.log(`[db] database "${DATABASE}" already exists`);
  }
  await client.end();
}

async function start() {
  if (await isUp()) {
    console.log(`[db] already running on 127.0.0.1:${PORT}`);
    return;
  }
  if (!existsSync(path.join(DB_DIR, "PG_VERSION"))) {
    initCluster();
  }
  console.log(`[db] starting postgres on 127.0.0.1:${PORT}`);
  mkdirSync(path.dirname(LOG_FILE), { recursive: true });
  run(pg_ctl, [
    "-D",
    DB_DIR,
    "-l",
    LOG_FILE,
    "-o",
    `-p ${PORT} -c autovacuum=off`,
    "-w",
    "start",
  ]);
  await ensureDatabase();
  console.log(`[db] ready: postgresql://${USER}@127.0.0.1:${PORT}/${DATABASE}`);
}

async function stop() {
  if (!(await isUp())) {
    console.log("[db] not running");
    return;
  }
  console.log("[db] stopping postgres");
  run(pg_ctl, ["-D", DB_DIR, "-m", "fast", "-w", "stop"]);
}

async function status() {
  if (await isUp()) {
    console.log(`[db] RUNNING on 127.0.0.1:${PORT}`);
  } else {
    console.log("[db] STOPPED (start with: npm run db:start)");
    process.exitCode = 1;
  }
}

const command = process.argv[2] ?? "status";
switch (command) {
  case "start":
    await start();
    break;
  case "restart":
    await stop();
    await start();
    break;
  case "stop":
    await stop();
    break;
  case "ensure":
    await start();
    break;
  case "status":
  default:
    await status();
    break;
  case "wipe":
    await stop();
    rmSync(DB_DIR, { recursive: true, force: true });
    rmSync(LOG_FILE, { force: true });
    console.log("[db] local data wiped");
    break;
}
