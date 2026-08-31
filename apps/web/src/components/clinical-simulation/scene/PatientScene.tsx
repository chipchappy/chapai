"use client";

import { memo, useEffect, useId, useMemo, useRef, useState, type CSSProperties, type RefObject } from "react";
import { Activity, BedDouble, Check, CircuitBoard, Eye, Focus, Maximize2, MonitorUp, Play, ScanFace, Stethoscope, X } from "lucide-react";
import type { PatientState } from "@/lib/clinical-simulation/engine";
import { getSceneAnchors, getSceneConnections, type ScenePoint } from "@/lib/clinical-simulation/scene-geometry";
import type { ClinicalScenario } from "@/lib/clinical-simulation/schema";
import type { PatientVisualState } from "@/lib/clinical-simulation/visual-state";
import MedicalDevices from "./MedicalDevices";
import PatientBody from "./PatientBody";
import RoomScene from "./RoomScene";
import styles from "./patient-scene.module.css";

export type ScenePerformanceSample = {
  fps: number | null;
  averageFrameMs: number | null;
  memoryMb: number | null;
  svgElements: number;
  quality: "full" | "reduced";
  externalAssetBytes: 0;
};

type SceneView = "bedside" | "focused" | "equipment" | "overview";
type FocusTarget = "face" | "pupils" | "respiratory" | "perfusion" | "iv" | "oxygen" | "monitor" | "pump" | "urinary" | "drain" | "bed";

type Props = {
  scenario: ClinicalScenario;
  state: PatientState;
  visual: PatientVisualState;
  onOpenAssessment: () => void;
  onPerformAction?: (actionId: string) => void;
  busy?: boolean;
  onPerformanceSample?: (sample: ScenePerformanceSample) => void;
};

/**
 * Maps each bedside focus target to the scenario actions a nurse would perform
 * there, so clicking the patient or a device surfaces real, performable actions.
 */
const focusActionPatterns: Record<FocusTarget, RegExp> = {
  face: /neuro|conscious|orientation|\bloc\b|glasgow|arousal|mental|sedation/i,
  pupils: /pupil/i,
  respiratory: /resp|breath|lung|airway|auscult|cough|spirometer/i,
  perfusion: /perfusion|capillary|pulse|skin|cardiovascular|cardiac|circulat|extremit/i,
  iv: /\biv\b|intravenous|\bline\b|site|infiltrat|patenc|flush|access/i,
  oxygen: /oxygen|\bo2\b|cannula|mask|fio2|nonrebreather|non-rebreather/i,
  monitor: /vital|monitor|blood pressure|telemetry|rhythm|ecg|ekg/i,
  pump: /infus|pump|\brate\b|bolus|fluid|titrat/i,
  urinary: /urin|foley|catheter|output|intake/i,
  drain: /drain|chest tube|dressing|surgical site|incision|bleed/i,
  bed: /position|reposition|head of bed|\bhob\b|fall|mobilit|ambulat/i,
};

type FocusDefinition = {
  id: FocusTarget;
  label: string;
  shortLabel: string;
  anchor: ScenePoint;
  available: boolean;
  revealed: boolean;
  description: string;
  hiddenMessage?: string;
};

function percentPosition(anchor: ScenePoint): CSSProperties {
  return { left: `${(anchor.x / 1200) * 100}%`, top: `${(anchor.y / 680) * 100}%` };
}

function offsetPoint(anchor: ScenePoint, x: number, y: number): ScenePoint {
  return { x: anchor.x + x, y: anchor.y + y };
}

function useDocumentVisibility() {
  const [hidden, setHidden] = useState(false);
  useEffect(() => {
    const update = () => setHidden(document.hidden);
    update();
    document.addEventListener("visibilitychange", update);
    return () => document.removeEventListener("visibilitychange", update);
  }, []);
  return hidden;
}

function useReducedMotion(forceReduced: boolean) {
  const [preferred, setPreferred] = useState(false);
  useEffect(() => {
    const query = window.matchMedia("(prefers-reduced-motion: reduce)");
    const update = () => setPreferred(query.matches);
    update();
    query.addEventListener?.("change", update);
    return () => query.removeEventListener?.("change", update);
  }, []);
  return forceReduced || preferred;
}

function usePerformanceSample(sceneRef: RefObject<HTMLDivElement | null>, quality: ScenePerformanceSample["quality"], callback?: (sample: ScenePerformanceSample) => void) {
  useEffect(() => {
    if (!callback) return;
    let raf = 0;
    let prior = performance.now();
    let started = prior;
    let frames = 0;
    let totalFrameMs = 0;
    const memory = () => {
      const value = performance as Performance & { memory?: { usedJSHeapSize?: number } };
      return value.memory?.usedJSHeapSize ? Math.round((value.memory.usedJSHeapSize / 1024 / 1024) * 10) / 10 : null;
    };
    const sample = (now: number) => {
      const delta = Math.min(250, now - prior);
      prior = now;
      frames += 1;
      totalFrameMs += delta;
      if (now - started >= 2500) {
        const elapsed = now - started;
        callback({
          fps: Math.round((frames / elapsed) * 1000),
          averageFrameMs: Math.round((totalFrameMs / Math.max(frames, 1)) * 10) / 10,
          memoryMb: memory(),
          svgElements: sceneRef.current?.querySelectorAll("svg *").length ?? 0,
          quality,
          externalAssetBytes: 0,
        });
        frames = 0;
        totalFrameMs = 0;
        started = now;
      }
      raf = requestAnimationFrame(sample);
    };
    raf = requestAnimationFrame(sample);
    return () => cancelAnimationFrame(raf);
  }, [callback, quality, sceneRef]);
}

function buildFocusDefinitions(scenario: ClinicalScenario, state: PatientState, visual: PatientVisualState, anchors: ReturnType<typeof getSceneAnchors>): FocusDefinition[] {
  const finding = (matcher: RegExp) => scenario.assessments.find((item) => matcher.test(`${item.id} ${item.category} ${item.label}`))?.finding;
  const oxygenDescription = visual.devices.oxygen === "room-air" ? "No oxygen delivery device is present." : `${visual.devices.oxygen.replaceAll("-", " ")} is positioned at ${visual.devices.oxygenFlow}.`;
  const definitions: FocusDefinition[] = [
    { id: "face", label: "Inspect patient appearance", shortLabel: "Appearance", anchor: offsetPoint(anchors.leftCheek, -42, 14), available: true, revealed: true, description: `${visual.consciousness.level}; expression ${visual.expression}; visible movement level ${visual.movement.intensity}.` },
    { id: "pupils", label: "Inspect pupils", shortLabel: "Pupils", anchor: offsetPoint(anchors.nose, -8, -42), available: true, revealed: visual.pupils.revealed, description: visual.pupils.description, hiddenMessage: "Pupil size and reactivity remain hidden until a neurologic or pupil assessment is performed." },
    { id: "respiratory", label: "Inspect chest and breathing", shortLabel: "Breathing", anchor: anchors.upperChest, available: true, revealed: visual.revealed.respiratory, description: finding(/respiratory|airway/) ?? `${visual.respiration.pattern} respirations with ${visual.respiration.work} work of breathing.`, hiddenMessage: `Visible breathing is ${visual.respiration.pattern} at ${visual.respiration.rate}/min. Perform a focused respiratory assessment to reveal auscultation and airway findings.` },
    { id: "perfusion", label: "Inspect skin and perfusion", shortLabel: "Perfusion", anchor: anchors.leftHand, available: true, revealed: visual.revealed.perfusion, description: finding(/perfusion|hemodynamic|vital/) ?? state.perfusion, hiddenMessage: "Gross color and moisture cues are visible, but capillary refill and focused perfusion findings require assessment." },
    { id: "iv", label: "Inspect IV access", shortLabel: "IV access", anchor: visual.devices.ivSites[0]?.side === "right" ? anchors.rightForearm : anchors.leftForearm, available: visual.devices.ivSites.length > 0, revealed: visual.revealed.iv, description: finding(/iv|line|device/) ?? visual.devices.ivSites.map((site) => `${site.id}: ${site.status}`).join("; "), hiddenMessage: "The access device is visible; patency and site findings require direct assessment." },
    { id: "oxygen", label: "Inspect oxygen device", shortLabel: "Oxygen", anchor: offsetPoint(anchors.nose, 42, 24), available: visual.devices.oxygen !== "room-air", revealed: true, description: oxygenDescription },
    { id: "monitor", label: "Open bedside monitor view", shortLabel: "Monitor", anchor: anchors.monitor, available: visual.devices.ecgLeads, revealed: true, description: "ECG leads, pulse oximetry, noninvasive pressure monitoring, and current alarms are connected to the bedside monitor." },
    { id: "pump", label: "Inspect infusion equipment", shortLabel: "Infusions", anchor: anchors.infusionPump, available: visual.devices.pumps.length > 0 || visual.devices.ivSites.length > 0, revealed: visual.revealed.iv, description: visual.devices.pumps.length > 0 ? visual.devices.pumps.map((pump) => `${pump.label}: ${pump.state}, ${pump.rate}`).join("; ") : "IV pole and access tubing are present without an active infusion channel.", hiddenMessage: "Infusion equipment is visible; verify the line and programmed channel before relying on it." },
    { id: "urinary", label: "Inspect urinary drainage", shortLabel: "Urine output", anchor: anchors.urinaryBag, available: visual.devices.urinaryDrainage.visible, revealed: visual.devices.urinaryDrainage.detailRevealed, description: `${visual.devices.urinaryDrainage.outputMlHr} mL/hr; ${visual.devices.urinaryDrainage.color} appearance.`, hiddenMessage: "The drainage system is visible, but the current measured output requires an intake-and-output assessment." },
    { id: "drain", label: "Inspect surgical drainage", shortLabel: "Drain", anchor: anchors.drainSystem, available: visual.devices.drain.visible, revealed: visual.devices.drain.detailRevealed, description: `${visual.devices.drain.kind.replaceAll("-", " ")}; ${visual.devices.drain.outputMl} mL ${visual.devices.drain.color} output.`, hiddenMessage: "A drainage system is visible, but output character and amount require focused inspection." },
    { id: "bed", label: "Inspect patient position", shortLabel: "Position", anchor: anchors.bedRail, available: !visual.position.ambulatory, revealed: true, description: `${visual.position.kind.replaceAll("-", " ")} with the head of bed at ${Math.round(visual.position.headOfBedDegrees)} degrees.` },
  ];
  return definitions.filter((item) => item.available);
}

function PatientScene({ scenario, state, visual, onOpenAssessment, onPerformAction, busy = false, onPerformanceSample }: Props) {
  const rawId = useId();
  const idPrefix = `patient-scene-${rawId.replaceAll(":", "")}`;
  const [view, setView] = useState<SceneView>("bedside");
  const [focus, setFocus] = useState<FocusTarget | null>(null);
  const sceneRef = useRef<HTMLDivElement>(null);
  const hidden = useDocumentVisibility();
  const reducedMotion = useReducedMotion(visual.reducedMotion);
  const anchors = useMemo(() => getSceneAnchors(visual), [visual]);
  const connections = useMemo(() => getSceneConnections(visual, anchors), [anchors, visual]);
  const focusDefinitions = useMemo(() => buildFocusDefinitions(scenario, state, visual, anchors), [anchors, scenario, state, visual]);
  const focused = focusDefinitions.find((item) => item.id === focus) ?? null;
  const focusedActions = useMemo(() => {
    if (!focused || !onPerformAction) return [];
    const pattern = focusActionPatterns[focused.id];
    return scenario.actions
      .filter((action) => (action.category === "assessment" || action.category === "intervention" || action.category === "safety") && pattern.test(`${action.label} ${action.description}`))
      .slice(0, 3);
  }, [focused, onPerformAction, scenario.actions]);
  const quality = visual.quality;
  usePerformanceSample(sceneRef, quality, onPerformanceSample);

  const sceneStyle = {
    "--breath-duration": `${visual.respiration.breathDurationSeconds}s`,
    "--chest-scale": String(1 + visual.respiration.chestAmplitude * 0.028),
    "--abdomen-scale": String(1 + visual.respiration.abdominalAmplitude * 0.018),
    "--blink-duration": `${visual.consciousness.blinkSeconds}s`,
    "--movement-intensity": String(visual.movement.intensity),
  } as CSSProperties;
  const visualSignature = [
    visual.position.kind,
    visual.consciousness.level,
    visual.respiration.pattern,
    visual.devices.oxygen,
    visual.skin.cyanosis,
    visual.skin.mottling,
    visual.skin.diaphoresis,
    visual.movement.intensity,
  ].join("-");

  function chooseView(next: SceneView) {
    setView(next);
    if (next === "focused" && !focus) setFocus("respiratory");
  }

  return (
    <section className={styles.sceneShell} aria-label="Reactive patient bedside scene" data-testid="patient-scene" data-scenario={scenario.slug} data-source={visual.source} data-room={visual.roomPreset} data-loc={visual.consciousness.level} data-position={visual.position.kind} data-oxygen={visual.devices.oxygen}>
      <header className={styles.sceneToolbar}>
        <div><span>Reactive bedside</span><strong>{visual.roomPreset.replaceAll("-", " ")} / {visual.source === "engine" ? "live patient state" : "developer preview"}</strong></div>
        <div className={styles.viewControl} role="group" aria-label="Patient scene view">
          <button type="button" data-active={view === "bedside"} aria-label="Bedside view" aria-pressed={view === "bedside"} onClick={() => chooseView("bedside")} title="Bedside view"><BedDouble size={15} aria-hidden="true" /><span>Bedside</span></button>
          <button type="button" data-active={view === "focused"} aria-label="Focused assessment view" aria-pressed={view === "focused"} onClick={() => chooseView("focused")} title="Focused assessment view"><Focus size={15} aria-hidden="true" /><span>Focused</span></button>
          <button type="button" data-active={view === "equipment"} aria-label="Equipment view" aria-pressed={view === "equipment"} onClick={() => chooseView("equipment")} title="Equipment view"><CircuitBoard size={15} aria-hidden="true" /><span>Equipment</span></button>
          <button type="button" data-active={view === "overview"} aria-label="Room overview" aria-pressed={view === "overview"} onClick={() => chooseView("overview")} title="Room overview"><Maximize2 size={15} aria-hidden="true" /><span>Overview</span></button>
        </div>
      </header>

      <div
        ref={sceneRef}
        className={styles.sceneViewport}
        style={sceneStyle}
        data-testid="patient-scene-viewport"
        data-view={view}
        data-paused={hidden}
        data-reduced-motion={reducedMotion}
        data-quality={quality}
        data-breathing={visual.respiration.pattern}
        data-respiratory-rate={visual.respiration.rate}
        data-work={visual.respiration.work}
        data-lighting={visual.roomLighting}
      >
        <svg key={visualSignature} className={styles.stateFrame} data-testid="patient-scene-svg" viewBox="0 0 1200 680" preserveAspectRatio="xMidYMid meet" role="img" aria-labelledby={`${idPrefix}-title ${idPrefix}-description`}>
          <title id={`${idPrefix}-title`}>{`${scenario.patient.name} in the ${visual.roomPreset.replaceAll("-", " ")} bedside scene`}</title>
          <desc id={`${idPrefix}-description`}>{visual.accessibleDescription}</desc>
          <defs>
            <radialGradient id={`${idPrefix}-alarm-light`} cx="50%" cy="35%" r="70%"><stop offset="0" stopColor="#d9534f" stopOpacity="0.5" /><stop offset="1" stopColor="#d9534f" stopOpacity="0" /></radialGradient>
            <pattern id={`${idPrefix}-mottling`} width="42" height="34" patternUnits="userSpaceOnUse" patternTransform="rotate(-9)"><path d="M4 12 Q13 2 22 12 T40 10 Q31 25 20 20 T2 26 Z" fill={visual.profile.palette.mottling} /><ellipse cx="12" cy="29" rx="8" ry="4" fill={visual.profile.palette.mottling} /></pattern>
          </defs>
          <RoomScene visual={visual} idPrefix={idPrefix} virtualMinute={state.virtualMinute} roomLabel={scenario.patient.room} patientName={scenario.patient.name} />
          <PatientBody visual={visual} anchors={anchors} idPrefix={idPrefix} />
          <MedicalDevices visual={visual} anchors={anchors} connections={connections} idPrefix={idPrefix} vitals={state.vitals} />
        </svg>

        <div className={styles.hotspotLayer} aria-label="Bedside inspection targets">
          {focusDefinitions.map((item) => <button key={item.id} type="button" className={styles.hotspot} style={percentPosition(item.anchor)} data-active={focus === item.id} data-target={item.id} aria-label={item.label} title={item.label} onClick={() => { setFocus(item.id); setView("focused"); }}><span /></button>)}
        </div>

        {focused ? <aside className={styles.focusPanel} data-testid="patient-focus-panel" data-focus={focused.id} data-revealed={focused.revealed} aria-live="polite">
          <header><div><span>Focused bedside view</span><strong>{focused.shortLabel}</strong></div><button type="button" onClick={() => setFocus(null)} aria-label="Close focused view" title="Close focused view"><X size={16} aria-hidden="true" /></button></header>
          <div className={styles.focusVisual} data-focus={focused.id}>
            {focused.id === "pupils" ? <div className={styles.pupilView} data-revealed={focused.revealed}><span style={{ "--pupil-size": focused.revealed ? `${visual.pupils.leftMm * 2.4}px` : "7px" } as CSSProperties} /><span style={{ "--pupil-size": focused.revealed ? `${visual.pupils.rightMm * 2.4}px` : "7px" } as CSSProperties} /></div> : null}
            {focused.id === "respiratory" ? <Activity aria-hidden="true" /> : focused.id === "monitor" ? <MonitorUp aria-hidden="true" /> : focused.id === "face" ? <ScanFace aria-hidden="true" /> : focused.id === "bed" ? <BedDouble aria-hidden="true" /> : <Stethoscope aria-hidden="true" />}
          </div>
          <p>{focused.revealed ? focused.description : focused.hiddenMessage}</p>
          {focusedActions.length ? <div className={styles.focusActions} role="group" aria-label={`Actions for ${focused.shortLabel}`}>
            {focusedActions.map((action) => {
              const done = state.completedActionIds.includes(action.id);
              return <button key={action.id} type="button" disabled={busy || (done && !action.repeatable)} data-completed={done} onClick={() => onPerformAction?.(action.id)}>
                {done ? <Check size={14} aria-hidden="true" /> : <Play size={14} aria-hidden="true" />} {action.label}
              </button>;
            })}
          </div> : null}
          {!focused.revealed ? <button type="button" className={styles.assessmentAction} onClick={onOpenAssessment}><Stethoscope size={15} aria-hidden="true" /> Open assessment actions</button> : null}
        </aside> : null}

        {visual.roomLighting === "emergency" ? <div className={styles.emergencyBanner} role="status"><Activity size={15} aria-hidden="true" /> Critical bedside change</div> : null}
      </div>

      <div className={styles.sceneFooter}>
        <div className={styles.observedCues} aria-hidden="true"><span>{visual.consciousness.level}</span><span>{visual.respiration.rate}/min / {visual.respiration.work} effort</span><span>{visual.devices.oxygen.replaceAll("-", " ")} {visual.devices.oxygenFlow !== "none" ? visual.devices.oxygenFlow : ""}</span>{visual.skin.mottling > 0 ? <span>Mottling visible</span> : null}{visual.skin.diaphoresis > 0 ? <span>Diaphoresis visible</span> : null}</div>
        <div className={styles.targetList} role="group" aria-label="Alternative bedside inspection list">{focusDefinitions.map((item) => <button key={item.id} type="button" data-active={focus === item.id} onClick={() => { setFocus(item.id); setView("focused"); }}><Eye size={13} aria-hidden="true" /> {item.shortLabel}</button>)}</div>
        <p className={styles.screenReaderStatus} aria-live="polite">{visual.accessibleDescription}</p>
      </div>
    </section>
  );
}

export default memo(PatientScene);
