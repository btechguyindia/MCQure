"use client";

import { useCallback, useEffect, useState } from "react";
import {
  BankIcon,
  CheckIcon,
  ClockIcon,
  CogIcon,
  FlagIcon,
  HistoryIcon,
  PlayIcon,
  SparklesIcon,
  XIcon,
} from "@/components/icons";

interface Column {
  name: string;
  type: string;
  nullable: boolean;
  primary: boolean;
}

interface TableMeta {
  name: string;
  rows: number;
  columns: Column[];
}

interface SchemaResponse {
  ok: boolean;
  tables?: TableMeta[];
  userJoinTables?: string[];
  message?: string;
}

interface QueryResult {
  ok: boolean;
  columns?: string[];
  rows?: Record<string, unknown>[];
  rowCount?: number;
  truncated?: boolean;
  elapsedMs?: number;
  message?: string;
}

interface QuerySuccess extends QueryResult {
  ok: true;
  columns: string[];
  rows: Record<string, unknown>[];
  rowCount: number;
  truncated: boolean;
  elapsedMs: number;
}

// Logical ordering of key fields for nicer result grids.
const FIELD_PRIORITY: Record<string, number> = {
  email: 0, name: 1, tier: 2, isAdmin: 3, subject: 4, topic: 5, subjectId: 60, topicId: 61,
  userId: 10, questionId: 11, sessionId: 12, paperId: 13, sectionId: 14, sourceId: 15,
  plan: 20, status: 21, provider: 22, amount: 23, currency: 24, cycle: 25,
  id: 100, createdAt: 110, updatedAt: 111, startedAt: 112, endedAt: 113, completionDate: 114,
};

function sortColumns(columns: string[]): string[] {
  return [...columns].sort((a, b) => {
    const pa = FIELD_PRIORITY[a] ?? 999;
    const pb = FIELD_PRIORITY[b] ?? 999;
    return pa - pb;
  });
}

function friendlyType(t: string): string {
  if (t.includes("character") || t.includes("text")) return "text";
  if (t.includes("bigint")) return "integer";
  if (t.includes("timestamp")) return "datetime";
  if (t === "json" || t === "jsonb") return "json";
  if (t === "boolean") return "bool";
  if (t === "numeric" || t.includes("int") || t.includes("real") || t.includes("double")) return "number";
  return t;
}

const DEFAULT_QUERY = `-- Type a query, press Run. Only SELECT / WITH are allowed.
-- Example: every user, their attempts and accuracy
SELECT
  u.email,
  u.name,
  u.tier,
  COUNT(a.id)  AS "Attempts",
  ROUND(100.0 * SUM(CASE WHEN a."isCorrect" THEN 1 ELSE 0 END) / NULLIF(SUM(CASE WHEN a."isCorrect" IS NOT NULL THEN 1 ELSE 0 END), 0), 1) AS "Accuracy %"
FROM "User" u
LEFT JOIN "Attempt" a ON a."userId" = u.id
GROUP BY u.id
ORDER BY "Attempts" DESC
LIMIT 50;`;

export function SqlConsole() {
  const [tables, setTables] = useState<TableMeta[]>([]);
  const [userJoinTables, setUserJoinTables] = useState<string[]>([]);
  const [schemaError, setSchemaError] = useState<string | null>(null);

  const [sql, setSql] = useState(DEFAULT_QUERY);
  const [running, setRunning] = useState(false);
  const [result, setResult] = useState<QuerySuccess | null>(null);
  const [queryError, setQueryError] = useState<string | null>(null);

  // schema
  useEffect(() => {
    fetch("/api/admin/db/schema")
      .then((r) => r.json() as Promise<SchemaResponse>)
      .then((d) => {
        if (d.ok && d.tables) {
          setTables(d.tables);
          setUserJoinTables(d.userJoinTables ?? []);
        } else setSchemaError(d.message ?? "Could not load schema");
      })
      .catch(() => setSchemaError("Could not load schema"));
  }, []);

  const runQuery = useCallback(async (query: string) => {
    setRunning(true);
    setQueryError(null);
    setResult(null);
    try {
      const r = await fetch("/api/admin/db/query", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sql: query }),
      });
      const d = (await r.json()) as QueryResult;
      if (d.ok && d.columns && d.rows && d.elapsedMs != null && d.rowCount != null) {
        const ordered = sortColumns(d.columns);
        setResult({
          ok: true,
          columns: ordered,
          rows: d.rows.map((row) => {
            const obj: Record<string, unknown> = {};
            for (const c of ordered) obj[c] = row[c];
            return obj;
          }),
          rowCount: d.rowCount,
          truncated: d.truncated ?? false,
          elapsedMs: d.elapsedMs,
        });
      } else {
        setQueryError(d.message ?? "Query failed");
      }
    } catch {
      setQueryError("Network error");
    } finally {
      setRunning(false);
    }
  }, []);

  // Example queries for quick exploration
  const examples: Record<string, string> = {
    "All users": `SELECT u.email, u.name, u.tier, u."isAdmin", u."createdAt" FROM "User" u ORDER BY u."createdAt" DESC;`,
    "Users with emails + attempts": `SELECT u.email, COUNT(a.id) AS attempts, SUM(CASE WHEN a."isCorrect" THEN 1 ELSE 0 END) AS correct FROM "User" u LEFT JOIN "Attempt" a ON a."userId" = u.id GROUP BY u.id ORDER BY attempts DESC;`,
    "User emails + questions answered": `SELECT u.email, u.name, COUNT(q.id) AS "questions in bank" FROM "User" u JOIN "Attempt" a ON a."userId" = u.id JOIN "Question" q ON q.id = a."questionId" GROUP BY u.id ORDER BY "questions in bank" DESC;`,
    "Most practiced subjects": `SELECT s.name AS subject, COUNT(q.id) AS questions FROM "Subject" s LEFT JOIN "Question" q ON q."subjectId" = s.id GROUP BY s.id ORDER BY questions DESC;`,
    "Active subscriptions w/ emails": `SELECT u.email, s.plan, s.status, s.amount, s.currency, s."currentPeriodEnd" FROM "Subscription" s JOIN "User" u ON u.id = s."userId" WHERE s.status = 'ACTIVE' ORDER BY s."currentPeriodEnd" DESC;`,
    "All study visits w/ emails": `SELECT u.email, t.name AS topic, sv.source, sv."createdAt" FROM "StudyVisit" sv JOIN "User" u ON u.id = sv."userId" JOIN "Topic" t ON t.id = sv."topicId" ORDER BY sv."createdAt" DESC LIMIT 100;`,
    "All goals w/ emails": `SELECT u.email, g.type, g.target, g.current, g."examDate" FROM "Goal" g JOIN "User" u ON u.id = g."userId" ORDER BY g."createdAt" DESC;`,
  };

  return (
    <div className="flex flex-col gap-5">
      {/* Schema region */}
      <section className="card p-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 className="section-title flex items-center gap-2">
            <BankIcon className="h-3.5 w-3.5 text-brand" />
            Database Schema — {tables.length} tables
          </h2>
          <span className="chip">Read-only · SELECT / WITH only</span>
        </div>

        {schemaError && (
          <p className="mt-3 inline-flex items-center gap-2 text-sm text-bad"><XIcon /> {schemaError}</p>
        )}

        <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
          {tables.length === 0 && !schemaError && (
            <div className="skeleton h-10 w-full" />
          )}
          {tables.map((t) => (
            <details key={t.name} className="group rounded-xl border border-line bg-canvas">
              <summary className="flex cursor-pointer items-center justify-between gap-2 px-3 py-2">
                <span className="flex items-center gap-2 font-mono text-sm font-semibold text-ink">
                  <FlagIcon className="h-3.5 w-3.5 text-brand" />
                  {t.name}
                </span>
                <span className="flex items-center gap-2">
                  <span className="chip">{t.rows.toLocaleString()} rows</span>
                  <span className="text-xs text-subtle-fg group-open:hidden">▸</span>
                </span>
              </summary>
              <div className="border-t border-line px-3 py-2 font-mono text-xs">
                {t.columns.map((c) => (
                  <div key={c.name} className="flex items-center justify-between gap-2 py-0.5">
                    <span className="flex items-center gap-1.5">
                      {c.primary && <span className="text-gold" title="Primary key">PK</span>}
                      <span className="text-ink">{c.name}</span>
                    </span>
                    <span className="text-subtle-fg">
                      {friendlyType(c.type)}
                      {c.nullable && <span className="text-warn"> · null</span>}
                    </span>
                  </div>
                ))}
                <div className="mt-2 flex flex-wrap gap-1.5">
                  <button
                    type="button"
                    onClick={() => {
                      const q =
                        t.name === "User"
                          ? `SELECT * FROM "User" LIMIT 100;`
                          : userJoinTables.includes(t.name)
                            ? `SELECT t.*, u.email FROM "${t.name}" t LEFT JOIN "User" u ON u.id = t."userId" LIMIT 100;`
                            : `SELECT * FROM "${t.name}" LIMIT 100;`;
                      setSql(q);
                      runQuery(q);
                    }}
                    className="inline-flex items-center gap-1.5 rounded-lg border border-line-strong px-2 py-1 text-xs font-semibold text-brand hover:bg-brand-soft"
                  >
                    <PlayIcon className="h-3 w-3" /> {userJoinTables.includes(t.name) && t.name !== "User" ? "Query with email" : "Query all columns"}
                  </button>
                  {userJoinTables.includes(t.name) && t.name !== "User" && (
                    <button
                      type="button"
                      onClick={() => {
                        const q = `SELECT * FROM "${t.name}" LIMIT 100;`;
                        setSql(q);
                        runQuery(q);
                      }}
                      className="inline-flex items-center gap-1.5 rounded-lg border border-line px-2 py-1 text-xs font-medium text-muted-fg hover:border-line-strong"
                    >
                      Raw
                    </button>
                  )}
                </div>
                {userJoinTables.includes(t.name) && (
                  <p className="mt-2 flex items-center gap-1 text-[11px] text-ok">
                    <CheckIcon className="h-3 w-3" /> Joins to User — email shown in every row
                  </p>
                )}
              </div>
            </details>
          ))}
        </div>
      </section>

      {/* Query editor */}
      <section className="card p-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 className="section-title flex items-center gap-2">
            <SparklesIcon className="h-3.5 w-3.5 text-brand" />
            SQL Query Editor
          </h2>
          <div className="flex flex-wrap gap-2">
            {Object.keys(examples).map((label) => (
              <button
                key={label}
                type="button"
                onClick={() => { setSql(String(examples[label])); setResult(null); setQueryError(null); }}
                className="rounded-lg border border-line bg-canvas px-2 py-1 text-xs font-medium text-muted-fg hover:border-brand hover:text-brand"
              >
                {label}
              </button>
            ))}
          </div>
        </div>

        <div className="mt-3 rounded-xl border border-line-strong bg-canvas p-2">
          <textarea
            value={sql}
            onChange={(e) => setSql(e.target.value)}
            spellCheck={false}
            rows={8}
            className="w-full resize-y bg-transparent font-mono text-sm leading-relaxed text-ink outline-none"
            placeholder="SELECT …"
          />
          <div className="flex items-center justify-between gap-2 border-t border-line pt-2">
            <span className="flex items-center gap-3 text-xs text-subtle-fg">
              <span className="inline-flex items-center gap-1"><ClockIcon className="h-3 w-3" /> {running ? "Running…" : result ? `${result.elapsedMs}ms` : "Ready"}</span>
              {result && (
                <span className="inline-flex items-center gap-1">
                  {result.rowCount.toLocaleString()} row{result.rowCount === 1 ? "" : "s"}
                  {result.truncated && <span className="text-warn"> (showing {result.rows.length})</span>}
                </span>
              )}
            </span>
            <button
              type="button"
              onClick={() => runQuery(sql)}
              disabled={running || !sql.trim()}
              className="btn btn-primary btn-sm shadow-glow"
            >
              {running ? "Running…" : "Run"}
              {!running && <PlayIcon className="h-3.5 w-3.5" />}
            </button>
          </div>
        </div>

        {queryError && (
          <p className="mt-3 inline-flex items-center gap-2 text-sm text-bad"><XIcon /> {queryError}</p>
        )}
      </section>

      {/* Results */}
      {result && (
        <section className="card p-0 overflow-hidden">
          <div className="flex items-center justify-between border-b border-line px-5 py-3">
            <h2 className="section-title flex items-center gap-2">
              <HistoryIcon className="h-3.5 w-3.5 text-brand" />
              Query Results
            </h2>
            <span className="chip">{result.columns.length} col · {result.rowCount} row{result.rowCount === 1 ? "" : "s"}</span>
          </div>
          <div className="overflow-x-auto max-h-120">
            <table className="table-clean">
              <thead className="sticky top-0 bg-card">
                <tr>
                  {result.columns.map((c) => (
                    <th key={c} className="whitespace-nowrap font-mono">{c}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {result.rows.map((row, i) => (
                  <tr key={i}>
                    {result.columns.map((c) => {
                      const v = row[c];
                      const display =
                        v == null ? <span className="text-subtle-fg">NULL</span> :
                        typeof v === "object" ? JSON.stringify(v) :
                        String(v);
                      const isEmail = c === "email" && typeof v === "string" && v.includes("@");
                      const isDate = c.toLowerCase().includes("date") || c.toLowerCase().includes("at");
                      return (
                        <td key={c} className="whitespace-nowrap align-top">
                          {isEmail ? (
                            <a href={`mailto:${v}`} className="link">{display}</a>
                          ) : isDate && typeof v === "string" ? (
                            <span className="tabular-nums text-muted-fg">{new Date(v).toLocaleString()}</span>
                          ) : (
                            <span className={typeof v === "number" ? "tabular-nums" : ""}>{display}</span>
                          )}
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}

      {/* Footer hint */}
      <section className="card p-4">
        <p className="flex items-center gap-2 text-xs text-muted-fg">
          <CogIcon className="h-3.5 w-3.5 text-brand" />
          <span>
            <strong className="text-ink">Only you</strong> can run queries — every request is verified against your admin session.
            Only <code className="kbd">SELECT</code> / <code className="kbd">WITH</code> statements are executed; writes are blocked server-side.
            Results are capped at 500 rows.
          </span>
        </p>
      </section>
    </div>
  );
}