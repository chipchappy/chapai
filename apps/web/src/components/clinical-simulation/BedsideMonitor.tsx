"use client";

import type { PatientState } from "@/lib/clinical-simulation/engine";
import styles from "./clinical-simulation.module.css";

function valueTone(value: number, low: number, high: number) {
  return value < low || value > high ? styles.monitorAlert : "";
}

export default function BedsideMonitor({ state }: { state: PatientState }) {
  const alarming = state.vitals.spo2 < 90 || state.vitals.map < 65 || state.vitals.heartRate > 125 || state.vitals.respiratoryRate < 8;
  return (
    <section className={styles.monitor} aria-label={`Bedside monitor. Rhythm ${state.cardiacRhythm}. Heart rate ${Math.round(state.vitals.heartRate)}. Oxygen saturation ${Math.round(state.vitals.spo2)} percent.`}>
      <header>
        <span>MONITOR 01</span>
        <span className={alarming ? styles.alarmActive : styles.alarmNormal}>{alarming ? "ALARM / CHECK PATIENT" : "ALARMS ACTIVE"}</span>
      </header>
      <div className={styles.waveform} aria-hidden="true">
        <svg viewBox="0 0 680 112" preserveAspectRatio="none" role="img">
          <defs>
            <pattern id="monitor-grid" width="34" height="28" patternUnits="userSpaceOnUse">
              <path d="M 34 0 L 0 0 0 28" fill="none" stroke="rgba(126, 234, 179, 0.08)" strokeWidth="1" />
            </pattern>
          </defs>
          <rect width="680" height="112" fill="url(#monitor-grid)" />
          <path className={styles.ecgTrace} d="M0 66 L38 66 L46 61 L54 68 L66 66 L78 66 L86 25 L94 95 L103 60 L116 66 L158 66 L166 62 L174 68 L186 66 L198 66 L206 25 L214 95 L223 60 L236 66 L278 66 L286 61 L294 68 L306 66 L318 66 L326 25 L334 95 L343 60 L356 66 L398 66 L406 62 L414 68 L426 66 L438 66 L446 25 L454 95 L463 60 L476 66 L518 66 L526 61 L534 68 L546 66 L558 66 L566 25 L574 95 L583 60 L596 66 L638 66 L646 62 L654 68 L666 66 L680 66" />
        </svg>
      </div>
      <div className={styles.monitorValues}>
        <div><span>HR</span><strong className={valueTone(state.vitals.heartRate, 50, 120)}>{Math.round(state.vitals.heartRate)}</strong><small>bpm</small></div>
        <div><span>NIBP</span><strong className={valueTone(state.vitals.map, 65, 130)}>{Math.round(state.vitals.systolic)}/{Math.round(state.vitals.diastolic)}</strong><small>MAP {Math.round(state.vitals.map)}</small></div>
        <div><span>SpO2</span><strong className={valueTone(state.vitals.spo2, 90, 100)}>{Math.round(state.vitals.spo2)}</strong><small>%</small></div>
        <div><span>RR</span><strong className={valueTone(state.vitals.respiratoryRate, 8, 32)}>{Math.round(state.vitals.respiratoryRate)}</strong><small>/min</small></div>
        <div><span>TEMP</span><strong className={valueTone(state.vitals.temperatureC, 35.5, 38.4)}>{state.vitals.temperatureC.toFixed(1)}</strong><small>°C</small></div>
      </div>
      <footer><span>{state.cardiacRhythm}</span><span>Virtual minute {state.virtualMinute}</span></footer>
    </section>
  );
}
