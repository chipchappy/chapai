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
import type { CohortAggregate, StudentRow } from "@/lib/instructor-access";

const TONE: Record<StudentRow["readiness"]["tone"], string> = {
  sage: "border-[rgba(111,141,118,0.28)] bg-[rgba(111,141,118,0.12)] text-[#55715e]",
  gold: "border-[rgba(176,141,87,0.28)] bg-[rgba(176,141,87,0.12)] text-[#8a6a2f]",
  clay: "border-[rgba(196,121,86,0.28)] bg-[rgba(196,121,86,0.12)] text-[#9b5e42]",
  blue: "border-[rgba(90,127,136,0.24)] bg-[rgba(90,127,136,0.1)] text-[#4f6f77]",
};

type Aggregate = CohortAggregate;

/**
 * The three populations on the platform. They behave differently enough that
 * averaging across them hides what matters: a demo cohort is a seeded roster
 * where non-participation is the signal, whereas an independent free account
 * self-selected in and its drop-off is a funnel question, not a teaching one.
 */
type Segment = "demo" | "paid" | "free";

const SEGMENT_LABEL: Record<Segment, string> = {
  demo: "Demo cohort",
  paid: "Independent paid",
  free: "Independent free",
};

const SEGMENT_HINT: Record<Segment, string> = {
  demo: "Seeded through an institutional access key",
  paid: "Self-serve subscribers, no cohort",
  free: "Self-serve free accounts, no cohort",
};

/** Cohort membership wins over tier: a demo student on a paid tier is still a
 *  demo student, because the question you ask about them is the cohort's. */
function segmentOf(student: StudentRow): Segment {
  if (student.cohort) return "demo";
  return student.tier === "free" ? "free" : "paid";
}

const SEGMENT_ORDER: Segment[] = ["demo", "paid", "free"];
type SortMode = "priority" | "activity" | "accuracy" | "volume";
type MetricFilter = "all" | "active" | "onTrack" | "support" | "accuracy" | "notStarted";

/** Accuracy band -> the bar colour that encodes it without relying on the number. */
const BAND_TONE: Record<StudentRow["band"], "sage" | "gold" | "clay" | "blue"> = {
  strong: "sage",
  "on-track": "sage",
  borderline: "gold",
  "at-risk": "clay",
  insufficient: "blue",
};
type StatTone = "blue" | "teal" | "sage" | "clay" | "gold";

const STAT_STYLE: Record<StatTone, { surface: string; icon: string; value: string; bar: string }> = {
  blue: {
    surface: "border-[rgba(90,127,136,0.24)] bg-[linear-gradient(145deg,rgba(240,247,248,0.96),rgba(255,255,255,0.88))]",
    icon: "bg-[rgba(90,127,136,0.14)] text-[#4f6f77]",
    value: "text-[#405f67]",
    bar: "bg-[#5a7f88]",
  },
  teal: {
    surface: "border-[rgba(92,145,145,0.24)] bg-[linear-gradient(145deg,rgba(238,248,247,0.96),rgba(255,255,255,0.88))]",
    icon: "bg-[rgba(92,145,145,0.14)] text-[#457575]",
    value: "text-[#3f6e6e]",
    bar: "bg-[#5c9191]",
  },
  sage: {
    surface: "border-[rgba(111,141,118,0.26)] bg-[linear-gradient(145deg,rgba(241,247,242,0.97),rgba(255,255,255,0.88))]",
    icon: "bg-[rgba(111,141,118,0.15)] text-[#55715e]",
    value: "text-[#55715e]",
    bar: "bg-[#7e9d86]",
  },
  clay: {
    surface: "border-[rgba(196,121,86,0.24)] bg-[linear-gradient(145deg,rgba(252,243,238,0.97),rgba(255,255,255,0.88))]",
    icon: "bg-[rgba(196,121,86,0.14)] text-[#9b5e42]",
    value: "text-[#9b5e42]",
    bar: "bg-[#c47956]",
  },
  gold: {
    surface: "border-[rgba(176,141,87,0.26)] bg-[linear-gradient(145deg,rgba(252,248,238,0.97),rgba(255,255,255,0.88))]",
    icon: "bg-[rgba(176,141,87,0.15)] text-[#8a6a2f]",
    value: "text-[#8a6a2f]",
    bar: "bg-[#c9a15a]",
  },
};

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

function StatTile({
  icon: Icon,
  label,
  value,
  sub,
  tone,
  progress,
  active,
  onClick,
}: {
  icon: LucideIcon;
  label: string;
  value: string | number;
  sub: string;
  tone: StatTone;
  progress: number;
  active: boolean;
  onClick: () => void;
}) {
  const style = STAT_STYLE[tone];
  return (
    <button
      type="button"
      aria-pressed={active}
      onClick={onClick}
      className={`group relative min-h-[112px] overflow-hidden rounded-lg border p-3 text-left shadow-[0_8px_24px_rgba(47,55,58,0.04)] transition duration-200 hover:-translate-y-0.5 hover:shadow-[0_12px_28px_rgba(47,55,58,0.09)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#7e9d86] sm:min-h-[126px] sm:p-4 ${style.surface} ${active ? "ring-2 ring-[#4a5559] ring-offset-2" : ""}`}
    >
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-[0.68rem] font-bold uppercase text-[rgba(74,85,89,0.62)]">{label}</p>
          <p className={`mt-2 font-serif text-[1.6rem] leading-none sm:text-[1.9rem] ${style.value}`}>{value}</p>
        </div>
        <span className={`grid h-9 w-9 shrink-0 place-items-center rounded-lg transition-transform group-hover:scale-105 ${style.icon}`}>
          <Icon aria-hidden="true" className="h-4 w-4" />
        </span>
      </div>
      <p className="mt-2 truncate text-xs text-muted">{sub}</p>
      <span className="mt-3 block h-1 overflow-hidden rounded-full bg-white/70" aria-hidden="true">
        <span className={`block h-full rounded-full transition-[width] duration-500 ${style.bar}`} style={{ width: `${Math.max(progress > 0 ? 5 : 0, Math.min(100, progress))}%` }} />
      </span>
    </button>
  );
}

function ProgressBar({ value, tone = "sage", hatched = false }: { value: number; tone?: "sage" | "gold" | "clay" | "blue"; hatched?: boolean }) {
  const colors = { sage: "bg-[#7e9d86]", gold: "bg-[#c9a15a]", clay: "bg-[#c47956]", blue: "bg-[#5a7f88]" };
  const hatch = { backgroundImage: "repeating-linear-gradient(90deg, currentColor 0 4px, transparent 4px 8px)" };
  return (
    <span className="block h-2 w-full overflow-hidden rounded-full bg-[rgba(74,85,89,0.1)]" aria-hidden="true">
      <span
        className={`block h-full rounded-full ${colors[tone]} ${hatched ? "text-[#5a7f88]" : ""}`}
        style={{
          width: `${Math.max(value > 0 ? 4 : 0, Math.min(100, value))}%`,
          ...(hatched ? { backgroundColor: "transparent", ...hatch } : {}),
        }}
      />
    </span>
  );
}

// Never-started seats rank first: in a cohort where most seats are unused,
// activation is the action a professor can actually take.
function priorityRank(student: StudentRow) {
  if (student.answered === 0) return 0;
  if (student.band === "at-risk") return 1;
  if (student.band === "insufficient") return 2;
  if (student.band === "borderline") return 3;
  return 4;
}

/** One entry in the admin scope picker. A link, not a button: the scope lives in
 *  the query string so a given view is shareable and survives a reload. */
function ScopeLink({ href, active, children }: { href: string; active: boolean; children: React.ReactNode }) {
  return (
    <a
      href={href}
      aria-current={active ? "page" : undefined}
      className={`rounded-full border px-3 py-1 text-xs transition ${
        active
          ? "border-[rgba(111,141,118,0.45)] bg-[rgba(111,141,118,0.14)] text-[#55715e]"
          : "border-[rgba(90,127,136,0.2)] text-muted hover:border-[rgba(90,127,136,0.4)]"
      }`}
    >
      {children}
    </a>
  );
}

export default function InstructorDashboard({
  institution,
  cohort,
  accessExpiresAt,
  students,
  aggregate,
  isPlatformAdmin = false,
  cohortOptions = [],
  activeScope = "all",
}: {
  institution: string | null;
  cohort: string;
  /** null for a platform admin, who holds no time-limited instructor grant. */
  accessExpiresAt: number | null;
  students: StudentRow[];
  aggregate: Aggregate;
  isPlatformAdmin?: boolean;
  cohortOptions?: Array<{ cohort: string; institution: string | null; students: number }>;
  activeScope?: string;
}) {
  const [query, setQuery] = useState("");
  const [sort, setSort] = useState<SortMode>("priority");
  const [metricFilter, setMetricFilter] = useState<MetricFilter>("all");
  // Admin-only: which population the roster shows. Kept out of MetricFilter
  // because a segment composes with every one of those filters — "at risk"
  // means something different inside a demo cohort than among paying self-serve
  // users, and you want to ask it of each population separately.
  const [segmentFilter, setSegmentFilter] = useState<Segment | "all">("all");
  const [selectedEmail, setSelectedEmail] = useState(students[0]?.email ?? "");

  const visibleStudents = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    const searched = normalized
      ? students.filter((student) => `${studentName(student)} ${student.email}`.toLowerCase().includes(normalized))
      : [...students];
    const bySegment = segmentFilter === "all"
      ? searched
      : searched.filter((student) => segmentOf(student) === segmentFilter);
    const filtered = bySegment.filter((student) => {
      if (metricFilter === "active") return student.recentAnswered > 0;
      if (metricFilter === "onTrack") return student.band === "on-track" || student.band === "strong";
      if (metricFilter === "support") return student.band === "at-risk";
      if (metricFilter === "notStarted") return student.answered === 0;
      return true;
    });
    // Students with no data sort last on accuracy views rather than reading as 0%.
    const acc = (s: StudentRow) => s.accuracy ?? -1;
    return filtered.sort((a, b) => {
      if (sort === "activity") return (b.lastActive ?? 0) - (a.lastActive ?? 0);
      if (sort === "accuracy") return acc(b) - acc(a) || b.answered - a.answered;
      if (sort === "volume") return b.answered - a.answered;
      return priorityRank(a) - priorityRank(b) || acc(a) - acc(b);
    });
  }, [metricFilter, query, segmentFilter, sort, students]);

  const selected = visibleStudents.find((student) => student.email === selectedEmail)
    ?? visibleStudents[0]
    ?? null;
  const inactive = Math.max(0, aggregate.count - aggregate.active7);
  // Counts come from the full roster, not the filtered view, so the chips keep
  // showing the size of each population while you are inside one of them.
  const segmentStats = SEGMENT_ORDER.map((segment) => {
    const members = students.filter((student) => segmentOf(student) === segment);
    return {
      segment,
      total: members.length,
      active: members.filter((student) => student.answered > 0).length,
    };
  });
  const paidCount = students.filter((student) => segmentOf(student) === "paid").length;
  const freeCount = students.filter((student) => segmentOf(student) === "free").length;

  // Grouped rendering only when nothing is narrowed — inside a single segment a
  // heading repeating that segment's name would be noise.
  const groupedRoster = segmentFilter === "all"
    ? SEGMENT_ORDER
        .map((segment) => ({ segment, rows: visibleStudents.filter((s) => segmentOf(s) === segment) }))
        .filter((group) => group.rows.length > 0)
    : [{ segment: segmentFilter, rows: visibleStudents }];
  const cohortNote = aggregate.count === 0
    ? "Students will appear as soon as they join with the program access key."
    : aggregate.atRisk > 0
      ? `${aggregate.atRisk} student${aggregate.atRisk === 1 ? " needs" : "s need"} focused remediation or faculty follow-up.`
      : inactive > 0
        ? `${inactive} student${inactive === 1 ? " has" : "s have"} not practiced during the past seven days.`
        : "The cohort is active this week. Maintain practice volume and timed readiness work.";

  function selectMetric(filter: MetricFilter, nextSort?: SortMode) {
    setMetricFilter((current) => current === filter && filter !== "all" ? "all" : filter);
    if (nextSort) setSort(nextSort);
  }

  return (
    <div className="mx-auto max-w-7xl space-y-5">
      <section className="dashboard-hub overflow-hidden rounded-lg p-5 md:p-7">
        <div className="flex flex-wrap items-start justify-between gap-5">
          <div className="min-w-0">
            <p className="terminal-label">Instructor console</p>
            <h1 className="mt-2 font-serif text-[1.9rem] leading-tight text-dark md:text-[2.25rem]">
              {institution ?? "Cohort overview"}
            </h1>
            <p className="mt-1 break-words text-sm text-muted">
              {cohort === "all"
                ? `Every registered account — ${paidCount} paid, ${freeCount} free`
                : <>Cohort <code className="text-[0.82em]">{cohort}</code></>}
            </p>
          </div>
          <div className="flex flex-col items-end gap-2 text-right">
            <span className="signal-pill signal-pill-sage">
              {isPlatformAdmin ? "Platform admin" : "Instructor access"}
            </span>
            {accessExpiresAt != null && (
              <p className="flex items-center gap-1.5 text-xs text-muted">
                <CalendarClock aria-hidden="true" className="h-3.5 w-3.5" />
                Demo access through {expiryDate(accessExpiresAt)}
              </p>
            )}
          </div>
        </div>

        {/* Scope picker — admin only. Instructors have exactly one cohort, so
            showing them a picker with a single entry would be noise. */}
        {isPlatformAdmin && (
          <div className="mt-5 flex flex-wrap items-center gap-2">
            <span className="terminal-label mr-1">Viewing</span>
            <ScopeLink href="/instructor?scope=all" active={activeScope === "all"}>
              All students
            </ScopeLink>
            {cohortOptions.map((option) => (
              <ScopeLink
                key={option.cohort}
                href={`/instructor?scope=${encodeURIComponent(option.cohort)}`}
                active={activeScope === option.cohort}
              >
                {option.institution ?? option.cohort} ({option.students})
              </ScopeLink>
            ))}
          </div>
        )}

        {/* Population split. Shown whenever the roster mixes segments — inside a
            single cohort every student is a demo student and the chips are noise. */}
        {isPlatformAdmin && activeScope === "all" && (
          <div className="mt-3 flex flex-wrap items-center gap-2">
            <span className="terminal-label mr-1">Group</span>
            <button
              type="button"
              onClick={() => setSegmentFilter("all")}
              aria-pressed={segmentFilter === "all"}
              className={`rounded-full border px-3 py-1 text-xs transition ${
                segmentFilter === "all"
                  ? "border-[rgba(92,145,145,0.45)] bg-[rgba(92,145,145,0.14)] text-[#3f6e6e]"
                  : "border-[rgba(90,127,136,0.2)] text-muted hover:border-[rgba(90,127,136,0.4)]"
              }`}
            >
              Everyone ({students.length})
            </button>
            {segmentStats.filter((s) => s.total > 0).map(({ segment, total, active }) => (
              <button
                key={segment}
                type="button"
                onClick={() => setSegmentFilter(segment)}
                aria-pressed={segmentFilter === segment}
                title={SEGMENT_HINT[segment]}
                className={`rounded-full border px-3 py-1 text-xs transition ${
                  segmentFilter === segment
                    ? "border-[rgba(92,145,145,0.45)] bg-[rgba(92,145,145,0.14)] text-[#3f6e6e]"
                    : "border-[rgba(90,127,136,0.2)] text-muted hover:border-[rgba(90,127,136,0.4)]"
                }`}
              >
                {SEGMENT_LABEL[segment]} ({total})
                <span className="ml-1 opacity-70">· {active} active</span>
              </button>
            ))}
          </div>
        )}
        <p className="mt-5 max-w-3xl border-l-2 border-[#c9a15a] pl-3 text-sm leading-6 text-dark">{cohortNote}</p>
        {aggregate.hiddenAutomationAccounts > 0 && (
          <p className="mt-2 text-xs text-muted">
            {aggregate.hiddenAutomationAccounts} automated test account
            {aggregate.hiddenAutomationAccounts === 1 ? " is" : "s are"} excluded from this view.
          </p>
        )}
      </section>

      {/* Ordered by what needs a decision. Unused seats lead: a cohort accuracy
          computed over two active students is not the first thing faculty should
          see when fourteen have never opened the bank. */}
      <section className="grid grid-cols-2 gap-3 lg:grid-cols-3 xl:grid-cols-6" aria-label="Cohort summary">
        <StatTile
          icon={AlertTriangle}
          label="Not started"
          value={aggregate.notStarted}
          sub={`of ${aggregate.count} seats redeemed`}
          tone="clay"
          progress={aggregate.count ? (aggregate.notStarted / aggregate.count) * 100 : 0}
          active={metricFilter === "notStarted"}
          onClick={() => selectMetric("notStarted", "priority")}
        />
        <StatTile icon={Activity} label="Active this week" value={aggregate.active7} sub={`${inactive} inactive`} tone="teal" progress={aggregate.count ? (aggregate.active7 / aggregate.count) * 100 : 0} active={metricFilter === "active"} onClick={() => selectMetric("active", "activity")} />
        <StatTile icon={CheckCircle2} label="On track" value={aggregate.onTrack} sub={`of ${aggregate.everActive} who practised`} tone="sage" progress={aggregate.everActive ? (aggregate.onTrack / aggregate.everActive) * 100 : 0} active={metricFilter === "onTrack"} onClick={() => selectMetric("onTrack", "accuracy")} />
        <StatTile icon={AlertTriangle} label="Needs support" value={aggregate.atRisk} sub="Prioritize follow-up" tone="clay" progress={aggregate.everActive ? (aggregate.atRisk / aggregate.everActive) * 100 : 0} active={metricFilter === "support"} onClick={() => selectMetric("support", "priority")} />
        <StatTile
          icon={Target}
          label="Cohort accuracy"
          value={aggregate.avgAccuracy == null ? "—" : `${aggregate.avgAccuracy}%`}
          // Pooled, and honest about how thin the sample is.
          sub={aggregate.avgAccuracy == null ? "no practice yet" : `pooled over ${aggregate.totalAnswered} answers${aggregate.lowConfidence ? " — thin" : ""}`}
          tone="gold"
          progress={aggregate.avgAccuracy ?? 0}
          active={metricFilter === "accuracy"}
          onClick={() => selectMetric("accuracy", "accuracy")}
        />
        <StatTile icon={Users} label="All students" value={aggregate.count} sub={`${aggregate.totalAnswered} questions answered`} tone="blue" progress={aggregate.count ? 100 : 0} active={metricFilter === "all"} onClick={() => selectMetric("all")} />
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
              {visibleStudents.length ? groupedRoster.map((group) => (
                <div key={group.segment}>
                  {segmentFilter === "all" && (
                    <div className="flex items-baseline justify-between border-t border-[rgba(74,85,89,0.14)] bg-[rgba(90,127,136,0.06)] px-4 py-1.5">
                      <span className="terminal-label">{SEGMENT_LABEL[group.segment]}</span>
                      <span className="text-[0.68rem] text-muted">{group.rows.length}</span>
                    </div>
                  )}
                  {group.rows.map((student) => {
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
                      <span className="mt-1 block w-full"><ProgressBar value={student.accuracy ?? 0} tone={BAND_TONE[student.band]} /></span>
                    </span>
                    <span className="text-right">
                      {/* Sample size rides with the number: 100% on 3 questions is
                          not a top performer, and must not read like one. */}
                      <span className={`block text-sm font-bold ${student.accuracy == null ? "text-muted" : "text-dark"}`}>
                        {student.accuracy == null ? "—" : `${student.accuracy}%`}
                      </span>
                      <span className="block text-[0.68rem] text-muted">
                        {student.answered === 0 ? "not started" : `n=${student.answered}`}
                      </span>
                    </span>
                  </button>
                );
                  })}
                </div>
              )) : (
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
  const ringValue = student.accuracy ?? 0;
  const hasData = student.accuracy != null;
  const thin = hasData && student.band === "insufficient";
  return (
    <div className="space-y-6">
      <header className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex min-w-0 items-center gap-3">
          <span className="grid h-12 w-12 shrink-0 place-items-center rounded-full bg-[#55715e] text-sm font-bold text-white">{initials(student)}</span>
          <div className="min-w-0">
            <h2 className="truncate font-serif text-2xl leading-tight text-dark">{studentName(student)}</h2>
            <p className="truncate text-sm text-muted">{student.email}</p>
            {/* Which population this student belongs to. Shown here because the
                same accuracy number means different things across segments. */}
            <p className="mt-1 truncate text-xs text-muted">
              {SEGMENT_LABEL[segmentOf(student)]}
              {student.cohort ? ` · ${student.cohort}` : ` · ${student.tier} plan`}
            </p>
          </div>
        </div>
        <span className={`inline-flex w-fit rounded-full border px-3 py-1 text-xs font-semibold ${TONE[student.readiness.tone]}`}>{student.readiness.label}</span>
      </header>

      <div className="grid gap-4 sm:grid-cols-[150px_minmax(0,1fr)]">
        <div className="flex items-center justify-center rounded-lg border border-[rgba(74,85,89,0.12)] bg-white/45 p-4">
          <div
            className="grid h-28 w-28 place-items-center rounded-full p-[9px]"
            style={{ background: `conic-gradient(${thin ? "#9aa8a2" : "#7e9d86"} ${ringValue * 3.6}deg, rgba(74,85,89,0.1) 0deg)` }}
            aria-label={hasData ? `${student.accuracy}% accuracy from ${student.answered} answered questions` : "No questions answered yet"}
          >
            <div className="grid h-full w-full place-items-center rounded-full bg-[#fbfaf7] text-center">
              <span>
                <strong className={`block font-serif text-2xl leading-none ${hasData ? "text-dark" : "text-muted"}`}>
                  {hasData ? `${student.accuracy}%` : "—"}
                </strong>
                <span className="mt-1 block text-[0.65rem] uppercase text-muted">
                  {hasData ? `of ${student.answered}` : "no data"}
                </span>
              </span>
            </div>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-px overflow-hidden rounded-lg border border-[rgba(74,85,89,0.12)] bg-[rgba(74,85,89,0.1)]">
          <DetailMetric icon={BarChart3} label="Answered" value={String(student.answered)} />
          {/* Coverage vs volume: answering 74 questions across 51 unique items
              means revisiting, which is invisible from a single total. */}
          <DetailMetric icon={Target} label="Unique covered" value={String(student.uniqueQuestions)} />
          <DetailMetric icon={Activity} label="This week" value={String(student.recentAnswered)} />
          <DetailMetric icon={Clock3} label="Avg. time" value={student.averageTimeSeconds ? `${student.averageTimeSeconds}s` : "--"} />
        </div>
      </div>

      {thin ? (
        <p className="rounded-lg border border-[rgba(90,127,136,0.24)] bg-[rgba(90,127,136,0.08)] px-3 py-2 text-xs leading-5 text-muted">
          Only {student.answered} question{student.answered === 1 ? "" : "s"} answered — too few to read this accuracy as a strength or a gap yet.
        </p>
      ) : null}

      <section>
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h3 className="text-sm font-bold text-dark">Faculty guidance</h3>
          <span className="text-xs text-muted">
            {student.lastActive ? `Last active ${relativeDay(student.lastActive).toLowerCase()}` : "No activity yet"}
          </span>
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
          <>
            <p className="mt-1 text-xs text-muted">Weakest lane first. Bars are hatched below 5 questions — too thin to read as a strength or a gap.</p>
            <div className="mt-3 space-y-3">
              {[...student.categories]
                // Surface the gap, not the alphabet: worst accuracy first, and
                // push thin lanes down so a 3/3 does not top the list.
                .sort((a, b) => (a.answered < 5 ? 1 : 0) - (b.answered < 5 ? 1 : 0) || a.accuracy - b.accuracy)
                .slice(0, 8)
                .map((category) => {
                  const thinLane = category.answered < 5;
                  return (
                    <div key={category.category} className="grid grid-cols-[minmax(0,1fr)_48px] items-center gap-3">
                      <div className="min-w-0">
                        <div className="mb-1 flex items-baseline justify-between gap-3 text-xs">
                          <span className="truncate font-medium text-dark">{category.category}</span>
                          <span className="shrink-0 text-muted">{category.correct}/{category.answered} correct</span>
                        </div>
                        <ProgressBar
                          value={category.accuracy}
                          tone={thinLane ? "blue" : category.accuracy >= 65 ? "sage" : category.accuracy >= 55 ? "gold" : "clay"}
                          hatched={thinLane}
                        />
                      </div>
                      <strong className={`text-right text-sm ${thinLane ? "text-muted" : "text-dark"}`}>{category.accuracy}%</strong>
                    </div>
                  );
                })}
            </div>
          </>
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
