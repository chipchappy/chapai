import type { StudentRow } from "@/lib/instructor-access";

const TONE: Record<StudentRow["readiness"]["tone"], string> = {
  sage: "border-[rgba(111,141,118,0.28)] bg-[rgba(111,141,118,0.12)] text-[#55715e]",
  gold: "border-[rgba(176,141,87,0.28)] bg-[rgba(176,141,87,0.12)] text-[#8a6a2f]",
  clay: "border-[rgba(196,121,86,0.28)] bg-[rgba(196,121,86,0.12)] text-[#9b5e42]",
  blue: "border-[rgba(90,127,136,0.24)] bg-[rgba(90,127,136,0.1)] text-[#4f6f77]",
};

function relativeDay(ts: number | null): string {
  if (!ts) return "—";
  const days = Math.floor((Date.now() / 1000 - ts) / 86400);
  return days <= 0 ? "today" : days === 1 ? "1d ago" : `${days}d ago`;
}

function StatTile({ label, value, sub, tone }: { label: string; value: string | number; sub?: string; tone?: string }) {
  return (
    <article className="metric-tile rounded-[20px] p-4">
      <p className="terminal-label">{label}</p>
      <p className={`mt-2 font-serif text-[1.9rem] leading-none ${tone ?? "text-dark"}`}>{value}</p>
      {sub ? <p className="mt-1 text-xs leading-5 text-muted">{sub}</p> : null}
    </article>
  );
}

export default function InstructorDashboard({
  institution,
  cohort,
  students,
  aggregate,
}: {
  institution: string | null;
  cohort: string;
  students: StudentRow[];
  aggregate: { count: number; active7: number; onTrack: number; atRisk: number; avgAccuracy: number };
}) {
  const cohortNote = aggregate.count === 0
    ? "No students have joined this cohort yet. Share your program's student access key and their progress will appear here."
    : aggregate.atRisk > 0
      ? `${aggregate.atRisk} student${aggregate.atRisk === 1 ? "" : "s"} at risk — prioritize remediation and 1:1 check-ins with those flagged below.`
      : aggregate.active7 < aggregate.count
        ? `${aggregate.count - aggregate.active7} student${aggregate.count - aggregate.active7 === 1 ? "" : "s"} inactive this week — a nudge keeps momentum before test day.`
        : "Cohort is engaged and trending well. Keep pushing volume and timed readiness exams.";

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <section className="dashboard-hub overflow-hidden rounded-[30px] p-6 md:p-8">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="terminal-label">Instructor console · faculty view</p>
            <h1 className="mt-2 font-serif text-[clamp(2rem,3.4vw,2.9rem)] leading-[0.98] text-dark">
              {institution ?? "Your cohort"}
            </h1>
            <p className="mt-1 text-sm text-muted">Cohort <code className="text-[0.82em]">{cohort}</code> · faculty oversight &amp; NCLEX-readiness analytics</p>
          </div>
          <span className="signal-pill signal-pill-sage">Instructor access</span>
        </div>
        <p className="mt-4 max-w-3xl text-sm leading-6 text-dark">{cohortNote}</p>
      </section>

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
        <StatTile label="Students" value={aggregate.count} sub="in this cohort" />
        <StatTile label="Active this week" value={aggregate.active7} sub={`of ${aggregate.count}`} />
        <StatTile label="On track" value={aggregate.onTrack} sub="≥65% accuracy" tone="text-[#55715e]" />
        <StatTile label="At risk" value={aggregate.atRisk} sub="<58% w/ data" tone="text-[#9b5e42]" />
        <StatTile label="Cohort accuracy" value={aggregate.avgAccuracy > 0 ? `${aggregate.avgAccuracy}%` : "n/a"} sub="avg of active students" />
      </section>

      <section className="study-console-panel">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <p className="terminal-label">Student roster · at-risk first</p>
          <span className="text-xs text-muted">{students.length} student{students.length === 1 ? "" : "s"}</span>
        </div>

        {students.length === 0 ? (
          <div className="dashboard-empty mt-4">
            <p className="font-semibold text-dark">No students linked yet.</p>
            <p className="mt-2 text-sm leading-6 text-muted">Students who sign up with your program&rsquo;s student access key are automatically added to this cohort.</p>
          </div>
        ) : (
          <div className="mt-4 overflow-x-auto">
            <table className="instructor-roster w-full text-left text-sm">
              <thead>
                <tr>
                  <th>Student</th>
                  <th>Answered</th>
                  <th>Accuracy</th>
                  <th>Readiness</th>
                  <th>Est. pass probability</th>
                  <th>Recommendation</th>
                  <th>Last active</th>
                </tr>
              </thead>
              <tbody>
                {students.map((s) => (
                  <tr key={s.email}>
                    <td className="font-medium text-dark">{s.email}</td>
                    <td>{s.answered}</td>
                    <td>
                      <div className="flex items-center gap-2">
                        <span>{s.answered > 0 ? `${s.accuracy}%` : "—"}</span>
                        {s.answered > 0 ? (
                          <span className="inline-block h-1.5 w-16 overflow-hidden rounded-full bg-[rgba(74,85,89,0.12)]">
                            <span
                              className={`block h-full rounded-full ${s.accuracy >= 65 ? "bg-[#7e9d86]" : s.accuracy >= 55 ? "bg-[#c9a15a]" : "bg-[#c47956]"}`}
                              style={{ width: `${Math.max(4, s.accuracy)}%` }}
                            />
                          </span>
                        ) : null}
                      </div>
                    </td>
                    <td>
                      <span className={`inline-flex rounded-full border px-2.5 py-0.5 text-xs font-semibold ${TONE[s.readiness.tone]}`}>
                        {s.readiness.label}
                      </span>
                    </td>
                    <td>
                      {s.prediction.sufficient ? (
                        <span><strong className="text-dark">{s.prediction.band}</strong> <span className="text-muted">· {s.prediction.label}</span></span>
                      ) : (
                        <span className="text-muted">{s.prediction.label}</span>
                      )}
                    </td>
                    <td className="max-w-[280px] text-xs leading-5 text-muted">{s.recommendation}</td>
                    <td className="text-xs text-muted">{relativeDay(s.lastActive)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        <p className="mt-4 text-xs leading-5 text-muted">
          <strong>About the estimate:</strong> the pass-probability range is an estimate derived from each student&rsquo;s
          Clarity practice performance (accuracy, volume, and consistency) — not a guaranteed NCLEX outcome. It is withheld
          until a student has answered enough questions to be meaningful, and is intended as a guidance tool for remediation
          and study planning.
        </p>
      </section>
    </div>
  );
}
