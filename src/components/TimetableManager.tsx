"use client";

import { useMemo, useState } from "react";
import { CheckIcon, ClockIcon, TargetIcon, XIcon } from "@/components/icons";

export type ScheduleCycle = "WEEKLY" | "BIWEEKLY" | "MONTHLY";

interface Slot {
  day: number;
  start: string;
  end: string;
  activity: string;
  topicId?: string;
}

export interface TimetableDTO {
  id: string;
  name: string;
  cycle: ScheduleCycle;
  targetQuestions: number;
  slots: Slot[];
  isActive: boolean;
}

export interface TimetableViewDTO {
  active: {
    id: string;
    name: string;
    cycle: ScheduleCycle;
    targetQuestions: number;
    slots: Slot[];
  } | null;
  cycleWindow: { start: string; end: string } | null;
  answeredThisCycle: number;
  today: { weekday: number; slots: Slot[] };
}

const DAY_LABELS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
const CYCLE_LABELS: Record<ScheduleCycle, string> = {
  WEEKLY: "Weekly",
  BIWEEKLY: "Bi-weekly",
  MONTHLY: "Monthly",
};

const SAMPLE_JSON = {
  cycle: "WEEKLY",
  targetQuestions: 175,
  slots: [
    { day: 0, start: "06:00", end: "07:30", activity: "Morning practice — weak topics" },
    { day: 2, start: "18:00", end: "19:00", activity: "PYQ review" },
    { day: 6, start: "10:00", end: "12:00", activity: "Full mock test" },
  ],
};

function fmtDay(iso: string): string {
  return new Date(iso).toLocaleDateString("en-IN", { day: "numeric", month: "short" });
}

function shortTime(t: string): string {
  const [h, m] = t.split(":").map(Number);
  const suffix = h >= 12 ? "pm" : "am";
  const hour = h % 12 === 0 ? 12 : h % 12;
  return m === 0 ? `${hour}${suffix}` : `${hour}:${String(m).padStart(2, "0")}${suffix}`;
}

interface Props {
  initialTimetables: TimetableDTO[];
  initialView: TimetableViewDTO;
}

type ApiResult = {
  ok: boolean;
  timetables?: TimetableDTO[];
  view?: TimetableViewDTO;
  message?: string;
};

export function TimetableManager({ initialTimetables, initialView }: Props) {
  const [timetables, setTimetables] = useState<TimetableDTO[]>(initialTimetables);
  const [view, setView] = useState<TimetableViewDTO>(initialView);
  const [editingId, setEditingId] = useState<string | null>(null); // null = new
  const [editorOpen, setEditorOpen] = useState(false);
  const [name, setName] = useState("");
  const [jsonText, setJsonText] = useState("");
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  const active = view.active;

  const slotsByDay = useMemo(() => {
    const map: Slot[][] = Array.from({ length: 7 }, () => []);
    for (const slot of active?.slots ?? []) {
      if (slot.day >= 0 && slot.day <= 6) map[slot.day].push(slot);
    }
    return map.map((list) => [...list].sort((a, b) => a.start.localeCompare(b.start)));
  }, [active]);

  function applyResult(data: ApiResult): boolean {
    if (!data.ok || !data.timetables || !data.view) {
      setMessage(data.message ?? "Something went wrong");
      return false;
    }
    setTimetables(data.timetables);
    setView(data.view);
    setMessage(null);
    return true;
  }

  async function call(method: string, url: string, body?: unknown): Promise<boolean> {
    setBusy(true);
    setMessage(null);
    try {
      const res = await fetch(url, {
        method,
        headers: body !== undefined ? { "Content-Type": "application/json" } : undefined,
        body: body !== undefined ? JSON.stringify(body) : undefined,
      });
      return applyResult((await res.json()) as ApiResult);
    } catch {
      setMessage("Network error. Please try again.");
      return false;
    } finally {
      setBusy(false);
    }
  }

  function openCreate() {
    setEditingId(null);
    setName("");
    setJsonText(JSON.stringify(SAMPLE_JSON, null, 2));
    setMessage(null);
    setEditorOpen(true);
  }

  function openEdit(tt: TimetableDTO) {
    setEditingId(tt.id);
    setName(tt.name);
    setJsonText(
      JSON.stringify(
        { cycle: tt.cycle, targetQuestions: tt.targetQuestions, slots: tt.slots },
        null,
        2
      )
    );
    setMessage(null);
    setEditorOpen(true);
  }

  async function save(e: React.FormEvent) {
    e.preventDefault();
    let plan: { cycle?: string; targetQuestions?: number; slots?: unknown };
    try {
      plan = JSON.parse(jsonText);
    } catch {
      setMessage("Schedule JSON is not valid JSON");
      return;
    }
    if (typeof plan !== "object" || plan === null || Array.isArray(plan)) {
      setMessage("Schedule JSON must be an object like the sample");
      return;
    }
    const payload = {
      name: name.trim(),
      ...(typeof (plan as Record<string, unknown>).cycle === "string"
        ? { cycle: (plan as Record<string, unknown>).cycle }
        : {}),
      ...(typeof (plan as Record<string, unknown>).targetQuestions === "number"
        ? { targetQuestions: (plan as Record<string, unknown>).targetQuestions }
        : {}),
      slots: (plan as Record<string, unknown>).slots,
    };
    const ok = editingId === null
      ? await call("POST", "/api/timetable", payload)
      : await call("PUT", `/api/timetable/${editingId}`, payload);
    if (ok) {
      setEditorOpen(false);
      setEditingId(null);
    }
  }

  const pct = active
    ? Math.min(100, (view.answeredThisCycle / Math.max(1, active.targetQuestions)) * 100)
    : 0;

  return (
    <div className="flex flex-col gap-6">
      {/* Active schedule + cycle progress */}
      <section className="card p-5 sm:p-6">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h2 className="section-title flex items-center gap-2">
              <ClockIcon className="h-4 w-4 text-brand" />
              Active schedule
            </h2>
            {active ? (
              <p className="mt-1 text-sm text-muted-fg">
                {active.name} · {CYCLE_LABELS[active.cycle]} ·{" "}
                {view.cycleWindow
                  ? `${fmtDay(view.cycleWindow.start)} – ${fmtDay(view.cycleWindow.end)}`
                  : ""}
              </p>
            ) : (
              <p className="mt-1 text-sm text-muted-fg">No timetable is active yet.</p>
            )}
          </div>
          {!editorOpen ? (
            <button type="button" onClick={openCreate} disabled={busy} className="btn btn-primary btn-sm">
              New timetable
            </button>
          ) : null}
        </div>

        {active ? (
          <>
            <div className="mt-4 max-w-xl">
              <p className="mb-1 text-xs text-subtle-fg">
                This cycle: <span className="stat-num">{view.answeredThisCycle}</span>/
                {active.targetQuestions} questions · resets{" "}
                {view.cycleWindow ? fmtDay(view.cycleWindow.end) : "—"}
              </p>
              <div className="progress">
                <div className="progress-bar" style={{ width: `${pct}%` }} />
              </div>
            </div>

            {/* Week grid */}
            <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-7">
              {DAY_LABELS.map((label, day) => {
                const isToday = view.today.weekday === day;
                return (
                  <div
                    key={label}
                    className={`rounded-xl border p-3 transition-colors ${
                      isToday ? "border-brand bg-brand-soft/40" : "border-line"
                    }`}
                  >
                    <p
                      className={`text-xs font-bold uppercase tracking-wide ${
                        isToday ? "text-brand" : "text-subtle-fg"
                      }`}
                    >
                      {label}
                    </p>
                    <ul className="mt-2 flex flex-col gap-1.5">
                      {slotsByDay[day].length === 0 ? (
                        <li className="text-xs text-subtle-fg">—</li>
                      ) : (
                        slotsByDay[day].map((slot, i) => (
                          <li key={i} className="rounded-lg bg-canvas px-2 py-1.5">
                            <p className="text-[0.65rem] font-semibold text-subtle-fg">
                              {shortTime(slot.start)}–{shortTime(slot.end)}
                            </p>
                            <p className="text-xs font-medium leading-snug text-ink">{slot.activity}</p>
                          </li>
                        ))
                      )}
                    </ul>
                  </div>
                );
              })}
            </div>
          </>
        ) : null}
      </section>

      {/* Editor */}
      {editorOpen ? (
        <form onSubmit={save} className="card p-5 sm:p-6">
          <div className="flex items-center justify-between">
            <h2 className="section-title flex items-center gap-2">
              <TargetIcon className="h-4 w-4 text-brand" />
              {editingId === null ? "New timetable" : "Edit timetable"}
            </h2>
            <button
              type="button"
              onClick={() => {
                setEditorOpen(false);
                setEditingId(null);
              }}
              className="text-xs font-semibold text-subtle-fg transition-colors hover:text-ink"
            >
              Close
            </button>
          </div>

          <div className="mt-4 grid gap-3 sm:max-w-md">
            <div>
              <label className="label">Name</label>
              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Morning routine"
                className="input"
                maxLength={80}
              />
            </div>
            <div>
              <label className="label">Schedule JSON</label>
              <textarea
                value={jsonText}
                onChange={(e) => setJsonText(e.target.value)}
                rows={14}
                spellCheck={false}
                className="input font-mono text-xs leading-relaxed"
              />
              <p className="mt-1 text-xs text-subtle-fg">
                Keys: <code>cycle</code> WEEKLY | BIWEEKLY | MONTHLY, <code>targetQuestions</code>{" "}
                (optional), <code>slots</code> with <code>day</code> 0=Mon…6=Sun,{" "}
                <code>start</code>/<code>end</code> HH:mm, <code>activity</code>, optional{" "}
                <code>topicId</code>.
              </p>
            </div>
          </div>

          {message ? <p className="field-error mt-3">{message}</p> : null}

          <div className="mt-4 flex gap-3">
            <button type="submit" disabled={busy} className="btn btn-primary">
              {busy ? "Saving…" : editingId === null ? "Create timetable" : "Save changes"}
            </button>
          </div>
        </form>
      ) : null}

      {/* Saved timetables */}
      <section className="flex flex-col gap-3">
        <h2 className="section-title">Your timetables ({timetables.length})</h2>
        {timetables.length === 0 && !editorOpen ? (
          <div className="card p-6 text-center">
            <p className="text-sm text-muted-fg">
              No timetables yet. Create one from the sample JSON above — weekly, bi-weekly or
              monthly.
            </p>
          </div>
        ) : (
          timetables.map((tt) => (
            <article key={tt.id} className="card flex flex-wrap items-center justify-between gap-3 p-4">
              <div className="min-w-0">
                <p className="flex flex-wrap items-center gap-2 text-sm font-semibold text-ink">
                  {tt.name}
                  <span className="chip">{CYCLE_LABELS[tt.cycle]}</span>
                  <span className="chip">{tt.slots.length} blocks</span>
                  {tt.isActive ? (
                    <span className="inline-flex items-center gap-1 chip border-brand text-brand">
                      <CheckIcon className="h-3 w-3" /> Active
                    </span>
                  ) : null}
                </p>
                <p className="mt-1 text-xs text-subtle-fg">
                  Target {tt.targetQuestions} questions per {CYCLE_LABELS[tt.cycle].toLowerCase()} cycle
                </p>
              </div>
              <div className="flex shrink-0 items-center gap-2">
                {!tt.isActive ? (
                  <button
                    type="button"
                    disabled={busy}
                    onClick={() => call("PUT", `/api/timetable/${tt.id}`, { isActive: true })}
                    className="btn btn-secondary btn-sm"
                  >
                    Activate
                  </button>
                ) : null}
                <button
                  type="button"
                  disabled={busy}
                  onClick={() => openEdit(tt)}
                  className="btn btn-secondary btn-sm"
                >
                  Edit
                </button>
                <button
                  type="button"
                  disabled={busy}
                  aria-label={`Delete ${tt.name}`}
                  onClick={() => {
                    if (confirm(`Delete "${tt.name}"? This cannot be undone.`)) {
                      void call("DELETE", `/api/timetable/${tt.id}`);
                    }
                  }}
                  className="btn btn-ghost btn-sm text-red-600 dark:text-red-400"
                >
                  <XIcon className="h-3.5 w-3.5" />
                  Delete
                </button>
              </div>
            </article>
          ))
        )}
      </section>
    </div>
  );
}
