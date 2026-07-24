"use client";

import { memo, useMemo, useState, type CSSProperties } from "react";
import { Activity, Check, Crosshair, Play, Stethoscope, X } from "lucide-react";
import BedsideMonitor from "@/components/clinical-simulation/BedsideMonitor";
import type { PatientState } from "@/lib/clinical-simulation/engine";
import type { ClinicalScenario } from "@/lib/clinical-simulation/schema";
import type { PatientVisualState } from "@/lib/clinical-simulation/visual-state";
import styles from "./patient-photo-scene.module.css";

// ─────────────────────────────────────────────────────────────────────────────
// Photoreal patient room composite.
//
// A high-quality room PHOTOGRAPH is the live environment; everything clinical is
// a state-driven layer on top of it:
//   - skin-finding overlays (cyanosis/mottling/diaphoresis/…) on the patient
//   - the live canvas monitor mounted over the wall display
//   - patient-region hotspots that surface performable scenario actions
//   - equipment hotspots that route into the matching workspace panel
//     (computer -> Chart, pumps -> MAR, headwall/vent -> Interventions, …)
//
// Affordances are deliberately subtle (spec: no big rings over everything):
// invisible at rest, ring + label on hover/keyboard focus, plus an explicit
// "show targets" toggle that reveals every interactive zone with its label.
// Anchors are percentages of the image so zones stay aligned at every size.
// ─────────────────────────────────────────────────────────────────────────────

type Anchor = { x: number; y: number };

type DeviceHotspot = {
  id: string;
  label: string;
  anchor: Anchor;
  /** Workspace tab this device opens. */
  tab: string;
};

type PhotoConfig = {
  src: string;
  aspect: number;
  face: Anchor;
  lips: Anchor;
  chest: Anchor;
  hand: Anchor;
  legs: Anchor;
  feet: Anchor;
  monitor: Anchor;
  /** Width of the live monitor overlay as % of room width. */
  monitorWidth?: number;
  devices?: DeviceHotspot[];
};

// Adult female, side-view semi-Fowler's (close-up bed shot).
const ADULT_FEMALE_SIDE: PhotoConfig = {
  src: "/sim/patients/adult-female-icu-side.webp",
  aspect: 1448 / 1086,
  face: { x: 21, y: 30 },
  lips: { x: 23.5, y: 35 },
  chest: { x: 33, y: 45 },
  hand: { x: 43, y: 49 },
  legs: { x: 62, y: 52 },
  feet: { x: 85, y: 47 },
  monitor: { x: 79, y: 30 },
  monitorWidth: 34,
};

// Adult male, full ICU room ("hospital simulation" wide shot): ventilator right,
// IV pumps + EHR workstation left, headwall + airway supplies right wall, Foley
// at the bed frame. The blank wall display is where the live monitor mounts.
const ADULT_MALE_ROOM: PhotoConfig = {
  src: "/sim/rooms/hospital-simulation.webp",
  aspect: 1672 / 941,
  face: { x: 57.5, y: 30 },
  lips: { x: 57.5, y: 33.5 },
  chest: { x: 54, y: 44 },
  hand: { x: 49, y: 55 },
  legs: { x: 45, y: 61 },
  feet: { x: 34, y: 74 },
  monitor: { x: 45, y: 29 },
  monitorWidth: 20,
  devices: [
    { id: "computer", label: "Chart (EHR)", anchor: { x: 9, y: 22 }, tab: "chart" },
    { id: "pumps", label: "IV pumps · MAR", anchor: { x: 33.5, y: 29 }, tab: "mar" },
    { id: "ventilator", label: "Ventilator", anchor: { x: 78, y: 36 }, tab: "interventions" },
    { id: "headwall", label: "O₂ & suction", anchor: { x: 87, y: 17 }, tab: "interventions" },
    { id: "airway", label: "Airway supplies", anchor: { x: 90, y: 33 }, tab: "interventions" },
    { id: "foley", label: "Foley & output", anchor: { x: 47, y: 84 }, tab: "assessment" },
  ],
};

const PHOTO_PATIENTS: Record<string, PhotoConfig> = {
  "septic-shock": ADULT_FEMALE_SIDE,
  "postoperative-deterioration": ADULT_FEMALE_SIDE,
  "evolving-acute-coronary-syndrome": ADULT_FEMALE_SIDE,
  "acute-respiratory-deterioration": ADULT_MALE_ROOM,
};

export function getPhotoPatient(slug: string): PhotoConfig | null {
  return PHOTO_PATIENTS[slug] ?? null;
}

type FocusId = "face" | "chest" | "hand" | "legs";
const focusMeta: Record<FocusId, { label: string; pattern: RegExp }> = {
  face: { label: "Head & neuro", pattern: /neuro|pupil|conscious|\bloc\b|glasgow|mental|airway|oxygen|cannula|mask/i },
  chest: { label: "Chest & breathing", pattern: /resp|breath|lung|auscult|oxygen|spiromet|\bcough\b/i },
  hand: { label: "IV & perfusion", pattern: /\biv\b|intravenous|line|site|infiltrat|patenc|flush|perfusion|capillary|pulse/i },
  legs: { label: "Lower extremities", pattern: /perfusion|mottl|edema|pulse|skin|extremit|dvt|calf/i },
};

function pct(a: Anchor): CSSProperties {
  return { left: `${a.x}%`, top: `${a.y}%` };
}

function PatientPhotoScene({
  scenario,
  state,
  visual,
  config,
  onOpenAssessment,
  onPerformAction,
  onOpenTab,
  busy = false,
}: {
  scenario: ClinicalScenario;
  state: PatientState;
  visual: PatientVisualState;
  config: PhotoConfig;
  onOpenAssessment: () => void;
  onPerformAction?: (actionId: string) => void;
  onOpenTab?: (tab: string) => void;
  busy?: boolean;
}) {
  const [focus, setFocus] = useState<FocusId | null>(null);
  const [imageReady, setImageReady] = useState(true);
  const [showTargets, setShowTargets] = useState(false);
  const skin = visual.skin;
  const alarming = state.vitals.spo2 < 90 || state.vitals.map < 65 || state.vitals.heartRate > 125 || state.vitals.respiratoryRate < 8;

  const breathStyle = {
    "--breath-duration": `${visual.respiration.breathDurationSeconds}s`,
    "--breath-scale": String(1 + visual.respiration.chestAmplitude * 0.02),
  } as CSSProperties;

  const focusActions = useMemo(() => {
    if (!focus || !onPerformAction) return [];
    const pattern = focusMeta[focus].pattern;
    return scenario.actions
      .filter((action) => (action.category === "assessment" || action.category === "intervention" || action.category === "safety") && pattern.test(`${action.label} ${action.description}`))
      .slice(0, 4);
  }, [focus, onPerformAction, scenario.actions]);

  const hotspots: Array<{ id: FocusId; anchor: Anchor }> = [
    { id: "face", anchor: config.face },
    { id: "chest", anchor: config.chest },
    { id: "hand", anchor: config.hand },
    { id: "legs", anchor: config.legs },
  ];

  const cues = [
    visual.consciousness.level,
    `${visual.respiration.rate}/min · ${visual.respiration.work}`,
    visual.devices.oxygen === "room-air" ? "room air" : `${visual.devices.oxygen.replaceAll("-", " ")} ${visual.devices.oxygenFlow}`,
    skin.mottling > 0 ? "mottling" : null,
    skin.cyanosis > 0 ? "cyanosis" : null,
    skin.diaphoresis > 0 ? "diaphoretic" : null,
  ].filter(Boolean) as string[];

  return (
    <section className={styles.photoShell} data-testid="patient-scene" data-source={visual.source} data-alarming={alarming} aria-label="Reactive photoreal patient bedside">
      <header className={styles.photoToolbar}>
        <div><span>Reactive bedside</span><strong>{scenario.patient.name} · {visual.consciousness.level}</strong></div>
        <div className={styles.photoToolbarRight}>
          {alarming ? <span className={styles.photoAlarm}><Activity size={13} aria-hidden="true" /> Alarm — check patient</span> : null}
          <button type="button" className={styles.targetToggle} aria-pressed={showTargets} onClick={() => setShowTargets((v) => !v)} title="Show interactable areas">
            <Crosshair size={13} aria-hidden="true" /> {showTargets ? "Hide targets" : "Show targets"}
          </button>
        </div>
      </header>

      <div className={styles.photoStage} style={{ aspectRatio: String(config.aspect) }} data-testid="patient-scene-viewport" data-show-targets={showTargets}>
        <div className={styles.photoBreath} style={breathStyle} data-reduced={visual.reducedMotion}>
          {/* eslint-disable-next-line @next/next/no-img-element -- static bedside asset, no optimization pipeline in the worker runtime */}
          <img className={styles.photoBase} src={config.src} alt={visual.accessibleDescription} draggable={false} onError={() => setImageReady(false)} onLoad={() => setImageReady(true)} />
        </div>
        {!imageReady ? <div className={styles.photoPending}><Stethoscope size={26} aria-hidden="true" /><strong>Patient photo pending</strong><span>Save the bedside image to <code>public{config.src}</code> to enable the photoreal scene.</span></div> : null}

        {/* ── Reactive clinical overlays, opacity driven by engine state ── */}
        <div className={styles.overlayLayer} aria-hidden="true">
          {skin.pallor > 0 ? <span className={styles.ovPallor} style={{ ...pct(config.face), opacity: 0.06 + skin.pallor * 0.05 }} /> : null}
          {skin.diaphoresis > 0 ? <span className={styles.ovDiaphoresis} style={{ ...pct(config.face), opacity: 0.18 + skin.diaphoresis * 0.14 }} /> : null}
          {skin.flushing > 0 ? <span className={styles.ovFlush} style={{ ...pct(config.face), opacity: 0.1 + skin.flushing * 0.09 }} /> : null}
          {skin.cyanosis > 0 ? <>
            <span className={styles.ovCyanosis} style={{ ...pct(config.lips), opacity: 0.22 + skin.cyanosis * 0.12, width: "6%", height: "3.5%" }} />
            <span className={styles.ovCyanosis} style={{ ...pct(config.hand), opacity: 0.18 + skin.cyanosis * 0.1, width: "7%", height: "5%" }} />
            <span className={styles.ovCyanosis} style={{ ...pct(config.feet), opacity: 0.18 + skin.cyanosis * 0.1, width: "9%", height: "6%" }} />
          </> : null}
          {skin.mottling > 0 ? <span className={styles.ovMottling} style={{ ...pct(config.legs), opacity: 0.12 + skin.mottling * 0.11 }} /> : null}
          {skin.edema > 0 ? <span className={styles.ovEdema} style={{ ...pct(config.feet), opacity: 0.1 + skin.edema * 0.08 }} /> : null}
        </div>

        {/* ── Live monitor mounted over the room's wall display ── */}
        <div className={styles.photoMonitor} style={{ ...pct(config.monitor), width: `${config.monitorWidth ?? 30}%` }}>
          <BedsideMonitor state={state} />
        </div>

        {/* ── Patient-region hotspots (subtle: visible on hover/focus/targets) ── */}
        <div className={styles.hotspotLayer}>
          {hotspots.map((h) => (
            <button key={h.id} type="button" className={styles.photoHotspot} style={pct(h.anchor)} data-active={focus === h.id} aria-label={focusMeta[h.id].label} onClick={() => setFocus(h.id)}>
              <span /><em>{focusMeta[h.id].label}</em>
            </button>
          ))}
          {/* ── Equipment hotspots: route straight into the matching workspace panel ── */}
          {(config.devices ?? []).map((device) => (
            <button key={device.id} type="button" className={styles.deviceHotspot} style={pct(device.anchor)} aria-label={device.label} onClick={() => onOpenTab?.(device.tab)}>
              <span /><em>{device.label}</em>
            </button>
          ))}
        </div>

        {focus ? (
          <aside className={styles.photoFocus} aria-live="polite">
            <header><strong>{focusMeta[focus].label}</strong><button type="button" onClick={() => setFocus(null)} aria-label="Close focused view"><X size={15} aria-hidden="true" /></button></header>
            {focusActions.length ? <div className={styles.photoFocusActions}>
              {focusActions.map((action) => {
                const done = state.completedActionIds.includes(action.id);
                return <button key={action.id} type="button" disabled={busy || (done && !action.repeatable)} data-completed={done} onClick={() => onPerformAction?.(action.id)}>{done ? <Check size={13} aria-hidden="true" /> : <Play size={13} aria-hidden="true" />} {action.label}</button>;
              })}
            </div> : <button type="button" className={styles.photoFocusOpen} onClick={onOpenAssessment}><Stethoscope size={14} aria-hidden="true" /> Open assessment actions</button>}
          </aside>
        ) : null}
      </div>

      <div className={styles.photoCues} aria-hidden="true">{cues.map((cue) => <span key={cue}>{cue}</span>)}</div>
      <p className={styles.srOnly} aria-live="polite">{visual.accessibleDescription}</p>
    </section>
  );
}

export default memo(PatientPhotoScene);
