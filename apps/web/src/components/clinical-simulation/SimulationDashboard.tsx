"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { Activity, ArrowRight, Clock3, Filter, RotateCcw, Stethoscope } from "lucide-react";
import type { ClinicalScenario } from "@/lib/clinical-simulation/schema";
import styles from "./clinical-simulation.module.css";

type AttemptSummary = {
  id: string;
  scenarioId: string;
  mode: "guided" | "independent";
  status: "in_progress" | "completed" | "abandoned";
  seed: number;
  scenarioVersion: string;
  virtualMinute: number;
  startedAt: number;
  updatedAt: number;
  completedAt: number | null;
  domainScores: Array<{ earned: number; possible: number }>;
};

type AssignmentSummary = {
  id: string;
  scenarioId: string;
  mode: "guided" | "independent";
  minimumDomainLevel: string | null;
  dueAt: number | null;
};

const unitLabels: Record<ClinicalScenario["unit"], string> = {
  "medical-surgical": "Medical-Surgical",
  telemetry: "Telemetry",
  "step-down": "Step-Down",
  "intensive-care": "Intensive Care",
  procedural: "Procedural",
  psychiatric: "Psychiatric",
};

function scoreFor(attempt?: AttemptSummary) {
  if (!attempt?.domainScores.length) return null;
  const earned = attempt.domainScores.reduce((sum, score) => sum + score.earned, 0);
  const possible = attempt.domainScores.reduce((sum, score) => sum + score.possible, 0);
  return possible > 0 ? Math.round((earned / possible) * 100) : null;
}

export default function SimulationDashboard({ scenarios }: { scenarios: ClinicalScenario[] }) {
  const [attempts, setAttempts] = useState<AttemptSummary[]>([]);
  const [assignments, setAssignments] = useState<AssignmentSummary[]>([]);
  const [unit, setUnit] = useState<"all" | ClinicalScenario["unit"]>("all");
  const [difficulty, setDifficulty] = useState<"all" | ClinicalScenario["difficulty"]>("all");
  const [storageError, setStorageError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    fetch("/api/clinical-simulation/attempts", { cache: "no-store" })
      .then(async (response) => {
        const body = await response.json();
        if (!response.ok) throw new Error(body.error?.message ?? body.error ?? "Progress could not be loaded.");
        if (active) {
          setAttempts(body.data.attempts);
          setAssignments(body.data.assignments);
        }
      })
      .catch((error: Error) => active && setStorageError(error.message));
    return () => { active = false; };
  }, []);

  const latestByScenario = useMemo(() => {
    const map = new Map<string, AttemptSummary>();
    for (const attempt of attempts) if (!map.has(attempt.scenarioId)) map.set(attempt.scenarioId, attempt);
    return map;
  }, [attempts]);
  const activeAttempt = attempts.find((attempt) => attempt.status === "in_progress");
  const activeScenario = scenarios.find((scenario) => scenario.id === activeAttempt?.scenarioId);
  const filtered = scenarios.filter((scenario) =>
    (unit === "all" || scenario.unit === unit) &&
    (difficulty === "all" || scenario.difficulty === difficulty));

  return (
    <main className={styles.dashboard}>
      <header className={styles.dashboardHeader}>
        <div>
          <span className={styles.eyebrow}>Clinical learning lab</span>
          <h1>Clinical Simulation</h1>
          <p>Manage a changing patient, make time-sensitive decisions, and review the clinical reasoning behind the outcome.</p>
        </div>
        <div className={styles.dashboardSummary} aria-label="Simulation progress">
          <span><strong>{attempts.filter((attempt) => attempt.status === "completed").length}</strong> completed</span>
          <span><strong>{scenarios.length}</strong> clinical environments</span>
        </div>
      </header>

      {activeAttempt && activeScenario ? (
        <section className={styles.continueBand} aria-labelledby="continue-heading">
          <Activity aria-hidden="true" />
          <div>
            <span>Active assignment</span>
            <h2 id="continue-heading">Continue {activeScenario.title}</h2>
            <p>{unitLabels[activeScenario.unit]} / minute {activeAttempt.virtualMinute} / {activeAttempt.mode} mode</p>
          </div>
          <Link className={styles.primaryAction} href={`/clinical-simulation/${activeScenario.slug}/run?attempt=${activeAttempt.id}`}>
            Resume <ArrowRight size={17} aria-hidden="true" />
          </Link>
        </section>
      ) : null}

      {storageError ? <div className={styles.inlineAlert} role="status">Progress storage: {storageError}</div> : null}

      <section className={styles.catalogSection} aria-labelledby="catalog-heading">
        <div className={styles.sectionHeading}>
          <div>
            <span className={styles.eyebrow}>Scenario catalog</span>
            <h2 id="catalog-heading">Choose a patient assignment</h2>
          </div>
          <div className={styles.filters} aria-label="Scenario filters">
            <Filter size={16} aria-hidden="true" />
            <label>
              <span className="sr-only">Unit</span>
              <select value={unit} onChange={(event) => setUnit(event.target.value as typeof unit)}>
                <option value="all">All units</option>
                {Object.entries(unitLabels).map(([value, label]) => <option key={value} value={value}>{label}</option>)}
              </select>
            </label>
            <label>
              <span className="sr-only">Difficulty</span>
              <select value={difficulty} onChange={(event) => setDifficulty(event.target.value as typeof difficulty)}>
                <option value="all">All levels</option>
                <option value="novice">Novice</option>
                <option value="intermediate">Intermediate</option>
                <option value="advanced">Advanced</option>
              </select>
            </label>
          </div>
        </div>

        <div className={styles.scenarioGrid}>
          {filtered.map((scenario) => {
            const latest = latestByScenario.get(scenario.id);
            const assignment = assignments.find((item) => item.scenarioId === scenario.id);
            const score = scoreFor(latest);
            return (
              <article className={styles.scenarioCard} key={scenario.id}>
                <div className={styles.scenarioCardTop}>
                  <span className={`${styles.unitMark} ${styles[scenario.unit.replace("-", "")]}`}><Stethoscope size={16} aria-hidden="true" /> {unitLabels[scenario.unit]}</span>
                  <span className={styles.difficulty}>{assignment ? "Instructor assigned" : scenario.difficulty}</span>
                </div>
                <span className={styles.technicalBadge}>Technical testing / clinical review required</span>
                <div>
                  <h3>{scenario.title}</h3>
                  <p>{scenario.patient.presentingProblem}</p>
                </div>
                <div className={styles.scenarioMeta}>
                  <span><Clock3 size={15} aria-hidden="true" /> {scenario.estimatedMinutes} min</span>
                  <span>{assignment?.dueAt ? `Due ${new Date(assignment.dueAt * 1000).toLocaleDateString()}` : latest?.status === "completed" ? `Best recent score ${score ?? "-"}%` : latest?.status === "in_progress" ? "In progress" : "Not started"}</span>
                </div>
                <Link className={styles.cardAction} href={latest?.status === "in_progress" ? `/clinical-simulation/${scenario.slug}/run?attempt=${latest.id}` : `/clinical-simulation/${scenario.slug}${assignment ? `?mode=${assignment.mode}` : ""}`}>
                  {latest?.status === "in_progress" ? "Resume scenario" : latest?.status === "completed" ? <><RotateCcw size={16} aria-hidden="true" /> Replay scenario</> : "Review prebrief"}
                  <ArrowRight size={17} aria-hidden="true" />
                </Link>
              </article>
            );
          })}
        </div>
      </section>

      {attempts.length ? <section className={styles.attemptHistory} aria-labelledby="attempt-history-heading">
        <div className={styles.sectionHeading}><div><span className={styles.eyebrow}>Saved work</span><h2 id="attempt-history-heading">Attempt history</h2></div></div>
        <div className={styles.attemptTable} role="table" aria-label="Clinical simulation attempt history">
          <div role="row" className={styles.attemptTableHeader}><span role="columnheader">Scenario</span><span role="columnheader">Status</span><span role="columnheader">Seed</span><span role="columnheader">Last saved</span><span role="columnheader">Action</span></div>
          {attempts.slice(0, 12).map((attempt) => {
            const attemptScenario = scenarios.find((scenario) => scenario.id === attempt.scenarioId);
            if (!attemptScenario) return null;
            const target = attempt.status === "completed" || attempt.status === "in_progress"
              ? `/clinical-simulation/${attemptScenario.slug}/run?attempt=${attempt.id}`
              : `/clinical-simulation/${attemptScenario.slug}`;
            return <div role="row" key={attempt.id}>
              <span role="cell"><strong>{attemptScenario.title}</strong><small>v{attempt.scenarioVersion} / {attempt.mode}</small></span>
              <span role="cell" data-status={attempt.status}>{attempt.status.replaceAll("_", " ")}{attempt.status === "in_progress" ? ` / minute ${attempt.virtualMinute}` : ""}</span>
              <span role="cell">{attempt.seed}</span>
              <span role="cell">{new Date(attempt.updatedAt * 1000).toLocaleString()}</span>
              <span role="cell"><Link href={target}>{attempt.status === "completed" ? "Review debrief" : attempt.status === "in_progress" ? "Resume" : "Replay"}<ArrowRight size={15} aria-hidden="true" /></Link></span>
            </div>;
          })}
        </div>
      </section> : null}

      <aside className={styles.safetyNote}>
        Educational simulation only. It does not replace facility policy, provider orders, local protocols, clinical judgment, or supervised bedside training. Do not enter real patient information.
      </aside>
    </main>
  );
}
