"use client";

import { useMemo, useState } from "react";
import { Check, MessageCircle, Play, Search } from "lucide-react";
import type { PatientState } from "@/lib/clinical-simulation/engine";
import type { ClinicalScenario, ScenarioAction } from "@/lib/clinical-simulation/schema";
import styles from "./assessment-station.module.css";

// ─────────────────────────────────────────────────────────────────────────────
// Assessment station.
//
// Every body system in one place, plus talking to the patient. Systems are
// ordered airway → breathing → circulation → disability → everything else, and
// each shows the scenario's own assessment actions for that system alongside any
// findings already revealed. Findings are stamped with the minute they were
// obtained and marked stale once the patient has moved on, so a student learns
// that assessment data has a shelf life.
// ─────────────────────────────────────────────────────────────────────────────

type SystemDef = { id: string; label: string; hint: string; pattern: RegExp };

const SYSTEMS: SystemDef[] = [
  { id: "general", label: "General survey", hint: "Overall appearance, distress, positioning", pattern: /general|survey|appearance|inspect/i },
  { id: "airway", label: "Airway", hint: "Patency, protective reflexes, secretions", pattern: /airway|secretion|suction|patency|swallow|gag/i },
  { id: "respiratory", label: "Respiratory", hint: "Effort, breath sounds, oxygenation", pattern: /resp|breath|lung|auscult|oxygen|spiromet|cough|sputum|abg/i },
  { id: "cardiovascular", label: "Cardiovascular", hint: "Rhythm, pulses, perfusion, pressures", pattern: /cardiac|cardiovascular|rhythm|pulse|perfusion|capillary|ecg|ekg|blood pressure|heart/i },
  { id: "neuro", label: "Neurologic", hint: "LOC, orientation, pupils, strength", pattern: /neuro|conscious|orient|pupil|glasgow|\bloc\b|mental|sedation|strength/i },
  { id: "abdomen", label: "GI / abdomen", hint: "Bowel sounds, distension, tenderness", pattern: /abdom|bowel|\bgi\b|nausea|vomit|distend|nutrition|feed/i },
  { id: "gu", label: "Genitourinary", hint: "Urine output, catheter, colour", pattern: /urin|foley|catheter|output|bladder|renal/i },
  { id: "skin", label: "Skin & wounds", hint: "Colour, temperature, sites, dressings", pattern: /skin|wound|dressing|incision|integument|mottl|edema|drain|pressure/i },
  { id: "lines", label: "Lines & devices", hint: "IV sites, patency, tubing, infusions", pattern: /\biv\b|line|site|infiltrat|patenc|flush|infus|tubing|access|central/i },
  { id: "pain", label: "Pain & comfort", hint: "Location, severity, response", pattern: /pain|comfort|analges|scale/i },
  { id: "safety", label: "Safety", hint: "Falls, restraints, precautions", pattern: /safety|fall|restraint|precaution|sitter|bed rail/i },
];

/** Things a nurse can say to a patient — answers reflect live state, not a script. */
type DialogueOption = { id: string; prompt: string; reply: (state: PatientState) => string };

const DIALOGUE: DialogueOption[] = [
  {
    id: "orientation",
    prompt: "Can you tell me your name and where you are?",
    reply: (s) => /alert/i.test(s.levelOfConsciousness)
      ? `"${s.orientation}." The patient answers without difficulty.`
      : /unrespons|obtund/i.test(s.levelOfConsciousness)
        ? "No verbal response. The patient does not open their eyes to voice."
        : `The patient answers slowly and needs prompting — ${s.orientation.toLowerCase()}.`,
  },
  {
    id: "breathing",
    prompt: "Are you having any trouble breathing?",
    reply: (s) => s.vitals.respiratoryRate > 26 || /labor|accessory|distress/i.test(s.respiratoryEffort)
      ? `"I can't... catch my breath." The patient speaks in short phrases and is using accessory muscles.`
      : /unrespons|obtund/i.test(s.levelOfConsciousness)
        ? "No response to the question."
        : `"I'm breathing okay." Speech is in full sentences.`,
  },
  {
    id: "pain",
    prompt: "Are you having any pain? Can you rate it 0 to 10?",
    reply: (s) => /unrespons|obtund/i.test(s.levelOfConsciousness)
      ? "No verbal response; the patient grimaces to sternal pressure."
      : s.vitals.pain >= 7
        ? `"It's bad — about ${s.vitals.pain} out of 10." The patient is guarding.`
        : s.vitals.pain > 0
          ? `"Maybe a ${s.vitals.pain}. It's manageable."`
          : `"No, I'm comfortable right now."`,
  },
  {
    id: "feeling",
    prompt: "How are you feeling right now — anything worrying you?",
    reply: (s) => s.anxiety >= 6
      ? `"Something doesn't feel right. I feel like something bad is happening."`
      : /unrespons|obtund/i.test(s.levelOfConsciousness)
        ? "No response."
        : s.vitals.spo2 < 92
          ? `"I feel a bit lightheaded and tired."`
          : `"I'm alright, just tired."`,
  },
  {
    id: "nausea",
    prompt: "Any nausea, dizziness, or chest discomfort?",
    reply: (s) => /unrespons|obtund/i.test(s.levelOfConsciousness)
      ? "No response."
      : s.vitals.map < 65
        ? `"I'm dizzy when I try to sit up."`
        : `"No, nothing like that."`,
  },
];

export default function AssessmentStation({
  scenario,
  state,
  busy,
  onPerform,
}: {
  scenario: ClinicalScenario;
  state: PatientState;
  busy: boolean;
  onPerform: (actionId: string) => void;
}) {
  const [systemId, setSystemId] = useState<string>("general");
  const [asked, setAsked] = useState<Record<string, string>>({});

  const assessmentActions = useMemo(
    () => scenario.actions.filter((a) => a.category === "assessment" || a.category === "safety"),
    [scenario.actions],
  );

  const system = SYSTEMS.find((s) => s.id === systemId) ?? SYSTEMS[0];

  const actionsFor = (def: SystemDef): ScenarioAction[] =>
    assessmentActions.filter((a) => def.pattern.test(`${a.label} ${a.description}`));

  const findingsFor = (def: SystemDef) =>
    scenario.assessments
      .filter((f) => state.revealedFindingIds.includes(f.id) && def.pattern.test(`${f.id} ${f.category} ${f.label}`))
      .map((f) => ({ ...f, record: state.assessmentRecords.find((r) => r.assessmentId === f.id) }));

  const systemActions = actionsFor(system);
  const systemFindings = findingsFor(system);

  return (
    <div className={styles.assess} data-testid="assessment-station">
      <nav className={styles.assessRail} aria-label="Body systems">
        {SYSTEMS.map((def) => {
          const count = actionsFor(def).length;
          const done = actionsFor(def).filter((a) => state.completedActionIds.includes(a.id)).length;
          if (!count) return null;
          return (
            <button key={def.id} type="button" data-active={def.id === systemId} onClick={() => setSystemId(def.id)} aria-current={def.id === systemId}>
              <span>{def.label}</span>
              <em data-complete={done > 0 && done === count}>{done}/{count}</em>
            </button>
          );
        })}
      </nav>

      <div className={styles.assessPane}>
        <header className={styles.assessHeader}>
          <div><h3>{system.label}</h3><p>{system.hint}</p></div>
        </header>

        <section aria-label={`${system.label} assessments`}>
          <h4><Search size={13} aria-hidden="true" /> Perform assessment</h4>
          {systemActions.length ? <div className={styles.assessActions}>
            {systemActions.map((action) => {
              const done = state.completedActionIds.includes(action.id);
              return (
                <button key={action.id} type="button" disabled={busy || (done && !action.repeatable)} data-done={done} onClick={() => onPerform(action.id)} title={action.description}>
                  {done ? <Check size={13} aria-hidden="true" /> : <Play size={13} aria-hidden="true" />}
                  <span>{action.label}{done && action.repeatable ? " (repeat)" : ""}</span>
                </button>
              );
            })}
          </div> : <p className={styles.assessEmpty}>No focused assessment is defined for this system in this scenario.</p>}
        </section>

        <section aria-label={`${system.label} findings`}>
          <h4>Findings</h4>
          {systemFindings.length ? <ul className={styles.assessFindings}>
            {systemFindings.map((f) => {
              const age = f.record ? state.virtualMinute - f.record.virtualMinute : 0;
              return (
                <li key={f.id} data-stale={age >= 5}>
                  <strong>{f.label}</strong>
                  <p>{f.finding}</p>
                  <small>Assessed +{f.record?.virtualMinute ?? 0} min{age >= 5 ? ` · ${age} min old — may no longer reflect the patient` : " · current"}</small>
                </li>
              );
            })}
          </ul> : <p className={styles.assessEmpty}>Nothing assessed yet for this system.</p>}
        </section>

        {system.id === "general" || system.id === "neuro" || system.id === "pain" ? (
          <section aria-label="Talk with the patient">
            <h4><MessageCircle size={13} aria-hidden="true" /> Talk with the patient</h4>
            <div className={styles.assessDialogue}>
              {DIALOGUE.map((option) => (
                <div key={option.id}>
                  <button type="button" onClick={() => setAsked((prev) => ({ ...prev, [option.id]: option.reply(state) }))}>
                    “{option.prompt}”
                  </button>
                  {asked[option.id] ? <p className={styles.assessReply}>{asked[option.id]}</p> : null}
                </div>
              ))}
            </div>
          </section>
        ) : null}
      </div>
    </div>
  );
}
