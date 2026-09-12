import { jsonOk, isNextResponse, jsonError } from "@/lib/api";
import { requireAdmin } from "@/lib/admin";
import { isReadOnlyQuery, runSelectQuery } from "@/lib/admin-sql";

export async function POST(request: Request) {
  const admin = await requireAdmin();
  if (isNextResponse(admin)) return admin;
  if (!admin.isAdmin) return jsonError("Admin access required", 403);

  let body: { sql?: string };
  try {
    body = await request.json();
  } catch {
    return jsonError("Invalid JSON body");
  }

  const sql = (body.sql ?? "").trim();
  if (!sql) return jsonError("Query is empty");

  const guard = isReadOnlyQuery(sql);
  if (!guard.ok) return jsonError(guard.reason ?? "Query rejected");

  try {
    const result = await runSelectQuery(sql);
    const safeRows = result.rows.map((row) => {
      const out: Record<string, unknown> = {};
      for (const [k, v] of Object.entries(row)) {
        if (k === "passwordHash") { out[k] = "••••••••"; continue; }
        if (typeof v === "bigint") out[k] = Number(v);
        else if (v instanceof Date) out[k] = v.toISOString();
        else if (v instanceof Uint8Array) out[k] = Buffer.from(v).toString("hex");
        else out[k] = v;
      }
      return out;
    });
    return jsonOk({ columns: deriveColumns(safeRows), rows: safeRows, rowCount: result.rowCount, truncated: result.truncated, elapsedMs: result.elapsedMs });
  } catch (err) {
    return jsonError(err instanceof Error ? err.message : "Query failed");
  }
}

function deriveColumns(rows: Record<string, unknown>[]): string[] {
  if (rows.length === 0) return [];
  return Object.keys(rows[0]);
}