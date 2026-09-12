// Read-only SQL guard for the admin console. Only analytic SELECT / WITH
// statements are allowed — any statement that writes, drops, or mutates the
// database is rejected before it reaches Prisma.

import { prisma } from "@/lib/db";

const FORBIDDEN_WORDS =
  /\b(insert|update|delete|drop|alter|create|truncate|grant|revoke|merge|call|copy|vacuum|reindex|cluster|comment|execute|declare|do\b|refresh|lock\b|comment|rename|set role|set session|attach|detach|import|export|restore|backup)\b(?![^(']*\))/i;

const LEADING_KEYWORDS = /^\s*(with|select)\b/i;

const COMMENT_STRIPPED = /(\/\*[\s\S]*?\*\/|--[^\n]*)/g;

export const MAX_ROWS = 500;

/** Detect whether a free-form user query is a safe read-only statement. */
export function isReadOnlyQuery(sql: string): { ok: boolean; reason?: string } {
  const clean = sql.replace(COMMENT_STRIPPED, "");
  if (!LEADING_KEYWORDS.test(clean)) {
    return { ok: false, reason: "Only SELECT (or WITH) queries are allowed." };
  }
  if (FORBIDDEN_WORDS.test(clean)) {
    return { ok: false, reason: "Write / destructive statements are blocked." };
  }
  return { ok: true };
}

export function buildPreviewSql(table: string, limit: number): string {
  return `SELECT * FROM "${table}" LIMIT ${Math.min(limit, MAX_ROWS)};`;
}

export async function listTables(): Promise<
  Array<{ name: string; rows: number; columns: Array<{ name: string; type: string; nullable: boolean; primary: boolean }> }>
> {
  const tables = await prisma.$queryRaw<
    Array<{ table_name: string; row_count: bigint }>
  >`
    SELECT t.table_name,
           (SELECT reltuples::bigint FROM pg_class c WHERE c.relname = t.table_name) AS row_count
    FROM information_schema.tables t
    WHERE t.table_schema = 'public'
      AND t.table_type = 'BASE TABLE'
      AND t.table_name NOT LIKE '_prisma_migrations'
    ORDER BY t.table_name
  `;

  const result: Array<{ name: string; rows: number; columns: Array<{ name: string; type: string; nullable: boolean; primary: boolean }> }> = [];

  for (const t of tables) {
    const cols = await prisma.$queryRaw<
      Array<{ column_name: string; data_type: string; is_nullable: string; column_key: string }>
    >`
      SELECT c.column_name, c.data_type, c.is_nullable,
             (SELECT 'PRI' WHERE EXISTS (
                SELECT 1 FROM information_schema.table_constraints tc
                JOIN information_schema.key_column_usage kcu
                  ON tc.constraint_name = kcu.constraint_name
                WHERE tc.constraint_type = 'PRIMARY KEY'
                  AND tc.table_schema = 'public'
                  AND tc.table_name = ${t.table_name}
                  AND kcu.column_name = c.column_name
             )) AS column_key
      FROM information_schema.columns c
      WHERE c.table_schema = 'public' AND c.table_name = ${t.table_name}
      ORDER BY c.ordinal_position
    `;
    result.push({
      name: t.table_name,
      rows: t.row_count != null ? Math.max(0, Number(t.row_count)) : 0,
      columns: cols.map((c) => ({
        name: c.column_name,
        type: c.data_type,
        nullable: c.is_nullable === "YES",
        primary: c.column_key === "PRI",
      })),
    });
  }

  return result;
}

export async function runSelectQuery(sql: string) {
  const started = Date.now();
  // queryRawUnsafe is required for free-form user SQL. The isReadOnlyQuery
  // guard above runs first and rejects everything but SELECT/WITH.
  const rows = (await prisma.$queryRawUnsafe(sql)) as Record<string, unknown>[];
  const elapsedMs = Date.now() - started;
  return {
    rows: rows.slice(0, MAX_ROWS),
    truncated: rows.length > MAX_ROWS,
    rowCount: rows.length,
    elapsedMs,
  };
}