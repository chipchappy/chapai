import type { PatientState } from "@/lib/clinical-simulation/engine";
import type { ClinicalScenario, ScenarioAction } from "@/lib/clinical-simulation/schema";

// ─────────────────────────────────────────────────────────────────────────────
// Live clinical concerns.
//
// Red flags read from the CURRENT vitals, labs, and symptoms — not from scenario
// authoring — so every scenario gets prioritised "what needs attention next"
// reasoning for free. Ranked airway -> breathing -> circulation -> disability,
// the order a nurse is taught to work a deteriorating patient.
// ─────────────────────────────────────────────────────────────────────────────

export type Concern = {
  id: string;
  label: string;
  detail: string;
  severity: "critical" | "warning";
  /** Lower sorts first. */
  rank: number;
  match: RegExp;
};

function numeric(value: unknown): number | null {
  const parsed = typeof value === "number" ? value : Number(String(value ?? "").replace(/[^0-9.-]/g, ""));
  return Number.isFinite(parsed) ? parsed : null;
}

function labValue(state: PatientState, key: string): number | null {
  const entry = Object.entries(state.labs ?? {}).find(([name]) => name.toLowerCase().includes(key));
  return entry ? numeric(entry[1]) : null;
}

export function buildConcerns(state: PatientState): Concern[] {
  const v = state.vitals;
  const concerns: Concern[] = [];
  const add = (c: Concern) => concerns.push(c);

  if (v.spo2 < 90) add({ id: "hypoxemia", label: "Hypoxemia", detail: `SpO₂ ${Math.round(v.spo2)}% — oxygenation is failing.`, severity: "critical", rank: 1, match: /oxygen|\bo2\b|cannula|mask|rebreather|airway|fio2/i });
  else if (v.spo2 < 94) add({ id: "borderline-spo2", label: "Borderline saturation", detail: `SpO₂ ${Math.round(v.spo2)}% — trending toward hypoxemia.`, severity: "warning", rank: 4, match: /oxygen|\bo2\b|cannula|mask|airway/i });

  if (v.respiratoryRate < 8) add({ id: "resp-depression", label: "Respiratory depression", detail: `RR ${Math.round(v.respiratoryRate)} — inadequate ventilation.`, severity: "critical", rank: 1, match: /airway|bag|ventilat|naloxone|reversal|resp/i });
  else if (v.respiratoryRate > 28) add({ id: "tachypnea", label: "Tachypnea", detail: `RR ${Math.round(v.respiratoryRate)} — increased work of breathing.`, severity: "warning", rank: 3, match: /resp|breath|oxygen|airway|abg/i });

  if (v.map < 65) add({ id: "hypotension", label: "Hypotension", detail: `MAP ${Math.round(v.map)} — organ perfusion is threatened.`, severity: "critical", rank: 2, match: /fluid|bolus|crystalloid|pressor|norepinephrine|vasopress|perfusion|lactate/i });
  if (v.heartRate > 120) add({ id: "tachycardia", label: "Tachycardia", detail: `HR ${Math.round(v.heartRate)} — compensating for something.`, severity: "warning", rank: 5, match: /fluid|bolus|rhythm|ecg|pain|cardiac|perfusion/i });

  if (v.temperatureC >= 38.3) add({ id: "fever", label: "Febrile", detail: `Temp ${v.temperatureC.toFixed(1)}°C — obtain cultures before antibiotics.`, severity: "warning", rank: 6, match: /culture|antibiotic|blood culture|sepsis|lactate/i });

  const lactate = labValue(state, "lactate");
  if (lactate != null && lactate >= 2) add({ id: "lactate", label: "Elevated lactate", detail: `Lactate ${lactate.toFixed(1)} — tissue hypoperfusion.`, severity: lactate >= 4 ? "critical" : "warning", rank: 3, match: /lactate|fluid|bolus|perfusion|pressor/i });

  if (!/alert/i.test(state.levelOfConsciousness)) add({ id: "loc", label: "Altered mental status", detail: `${state.levelOfConsciousness} — reassess airway protection and perfusion.`, severity: "critical", rank: 2, match: /neuro|conscious|glucose|airway|\bloc\b|mental|pupil/i });

  if (state.urineOutputMlHr < 30) add({ id: "oliguria", label: "Oliguria", detail: `${Math.round(state.urineOutputMlHr)} mL/hr — renal perfusion is dropping.`, severity: "warning", rank: 5, match: /urine|foley|output|fluid|intake|perfusion/i });

  if (state.bleedingMl > 0) add({ id: "bleeding", label: "Active bleeding", detail: `${Math.round(state.bleedingMl)} mL documented — find the source and control it.`, severity: "critical", rank: 2, match: /bleed|hemorrhage|dressing|pressure|surgical|transfus/i });

  if (v.pain >= 7) add({ id: "pain", label: "Uncontrolled pain", detail: `Pain ${v.pain}/10 — treat and reassess.`, severity: "warning", rank: 7, match: /pain|analges|opioid|comfort/i });

  if (state.agitation >= 7) add({ id: "agitation", label: "Escalating agitation", detail: `Agitation ${state.agitation}/10 — safety risk to patient and staff.`, severity: "warning", rank: 4, match: /agitat|de-escalat|safety|restraint|calm|sitter/i });

  return concerns.sort((a, b) => a.rank - b.rank || (a.severity === "critical" ? -1 : 1));
}

/** The best un-performed, safe action that addresses a concern (guided mode only). */
export function suggestActionFor(scenario: ClinicalScenario, state: PatientState, concern: Concern): ScenarioAction | null {
  return scenario.actions.find((action) =>
    !state.completedActionIds.includes(action.id)
    && action.baseClassification !== "unsafe"
    && action.baseClassification !== "critical_error"
    && concern.match.test(`${action.label} ${action.description}`)) ?? null;
}
