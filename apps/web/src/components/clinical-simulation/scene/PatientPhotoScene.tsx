"use client";

import { memo, useMemo, useState, type CSSProperties } from "react";
import { Check, Maximize2, Play, Stethoscope, X } from "lucide-react";
import BedsideMonitor from "@/components/clinical-simulation/BedsideMonitor";
import type { PatientState } from "@/lib/clinical-simulation/engine";
import { getPatientPresentation } from "@/lib/clinical-simulation/patient-presentations";
import type { ClinicalScenario } from "@/lib/clinical-simulation/schema";
import type { PatientVisualState } from "@/lib/clinical-simulation/visual-state";
import type { SimulationToolId } from "@/lib/clinical-simulation/workspace-tools";
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
// Affordances are deliberately subtle: equipment is softly outlined at rest
// and becomes explicit on hover or keyboard focus.
// Anchors are percentages of the image so zones stay aligned at every size.
// ─────────────────────────────────────────────────────────────────────────────

type Anchor = { x: number; y: number };

type DeviceHotspot = {
  id: string;
  label: string;
  anchor: Anchor;
  /** Workspace tab this device opens. */
  tab: SimulationToolId;
  /** Optional outline bounds (% of image) so the whole object is traced, not
   *  just a point — this is what makes equipment read as interactable. */
  rect?: { x: number; y: number; w: number; h: number };
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
  /** Exact bounds of the room's blank wall screen, as % of the image. The live
   *  monitor is inset into this rect so it reads as the room's own display
   *  rather than a floating panel. */
  monitorRect?: { x: number; y: number; w: number; h: number };
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
  monitor: { x: 48.4, y: 13.6 },
  monitorRect: { x: 43.82, y: 8.35, w: 9.62, h: 10.82 },
  devices: [
    { id: "computer", label: "Chart (EHR)", anchor: { x: 9, y: 22 }, tab: "chart", rect: { x: 1, y: 12, w: 17, h: 26 } },
    { id: "pumps", label: "IV pumps · MAR", anchor: { x: 33.5, y: 29 }, tab: "medications", rect: { x: 28.5, y: 24, w: 10, h: 16 } },
    { id: "ventilator", label: "Respiratory support", anchor: { x: 78, y: 42 }, tab: "care", rect: { x: 70.5, y: 28, w: 15, h: 46 } },
    { id: "headwall", label: "O₂ & suction", anchor: { x: 88, y: 18 }, tab: "care", rect: { x: 82, y: 10, w: 15, h: 16 } },
    { id: "airway", label: "Airway supplies", anchor: { x: 92, y: 32 }, tab: "care", rect: { x: 87, y: 24, w: 11, h: 17 } },
    { id: "foley", label: "Foley & output", anchor: { x: 31, y: 79 }, tab: "assessment", rect: { x: 27, y: 71, w: 8, h: 16 } },
    { id: "crashcart", label: "Emergency care", anchor: { x: 94, y: 62 }, tab: "care", rect: { x: 89, y: 46, w: 11, h: 34 } },
  ],
};

const patientMatchedRoom = (src: string): PhotoConfig => ({ ...ADULT_MALE_ROOM, src });

// The five authored presentation families use matched full-room plates so the
// chart identity, evolving portrait, and bedside patient remain the same person.
// Other scenarios use a sex-matched fallback until a reviewed plate exists.
const PHOTO_PATIENTS: Record<string, PhotoConfig> = {
  "postoperative-deterioration": patientMatchedRoom("/sim/rooms/hospital-simulation-maria-gonzalez.webp"),
  "evolving-acute-coronary-syndrome": patientMatchedRoom("/sim/rooms/hospital-simulation-david-lee.webp"),
  "acute-respiratory-deterioration": ADULT_MALE_ROOM,
  "septic-shock": patientMatchedRoom("/sim/rooms/hospital-simulation-sarah-johnson.webp"),
  "sedation-airway-compromise": patientMatchedRoom("/sim/rooms/hospital-simulation-william-thompson.webp"),

  // Female fallbacks
  "acute-transfusion-reaction": ADULT_FEMALE_SIDE,
  "intravenous-antibiotic-anaphylaxis": ADULT_FEMALE_SIDE,
  "hyperkalemia-missed-dialysis": ADULT_FEMALE_SIDE,
  "flash-pulmonary-edema": ADULT_FEMALE_SIDE,
  "ward-sepsis-recognition": ADULT_FEMALE_SIDE,
  "postoperative-pulmonary-embolism": ADULT_FEMALE_SIDE,
  // Male fallbacks
  "insulin-induced-hypoglycemia": ADULT_MALE_ROOM,
  "diabetic-ketoacidosis": ADULT_MALE_ROOM,
  "acute-ischemic-stroke-code": ADULT_MALE_ROOM,
  "severe-alcohol-withdrawal": ADULT_MALE_ROOM,
  "variceal-upper-gi-hemorrhage": ADULT_MALE_ROOM,
  "raised-intracranial-pressure": ADULT_MALE_ROOM,
  "postoperative-delirium-fall-risk": ADULT_MALE_ROOM,
  "tension-pneumothorax-after-line": ADULT_MALE_ROOM,
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
  onOpenTab?: (tab: SimulationToolId) => void;
  busy?: boolean;
}) {
  const [focus, setFocus] = useState<FocusId | null>(null);
  const [imageReady, setImageReady] = useState(true);
  const [monitorOpen, setMonitorOpen] = useState(false);
  const skin = visual.skin;
  const presentation = useMemo(
    () => getPatientPresentation(scenario.slug, scenario.patient.name, state),
    [scenario.patient.name, scenario.slug, state],
  );
  const alarming = state.vitals.spo2 < 90 || state.vitals.map < 65 || state.vitals.heartRate > 125 || state.vitals.respiratoryRate < 8;

  const visualSignature = [
    presentation?.stage ?? 0,
    visual.position.kind,
    visual.devices.oxygen,
    visual.devices.oxygenFlow,
    visual.consciousness.level,
    skin.pallor,
    skin.diaphoresis,
    skin.flushing,
    skin.cyanosis,
    skin.mottling,
    skin.edema,
  ].join("-");

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

  return (
    <section
      className={styles.photoShell}
      data-testid="patient-scene"
      data-source={visual.source}
      data-room={scenario.unit}
      data-position={visual.position.kind}
      data-oxygen={visual.devices.oxygen}
      data-loc={visual.consciousness.level}
      data-alarming={alarming}
      aria-label="Reactive photoreal patient bedside"
    >
      <div className={styles.photoStage} data-testid="patient-scene-viewport" data-show-targets="false" data-presentation-stage={presentation?.stage ?? 0} data-lighting={visual.roomLighting} data-reduced-motion={visual.reducedMotion}>
        <div key={visualSignature} className={styles.photoStill} data-testid="patient-static-state" data-reduced={visual.reducedMotion}>
          {/* eslint-disable-next-line @next/next/no-img-element -- static bedside asset, no optimization pipeline in the worker runtime */}
          <img className={styles.photoBase} src={config.src} alt={visual.accessibleDescription} draggable={false} onError={() => setImageReady(false)} onLoad={() => setImageReady(true)} />
        </div>
        {!imageReady ? <div className={styles.photoPending}><Stethoscope size={26} aria-hidden="true" /><strong>Patient photo pending</strong><span>Save the bedside image to <code>public{config.src}</code> to enable the photoreal scene.</span></div> : null}

        {/* ── Reactive clinical overlays, opacity driven by engine state ── */}
        <div className={styles.overlayLayer} aria-hidden="true">
          {skin.pallor > 0 ? <span className={styles.ovPallor} data-skin-overlay="pallor" style={{ ...pct(config.face), opacity: 0.06 + skin.pallor * 0.05 }} /> : null}
          {skin.diaphoresis > 0 ? <span className={styles.ovDiaphoresis} data-skin-overlay="diaphoresis" style={{ ...pct(config.face), opacity: 0.18 + skin.diaphoresis * 0.14 }} /> : null}
          {skin.flushing > 0 ? <span className={styles.ovFlush} data-skin-overlay="flushing" style={{ ...pct(config.face), opacity: 0.1 + skin.flushing * 0.09 }} /> : null}
          {skin.cyanosis > 0 ? <>
            <span className={styles.ovCyanosis} data-skin-overlay="cyanosis" style={{ ...pct(config.lips), opacity: 0.22 + skin.cyanosis * 0.12, width: "6%", height: "3.5%" }} />
            <span className={styles.ovCyanosis} data-skin-overlay="cyanosis" style={{ ...pct(config.hand), opacity: 0.18 + skin.cyanosis * 0.1, width: "7%", height: "5%" }} />
            <span className={styles.ovCyanosis} data-skin-overlay="cyanosis" style={{ ...pct(config.feet), opacity: 0.18 + skin.cyanosis * 0.1, width: "9%", height: "6%" }} />
          </> : null}
          {skin.mottling > 0 ? <span className={styles.ovMottling} data-skin-overlay="mottling" style={{ ...pct(config.legs), opacity: 0.12 + skin.mottling * 0.11 }} /> : null}
          {skin.edema > 0 ? <span className={styles.ovEdema} data-skin-overlay="edema" style={{ ...pct(config.feet), opacity: 0.1 + skin.edema * 0.08 }} /> : null}
        </div>

        {/* ── Live monitor: inset into the room's own wall screen ── */}
        {config.monitorRect ? (
          <div
            className={styles.wallScreen}
            data-testid="integrated-wall-monitor"
            style={{ left: `${config.monitorRect.x}%`, top: `${config.monitorRect.y}%`, width: `${config.monitorRect.w}%`, height: `${config.monitorRect.h}%` }}
          >
            <BedsideMonitor state={state} compact embedded />
            <button type="button" className={styles.monitorExpand} onClick={() => setMonitorOpen(true)} aria-label="Expand bedside monitor" title="Expand bedside monitor">
              <Maximize2 size={10} aria-hidden="true" />
            </button>
          </div>
        ) : (
          <div className={styles.photoMonitor} style={{ ...pct(config.monitor), width: `${config.monitorWidth ?? 30}%` }}>
            <BedsideMonitor state={state} />
          </div>
        )}
        {monitorOpen ? (
          <div className={styles.monitorExpanded} role="dialog" aria-label="Bedside monitor">
            <button type="button" className={styles.monitorClose} onClick={() => setMonitorOpen(false)} aria-label="Close monitor"><X size={16} aria-hidden="true" /></button>
            <BedsideMonitor state={state} />
          </div>
        ) : null}

        {/* ── Patient-region hotspots (subtle: visible on hover/focus/targets) ── */}
        <div className={styles.hotspotLayer}>
          {hotspots.map((h) => (
            <button key={h.id} type="button" className={styles.photoHotspot} style={pct(h.anchor)} data-active={focus === h.id} aria-label={focusMeta[h.id].label} onClick={() => setFocus(h.id)}>
              <span /><em>{focusMeta[h.id].label}</em>
            </button>
          ))}
          {/* ── Equipment hotspots: route straight into the matching workspace panel ── */}
          {(config.devices ?? []).map((device) => device.rect ? (
            <button
              key={device.id}
              type="button"
              className={styles.deviceOutline}
              style={{ left: `${device.rect.x}%`, top: `${device.rect.y}%`, width: `${device.rect.w}%`, height: `${device.rect.h}%` }}
              aria-label={device.label}
              data-tool={device.tab}
              data-testid={`room-target-${device.id}`}
              onClick={() => onOpenTab?.(device.tab)}
            >
              <em>{device.label}</em>
            </button>
          ) : (
            <button key={device.id} type="button" className={styles.deviceHotspot} style={pct(device.anchor)} aria-label={device.label} data-tool={device.tab} onClick={() => onOpenTab?.(device.tab)}>
              <span /><em>{device.label}</em>
            </button>
          ))}
        </div>

        {focus ? (
          <aside className={styles.photoFocus} data-testid="patient-focus-panel" data-focus={focus} aria-live="polite">
            <header><strong>{focusMeta[focus].label}</strong><button type="button" onClick={() => setFocus(null)} aria-label="Close focused view"><X size={15} aria-hidden="true" /></button></header>
            {presentation ? (
              <figure className={styles.presentationFocus}>
                {/* eslint-disable-next-line @next/next/no-img-element -- authored simulation-state asset, served directly by the worker */}
                <img src={presentation.src} alt={presentation.alt} draggable={false} />
                <figcaption>
                  <span>Current presentation</span>
                  <strong>{visual.consciousness.level}</strong>
                  <small>{visual.respiration.rate}/min · {visual.respiration.work} work of breathing</small>
                </figcaption>
              </figure>
            ) : null}
            {focusActions.length ? <div className={styles.photoFocusActions}>
              {focusActions.map((action) => {
                const done = state.completedActionIds.includes(action.id);
                return <button key={action.id} type="button" disabled={busy || (done && !action.repeatable)} data-completed={done} onClick={() => onPerformAction?.(action.id)}>{done ? <Check size={13} aria-hidden="true" /> : <Play size={13} aria-hidden="true" />} {action.label}</button>;
              })}
            </div> : <button type="button" className={styles.photoFocusOpen} onClick={onOpenAssessment}><Stethoscope size={14} aria-hidden="true" /> Open assessment actions</button>}
          </aside>
        ) : null}
      </div>

      <p className={styles.srOnly} aria-live="polite">{visual.accessibleDescription}</p>
    </section>
  );
}

export default memo(PatientPhotoScene);
