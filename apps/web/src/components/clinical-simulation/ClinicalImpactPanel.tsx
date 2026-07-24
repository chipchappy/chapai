"use client";

import { useMemo } from "react";
import { AlertTriangle, ArrowDownRight, ArrowUpRight, Clock3, Hourglass, Play, Radar, Sparkles } from "lucide-react";
import type { PatientState } from "@/lib/clinical-simulation/engine";
import { buildConcerns, suggestActionFor, type Concern } from "@/lib/clinical-simulation/concerns";
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
  const suggestionFor = (concern: Concern): ScenarioAction | null => (guided ? suggestActionFor(scenario, state, concern) : null);

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
