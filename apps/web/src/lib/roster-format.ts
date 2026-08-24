import type { StudentRow } from "@/lib/instructor-access";

// ─────────────────────────────────────────────────────────────────────────────
// Roster display helpers.
//
// Pure functions InstructorDashboard.tsx uses to classify and format roster
// rows. Split out of instructor-access.ts on purpose: that module opens with
// `import "server-only"`, and a "use client" component pulling in a runtime
// (non-type) export from it would drag that side effect into the client
// bundle and break the build. Living here also makes both functions directly
// unit-testable the same way lib/quiz-accuracy.ts is.
// ─────────────────────────────────────────────────────────────────────────────

/**
 * The three populations on the platform. They behave differently enough that
 * averaging across them hides what matters: a demo cohort is a seeded roster
 * where non-participation is the signal, whereas an independent free account
 * self-selected in and its drop-off is a funnel question, not a teaching one.
 */
export type Segment = "demo" | "paid" | "free";

/** Cohort membership wins over tier: a demo student on a paid tier is still a
 *  demo student, because the question you ask about them is the cohort's. */
export function segmentOf(student: Pick<StudentRow, "cohort" | "tier">): Segment {
  if (student.cohort) return "demo";
  return student.tier === "free" ? "free" : "paid";
}

/**
 * Total on-site time as "Xh Ym" / "Ym" for the roster's time-on-site column.
 *
 * `ms` is null whenever the student has no timed answers at all — the roster
 * renders that as an em dash, never "0m". "0m" reads as "visited and did
 * nothing" when the truth is "we never measured it", and most rows fall in
 * the null case: only a fraction of quiz_answers rows carry a time_spent_ms
 * value. A genuine zero-millisecond sum (the student has timed answers and
 * they summed to exactly 0) is a different, real measurement and renders as
 * "0m" rather than a dash.
 */
export function formatTimeOnSite(ms: number | null): string {
  if (ms == null) return "—";
  if (ms <= 0) return "0m";
  const totalMinutes = Math.floor(ms / 60_000);
  if (totalMinutes < 1) return "<1m";
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  return hours > 0 ? `${hours}h ${minutes}m` : `${minutes}m`;
}
