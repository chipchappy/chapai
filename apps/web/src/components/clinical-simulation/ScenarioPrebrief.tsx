"use client";

import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, ArrowRight, BookOpenCheck, Clock3, ShieldCheck, Users } from "lucide-react";
import type { ClinicalScenario } from "@/lib/clinical-simulation/schema";
import { trackEvent } from "@/lib/analytics";
import styles from "./clinical-simulation.module.css";

export default function ScenarioPrebrief({ scenario, defaultMode = "guided", developerToolsEnabled = false }: { scenario: ClinicalScenario; defaultMode?: "guided" | "independent"; developerToolsEnabled?: boolean }) {
  const router = useRouter();
  const [mode, setMode] = useState<"guided" | "independent">(defaultMode);
  const [seed, setSeed] = useState("260717");
  const [starting, setStarting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function start() {
    const numericSeed = Number(seed);
    if (developerToolsEnabled && (!Number.isInteger(numericSeed) || numericSeed < 1 || numericSeed > 2_147_483_647)) {
      setError("Enter a whole-number seed from 1 through 2147483647.");
      return;
    }
    setStarting(true);
    setError(null);
    try {
      const response = await fetch("/api/clinical-simulation/attempts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ scenarioSlug: scenario.slug, mode, ...(developerToolsEnabled ? { seed: numericSeed } : {}) }),
      });
      const body = await response.json();
      if (!response.ok) throw new Error(body.error ?? "The simulation could not start.");
      trackEvent("simulation_started", { unit: scenario.unit, mode, scenarioId: scenario.id });
      router.push(`/clinical-simulation/${scenario.slug}/run?attempt=${body.data.id}`);
    } catch (startError) {
      setError(startError instanceof Error ? startError.message : "The simulation could not start.");
      setStarting(false);
    }
  }

  return (
    <main className={styles.prebrief}>
      <Link className={styles.backLink} href="/clinical-simulation"><ArrowLeft size={17} aria-hidden="true" /> Scenario catalog</Link>
      <header className={styles.prebriefHeader}>
        <span className={styles.eyebrow}>{scenario.specialty} / {scenario.difficulty}</span>
        <h1>{scenario.title}</h1>
        <p>{scenario.prebrief.shift}. You are the {scenario.prebrief.role}.</p>
        <span className={styles.reviewStatus}>Technical testing / clinical review required</span>
      </header>

      <div className={styles.prebriefLayout}>
        <section className={styles.handoffPanel} aria-labelledby="handoff-heading">
          <div className={styles.patientIdentity}>
            <div aria-hidden="true">{scenario.patient.name.split(" ").map((part) => part[0]).join("")}</div>
            <span>
              <strong>{scenario.patient.name}</strong>
              {scenario.patient.age} years / {scenario.patient.pronouns} / Room {scenario.patient.room}
            </span>
          </div>
          <h2 id="handoff-heading">Handoff report</h2>
          <p>{scenario.prebrief.handoff}</p>
          <div className={styles.baselineVitals} aria-label="Vitals at handoff">
            {[
              ["HR", String(scenario.initialState.vitals.heartRate), "bpm"],
              ["BP", `${scenario.initialState.vitals.systolic}/${scenario.initialState.vitals.diastolic}`, `MAP ${scenario.initialState.vitals.map}`],
              ["SpO₂", String(scenario.initialState.vitals.spo2), scenario.initialState.oxygenDevice],
              ["RR", String(scenario.initialState.vitals.respiratoryRate), "/min"],
              ["Temp", scenario.initialState.vitals.temperatureC.toFixed(1), "°C"],
              ["Pain", String(scenario.initialState.vitals.pain), "/10"],
            ].map(([label, value, unit]) => <div key={label}><span>{label}</span><strong>{value}</strong><small>{unit}</small></div>)}
          </div>
          <p className={styles.baselineVitalsNote}>Vitals as reported at handoff — verify them yourself at the bedside.</p>
          <dl className={styles.prebriefFacts}>
            <div><dt>Allergies</dt><dd>{scenario.patient.allergies.join(", ")}</dd></div>
            <div><dt>Code status</dt><dd>{scenario.patient.codeStatus}</dd></div>
            <div><dt>Isolation</dt><dd>{scenario.patient.isolation}</dd></div>
            <div><dt>Baseline</dt><dd>{scenario.patient.baselineFunction}</dd></div>
          </dl>
        </section>

        <section className={styles.prebriefDetails}>
          <div className={styles.detailBlock}>
            <h2><BookOpenCheck size={18} aria-hidden="true" /> Learning objectives</h2>
            <ul>{scenario.learningObjectives.map((objective) => <li key={objective}>{objective}</li>)}</ul>
          </div>
          <div className={styles.detailBlock}>
            <h2><Users size={18} aria-hidden="true" /> Available resources</h2>
            <p>{scenario.prebrief.resources.join(" / ")}</p>
          </div>
          <div className={styles.detailBlock}>
            <h2><ShieldCheck size={18} aria-hidden="true" /> Simulation safety</h2>
            <p>{scenario.prebrief.safetyNote}</p>
          </div>
          <div className={styles.modeBlock}>
            <span>Learning mode</span>
            <div className={styles.segmented} role="radiogroup" aria-label="Simulation mode">
              <button type="button" role="radio" aria-checked={mode === "guided"} data-active={mode === "guided"} onClick={() => { setMode("guided"); trackEvent("simulation_mode_selected", { mode: "guided", scenarioId: scenario.id }); }}>Guided</button>
              <button type="button" role="radio" aria-checked={mode === "independent"} data-active={mode === "independent"} onClick={() => { setMode("independent"); trackEvent("simulation_mode_selected", { mode: "independent", scenarioId: scenario.id }); }}>Independent</button>
            </div>
            <p>{mode === "guided" ? "Subtle prioritization cues and safety reminders are available." : "Routine coaching is withheld until the debrief."}</p>
          </div>
          {developerToolsEnabled ? <div className={styles.seedControl}>
            <label htmlFor="simulation-seed">Deterministic test seed</label>
            <input id="simulation-seed" type="number" min="1" max="2147483647" value={seed} onChange={(event) => setSeed(event.target.value)} />
            <p>Use the same seed to reproduce the same controlled starting variance.</p>
          </div> : null}
        </section>
      </div>

      <footer className={styles.prebriefFooter}>
        <span><Clock3 size={17} aria-hidden="true" /> Approximately {scenario.estimatedMinutes} minutes</span>
        {error ? <span className={styles.errorText} role="alert">{error}</span> : null}
        <button className={styles.primaryAction} type="button" disabled={starting} onClick={start}>
          {starting ? "Preparing patient..." : "Start simulation"} <ArrowRight size={17} aria-hidden="true" />
        </button>
      </footer>
    </main>
  );
}
