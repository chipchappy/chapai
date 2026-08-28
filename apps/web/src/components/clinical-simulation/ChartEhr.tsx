"use client";

import { useMemo, useState } from "react";
import { Activity, ClipboardList, Droplets, FileText, FlaskConical, HeartPulse, ListChecks, Stethoscope, TrendingUp, User } from "lucide-react";
import type { PatientState } from "@/lib/clinical-simulation/engine";
import type { ClinicalScenario } from "@/lib/clinical-simulation/schema";
import styles from "./clinical-simulation.module.css";

// ─────────────────────────────────────────────────────────────────────────────
// Bedside EHR.
//
// The room's workstation opens this: a fictional but authentically-organised
// chart. Every section reads from the SAME engine state as the monitor and the
// patient, so trends, results, and I/O move as the scenario unfolds — the
// student has to interpret, not just acknowledge.
//
// Deliberately shallow-clicking: one rail, one pane, no nested modals.
// ─────────────────────────────────────────────────────────────────────────────

type SectionId = "overview" | "history" | "handoff" | "orders" | "labs" | "trends" | "io" | "notes";

const sections: Array<{ id: SectionId; label: string; icon: typeof User }> = [
  { id: "overview", label: "Overview", icon: User },
  { id: "history", label: "History", icon: FileText },
  { id: "handoff", label: "Handoff", icon: Stethoscope },
  { id: "orders", label: "Orders", icon: ListChecks },
  { id: "labs", label: "Labs", icon: FlaskConical },
  { id: "trends", label: "Vitals trends", icon: TrendingUp },
  { id: "io", label: "Intake / output", icon: Droplets },
  { id: "notes", label: "Notes", icon: ClipboardList },
];

function Row({ term, children }: { term: string; children: React.ReactNode }) {
  return <div className={styles.ehrRow}><dt>{term}</dt><dd>{children}</dd></div>;
}

/** Sparkline over the engine's per-minute vitals history. */
function Trend({ samples, pick, label, unit, low, high }: {
  samples: Array<{ minute: number; heartRate: number; map: number; spo2: number; respiratoryRate: number }>;
  pick: (s: { heartRate: number; map: number; spo2: number; respiratoryRate: number }) => number;
  label: string;
  unit: string;
  low: number;
  high: number;
}) {
  if (samples.length < 2) return null;
  const values = samples.map(pick);
  const min = Math.min(...values, low);
  const max = Math.max(...values, high);
  const span = Math.max(1, max - min);
  const w = 260;
  const h = 46;
  const points = values.map((v, i) => `${((i / (values.length - 1)) * w).toFixed(1)},${(h - ((v - min) / span) * h).toFixed(1)}`).join(" ");
  const current = values[values.length - 1];
  const first = values[0];
  const delta = Math.round(current - first);
  const outOfRange = current < low || current > high;
  return (
    <div className={styles.ehrTrend} data-alert={outOfRange}>
      <div><span>{label}</span><strong>{Math.round(current)}<small>{unit}</small></strong></div>
      <svg viewBox={`0 0 ${w} ${h}`} role="img" aria-label={`${label} trend, currently ${Math.round(current)} ${unit}`}>
        <polyline points={points} fill="none" stroke="currentColor" strokeWidth="2" strokeLinejoin="round" strokeLinecap="round" />
      </svg>
      <em>{delta === 0 ? "no change" : `${delta > 0 ? "+" : ""}${delta} since start`}</em>
    </div>
  );
}

export default function ChartEhr({ scenario, state }: { scenario: ClinicalScenario; state: PatientState }) {
  const [section, setSection] = useState<SectionId>("overview");
  const patient = scenario.patient;
  const samples = state.vitalsHistory ?? [];

  const availableLabs = useMemo(
    () => scenario.chart.labs.filter((lab) => lab.availableAtMinute <= state.virtualMinute),
    [scenario.chart.labs, state.virtualMinute],
  );
  const pendingLabs = scenario.chart.labs.filter((lab) => lab.availableAtMinute > state.virtualMinute);
  const documentation = state.actionLog.filter((entry) => entry.category === "documentation" || entry.category === "communication");

  return (
    <div className={styles.ehr} data-testid="chart-ehr">
      <nav className={styles.ehrRail} aria-label="Chart sections">
        {sections.map((item) => {
          const Icon = item.icon;
          const badge = item.id === "labs" && availableLabs.some((lab) => lab.flag === "critical");
          return (
            <button key={item.id} type="button" data-active={section === item.id} onClick={() => setSection(item.id)} aria-current={section === item.id}>
              <Icon size={15} aria-hidden="true" /> {item.label}
              {badge ? <em className={styles.ehrCritical} aria-label="critical result">!</em> : null}
            </button>
          );
        })}
      </nav>

      <div className={styles.ehrPane}>
        {section === "overview" ? <>
          <h2>Patient overview</h2>
          <dl className={styles.ehrList}>
            <Row term="Name">{patient.name}</Row>
            <Row term="Age / sex">{patient.age} · {patient.sex} ({patient.pronouns})</Row>
            <Row term="Room">{patient.room}</Row>
            <Row term="Admitting problem">{patient.presentingProblem}</Row>
            <Row term="Allergies"><strong className={patient.allergies.length ? styles.ehrFlag : undefined}>{patient.allergies.join(", ") || "No known drug allergies"}</strong></Row>
            <Row term="Code status">{patient.codeStatus}</Row>
            <Row term="Isolation">{patient.isolation}</Row>
            <Row term="Baseline function">{patient.baselineFunction}</Row>
            <Row term="Risks">Fall {patient.risks.fall} · skin {patient.risks.skin} · suicide {patient.risks.suicide} · elopement {patient.risks.elopement}</Row>
          </dl>
          <h2>Lines, tubes and drains</h2>
          <ul className={styles.ehrPlain}>{Object.entries(state.devices).map(([device, detail]) => <li key={device}><strong>{device.replaceAll("_", " ")}</strong> — {detail}</li>)}</ul>
        </> : null}

        {section === "history" ? <>
          <h2>Medical history</h2>
          <ul className={styles.ehrPlain}>{patient.history.map((item) => <li key={item}>{item}</li>)}</ul>
          <h2>Surgical history</h2>
          <ul className={styles.ehrPlain}>{patient.surgicalHistory.length ? patient.surgicalHistory.map((item) => <li key={item}>{item}</li>) : <li>None documented</li>}</ul>
          <h2>Home medications</h2>
          <ul className={styles.ehrPlain}>{scenario.chart.homeMedications.length ? scenario.chart.homeMedications.map((item) => <li key={item}>{item}</li>) : <li>None documented</li>}</ul>
          <h2>Social / substance history</h2>
          <ul className={styles.ehrPlain}>{[...patient.socialHistory, ...patient.substanceUseHistory].map((item) => <li key={item}>{item}</li>)}</ul>
          {patient.psychiatricHistory.length ? <><h2>Psychiatric history</h2><ul className={styles.ehrPlain}>{patient.psychiatricHistory.map((item) => <li key={item}>{item}</li>)}</ul></> : null}
        </> : null}

        {section === "handoff" ? <>
          <h2>Shift handoff</h2>
          <p className={styles.ehrNarrative}>{scenario.prebrief.handoff}</p>
          <dl className={styles.ehrList}>
            <Row term="Shift">{scenario.prebrief.shift}</Row>
            <Row term="Your role">{scenario.prebrief.role}</Row>
            <Row term="Resources">{scenario.prebrief.resources.join(" · ")}</Row>
          </dl>
          <p className={styles.ehrSafety}>{scenario.prebrief.safetyNote}</p>
        </> : null}

        {section === "orders" ? <>
          <h2>Active orders</h2>
          <ul className={styles.ehrPlain}>{scenario.chart.orders.map((item) => <li key={item}>{item}</li>)}</ul>
          {state.activeOrders.length ? <>
            <h2>New orders during this event</h2>
            <ul className={styles.ehrPlain} data-testid="simulation-new-orders">
              {state.activeOrders.map((item, index) => <li key={`${item}-${index}`}><strong>New</strong> — {item}</li>)}
            </ul>
          </> : null}
          <h2>PRN orders</h2>
          <ul className={styles.ehrPlain}>{scenario.chart.prnOrders.length ? scenario.chart.prnOrders.map((item) => <li key={item}>{item}</li>) : <li>None</li>}</ul>
          <h2>Active infusions and medications</h2>
          <ul className={styles.ehrPlain}>{scenario.chart.activeMedications.length ? scenario.chart.activeMedications.map((item) => <li key={item}>{item}</li>) : <li>None running</li>}</ul>
        </> : null}

        {section === "labs" ? <>
          <h2>Laboratory results</h2>
          {availableLabs.length ? <table className={styles.ehrTable}>
            <thead><tr><th scope="col">Test</th><th scope="col">Result</th><th scope="col">Flag</th><th scope="col">Collected</th></tr></thead>
            <tbody>{availableLabs.map((lab) => {
              const value = state.labs[lab.stateKey ?? lab.name] ?? lab.value;
              return <tr key={lab.name} data-flag={lab.flag}>
                <th scope="row">{lab.name}</th>
                <td>{String(value)}{lab.unit ? ` ${lab.unit}` : ""}</td>
                <td><span data-flag={lab.flag}>{lab.flag}</span></td>
                <td>+{lab.availableAtMinute} min</td>
              </tr>;
            })}</tbody>
          </table> : <p>No results have returned yet.</p>}
          {pendingLabs.length ? <p className={styles.ehrPending}>{pendingLabs.length} ordered result{pendingLabs.length === 1 ? "" : "s"} still pending.</p> : null}
          <h2>Diagnostics</h2>
          <ul className={styles.ehrPlain}>{scenario.chart.diagnostics.filter((d) => d.availableAtMinute <= state.virtualMinute).map((d) => <li key={d.name}><strong>{d.name}</strong> — {d.result}</li>)}
            {!scenario.chart.diagnostics.some((d) => d.availableAtMinute <= state.virtualMinute) ? <li>No diagnostic results available.</li> : null}</ul>
        </> : null}

        {section === "trends" ? <>
          <h2>Vital sign trends</h2>
          {samples.length >= 2 ? <div className={styles.ehrTrends}>
            <Trend samples={samples} pick={(s) => s.heartRate} label="Heart rate" unit=" bpm" low={50} high={120} />
            <Trend samples={samples} pick={(s) => s.map} label="MAP" unit=" mmHg" low={65} high={110} />
            <Trend samples={samples} pick={(s) => s.spo2} label="SpO₂" unit="%" low={92} high={100} />
            <Trend samples={samples} pick={(s) => s.respiratoryRate} label="Respiratory rate" unit="/min" low={10} high={24} />
          </div> : <p>Trends appear once the simulation clock has advanced.</p>}
        </> : null}

        {section === "io" ? <>
          <h2>Intake and output</h2>
          <dl className={styles.ehrList}>
            <Row term="Urine output">{Math.round(state.urineOutputMlHr)} mL/hr {state.urineOutputMlHr < 30 ? <span className={styles.ehrFlag}>(below 30 mL/hr goal)</span> : null}</Row>
            <Row term="Fluid balance">{state.fluidBalanceMl > 0 ? "+" : ""}{Math.round(state.fluidBalanceMl)} mL</Row>
            <Row term="Drain output">{Math.round(state.drainOutputMl)} mL</Row>
            <Row term="Documented bleeding">{Math.round(state.bleedingMl)} mL</Row>
            <Row term="Running infusions">{Object.entries(state.infusionRates).length ? Object.entries(state.infusionRates).map(([k, v]) => `${k}: ${v}`).join(" · ") : "None"}</Row>
          </dl>
        </> : null}

        {section === "notes" ? <>
          <h2>Nursing notes and communication</h2>
          {documentation.length ? <ol className={styles.ehrNotes}>{documentation.map((entry) => <li key={entry.id}>
            <time>+{entry.virtualMinute} min</time>
            <div><strong>{entry.label}</strong><p>{entry.feedback}</p></div>
          </li>)}</ol> : <p>No documentation or provider communication has been recorded this shift.</p>}
        </> : null}
      </div>
    </div>
  );
}
