import type { ActionLogEntry, PatientState } from "@/lib/clinical-simulation/engine";
import type { ClinicalScenario, ScenarioAction } from "@/lib/clinical-simulation/schema";

// ─────────────────────────────────────────────────────────────────────────────
// Best-practice route grading.
//
// The scenario already encodes what expert practice looks like: which actions
// are essential, when each is optimal (`optimalByMinute`), when it becomes late
// (`lateAfterMinute`), what is required to finish, and what is unsafe. This
// derives the ideal ROUTE from that data and grades the student's actual route
// against it — not just *what* they did, but *in what order* and *how quickly*.
//
// Deterministic and instant: the same run always grades the same way, which is
// what makes rewind-and-retry meaningful. No model call, no latency, no cost.
// ─────────────────────────────────────────────────────────────────────────────

export type RouteStepStatus = "optimal" | "late" | "out-of-order" | "missed";

export type RouteStep = {
  actionId: string;
  label: string;
  rationale: string;
  /** Position in the ideal route (1-based). */
  idealPosition: number;
  /** Where the student actually did it (1-based), or null if never. */
  actualPosition: number | null;
  performedAtMinute: number | null;
  targetMinute: number | null;
  status: RouteStepStatus;
  note: string;
};

export type BestPracticeGrade = {
  /** 0-100 composite of coverage, ordering, and timeliness. */
  score: number;
  band: "expert" | "proficient" | "developing" | "unsafe";
  coverage: number;
  ordering: number;
  timeliness: number;
  steps: RouteStep[];
  unsafeCount: number;
  headline: string;
  /** Highest-leverage thing to change on the next run. */
  nextFocus: string;
};

const PRIORITY: Record<string, number> = {
  essential: 0,
  high_priority: 1,
  appropriate: 2,
  acceptable_alternative: 3,
};

/**
 * The ideal route: every essential/high-priority action plus anything the
 * scenario requires for completion, ordered by its optimal timing, then by
 * clinical priority, then by the author's declared sequence.
 */
export function idealRoute(scenario: ClinicalScenario): ScenarioAction[] {
  const required = new Set(scenario.completion.requiredActionIds);
  const candidates = scenario.actions.filter(
    (action) => required.has(action.id) || action.baseClassification === "essential" || action.baseClassification === "high_priority",
  );
  return candidates
    .map((action, index) => ({ action, index }))
    .sort((a, b) => {
      const at = a.action.optimalByMinute ?? a.action.lateAfterMinute ?? Number.MAX_SAFE_INTEGER;
      const bt = b.action.optimalByMinute ?? b.action.lateAfterMinute ?? Number.MAX_SAFE_INTEGER;
      if (at !== bt) return at - bt;
      const ap = PRIORITY[a.action.baseClassification] ?? 9;
      const bp = PRIORITY[b.action.baseClassification] ?? 9;
      if (ap !== bp) return ap - bp;
      return a.index - b.index;
    })
    .map(({ action }) => action);
}

function firstPerformance(log: ActionLogEntry[], actionId: string) {
  const index = log.findIndex((entry) => entry.actionId === actionId);
  return index === -1 ? null : { index, entry: log[index] };
}

export function gradeBestPracticeRoute(scenario: ClinicalScenario, state: PatientState): BestPracticeGrade {
  const route = idealRoute(scenario);
  const log = state.actionLog;
  const unsafeCount = log.filter((entry) => entry.classification === "unsafe" || entry.classification === "critical_error").length;

  // Order the student's own performances of route actions, to judge sequence
  // against the ideal independently of any extra actions they took.
  const performedRouteIds = route
    .map((action) => ({ action, hit: firstPerformance(log, action.id) }))
    .filter((item) => item.hit)
    .sort((a, b) => a.hit!.index - b.hit!.index)
    .map((item) => item.action.id);

  const steps: RouteStep[] = route.map((action, idealIndex) => {
    const hit = firstPerformance(log, action.id);
    const target = action.optimalByMinute ?? action.lateAfterMinute ?? null;
    const actualPosition = hit ? performedRouteIds.indexOf(action.id) + 1 : null;

    if (!hit) {
      return {
        actionId: action.id,
        label: action.label,
        rationale: action.rationale,
        idealPosition: idealIndex + 1,
        actualPosition: null,
        performedAtMinute: null,
        targetMinute: target,
        status: "missed",
        note: target != null ? `Never performed — expert practice does this by minute ${target}.` : "Never performed.",
      };
    }

    const minute = hit.entry.virtualMinute;
    const late = action.lateAfterMinute != null && minute > action.lateAfterMinute;
    const onTime = target == null || minute <= target;
    const outOfOrder = actualPosition != null && actualPosition > idealIndex + 1;

    let status: RouteStepStatus = "optimal";
    let note = target != null ? `Done at minute ${minute} (target ${target}).` : `Done at minute ${minute}.`;
    if (late) {
      status = "late";
      note = `Done at minute ${minute} — late; the window closed at ${action.lateAfterMinute}.`;
    } else if (outOfOrder) {
      status = "out-of-order";
      note = `Done at minute ${minute}, but ${idealIndex + 1 - (actualPosition ?? 0) > 0 ? "earlier" : "later"} in your sequence than expert order (#${actualPosition} vs ideal #${idealIndex + 1}).`;
    } else if (!onTime) {
      status = "late";
      note = `Done at minute ${minute} — past the optimal window of ${target}.`;
    }

    return {
      actionId: action.id,
      label: action.label,
      rationale: action.rationale,
      idealPosition: idealIndex + 1,
      actualPosition,
      performedAtMinute: minute,
      targetMinute: target,
      status,
      note,
    };
  });

  const total = steps.length || 1;
  const performed = steps.filter((s) => s.status !== "missed");
  const coverage = Math.round((performed.length / total) * 100);
  const inOrder = performed.filter((s) => s.status !== "out-of-order").length;
  const ordering = performed.length ? Math.round((inOrder / performed.length) * 100) : 0;
  const onTime = performed.filter((s) => s.status === "optimal").length;
  const timeliness = performed.length ? Math.round((onTime / performed.length) * 100) : 0;

  // Coverage carries the most weight — omitting essential care is the biggest
  // failure — then timeliness, then sequence. Unsafe actions subtract directly.
  const raw = coverage * 0.5 + timeliness * 0.3 + ordering * 0.2 - unsafeCount * 12;
  const score = Math.max(0, Math.min(100, Math.round(raw)));

  const band: BestPracticeGrade["band"] =
    unsafeCount > 0 && score < 60 ? "unsafe" : score >= 88 ? "expert" : score >= 70 ? "proficient" : score >= 50 ? "developing" : "unsafe";

  const missed = steps.filter((s) => s.status === "missed");
  const lateSteps = steps.filter((s) => s.status === "late");
  const misordered = steps.filter((s) => s.status === "out-of-order");

  const headline =
    band === "expert" ? "You followed the evidence-based route almost exactly."
    : band === "proficient" ? "Solid clinical route with a few timing or sequence gaps."
    : band === "developing" ? "The essential care was incomplete or significantly delayed."
    : "Unsafe or badly incomplete — rewind and work the priorities in order.";

  const nextFocus =
    unsafeCount > 0 ? `Eliminate the ${unsafeCount} unsafe action${unsafeCount === 1 ? "" : "s"} — rewind to just before ${log.find((e) => e.classification === "unsafe" || e.classification === "critical_error")?.label ?? "that decision"} and choose again.`
    : missed.length ? `Missed: ${missed.slice(0, 2).map((s) => s.label).join(" and ")}. These are required by best practice for this presentation.`
    : lateSteps.length ? `Timing: ${lateSteps[0].label} needed to happen by minute ${lateSteps[0].targetMinute}.`
    : misordered.length ? `Sequence: ${misordered[0].label} belongs at step ${misordered[0].idealPosition} of the route.`
    : "Route matched best practice — try independent mode or a harder scenario.";

  return { score, band, coverage, ordering, timeliness, steps, unsafeCount, headline, nextFocus };
}
