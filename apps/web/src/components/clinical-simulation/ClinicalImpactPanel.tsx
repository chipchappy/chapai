"use client";

import { useMemo } from "react";
import { AlertTriangle, ArrowDownRight, ArrowUpRight, Clock3, Hourglass, Play, Radar, Sparkles } from "lucide-react";
import type { PatientState } from "@/lib/clinical-simulation/engine";
import type { ClinicalScenario, ScenarioAction } from "@/lib/clinical-simulation/schema";
import styles from "./clinical-simulation.module.css";

// ─────────────────────────────────────────────────────────────────────────────
// Decision consequences ("butterfly effects").
//
// Three linked ideas, all derived from live engine state — no scenario authoring
// required, so every scenario gets this behaviour:
//   1. Unfolding — effects already committed by a past decision that have not
//      landed yet (engine `pendingEffects`). This is the butterfly mid-flight.
//   2. Active concerns — physiologic red flags read from the CURRENT vitals,
//      labs, and symptoms, ranked by clinical priority. Guided mode links each
//      concern to the matching un-performed action; independent mode names the
//      concern but withholds the answer.
//   3. Ripple — the physiologic delta produced by the most recent decision, so
//      cause and effect sit next to each other.
// ─────────────────────────────────────────────────────────────────────────────

type Concern = {
  id: string;
  label: string;
  detail: string;
  severity: "critical" | "warning";
  /** Priority rank — lower sorts first (airway/breathing/circulation ordering). */
  rank: number;
  match: RegExp;
};

/** Human labels for engine state paths surfaced in decision ripples. */
const PATH_LABELS: Record<string, string> = {
  "vitals.heartRate": "HR",
  "vitals.systolic": "Systolic",
  "vitals.diastolic": "Diastolic",
  "vitals.map": "MAP",
  "vitals.respiratoryRate": "RR",
  "vitals.spo2": "SpO₂",
  "vitals.temperatureC": "Temp",
  "vitals.pain": "Pain",
  urineOutputMlHr: "Urine output",
  levelOfConsciousness: "LOC",
  perfusion: "Perfusion",
  breathSounds: "Breath sounds",
  respiratoryEffort: "Effort",
  cardiacRhythm: "Rhythm",
  oxygenDevice: "O₂ device",
  oxygenFlow: "O₂ flow",
  bleedingMl: "Bleeding",
  drainOutputMl: "Drain output",
  anxiety: "Anxiety",
  agitation: "Agitation",
};

function labelForPath(path: string) {
  if (PATH_LABELS[path]) return PATH_LABELS[path];
  const leaf = path.split(".").pop() ?? path;
  const key = leaf.replace(/^labs\./, "");
  return key.replace(/([a-z])([A-Z])/g, "$1 $2").replace(/[_-]+/g, " ").replace(/^./, (c) => c.toUpperCase());
}

function numeric(value: unknown): number | null {
  const parsed = typeof value === "number" ? value : Number(String(value ?? "").replace(/[^0-9.-]/g, ""));
  return Number.isFinite(parsed) ? parsed : null;
}

function labValue(state: PatientState, key: string): number | null {
  const entry = Object.entries(state.labs ?? {}).find(([name]) => name.toLowerCase().includes(key));
  return entry ? numeric(entry[1]) : null;
}

function buildConcerns(state: PatientState): Concern[] {
  const v = state.vitals;
  const concerns: Concern[] = [];
  const add = (c: Concern) => concerns.push(c);

  // Airway / breathing first, then circulation, then disability — the same order
  // a nurse is taught to work a deteriorating patient.
  if (v.spo2 < 90) add({ id: "hypoxemia", label: "Hypoxemia", detail: `SpO₂ ${Math.round(v.spo2)}% — oxygenation is failing.`, severity: "critical", rank: 1, match: /oxygen|\bo2\b|cannula|mask|rebreather|airway|fio2/i });
  else if (v.spo2 < 94) add({ id: "borderline-spo2", label: "Borderline saturation", detail: `SpO₂ ${Math.round(v.spo2)}% — trending toward hypoxemia.`, severity: "warning", rank: 4, match: /oxygen|\bo2\b|cannula|mask|airway/i });

  if (v.respiratoryRate < 8) add({ id: "resp-depression", label: "Respiratory depression", detail: `RR ${Math.round(v.respiratoryRate)} — inadequate ventilation.`, severity: "critical", rank: 1, match: /airway|bag|ventilat|naloxone|reversal|resp/i });
  else if (v.respiratoryRate > 28) add({ id: "tachypnea", label: "Tachypnea", detail: `RR ${Math.round(v.respiratoryRate)} — increased work of breathing.`, severity: "warning", rank: 3, match: /resp|breath|oxygen|airway|abg/i });

  if (v.map < 65) add({ id: "hypotension", label: "Hypotension", detail: `MAP ${Math.round(v.map)} — organ perfusion is threatened.`, severity: "critical", rank: 2, match: /fluid|bolus|crystalloid|pressor|norepinephrine|vasopress|perfusion|lactate/i });
  if (v.heartRate > 120) add({ id: "tachycardia", label: "Tachycardia", detail: `HR ${Math.round(v.heartRate)} — compensating for something.`, severity: "warning", rank: 5, match: /fluid|bolus|rhythm|ecg|pain|cardiac|perfusion/i });

  const temp = v.temperatureC;
  if (temp >= 38.3) add({ id: "fever", label: "Febrile", detail: `Temp ${temp.toFixed(1)}°C — obtain cultures before antibiotics.`, severity: "warning", rank: 6, match: /culture|antibiotic|blood culture|sepsis|lactate/i });

  const lactate = labValue(state, "lactate");
  if (lactate != null && lactate >= 2) add({ id: "lactate", label: "Elevated lactate", detail: `Lactate ${lactate} — tissue hypoperfusion.`, severity: lactate >= 4 ? "critical" : "warning", rank: 3, match: /lactate|fluid|bolus|perfusion|pressor/i });

  if (!/alert/i.test(state.levelOfConsciousness)) add({ id: "loc", label: "Altered mental status", detail: `${state.levelOfConsciousness} — reassess airway protection and perfusion.`, severity: "critical", rank: 2, match: /neuro|conscious|glucose|airway|\bloc\b|mental|pupil/i });

  if (state.urineOutputMlHr < 30) add({ id: "oliguria", label: "Oliguria", detail: `${Math.round(state.urineOutputMlHr)} mL/hr — renal perfusion is dropping.`, severity: "warning", rank: 5, match: /urine|foley|output|fluid|intake|perfusion/i });

  if (state.bleedingMl > 0) add({ id: "bleeding", label: "Active bleeding", detail: `${Math.round(state.bleedingMl)} mL documented — assess source and control it.`, severity: "critical", rank: 2, match: /bleed|hemorrhage|dressing|pressure|surgical|transfus/i });

  if (v.pain >= 7) add({ id: "pain", label: "Uncontrolled pain", detail: `Pain ${v.pain}/10 — treat and reassess.`, severity: "warning", rank: 7, match: /pain|analges|opioid|comfort/i });

  if (state.agitation >= 7) add({ id: "agitation", label: "Escalating agitation", detail: `Agitation ${state.agitation}/10 — safety risk to patient and staff.`, severity: "warning", rank: 4, match: /agitat|de-escalat|safety|restraint|calm|sitter/i });

  return concerns.sort((a, b) => a.rank - b.rank || (a.severity === "critical" ? -1 : 1));
}

export default function ClinicalImpactPanel({
  scenario,
  state,
  busy,
  onAct,
}: {
  scenario: ClinicalScenario;
  state: PatientState;
  busy: boolean;
  onAct: (actionId: string) => void;
}) {
  const guided = state.mode === "guided";
  const concerns = useMemo(() => buildConcerns(state), [state]);
  const lastEntry = state.actionLog[state.actionLog.length - 1];
  const pending = [...(state.pendingEffects ?? [])].sort((a, b) => a.dueMinute - b.dueMinute);

  // In guided mode each concern offers the matching un-performed action.
  const suggestionFor = (concern: Concern): ScenarioAction | null => {
    if (!guided) return null;
    return scenario.actions.find((action) =>
      !state.completedActionIds.includes(action.id)
      && action.baseClassification !== "unsafe"
      && action.baseClassification !== "critical_error"
      && concern.match.test(`${action.label} ${action.description}`)) ?? null;
  };

  const ripples = (lastEntry?.stateChanges ?? [])
    .map((change) => {
      const before = numeric(change.before);
      const after = numeric(change.after);
      return { path: change.path, before, after, label: labelForPath(change.path), textAfter: String(change.after) };
    })
    .slice(0, 6);

  return (
    <section className={styles.impactPanel} aria-label="Clinical decision impact">
      <header><Radar size={16} aria-hidden="true" /> Clinical impact</header>

      {pending.length ? (
        <div className={styles.impactBlock} data-kind="unfolding">
          <h3><Hourglass size={14} aria-hidden="true" /> Still unfolding</h3>
          <ul>
            {pending.slice(0, 4).map((effect) => {
              const inMinutes = Math.max(0, effect.dueMinute - state.virtualMinute);
              return <li key={effect.id}>
                <span className={styles.impactWhen}>{inMinutes === 0 ? "now" : `~${inMinutes} min`}</span>
                <p>{effect.feedback}</p>
              </li>;
            })}
          </ul>
          <small>Decisions you already made are still changing this patient.</small>
        </div>
      ) : null}

      <div className={styles.impactBlock} data-kind="concerns">
        <h3><AlertTriangle size={14} aria-hidden="true" /> Active concerns{concerns.length ? ` (${concerns.length})` : ""}</h3>
        {concerns.length ? (
          <ul>
            {concerns.slice(0, 5).map((concern) => {
              const suggestion = suggestionFor(concern);
              return <li key={concern.id} data-severity={concern.severity}>
                <div><strong>{concern.label}</strong><p>{concern.detail}</p></div>
                {suggestion ? (
                  <button type="button" disabled={busy} onClick={() => onAct(suggestion.id)} title={suggestion.rationale}>
                    <Play size={13} aria-hidden="true" /> {suggestion.label}
                  </button>
                ) : null}
              </li>;
            })}
          </ul>
        ) : <p className={styles.impactCalm}><Sparkles size={14} aria-hidden="true" /> No red flags in the current data. Keep reassessing — this patient can change.</p>}
        {!guided && concerns.length ? <small>Independent mode: concerns are named, the next step is yours to choose.</small> : null}
      </div>

      {lastEntry ? (
        <div className={styles.impactBlock} data-kind="ripple">
          <h3><Clock3 size={14} aria-hidden="true" /> Ripple from your last decision</h3>
          <p className={styles.impactDecision}>{lastEntry.label} <em>+{lastEntry.virtualMinute} min</em></p>
          {ripples.length ? (
            <div className={styles.rippleGrid}>
              {ripples.map((ripple) => {
                const delta = ripple.before != null && ripple.after != null ? ripple.after - ripple.before : null;
                const direction = delta == null || Math.abs(delta) < 0.05 ? "flat" : delta > 0 ? "up" : "down";
                return <span key={ripple.path} data-direction={direction}>
                  <i>{ripple.label}</i>
                  {delta != null
                    ? <b>{direction === "up" ? <ArrowUpRight size={12} aria-hidden="true" /> : direction === "down" ? <ArrowDownRight size={12} aria-hidden="true" /> : null}{Math.round(ripple.after ?? 0)}</b>
                    : <b title={ripple.textAfter}>{ripple.textAfter.slice(0, 22)}</b>}
                </span>;
              })}
            </div>
          ) : <small>No measurable physiologic change yet — some effects take time to appear.</small>}
        </div>
      ) : null}
    </section>
  );
}
