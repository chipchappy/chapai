import type { PatientState } from "@/lib/clinical-simulation/engine";
import type { ClinicalScenario } from "@/lib/clinical-simulation/schema";
import { buildConcerns } from "@/lib/clinical-simulation/concerns";
import { gradeBestPracticeRoute } from "@/lib/clinical-simulation/best-practice";

// ─────────────────────────────────────────────────────────────────────────────
// Achievements.
//
// Every badge maps to a real clinical competency, not to activity. You cannot
// earn one by clicking a lot — each requires something a good nurse actually
// does: recognising early, acting in order, escalating with data, reassessing
// after treatment, and keeping the patient safe.
//
// Derived from live state so they light up the moment they are earned, and a
// rewound run re-evaluates honestly.
// ─────────────────────────────────────────────────────────────────────────────

export type Achievement = {
  id: string;
  label: string;
  detail: string;
  icon: string;
  earned: boolean;
  /** Progress toward earning, 0-1, for partially-complete badges. */
  progress?: number;
};

const ESCALATION = /page|notify|call|escalat|rapid response|provider|sbar|contact/i;
const REASSESS = /reassess|recheck|repeat|re-?evaluat|follow.?up/i;

export function buildAchievements(scenario: ClinicalScenario, state: PatientState): Achievement[] {
  const log = state.actionLog;
  const grade = gradeBestPracticeRoute(scenario, state);
  const concerns = buildConcerns(state);

  const optimal = log.filter((e) => ["essential", "high_priority", "appropriate"].includes(e.classification));
  const unsafe = log.filter((e) => ["unsafe", "critical_error"].includes(e.classification));

  // Longest run of consecutive optimal decisions.
  let streak = 0;
  let bestStreak = 0;
  for (const entry of log) {
    if (["essential", "high_priority", "appropriate"].includes(entry.classification)) {
      streak += 1;
      bestStreak = Math.max(bestStreak, streak);
    } else streak = 0;
  }

  const firstAssessment = log.find((e) => e.category === "assessment");
  const firstEscalation = log.find((e) => ESCALATION.test(`${e.label} ${e.feedback}`));
  const firstIntervention = log.find((e) => ["intervention", "medication"].includes(e.category));
  const reassessAfterTreat = firstIntervention
    ? log.some((e) => REASSESS.test(`${e.label} ${e.feedback}`) && e.virtualMinute > firstIntervention.virtualMinute)
    : false;

  const criticalConcernsOpen = concerns.filter((c) => c.severity === "critical").length;

  return [
    {
      id: "first-look",
      label: "Eyes on the patient",
      detail: "Assessed the patient before doing anything else.",
      icon: "👁️",
      earned: Boolean(firstAssessment && log[0]?.category === "assessment"),
    },
    {
      id: "early-recognition",
      label: "Early recognition",
      detail: "Completed a focused assessment within the first 3 minutes.",
      icon: "⚡",
      earned: Boolean(firstAssessment && firstAssessment.virtualMinute <= 3),
    },
    {
      id: "priority-order",
      label: "Right order",
      detail: "Followed the expert sequence with no steps out of order.",
      icon: "🎯",
      earned: grade.ordering === 100 && grade.coverage > 0,
      progress: grade.ordering / 100,
    },
    {
      id: "streak-3",
      label: "On a roll",
      detail: "Three optimal decisions back to back.",
      icon: "🔥",
      earned: bestStreak >= 3,
      progress: Math.min(1, bestStreak / 3),
    },
    {
      id: "streak-6",
      label: "Clinical flow",
      detail: "Six optimal decisions without a misstep.",
      icon: "🌊",
      earned: bestStreak >= 6,
      progress: Math.min(1, bestStreak / 6),
    },
    {
      id: "escalated",
      label: "Called for help",
      detail: "Escalated to the care team while it still mattered.",
      icon: "📞",
      earned: Boolean(firstEscalation),
    },
    {
      id: "closed-loop",
      label: "Closed the loop",
      detail: "Reassessed the patient after treating them.",
      icon: "🔄",
      earned: reassessAfterTreat,
    },
    {
      id: "no-harm",
      label: "First, do no harm",
      detail: "Completed the run with zero unsafe actions.",
      icon: "🛡️",
      earned: unsafe.length === 0 && log.length >= 4,
    },
    {
      id: "full-coverage",
      label: "Nothing missed",
      detail: "Performed every action best practice requires.",
      icon: "✅",
      earned: grade.coverage === 100,
      progress: grade.coverage / 100,
    },
    {
      id: "stabilised",
      label: "Patient stabilised",
      detail: "No critical concerns remaining at the bedside.",
      icon: "💚",
      earned: log.length >= 3 && criticalConcernsOpen === 0,
    },
    {
      id: "expert-route",
      label: "Expert route",
      detail: "Scored 88 or above against the evidence-based route.",
      icon: "🏆",
      earned: grade.score >= 88,
      progress: grade.score / 88,
    },
  ];
}

export function achievementSummary(list: Achievement[]) {
  const earned = list.filter((a) => a.earned);
  return { earned: earned.length, total: list.length, latest: earned[earned.length - 1] ?? null };
}
