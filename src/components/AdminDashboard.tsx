"use client";

import { useEffect, useState, useCallback } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Line,
  LineChart,
  PieChart,
  Pie,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import {
  AnalyticsIcon,
  BankIcon,
  FlagIcon,
  HistoryIcon,
  LockIcon,
  SparklesIcon,
  TargetIcon,
  XIcon,
} from "@/components/icons";

type Tab = "overview" | "users" | "questions" | "activity" | "mocks" | "subscriptions" | "engagement" | "ingestion";

const TABS: { key: Tab; label: string }[] = [
  { key: "overview", label: "Overview" },
  { key: "users", label: "Users" },
  { key: "questions", label: "Questions" },
  { key: "activity", label: "Activity" },
  { key: "mocks", label: "Mock Tests" },
  { key: "subscriptions", label: "Subscriptions" },
  { key: "engagement", label: "Engagement" },
  { key: "ingestion", label: "Ingestion" },
];

const TICK = { fill: "var(--mcq-subtle)", fontSize: 11 };
const TOOLTIP_STYLE = {
  background: "var(--mcq-card)",
  border: "1px solid var(--mcq-line)",
  borderRadius: 12,
  color: "var(--mcq-fg)",
  boxShadow: "var(--shadow-lift)",
  fontSize: 12,
};

const PIE_COLORS = ["var(--mcq-brand)", "var(--mcq-accent)", "var(--mcq-warn)", "var(--mcq-bad)", "var(--mcq-ok)", "#8b5cf6", "#f97316", "#06b6d4"];

interface StatsData {
  stats: {
    users: { total: number; last30d: number; last7d: number };
    questions: {
      total: number; active: number;
      bySource: Array<{ source: string; count: number }>;
      byDifficulty: Array<{ difficulty: string; count: number }>;
      byQuality: Array<{ status: string; count: number }>;
    };
    attempts: {
      total: number; last24h: number; last7d: number;
      byDay: Array<{ day: string; attempts: number; accuracy: number | null }>;
    };
    sessions: { total: number };
    mockRuns: { total: number };
    subscriptions: { active: number; totalRevenue: number };
    tiers: Array<{ tier: string; count: number }>;
  };
}

interface UsersData {
  users: Array<{
    id: string; email: string; name: string | null; tier: string; isAdmin: boolean;
    createdAt: string; attemptCount: number; sessionCount: number; mockCount: number;
    accuracy: number | null;
    subscription: { plan: string; amount: number; currency: string; provider: string; expiresAt: string } | null;
  }>;
}

interface QuestionsData {
  questions: {
    total: number;
    bySource: Array<{ source: string; count: number }>;
    byDifficulty: Array<{ difficulty: string; count: number }>;
    byQuality: Array<{ status: string; count: number }>;
    bySubject: Array<{ subject: string; count: number; avgRelevance: number | null }>;
    topAttempted: Array<{
      id: string; text: string; subject: string; topic: string; difficulty: string;
      sourceType: string; timesAttempted: number; timesCorrect: number; timesIncorrect: number;
      avgResponseTimeMs: number; examRelevance: number; qualityStatus: string; accuracy: number | null;
    }>;
    leastAttempted: Array<{
      id: string; text: string; subject: string; topic: string; difficulty: string;
      sourceType: string; timesAttempted: number; qualityStatus: string;
    }>;
    duplicates: Array<{ method: string; count: number; avgSimilarity: number | null }>;
    totalReports: number;
  };
  ingestionJobs: Array<{
    id: string; kind: string; status: string; requested: number; processed: number;
    accepted: number; rejected: number; error: string | null;
    createdAt: string; completedAt: string | null;
  }>;
}

interface SubscriptionsData {
  subscriptions: Array<{
    id: string; plan: string; cycle: string; status: string; provider: string;
    providerRef: string | null; amount: number; currency: string;
    currentPeriodEnd: string; cancelledAt: string | null; createdAt: string;
    user: { id: string; email: string; name: string | null };
  }>;
  breakdown: {
    byPlan: Array<{ plan: string; count: number; totalAmount: number }>;
    byStatus: Array<{ status: string; count: number }>;
    byProvider: Array<{ provider: string; count: number; totalAmount: number }>;
    revenueByPlan: Array<{ plan: string; activeCount: number; revenue: number }>;
  };
}

export function AdminDashboard() {
  const [tab, setTab] = useState<Tab>("overview");
  const [stats, setStats] = useState<StatsData["stats"] | null>(null);
  const [users, setUsers] = useState<UsersData["users"]>([]);
  const [questions, setQuestions] = useState<QuestionsData["questions"] | null>(null);
  const [jobs, setJobs] = useState<QuestionsData["ingestionJobs"]>([]);
  const [subs, setSubs] = useState<SubscriptionsData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchTab = useCallback(async (t: Tab) => {
    setLoading(true);
    setError(null);
    try {
      if (t === "overview") {
        const r = await fetch("/api/admin/stats");
        const d = await r.json();
        if (d.ok) setStats(d.stats);
        else setError(d.message ?? "Failed to load stats");
      } else if (t === "users") {
        const r = await fetch("/api/admin/users");
        const d = await r.json();
        if (d.ok) setUsers(d.users);
        else setError(d.message ?? "Failed to load users");
      } else if (t === "questions" || t === "ingestion") {
        const r = await fetch("/api/admin/questions");
        const d = await r.json();
        if (d.ok) {
          setQuestions(d.questions);
          setJobs(d.ingestionJobs);
        } else setError(d.message ?? "Failed to load questions");
      } else if (t === "subscriptions") {
        const r = await fetch("/api/admin/subscriptions");
        const d = await r.json();
        if (d.ok) setSubs(d);
        else setError(d.message ?? "Failed to load subscriptions");
      } else {
        // activity, mocks, engagement — pull from stats + questions
        const [sR, qR] = await Promise.all([fetch("/api/admin/stats"), fetch("/api/admin/questions")]);
        const [sD, qD] = await Promise.all([sR.json(), qR.json()]);
        if (sD.ok) setStats(sD.stats);
        if (qD.ok) { setQuestions(qD.questions); setJobs(qD.ingestionJobs); }
      }
    } catch {
      setError("Network error");
    } finally {
      setLoading(false);
    }
  }, []);

  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => { fetchTab(tab); }, [tab, fetchTab]);

  if (error) {
    return (
      <div className="card p-6 text-center" role="alert">
        <p className="inline-flex items-center gap-2 text-sm font-medium text-bad">
          <XIcon /> {error}
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      {/* Tab bar */}
      <div className="flex flex-wrap gap-1 rounded-2xl border border-line bg-card p-1">
        {TABS.map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={`rounded-xl px-3 py-1.5 text-xs font-semibold transition-colors ${
              tab === t.key
                ? "bg-brand text-on-brand shadow-glow"
                : "text-muted-fg hover:bg-brand-soft hover:text-fg"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {loading && !stats && !users.length && !questions && !subs ? (
        <div className="flex flex-col gap-4">
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            {Array.from({ length: 8 }, (_, i) => (
              <div key={i} className="card p-4">
                <div className="skeleton mx-auto h-7 w-14" />
                <div className="skeleton mx-auto mt-2 h-2.5 w-20" />
              </div>
            ))}
          </div>
          <div className="card p-5"><div className="skeleton h-56" /></div>
        </div>
      ) : (
        <>
          {tab === "overview" && stats && <OverviewTab stats={stats} />}
          {tab === "users" && <UsersTab users={users} />}
          {tab === "questions" && questions && <QuestionsTab questions={questions} />}
          {tab === "activity" && stats && <ActivityTab stats={stats} />}
          {tab === "mocks" && stats && <MocksTab stats={stats} />}
          {tab === "subscriptions" && subs && <SubscriptionsTab data={subs} />}
          {tab === "engagement" && questions && <EngagementTab questions={questions} />}
          {tab === "ingestion" && <IngestionTab jobs={jobs} />}
        </>
      )}
    </div>
  );
}

// ── Overview ─────────────────────────────────────────────────────────────────
function OverviewTab({ stats }: { stats: StatsData["stats"] }) {
  const tierPie = stats.tiers.map((t) => ({ name: t.tier, value: t.count }));
  return (
    <div className="flex flex-col gap-6">
      <div className="stagger grid grid-cols-2 gap-3 sm:grid-cols-4">
        <KpiCard label="Total Users" value={String(stats.users.total)} sub={`+${stats.users.last7d} this week`} />
        <KpiCard label="Total Questions" value={String(stats.questions.total)} sub={`${stats.questions.active} active`} />
        <KpiCard label="Total Attempts" value={String(stats.attempts.total)} sub={`${stats.attempts.last24h} today`} />
        <KpiCard label="Sessions" value={String(stats.sessions.total)} />
        <KpiCard label="Mock Tests" value={String(stats.mockRuns.total)} />
        <KpiCard label="Active Subs" value={String(stats.subscriptions.active)} />
        <KpiCard label="Revenue" value={`₹${stats.subscriptions.totalRevenue.toLocaleString()}`} />
        <KpiCard label="7d Attempts" value={String(stats.attempts.last7d)} />
      </div>

      {/* Attempts trend */}
      <section className="card p-5">
        <h2 className="section-title flex items-center gap-2">
          <AnalyticsIcon className="h-3.5 w-3.5 text-brand" />
          Attempts — last 14 days
        </h2>
        <div className="mt-4 h-56">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={stats.attempts.byDay} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--mcq-line)" />
              <XAxis dataKey="day" tick={TICK} tickLine={false} axisLine={{ stroke: "var(--mcq-line)" }} interval="preserveStartEnd" />
              <YAxis tick={TICK} tickLine={false} axisLine={false} />
              <Tooltip contentStyle={TOOLTIP_STYLE} cursor={{ fill: "var(--mcq-brand-soft)" }} />
              <Bar dataKey="attempts" radius={[4, 4, 0, 0]} fill="var(--mcq-brand)" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </section>

      {/* Tier distribution */}
      {tierPie.length > 0 && (
        <div className="grid gap-4 sm:grid-cols-2">
          <section className="card p-5">
            <h2 className="section-title">User tier distribution</h2>
            <div className="mt-4 h-56">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={tierPie} cx="50%" cy="50%" outerRadius={80} dataKey="value" label={({ name, value }) => `${name}: ${value}`}>
                    {tierPie.map((_, i) => <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />)}
                  </Pie>
                  <Tooltip contentStyle={TOOLTIP_STYLE} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </section>
          <section className="card p-5">
            <h2 className="section-title">Question difficulty breakdown</h2>
            <div className="mt-4 h-56">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={stats.questions.byDifficulty.map((d) => ({ name: d.difficulty, value: d.count }))}
                    cx="50%" cy="50%" outerRadius={80} dataKey="value"
                    label={({ name, value }) => `${name}: ${value}`}
                  >
                    {stats.questions.byDifficulty.map((_, i) => <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />)}
                  </Pie>
                  <Tooltip contentStyle={TOOLTIP_STYLE} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </section>
        </div>
      )}
    </div>
  );
}

// ── Users ────────────────────────────────────────────────────────────────────
function UsersTab({ users }: { users: UsersData["users"] }) {
  return (
    <section className="card p-5 overflow-x-auto">
      <h2 className="section-title flex items-center gap-2 mb-4">
        <TargetIcon className="h-3.5 w-3.5 text-brand" />
        All Users ({users.length})
      </h2>
      <table className="table-clean">
        <thead>
          <tr>
            <th>Name</th>
            <th>Email</th>
            <th>Tier</th>
            <th>Admin</th>
            <th className="text-right">Attempts</th>
            <th className="text-right">Accuracy</th>
            <th className="text-right">Sessions</th>
            <th className="text-right">Mocks</th>
            <th>Joined</th>
          </tr>
        </thead>
        <tbody>
          {users.map((u) => (
            <tr key={u.id}>
              <td className="font-medium">{u.name ?? "—"}</td>
              <td className="text-muted-fg">{u.email}</td>
              <td><TierBadge tier={u.tier} /></td>
              <td>{u.isAdmin ? <span className="badge badge-ok">Admin</span> : "—"}</td>
              <td className="text-right tabular-nums">{u.attemptCount.toLocaleString()}</td>
              <td className="text-right tabular-nums">{u.accuracy != null ? `${u.accuracy}%` : "—"}</td>
              <td className="text-right tabular-nums">{u.sessionCount}</td>
              <td className="text-right tabular-nums">{u.mockCount}</td>
              <td className="text-muted-fg">{new Date(u.createdAt).toLocaleDateString()}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </section>
  );
}

// ── Questions ────────────────────────────────────────────────────────────────
function QuestionsTab({ questions }: { questions: QuestionsData["questions"] }) {
  return (
    <div className="flex flex-col gap-6">
      {/* Source breakdown */}
      <div className="grid gap-4 sm:grid-cols-3">
        <PieCard title="By Source" data={questions.bySource.map((s) => ({ name: s.source, value: s.count }))} />
        <PieCard title="By Difficulty" data={questions.byDifficulty.map((d) => ({ name: d.difficulty, value: d.count }))} />
        <PieCard title="By Quality" data={questions.byQuality.map((q) => ({ name: q.status, value: q.count }))} />
      </div>

      {/* Subject breakdown */}
      {questions.bySubject.length > 0 && (
        <section className="card p-5">
          <h2 className="section-title mb-3">Questions by subject</h2>
          <div className="h-56">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={questions.bySubject} layout="vertical" margin={{ top: 0, right: 20, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--mcq-line)" horizontal={false} />
                <XAxis type="number" tick={TICK} tickLine={false} axisLine={false} />
                <YAxis dataKey="subject" type="category" tick={TICK} tickLine={false} axisLine={false} width={120} />
                <Tooltip contentStyle={TOOLTIP_STYLE} />
                <Bar dataKey="count" radius={[0, 4, 4, 0]} fill="var(--mcq-brand)" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </section>
      )}

      {/* Top attempted */}
      <section className="card p-5 overflow-x-auto">
        <h2 className="section-title mb-3">Most attempted questions</h2>
        <table className="table-clean">
          <thead>
            <tr>
              <th>Question</th>
              <th>Subject</th>
              <th>Difficulty</th>
              <th>Source</th>
              <th className="text-right">Attempts</th>
              <th className="text-right">Accuracy</th>
              <th className="text-right">Avg Time</th>
              <th>Quality</th>
            </tr>
          </thead>
          <tbody>
            {questions.topAttempted.map((q) => (
              <tr key={q.id}>
                <td className="max-w-xs truncate">{q.text}</td>
                <td className="text-muted-fg">{q.subject}</td>
                <td><DifficultyBadge d={q.difficulty} /></td>
                <td className="text-muted-fg">{q.sourceType}</td>
                <td className="text-right tabular-nums">{q.timesAttempted}</td>
                <td className="text-right tabular-nums">{q.accuracy != null ? `${q.accuracy}%` : "—"}</td>
                <td className="text-right tabular-nums">{(q.avgResponseTimeMs / 1000).toFixed(1)}s</td>
                <td><QualityBadge s={q.qualityStatus} /></td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>

      {/* Duplicates */}
      {questions.duplicates.length > 0 && (
        <section className="card p-5">
          <h2 className="section-title mb-3 flex items-center gap-2">
            <FlagIcon className="h-3.5 w-3.5 text-warn" />
            Duplicate groups ({questions.totalReports} reports)
          </h2>
          <div className="flex flex-wrap gap-2">
            {questions.duplicates.map((d) => (
              <div key={d.method} className="chip">
                {d.method}: {d.count} pairs
                {d.avgSimilarity != null && <span className="text-subtle-fg"> (avg {Math.round(d.avgSimilarity * 100)}%)</span>}
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}

// ── Activity ─────────────────────────────────────────────────────────────────
function ActivityTab({ stats }: { stats: StatsData["stats"] }) {
  return (
    <div className="flex flex-col gap-6">
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <KpiCard label="Total Attempts" value={String(stats.attempts.total)} />
        <KpiCard label="Last 24h" value={String(stats.attempts.last24h)} />
        <KpiCard label="Last 7d" value={String(stats.attempts.last7d)} />
        <KpiCard label="Sessions" value={String(stats.sessions.total)} />
      </div>
      <section className="card p-5">
        <h2 className="section-title flex items-center gap-2 mb-4">
          <HistoryIcon className="h-3.5 w-3.5 text-brand" />
          Daily attempts & accuracy
        </h2>
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={stats.attempts.byDay} margin={{ top: 5, right: 30, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--mcq-line)" />
              <XAxis dataKey="day" tick={TICK} tickLine={false} axisLine={{ stroke: "var(--mcq-line)" }} interval="preserveStartEnd" />
              <YAxis yAxisId="left" tick={TICK} tickLine={false} axisLine={false} />
              <YAxis yAxisId="right" orientation="right" domain={[0, 100]} tick={TICK} tickLine={false} axisLine={false} />
              <Tooltip contentStyle={TOOLTIP_STYLE} />
              <Bar yAxisId="left" dataKey="attempts" radius={[4, 4, 0, 0]} fill="var(--mcq-brand)" />
              <Line yAxisId="right" type="monotone" dataKey="accuracy" stroke="var(--mcq-ok)" strokeWidth={2} dot={{ r: 3 }} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </section>
    </div>
  );
}

// ── Mock Tests ───────────────────────────────────────────────────────────────
function MocksTab({ stats }: { stats: StatsData["stats"] }) {
  return (
    <div className="flex flex-col gap-6">
      <KpiCard label="Total Mock Tests" value={String(stats.mockRuns.total)} />
      <section className="card p-5">
        <h2 className="section-title flex items-center gap-2 mb-4">
          <SparklesIcon className="h-3.5 w-3.5 text-brand" />
          Mock test activity over time
        </h2>
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={stats.attempts.byDay} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--mcq-line)" />
              <XAxis dataKey="day" tick={TICK} tickLine={false} axisLine={{ stroke: "var(--mcq-line)" }} interval="preserveStartEnd" />
              <YAxis tick={TICK} tickLine={false} axisLine={false} />
              <Tooltip contentStyle={TOOLTIP_STYLE} />
              <Line type="monotone" dataKey="attempts" stroke="var(--mcq-brand)" strokeWidth={2} dot={{ r: 3 }} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </section>
    </div>
  );
}

// ── Subscriptions ────────────────────────────────────────────────────────────
function SubscriptionsTab({ data }: { data: SubscriptionsData }) {
  return (
    <div className="flex flex-col gap-6">
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <KpiCard label="Active Subs" value={String(data.breakdown.byStatus.find((s) => s.status === "ACTIVE")?.count ?? 0)} />
        <KpiCard label="Total Revenue" value={`₹${data.breakdown.byPlan.reduce((s, p) => s + p.totalAmount, 0).toLocaleString()}`} />
        {data.breakdown.byProvider.map((p) => (
          <KpiCard key={p.provider} label={p.provider} value={`${p.count} subs`} sub={`₹${p.totalAmount.toLocaleString()}`} />
        ))}
      </div>

      {/* Revenue by plan */}
      <section className="card p-5">
        <h2 className="section-title mb-3">Revenue by plan</h2>
        <div className="h-56">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data.breakdown.revenueByPlan} margin={{ top: 5, right: 5, left: -10, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--mcq-line)" />
              <XAxis dataKey="plan" tick={TICK} tickLine={false} axisLine={{ stroke: "var(--mcq-line)" }} />
              <YAxis tick={TICK} tickLine={false} axisLine={false} />
              <Tooltip contentStyle={TOOLTIP_STYLE} />
              <Bar dataKey="revenue" radius={[4, 4, 0, 0]} fill="var(--mcq-brand)" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </section>

      {/* Subscriptions table */}
      <section className="card p-5 overflow-x-auto">
        <h2 className="section-title mb-3">All subscriptions ({data.subscriptions.length})</h2>
        <table className="table-clean">
          <thead>
            <tr>
              <th>User</th>
              <th>Plan</th>
              <th>Cycle</th>
              <th>Status</th>
              <th>Provider</th>
              <th className="text-right">Amount</th>
              <th>Expires</th>
              <th>Created</th>
            </tr>
          </thead>
          <tbody>
            {data.subscriptions.map((s) => (
              <tr key={s.id}>
                <td className="font-medium">{s.user.name ?? s.user.email}</td>
                <td><TierBadge tier={s.plan} /></td>
                <td className="text-muted-fg">{s.cycle}</td>
                <td><StatusBadge status={s.status} /></td>
                <td className="text-muted-fg">{s.provider}</td>
                <td className="text-right tabular-nums">₹{s.amount.toLocaleString()}</td>
                <td className="text-muted-fg">{new Date(s.currentPeriodEnd).toLocaleDateString()}</td>
                <td className="text-muted-fg">{new Date(s.createdAt).toLocaleDateString()}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>
    </div>
  );
}

// ── Engagement ───────────────────────────────────────────────────────────────
function EngagementTab({ questions }: { questions: QuestionsData["questions"] }) {
  return (
    <div className="flex flex-col gap-6">
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
        <KpiCard label="Question Reports" value={String(questions.totalReports)} />
        <KpiCard label="Duplicate Pairs" value={String(questions.duplicates.reduce((s, d) => s + d.count, 0))} />
        <KpiCard label="Least Attempted" value={String(questions.leastAttempted.length)} sub="questions with 0 attempts" />
      </div>

      {/* Least attempted (engagement gap) */}
      <section className="card p-5 overflow-x-auto">
        <h2 className="section-title mb-3 flex items-center gap-2">
          <LockIcon className="h-3.5 w-3.5 text-warn" />
          Low engagement questions (least attempted)
        </h2>
        <table className="table-clean">
          <thead>
            <tr>
              <th>Question</th>
              <th>Subject</th>
              <th>Topic</th>
              <th>Difficulty</th>
              <th>Source</th>
              <th className="text-right">Attempts</th>
              <th>Quality</th>
            </tr>
          </thead>
          <tbody>
            {questions.leastAttempted.map((q) => (
              <tr key={q.id}>
                <td className="max-w-xs truncate">{q.text}</td>
                <td className="text-muted-fg">{q.subject}</td>
                <td className="text-muted-fg">{q.topic}</td>
                <td><DifficultyBadge d={q.difficulty} /></td>
                <td className="text-muted-fg">{q.sourceType}</td>
                <td className="text-right tabular-nums">{q.timesAttempted}</td>
                <td><QualityBadge s={q.qualityStatus} /></td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>
    </div>
  );
}

// ── Ingestion ────────────────────────────────────────────────────────────────
function IngestionTab({ jobs }: { jobs: QuestionsData["ingestionJobs"] }) {
  return (
    <section className="card p-5 overflow-x-auto">
      <h2 className="section-title mb-3 flex items-center gap-2">
        <BankIcon className="h-3.5 w-3.5 text-brand" />
        Ingestion Jobs ({jobs.length})
      </h2>
      {jobs.length === 0 ? (
        <p className="text-sm text-muted-fg">No ingestion jobs recorded yet.</p>
      ) : (
        <table className="table-clean">
          <thead>
            <tr>
              <th>Kind</th>
              <th>Status</th>
              <th className="text-right">Requested</th>
              <th className="text-right">Processed</th>
              <th className="text-right">Accepted</th>
              <th className="text-right">Rejected</th>
              <th>Error</th>
              <th>Created</th>
              <th>Completed</th>
            </tr>
          </thead>
          <tbody>
            {jobs.map((j) => (
              <tr key={j.id}>
                <td className="text-muted-fg">{j.kind}</td>
                <td><JobStatusBadge status={j.status} /></td>
                <td className="text-right tabular-nums">{j.requested}</td>
                <td className="text-right tabular-nums">{j.processed}</td>
                <td className="text-right tabular-nums text-ok">{j.accepted}</td>
                <td className="text-right tabular-nums text-bad">{j.rejected}</td>
                <td className="max-w-[200px] truncate text-bad">{j.error ?? "—"}</td>
                <td className="text-muted-fg">{new Date(j.createdAt).toLocaleDateString()}</td>
                <td className="text-muted-fg">{j.completedAt ? new Date(j.completedAt).toLocaleDateString() : "—"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </section>
  );
}

// ── Shared sub-components ────────────────────────────────────────────────────

function KpiCard({ label, value, sub }: { label: string; value: string; sub?: string }) {
  return (
    <div className="card card-hover p-4 text-center">
      <p className="stat-num text-xl text-ink">{value}</p>
      <p className="kicker mt-1.5 justify-center">{label}</p>
      {sub && <p className="mt-1 text-xs text-subtle-fg">{sub}</p>}
    </div>
  );
}

function PieCard({ title, data }: { title: string; data: Array<{ name: string; value: number }> }) {
  if (data.length === 0) return null;
  return (
    <section className="card p-5">
      <h2 className="section-title mb-2">{title}</h2>
      <div className="h-48">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie data={data} cx="50%" cy="50%" outerRadius={65} dataKey="value" label={({ name, value }) => `${name}: ${value}`}>
              {data.map((_, i) => <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />)}
            </Pie>
            <Tooltip contentStyle={TOOLTIP_STYLE} />
          </PieChart>
        </ResponsiveContainer>
      </div>
    </section>
  );
}

function TierBadge({ tier }: { tier: string }) {
  const cls =
    tier === "ROYAL" ? "tier-royal" :
    tier === "PREMIUM_PLUS" ? "badge-accent" :
    tier === "PREMIUM" ? "tier-silver" :
    "badge-neutral";
  return <span className={`badge ${cls}`}>{tier}</span>;
}

function StatusBadge({ status }: { status: string }) {
  const cls =
    status === "ACTIVE" ? "badge-ok" :
    status === "PENDING" ? "badge-warn" :
    status === "CANCELLED" ? "badge-bad" :
    "badge-neutral";
  return <span className={`badge ${cls}`}>{status}</span>;
}

function DifficultyBadge({ d }: { d: string }) {
  const cls =
    d === "EASY" ? "badge-ok" :
    d === "MEDIUM" ? "badge-warn" :
    d === "HARD" ? "badge-bad" :
    "badge-neutral";
  return <span className={`badge ${cls}`}>{d}</span>;
}

function QualityBadge({ s }: { s: string }) {
  const cls =
    s === "APPROVED" ? "badge-ok" :
    s === "PENDING" ? "badge-warn" :
    s === "REJECTED" ? "badge-bad" :
    "badge-neutral";
  return <span className={`badge ${cls}`}>{s}</span>;
}

function JobStatusBadge({ status }: { status: string }) {
  const cls =
    status === "COMPLETED" ? "badge-ok" :
    status === "RUNNING" ? "badge-warn" :
    status === "FAILED" ? "badge-bad" :
    "badge-neutral";
  return <span className={`badge ${cls}`}>{status}</span>;
}
