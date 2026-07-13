"use client";

import { useMemo, useState } from "react";
import {
  Activity,
  AlertTriangle,
  ArrowDown,
  ArrowUp,
  BarChart3,
  CalendarClock,
  CheckCircle2,
  Clock3,
  Search,
  Target,
  TrendingUp,
  UserRound,
  Users,
  type LucideIcon,
} from "lucide-react";
import type { StudentRow } from "@/lib/instructor-access";

const TONE: Record<StudentRow["readiness"]["tone"], string> = {
  sage: "border-[rgba(111,141,118,0.28)] bg-[rgba(111,141,118,0.12)] text-[#55715e]",
  gold: "border-[rgba(176,141,87,0.28)] bg-[rgba(176,141,87,0.12)] text-[#8a6a2f]",
  clay: "border-[rgba(196,121,86,0.28)] bg-[rgba(196,121,86,0.12)] text-[#9b5e42]",
  blue: "border-[rgba(90,127,136,0.24)] bg-[rgba(90,127,136,0.1)] text-[#4f6f77]",
};

type Aggregate = { count: number; active7: number; onTrack: number; atRisk: number; avgAccuracy: number };
type SortMode = "priority" | "activity" | "accuracy" | "volume";

function studentName(student: StudentRow) {
  if (student.name?.trim()) return student.name.trim();
  return student.email
    .split("@")[0]
    .split(/[._-]+/)
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

function initials(student: StudentRow) {
  return studentName(student)
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part.charAt(0))
    .join("")
    .toUpperCase();
}

function relativeDay(ts: number | null): string {
  if (!ts) return "No activity";
  const days = Math.max(0, Math.floor((Date.now() / 1000 - ts) / 86400));
  return days <= 0 ? "Today" : days === 1 ? "1 day ago" : `${days} days ago`;
}

function shortDate(ts: number) {
  return new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric" }).format(new Date(ts * 1000));
}

function expiryDate(ts: number) {
  return new Intl.DateTimeFormat("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
    timeZone: "America/Los_Angeles",
  }).format(new Date(ts * 1000));
}

function StatTile({ icon: Icon, label, value, sub, tone }: { icon: LucideIcon; label: string; value: string | number; sub: string; tone?: string }) {
  return (
    <article className="metric-tile rounded-lg p-4">
      <div className="flex items-center justify-between gap-3">
        <p className="terminal-label">{label}</p>
        <Icon aria-hidden="true" className={`h-4 w-4 ${tone ?? "text-[#55715e]"}`} />
      </div>
      <p className={`mt-3 font-serif text-[1.8rem] leading-none ${tone ?? "text-dark"}`}>{value}</p>
      <p className="mt-1 text-xs leading-5 text-muted">{sub}</p>
    </article>
  );
}

function ProgressBar({ value, tone = "sage" }: { value: number; tone?: "sage" | "gold" | "clay" | "blue" }) {
  const colors = { sage: "bg-[#7e9d86]", gold: "bg-[#c9a15a]", clay: "bg-[#c47956]", blue: "bg-[#5a7f88]" };
  return (
    <span className="block h-2 w-full overflow-hidden rounded-full bg-[rgba(74,85,89,0.1)]" aria-hidden="true">
      <span className={`block h-full rounded-full ${colors[tone]}`} style={{ width: `${Math.max(value > 0 ? 4 : 0, Math.min(100, value))}%` }} />
    </span>
  );
}

function priorityRank(student: StudentRow) {
  if (student.answered >= 50 && student.accuracy < 58) return 0;
  if (student.answered < 25) return 1;
  if (student.accuracy < 65) return 2;
  return 3;
}

export default function InstructorDashboard({
  institution,
  cohort,
  accessExpiresAt,
  students,
  aggregate,
}: {
  institution: string | null;
  cohort: string;
  accessExpiresAt: number;
  students: StudentRow[];
  aggregate: Aggregate;
}) {
  const [query, setQuery] = useState("");
  const [sort, setSort] = useState<SortMode>("priority");
  const [selectedEmail, setSelectedEmail] = useState(students[0]?.email ?? "");

  const visibleStudents = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    const filtered = normalized
      ? students.filter((student) => `${studentName(student)} ${student.email}`.toLowerCase().includes(normalized))
      : [...students];
    return filtered.sort((a, b) => {
      if (sort === "activity") return (b.lastActive ?? 0) - (a.lastActive ?? 0);
      if (sort === "accuracy") return b.accuracy - a.accuracy || b.answered - a.answered;
      if (sort === "volume") return b.answered - a.answered;
      return priorityRank(a) - priorityRank(b) || a.accuracy - b.accuracy;
    });
  }, [query, sort, students]);

  const selected = visibleStudents.find((student) => student.email === selectedEmail)
    ?? visibleStudents[0]
    ?? students.find((student) => student.email === selectedEmail)
    ?? null;
  const inactive = Math.max(0, aggregate.count - aggregate.active7);
  const cohortNote = aggregate.count === 0
    ? "Students will appear as soon as they join with the program access key."
    : aggregate.atRisk > 0
      ? `${aggregate.atRisk} student${aggregate.atRisk === 1 ? " needs" : "s need"} focused remediation or faculty follow-up.`
      : inactive > 0
        ? `${inactive} student${inactive === 1 ? " has" : "s have"} not practiced during the past seven days.`
        : "The cohort is active this week. Maintain practice volume and timed readiness work.";

  return (
    <div className="mx-auto max-w-7xl space-y-5">
      <section className="dashboard-hub overflow-hidden rounded-lg p-5 md:p-7">
        <div className="flex flex-wrap items-start justify-between gap-5">
          <div className="min-w-0">
            <p className="terminal-label">Instructor console</p>
            <h1 className="mt-2 font-serif text-[1.9rem] leading-tight text-dark md:text-[2.25rem]">
              {institution ?? "Cohort overview"}
            </h1>
            <p className="mt-1 break-words text-sm text-muted">Cohort <code className="text-[0.82em]">{cohort}</code></p>
          </div>
          <div className="flex flex-col items-end gap-2 text-right">
            <span className="signal-pill signal-pill-sage">Instructor access</span>
            <p className="flex items-center gap-1.5 text-xs text-muted">
              <CalendarClock aria-hidden="true" className="h-3.5 w-3.5" />
              Demo access through {expiryDate(accessExpiresAt)}
            </p>
          </div>
        </div>
        <p className="mt-5 max-w-3xl border-l-2 border-[#c9a15a] pl-3 text-sm leading-6 text-dark">{cohortNote}</p>
      </section>

      <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-5" aria-label="Cohort summary">
        <StatTile icon={Users} label="Students" value={aggregate.count} sub="enrolled in this cohort" />
        <StatTile icon={Activity} label="Active this week" value={aggregate.active7} sub={`${inactive} currently inactive`} tone="text-[#5a7f88]" />
        <StatTile icon={CheckCircle2} label="On track" value={aggregate.onTrack} sub="65% or higher with practice" tone="text-[#55715e]" />
        <StatTile icon={AlertTriangle} label="Needs support" value={aggregate.atRisk} sub="below 58% with enough data" tone="text-[#9b5e42]" />
        <StatTile icon={Target} label="Cohort accuracy" value={aggregate.avgAccuracy ? `${aggregate.avgAccuracy}%` : "n/a"} sub="average among active students" tone="text-[#8a6a2f]" />
      </section>

      <section className="study-console-panel overflow-hidden !p-0">
        <div className="flex flex-col gap-3 border-b border-[rgba(74,85,89,0.12)] p-4 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="terminal-label">Student progress</p>
            <p className="mt-1 text-xs text-muted">Select a student to review strengths, activity, and next steps.</p>
          </div>
          <div className="flex flex-col gap-2 sm:flex-row">
            <label className="relative block min-w-0 sm:w-64">
              <span className="sr-only">Search students</span>
              <Search aria-hidden="true" className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" />
              <input
                className="h-10 w-full rounded-md border border-[rgba(74,85,89,0.18)] bg-white/70 pl-9 pr-3 text-sm text-dark outline-none focus:border-[#7e9d86] focus:ring-2 focus:ring-[rgba(126,157,134,0.18)]"
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Search students"
              />
            </label>
            <label>
              <span className="sr-only">Sort students</span>
              <select
                className="h-10 w-full rounded-md border border-[rgba(74,85,89,0.18)] bg-white/70 px-3 text-sm text-dark outline-none focus:border-[#7e9d86] sm:w-40"
                value={sort}
                onChange={(event) => setSort(event.target.value as SortMode)}
              >
                <option value="priority">Priority first</option>
                <option value="activity">Recent activity</option>
                <option value="accuracy">Accuracy</option>
                <option value="volume">Questions answered</option>
              </select>
            </label>
          </div>
        </div>

        {students.length === 0 ? (
          <div className="p-8 text-center">
            <UserRound aria-hidden="true" className="mx-auto h-8 w-8 text-[#7e9d86]" />
            <p className="mt-3 font-semibold text-dark">No students linked yet</p>
            <p className="mx-auto mt-2 max-w-lg text-sm leading-6 text-muted">Students who register with the program student key are added to this cohort automatically.</p>
          </div>
        ) : (
          <div className="grid min-h-[590px] lg:grid-cols-[minmax(280px,0.8fr)_minmax(0,1.55fr)]">
            <div className="max-h-[680px] overflow-y-auto border-b border-[rgba(74,85,89,0.12)] lg:border-b-0 lg:border-r">
              <div className="flex items-center justify-between px-4 py-3 text-xs text-muted">
                <span>{visibleStudents.length} student{visibleStudents.length === 1 ? "" : "s"}</span>
                <span>7-day activity</span>
              </div>
              {visibleStudents.length ? visibleStudents.map((student) => {
                const active = selected?.email === student.email;
                return (
                  <button
                    key={student.email}
                    type="button"
                    aria-pressed={active}
                    onClick={() => setSelectedEmail(student.email)}
                    className={`grid w-full grid-cols-[40px_minmax(0,1fr)_auto] items-center gap-3 border-t border-[rgba(74,85,89,0.1)] px-4 py-3 text-left transition ${active ? "bg-[rgba(126,157,134,0.13)] shadow-[inset_3px_0_0_#7e9d86]" : "hover:bg-white/55"}`}
                  >
                    <span className="grid h-10 w-10 place-items-center rounded-full bg-[#55715e] text-xs font-bold text-white">{initials(student)}</span>
                    <span className="min-w-0">
                      <span className="block truncate text-sm font-semibold text-dark">{studentName(student)}</span>
                      <span className="block truncate text-xs text-muted">{student.email}</span>
                      <span className="mt-1 block w-full"><ProgressBar value={student.accuracy} tone={student.accuracy >= 65 ? "sage" : student.accuracy >= 55 ? "gold" : "clay"} /></span>
                    </span>
                    <span className="text-right">
                      <span className="block text-sm font-bold text-dark">{student.answered ? `${student.accuracy}%` : "--"}</span>
                      <span className="block text-[0.68rem] text-muted">{student.recentAnswered} this week</span>
                    </span>
                  </button>
                );
              }) : (
                <p className="border-t border-[rgba(74,85,89,0.1)] p-6 text-center text-sm text-muted">No students match that search.</p>
              )}
            </div>

            <div className="min-w-0 p-4 md:p-6">
              {selected ? <StudentDetail student={selected} /> : (
                <div className="grid min-h-64 place-items-center text-sm text-muted">Select a student to view progress.</div>
              )}
            </div>
          </div>
        )}

        <p className="border-t border-[rgba(74,85,89,0.12)] px-4 py-3 text-xs leading-5 text-muted">
          Readiness estimates use Clarity practice accuracy, volume, and consistency. They support study planning and are not a guarantee of NCLEX outcomes.
        </p>
      </section>
    </div>
  );
}

function StudentDetail({ student }: { student: StudentRow }) {
  const ringValue = student.answered ? student.accuracy : 0;
  return (
    <div className="space-y-6">
      <header className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex min-w-0 items-center gap-3">
          <span className="grid h-12 w-12 shrink-0 place-items-center rounded-full bg-[#55715e] text-sm font-bold text-white">{initials(student)}</span>
          <div className="min-w-0">
            <h2 className="truncate font-serif text-2xl leading-tight text-dark">{studentName(student)}</h2>
            <p className="truncate text-sm text-muted">{student.email}</p>
          </div>
        </div>
        <span className={`inline-flex w-fit rounded-full border px-3 py-1 text-xs font-semibold ${TONE[student.readiness.tone]}`}>{student.readiness.label}</span>
      </header>

      <div className="grid gap-4 sm:grid-cols-[150px_minmax(0,1fr)]">
        <div className="flex items-center justify-center rounded-lg border border-[rgba(74,85,89,0.12)] bg-white/45 p-4">
          <div
            className="grid h-28 w-28 place-items-center rounded-full p-[9px]"
            style={{ background: `conic-gradient(#7e9d86 ${ringValue * 3.6}deg, rgba(74,85,89,0.1) 0deg)` }}
            aria-label={`${student.accuracy}% overall accuracy`}
          >
            <div className="grid h-full w-full place-items-center rounded-full bg-[#fbfaf7] text-center">
              <span>
                <strong className="block font-serif text-2xl leading-none text-dark">{student.answered ? `${student.accuracy}%` : "--"}</strong>
                <span className="mt-1 block text-[0.65rem] uppercase text-muted">accuracy</span>
              </span>
            </div>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-px overflow-hidden rounded-lg border border-[rgba(74,85,89,0.12)] bg-[rgba(74,85,89,0.1)]">
          <DetailMetric icon={BarChart3} label="Answered" value={String(student.answered)} />
          <DetailMetric icon={Activity} label="This week" value={String(student.recentAnswered)} />
          <DetailMetric icon={TrendingUp} label="Sessions" value={String(student.sessions)} />
          <DetailMetric icon={Clock3} label="Avg. time" value={student.averageTimeSeconds ? `${student.averageTimeSeconds}s` : "--"} />
        </div>
      </div>

      <section>
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h3 className="text-sm font-bold text-dark">Faculty guidance</h3>
          <span className="text-xs text-muted">Last active {relativeDay(student.lastActive).toLowerCase()}</span>
        </div>
        <div className="mt-2 rounded-lg border border-[rgba(201,161,90,0.25)] bg-[rgba(201,161,90,0.08)] p-3 text-sm leading-6 text-dark">
          {student.recommendation}
        </div>
        <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-muted">
          <span>Readiness estimate: <strong className="text-dark">{student.prediction.sufficient ? student.prediction.band : student.prediction.label}</strong></span>
          {student.trend != null ? (
            <span className={`inline-flex items-center gap-1 font-semibold ${student.trend >= 0 ? "text-[#55715e]" : "text-[#9b5e42]"}`}>
              {student.trend >= 0 ? <ArrowUp aria-hidden="true" className="h-3.5 w-3.5" /> : <ArrowDown aria-hidden="true" className="h-3.5 w-3.5" />}
              {Math.abs(student.trend)} points vs. prior session
            </span>
          ) : null}
        </div>
      </section>

      <section>
        <h3 className="text-sm font-bold text-dark">Performance by category</h3>
        {student.categories.length ? (
          <div className="mt-3 space-y-3">
            {student.categories.slice(0, 7).map((category) => (
              <div key={category.category} className="grid grid-cols-[minmax(0,1fr)_48px] items-center gap-3">
                <div className="min-w-0">
                  <div className="mb-1 flex items-baseline justify-between gap-3 text-xs">
                    <span className="truncate font-medium text-dark">{category.category}</span>
                    <span className="shrink-0 text-muted">{category.correct}/{category.answered} correct</span>
                  </div>
                  <ProgressBar value={category.accuracy} tone={category.accuracy >= 65 ? "sage" : category.accuracy >= 55 ? "gold" : "clay"} />
                </div>
                <strong className="text-right text-sm text-dark">{category.accuracy}%</strong>
              </div>
            ))}
          </div>
        ) : <p className="mt-2 text-sm text-muted">Category detail appears after the student completes practice questions.</p>}
      </section>

      <section>
        <h3 className="text-sm font-bold text-dark">Recent sessions</h3>
        {student.recentSessions.length ? (
          <div className="mt-2 overflow-x-auto">
            <table className="w-full min-w-[460px] text-left text-xs">
              <thead className="text-muted">
                <tr className="border-b border-[rgba(74,85,89,0.12)]">
                  <th className="py-2 pr-3 font-medium">Date</th>
                  <th className="py-2 pr-3 font-medium">Practice</th>
                  <th className="py-2 pr-3 font-medium">Score</th>
                  <th className="py-2 font-medium">Accuracy</th>
                </tr>
              </thead>
              <tbody>
                {student.recentSessions.slice(0, 6).map((session) => (
                  <tr key={session.id} className="border-b border-[rgba(74,85,89,0.08)] text-dark">
                    <td className="py-2.5 pr-3 text-muted">{shortDate(session.startedAt)}</td>
                    <td className="max-w-52 truncate py-2.5 pr-3">{session.category || `${session.exam.toUpperCase()} mixed`}</td>
                    <td className="py-2.5 pr-3">{session.correct}/{session.answered}</td>
                    <td className="py-2.5 font-semibold">{session.accuracy}%</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : <p className="mt-2 text-sm text-muted">No completed sessions yet.</p>}
      </section>
    </div>
  );
}

function DetailMetric({ icon: Icon, label, value }: { icon: LucideIcon; label: string; value: string }) {
  return (
    <div className="min-w-0 bg-[#fbfaf7] p-3">
      <div className="flex items-center gap-1.5 text-xs text-muted"><Icon aria-hidden="true" className="h-3.5 w-3.5" />{label}</div>
      <strong className="mt-1 block truncate font-serif text-xl text-dark">{value}</strong>
    </div>
  );
}
