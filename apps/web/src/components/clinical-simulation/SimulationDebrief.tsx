"use client";

import Link from "next/link";
import { AlertTriangle, ArrowLeft, CheckCircle2, Clock3, Download, ExternalLink, RotateCcw, TrendingUp } from "lucide-react";
import type { SimulationDebrief as Debrief } from "@/lib/clinical-simulation/engine";
import type { ClinicalScenario, CompetencyDomain } from "@/lib/clinical-simulation/schema";
import type { BestPracticeGrade } from "@/lib/clinical-simulation/best-practice";
import styles from "./clinical-simulation.module.css";

const domainLabels: Record<CompetencyDomain, string> = {
  assessment: "Assessment",
  "clinical-recognition": "Clinical recognition",
  prioritization: "Prioritization",
  safety: "Safety",
  "medication-administration": "Medication administration",
  intervention: "Intervention selection",
  escalation: "Escalation",
  communication: "Communication",
  reassessment: "Reassessment",
  documentation: "Documentation",
  "patient-education": "Patient education",
  "time-management": "Time management",
};

function VitalsTrajectoryChart({ debrief }: { debrief: Debrief }) {
  const samples = debrief.vitalsTrajectory ?? [];
  if (samples.length < 2) return null;
  const width = 760;
  const left = 46;
  const right = 748;
  const top = 16;
  const bottom = 168;
  const maxMinute = Math.max(samples[samples.length - 1].minute, 1);
  const x = (minute: number) => left + (minute / maxMinute) * (right - left);
  const y = (value: number, min: number, max: number) => bottom - ((Math.min(Math.max(value, min), max) - min) / (max - min)) * (bottom - top);
  const series = [
    { key: "heartRate" as const, label: "HR", color: "#2f8a5b", min: 0, max: 170 },
    { key: "map" as const, label: "MAP", color: "#b07f2e", min: 0, max: 130 },
    { key: "spo2" as const, label: "SpO₂", color: "#2e7fa8", min: 60, max: 100 },
  ];
  const markers = debrief.timeline
    .filter((entry) => ["essential", "high_priority", "unsafe", "critical_error"].includes(entry.classification))
    .map((entry) => ({ id: entry.id, minute: entry.virtualMinute, label: entry.label, good: entry.classification === "essential" || entry.classification === "high_priority" }));
  const tickStep = Math.max(5, Math.ceil(maxMinute / 6 / 5) * 5);
  const ticks: number[] = [];
  for (let tick = 0; tick <= maxMinute; tick += tickStep) ticks.push(tick);
  return (
    <section className={styles.vitalsChartSection} aria-labelledby="trajectory-chart-heading">
      <div className={styles.sectionHeading}><div><span className={styles.eyebrow}>Physiologic trajectory</span><h2 id="trajectory-chart-heading">Vitals over the attempt, with your key decisions</h2></div></div>
      <svg viewBox={`0 0 ${width} 212`} role="img" aria-label={`Heart rate, mean arterial pressure, and oxygen saturation across ${maxMinute} simulated minutes.`}>
        {[0.25, 0.5, 0.75, 1].map((fraction) => <line key={fraction} x1={left} x2={right} y1={top + (bottom - top) * fraction} y2={top + (bottom - top) * fraction} stroke="#dde5df" strokeWidth="1" />)}
        {ticks.map((tick) => <g key={tick}><line x1={x(tick)} x2={x(tick)} y1={bottom} y2={bottom + 4} stroke="#9aa8a2" /><text x={x(tick)} y={bottom + 16} textAnchor="middle" fill="#71827b" fontSize="10">+{tick}m</text></g>)}
        <line x1={left} x2={right} y1={y(65, 0, 130)} y2={y(65, 0, 130)} stroke="#b07f2e" strokeWidth="1" strokeDasharray="5 4" opacity="0.55" />
        <text x={right} y={y(65, 0, 130) - 4} textAnchor="end" fill="#b07f2e" fontSize="9" opacity="0.8">MAP 65</text>
        {series.map((line) => <polyline key={line.key} fill="none" stroke={line.color} strokeWidth="2.2" strokeLinejoin="round" strokeLinecap="round" points={samples.map((sample) => `${x(sample.minute).toFixed(1)},${y(sample[line.key], line.min, line.max).toFixed(1)}`).join(" ")} />)}
        {markers.map((marker) => <g key={marker.id}><line x1={x(marker.minute)} x2={x(marker.minute)} y1={top - 6} y2={bottom} stroke={marker.good ? "#3f7d5c" : "#b0524a"} strokeWidth="1" opacity="0.3" /><circle cx={x(marker.minute)} cy={top - 8} r="4.5" fill={marker.good ? "#3f7d5c" : "#b0524a"}><title>{`+${marker.minute} min — ${marker.label}`}</title></circle></g>)}
        <line x1={left} x2={left} y1={top} y2={bottom} stroke="#9aa8a2" />
        <line x1={left} x2={right} y1={bottom} y2={bottom} stroke="#9aa8a2" />
      </svg>
      <div className={styles.vitalsChartLegend}>
        {series.map((line) => <span key={line.key}><i style={{ background: line.color }} /> {line.label}</span>)}
        <span><i style={{ background: "#3f7d5c", borderRadius: "50%" }} /> Priority action</span>
        <span><i style={{ background: "#b0524a", borderRadius: "50%" }} /> Unsafe action</span>
      </div>
    </section>
  );
}

function BestPracticeRoute({ grade }: { grade: BestPracticeGrade }) {
  const statusLabel: Record<string, string> = { optimal: "On time", late: "Late", "out-of-order": "Out of order", missed: "Missed" };
  return (
    <section className={styles.routeSection} aria-labelledby="route-heading">
      <div className={styles.sectionHeading}><div><span className={styles.eyebrow}>Best-practice route</span><h2 id="route-heading">How your route compared with expert practice</h2></div></div>
      <div className={styles.routeScore} data-band={grade.band}>
        <div><span>Route score</span><strong>{grade.score}</strong><small>/100 · {grade.band}</small></div>
        <div><span>Coverage</span><strong>{grade.coverage}%</strong><small>essential care performed</small></div>
        <div><span>Timeliness</span><strong>{grade.timeliness}%</strong><small>within the window</small></div>
        <div><span>Sequence</span><strong>{grade.ordering}%</strong><small>in expert order</small></div>
      </div>
      <p className={styles.routeHeadline}>{grade.headline}</p>
      <ol className={styles.routeSteps}>
        {grade.steps.map((step) => (
          <li key={step.actionId} data-status={step.status}>
            <span className={styles.routeStepNum}>{step.idealPosition}</span>
            <div>
              <strong>{step.label}</strong>
              <em>{statusLabel[step.status] ?? step.status}</em>
              <p>{step.note}</p>
              <small>{step.rationale}</small>
            </div>
          </li>
        ))}
      </ol>
      <aside className={styles.routeFocus}><strong>Next run</strong><p>{grade.nextFocus}</p></aside>
    </section>
  );
}

export default function SimulationDebrief({ scenario, debrief, attemptId, grade, traceExportEnabled = false }: { scenario: ClinicalScenario; debrief: Debrief; attemptId: string; grade?: BestPracticeGrade; traceExportEnabled?: boolean }) {
  const actionById = new Map(scenario.actions.map((action) => [action.id, action]));
  const timelineByEntryId = new Map(debrief.timeline.map((entry) => [entry.id, entry]));
  const outcomeLabel = debrief.outcome === "stabilized" ? "Patient stabilized" : debrief.outcome === "partially-stabilized" ? "Partial stabilization" : "Patient deteriorated";

  return (
    <main className={styles.debrief}>
      <header className={styles.debriefHeader}>
        <span className={styles.eyebrow}>Clinical debrief</span>
        <div className={styles.outcomeLine}>
          {debrief.outcome === "stabilized" ? <CheckCircle2 aria-hidden="true" /> : <AlertTriangle aria-hidden="true" />}
          <div><h1>{outcomeLabel}</h1><p>{scenario.debrief.overview}</p></div>
        </div>
        <div className={styles.debriefActions}>
          <Link href="/clinical-simulation"><ArrowLeft size={17} aria-hidden="true" /> Catalog</Link>
          <Link href={`/clinical-simulation/${scenario.slug}`}><RotateCcw size={17} aria-hidden="true" /> Replay</Link>
          {traceExportEnabled ? <a href={`/api/clinical-simulation/attempts/${encodeURIComponent(attemptId)}/trace`} download><Download size={17} aria-hidden="true" /> Export trace</a> : null}
        </div>
      </header>

      <section className={styles.trajectoryBand}>
        <div><span>Strongest domain</span><strong>{debrief.strongestDomain ? domainLabels[debrief.strongestDomain] : "Not observed"}</strong></div>
        <div><span>Growth priority</span><strong>{debrief.weakestDomain ? domainLabels[debrief.weakestDomain] : "Not observed"}</strong></div>
        <div><span>Critical errors</span><strong>{debrief.criticalErrors.length}</strong></div>
      </section>

      <section className={styles.metricStrip} aria-label="Attempt timing">
        {Object.entries({
          "First assessment": debrief.metrics.timeToFirstAssessment,
          Recognition: debrief.metrics.timeToRecognition,
          "Major intervention": debrief.metrics.timeToFirstMajorIntervention,
          Escalation: debrief.metrics.timeToEscalation,
          Reassessment: debrief.metrics.timeToReassessment,
          Documentation: debrief.metrics.timeToDocumentation,
        }).map(([label, minute]) => <div key={label}><Clock3 size={15} aria-hidden="true" /><span>{label}</span><strong>{minute == null ? "Not completed" : `+${minute} min`}</strong></div>)}
      </section>

      {grade ? <BestPracticeRoute grade={grade} /> : null}

      <VitalsTrajectoryChart debrief={debrief} />

      <section className={styles.finalStateBand} aria-labelledby="final-state-heading">
        <div><span className={styles.eyebrow}>Final patient condition</span><h2 id="final-state-heading">State at minute {debrief.finalPatientState.virtualMinute}</h2><p>{debrief.outcomeExplanation}</p></div>
        <dl>
          <div><dt>BP / MAP</dt><dd>{debrief.finalPatientState.bloodPressure} / {debrief.finalPatientState.map}</dd></div>
          <div><dt>HR / RR</dt><dd>{debrief.finalPatientState.heartRate} / {debrief.finalPatientState.respiratoryRate}</dd></div>
          <div><dt>SpO2</dt><dd>{debrief.finalPatientState.spo2}%</dd></div>
          <div><dt>Urine output</dt><dd>{debrief.finalPatientState.urineOutputMlHr} mL/hr</dd></div>
          <div><dt>Lactate</dt><dd>{debrief.finalPatientState.lactate == null ? "Not available" : `${debrief.finalPatientState.lactate} mmol/L`}</dd></div>
          <div><dt>Mental status</dt><dd>{debrief.finalPatientState.mentalStatus}</dd></div>
        </dl>
      </section>

      <div className={styles.debriefColumns}>
        <section aria-labelledby="competencies-heading">
          <div className={styles.sectionHeading}><div><span className={styles.eyebrow}>Competency profile</span><h2 id="competencies-heading">What the attempt demonstrated</h2></div></div>
          <div className={styles.domainList}>
            {debrief.domainScores.map((score) => {
              const percent = score.possible ? Math.round((score.earned / score.possible) * 100) : 0;
              return <div key={score.domain} className={styles.domainRow}>
                <div><strong>{domainLabels[score.domain]}</strong><span>{score.level}</span></div>
                <div className={styles.domainTrack} aria-label={`${domainLabels[score.domain]} ${percent} percent`}><span style={{ width: `${percent}%` }} /></div>
                <output>{score.earned}/{score.possible}</output>
              </div>;
            })}
          </div>
        </section>

        <section aria-labelledby="priorities-heading">
          <div className={styles.sectionHeading}><div><span className={styles.eyebrow}>Clinical priorities</span><h2 id="priorities-heading">Actions that shaped the outcome</h2></div></div>
          <div className={styles.priorityLists}>
            <div>
              <h3><CheckCircle2 size={17} aria-hidden="true" /> Completed priorities</h3>
              <ul>{debrief.completedRequiredActions.map((id) => <li key={id}>{actionById.get(id)?.label ?? id}</li>)}</ul>
            </div>
            <div>
              <h3><TrendingUp size={17} aria-hidden="true" /> Missed priorities</h3>
              {debrief.missedRequiredActions.length ? <ul>{debrief.missedRequiredActions.map((id) => <li key={id}><strong>{actionById.get(id)?.label ?? id}</strong><span>{actionById.get(id)?.rationale}</span></li>)}</ul> : <p>All required clinical priorities were completed.</p>}
            </div>
          </div>
        </section>
      </div>

      <section className={styles.debriefNarrative} aria-labelledby="trajectory-heading">
        <h2 id="trajectory-heading">Why the patient changed</h2>
        <p>{debrief.outcomeExplanation}</p>
        <ul>{debrief.causalFactors.map((factor) => <li key={factor}>{factor}</li>)}</ul>
        <p><strong>Untreated trajectory:</strong> {scenario.debrief.untreatedTrajectory}</p>
        <div>{scenario.debrief.keyPrinciples.map((principle) => <span key={principle}>{principle}</span>)}</div>
      </section>

      <section className={styles.medicationDebrief} aria-labelledby="medication-debrief-heading">
        <div className={styles.sectionHeading}><div><span className={styles.eyebrow}>Medication safety</span><h2 id="medication-debrief-heading">Medication decisions in this attempt</h2></div></div>
        {debrief.medicationActionIds.length ? <ul>{debrief.medicationActionIds.map((entryId) => {
          const entry = timelineByEntryId.get(entryId);
          return entry ? <li key={entry.id} data-classification={entry.classification}><strong>{entry.label}</strong><span>+{entry.virtualMinute} min / {entry.classification.replaceAll("_", " ")}</span><p>{entry.feedback}</p></li> : null;
        })}</ul> : <p>No medication decision was recorded.</p>}
      </section>

      <section className={styles.timelineDebrief} aria-labelledby="timeline-heading">
        <div className={styles.sectionHeading}><div><span className={styles.eyebrow}>Decision timeline</span><h2 id="timeline-heading">Your clinical sequence</h2></div></div>
        {debrief.timeline.length ? <ol>{debrief.timeline.map((entry) => <li key={entry.id} data-classification={entry.classification}>
          <time>+{entry.virtualMinute} min</time><div><strong>{entry.label}</strong><span>{entry.classification.replaceAll("_", " ")}</span><p>{entry.feedback}</p>{entry.stateChanges.length ? <small>{entry.stateChanges.map((change) => `${change.path}: ${String(change.before)} -> ${String(change.after)}`).join(" / ")}</small> : null}</div>
        </li>)}</ol> : <p>No actions were recorded.</p>}
      </section>

      <aside className={styles.replayFocus}><TrendingUp size={20} aria-hidden="true" /><div><strong>Suggested replay focus</strong><p>{debrief.suggestedReplayFocus}</p></div></aside>

      <section className={styles.evidenceSection} aria-labelledby="evidence-heading">
        <div><span className={styles.eyebrow}>Evidence record</span><h2 id="evidence-heading">Sources informing this scenario</h2><p>Clinical review status: {scenario.clinicalReviewerStatus.replaceAll("-", " ")}. Content remains educational and subject to facility policy and local protocols.</p></div>
        <ul>{scenario.evidence.map((source) => <li key={source.id}><a href={source.url} target="_blank" rel="noreferrer">{source.title}<ExternalLink size={14} aria-hidden="true" /></a><span>{source.organization} / {source.guidelineVersion} / reviewed {source.reviewedAt}</span></li>)}</ul>
      </section>
    </main>
  );
}
