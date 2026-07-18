"use client";

import { Eye, Gauge, RefreshCcw, TriangleAlert } from "lucide-react";
import type { ScenePerformanceSample } from "./PatientScene";
import { patientPositions } from "@/lib/clinical-simulation/schema";
import {
  roomPresetIds,
  skinToneIds,
  type ConsciousnessVisual,
  type OxygenDeviceVisual,
  type PatientVisualState,
  type VisualDebugOverrides,
  type WorkOfBreathingVisual,
} from "@/lib/clinical-simulation/visual-state";
import styles from "./patient-scene.module.css";

type Props = {
  visual: PatientVisualState;
  overrides: VisualDebugOverrides;
  performance: ScenePerformanceSample | null;
  disabled: boolean;
  onChange: (next: VisualDebugOverrides) => void;
};

const consciousnessLevels: ConsciousnessVisual[] = ["alert", "anxious", "restless", "drowsy", "somnolent", "confused", "agitated", "obtunded", "unresponsive", "sedated"];
const workLevels: WorkOfBreathingVisual[] = ["none", "mild", "moderate", "severe", "exhaustion", "arrest"];
const oxygenDevices: OxygenDeviceVisual[] = ["room-air", "nasal-cannula", "high-flow-nasal-cannula", "simple-mask", "venturi-mask", "non-rebreather", "cpap", "bipap", "bag-mask", "tracheostomy-collar", "t-piece", "mechanical-ventilation"];

function title(value: string) {
  return value.replaceAll("-", " ");
}

export default function VisualDeveloperControls({ visual, overrides, performance, disabled, onChange }: Props) {
  const set = <Key extends keyof VisualDebugOverrides>(key: Key, value: VisualDebugOverrides[Key] | undefined) => onChange({ ...overrides, [key]: value });
  return (
    <section className={styles.visualDeveloper} aria-label="Protected patient scene controls">
      <header><div><Eye size={17} aria-hidden="true" /><span>Visual-state preview</span></div><button type="button" disabled={disabled || Object.keys(overrides).length === 0} onClick={() => onChange({})}><RefreshCcw size={14} aria-hidden="true" /> Reset visual overrides</button></header>
      <p>These controls alter only the protected visual preview. Student mode remains synchronized to the persisted simulation engine.</p>
      <div className={styles.visualControlGrid}>
        <label><span>Skin tone</span><select value={overrides.skinTone ?? ""} onChange={(event) => set("skinTone", event.target.value ? event.target.value as VisualDebugOverrides["skinTone"] : undefined)}><option value="">Engine variant</option>{skinToneIds.map((item) => <option key={item} value={item}>{title(item)}</option>)}</select></label>
        <label><span>Body variant</span><select value={overrides.bodyVariant ?? ""} onChange={(event) => set("bodyVariant", event.target.value ? event.target.value as VisualDebugOverrides["bodyVariant"] : undefined)}><option value="">Engine variant</option><option value="slender">Slender</option><option value="average">Average</option><option value="broad">Broad</option></select></label>
        <label><span>Consciousness</span><select value={overrides.consciousness ?? ""} onChange={(event) => set("consciousness", event.target.value ? event.target.value as ConsciousnessVisual : undefined)}><option value="">Engine state</option>{consciousnessLevels.map((item) => <option key={item} value={item}>{title(item)}</option>)}</select></label>
        <label><span>Respiratory rate</span><input type="number" min="0" max="80" value={overrides.respiratoryRate ?? ""} placeholder={String(visual.respiration.rate)} onChange={(event) => set("respiratoryRate", event.target.value === "" ? undefined : Number(event.target.value))} /></label>
        <label><span>Work of breathing</span><select value={overrides.workOfBreathing ?? ""} onChange={(event) => set("workOfBreathing", event.target.value ? event.target.value as WorkOfBreathingVisual : undefined)}><option value="">Engine state</option>{workLevels.map((item) => <option key={item} value={item}>{title(item)}</option>)}</select></label>
        <label><span>Position</span><select value={overrides.position ?? ""} onChange={(event) => set("position", event.target.value ? event.target.value as VisualDebugOverrides["position"] : undefined)}><option value="">Engine state</option>{patientPositions.map((item) => <option key={item} value={item}>{title(item)}</option>)}</select></label>
        <label><span>Oxygen device</span><select value={overrides.oxygenDevice ?? ""} onChange={(event) => set("oxygenDevice", event.target.value ? event.target.value as OxygenDeviceVisual : undefined)}><option value="">Engine state</option>{oxygenDevices.map((item) => <option key={item} value={item}>{title(item)}</option>)}</select></label>
        <label><span>Room preset</span><select value={overrides.roomPreset ?? ""} onChange={(event) => set("roomPreset", event.target.value ? event.target.value as VisualDebugOverrides["roomPreset"] : undefined)}><option value="">Scenario room</option>{roomPresetIds.map((item) => <option key={item} value={item}>{title(item)}</option>)}</select></label>
        <label><span>Pupils</span><select value={overrides.pupils ?? ""} onChange={(event) => set("pupils", event.target.value ? event.target.value as VisualDebugOverrides["pupils"] : undefined)}><option value="">Engine / reveal rules</option><option value="normal">Normal</option><option value="unequal">Unequal</option><option value="pinpoint">Pinpoint</option><option value="dilated">Dilated</option><option value="fixed">Fixed</option></select></label>
        <label><span>IV sites</span><select value={overrides.ivSites ?? ""} onChange={(event) => set("ivSites", event.target.value ? event.target.value as VisualDebugOverrides["ivSites"] : undefined)}><option value="">Engine devices</option><option value="none">None</option><option value="single">Single peripheral</option><option value="dual">Dual peripheral</option><option value="central">Central line</option></select></label>
        <label><span>Drain</span><select value={overrides.drain ?? ""} onChange={(event) => set("drain", event.target.value ? event.target.value as VisualDebugOverrides["drain"] : undefined)}><option value="">Engine devices</option><option value="none">None</option><option value="jp">JP drain</option><option value="chest-tube">Chest tube</option></select></label>
        <label><span>Defibrillation pads</span><select value={overrides.defibrillationPads ?? ""} onChange={(event) => set("defibrillationPads", event.target.value ? event.target.value as VisualDebugOverrides["defibrillationPads"] : undefined)}><option value="">Engine state</option><option value="none">None</option><option value="anterior-lateral">Anterior-lateral</option><option value="anterior-posterior">Anterior-posterior</option></select></label>
      </div>
      <div className={styles.visualRanges}>
        <label><span>Diaphoresis <output>{overrides.diaphoresis ?? visual.skin.diaphoresis}</output></span><input type="range" min="0" max="3" value={overrides.diaphoresis ?? visual.skin.diaphoresis} onChange={(event) => set("diaphoresis", Number(event.target.value) as 0 | 1 | 2 | 3)} /></label>
        <label><span>Mottling <output>{overrides.mottling ?? visual.skin.mottling}</output></span><input type="range" min="0" max="4" value={overrides.mottling ?? visual.skin.mottling} onChange={(event) => set("mottling", Number(event.target.value) as 0 | 1 | 2 | 3 | 4)} /></label>
        <label><span>Edema <output>{overrides.edema ?? visual.skin.edema}</output></span><input type="range" min="0" max="4" value={overrides.edema ?? visual.skin.edema} onChange={(event) => set("edema", Number(event.target.value) as 0 | 1 | 2 | 3 | 4)} /></label>
      </div>
      <div className={styles.visualToggles}>
        <label><input type="checkbox" checked={Boolean(overrides.ventilator)} onChange={(event) => set("ventilator", event.target.checked || undefined)} /><span>Ventilator</span></label>
        <label><input type="checkbox" checked={overrides.ecgLeads ?? visual.devices.ecgLeads} onChange={(event) => set("ecgLeads", event.target.checked)} /><span>ECG leads</span></label>
        <label><input type="checkbox" checked={Boolean(overrides.seizure)} onChange={(event) => set("seizure", event.target.checked || undefined)} /><span>Seizure</span></label>
        <label><input type="checkbox" checked={Boolean(overrides.respiratoryArrest)} onChange={(event) => set("respiratoryArrest", event.target.checked || undefined)} /><span>Respiratory arrest</span></label>
        <label><input type="checkbox" checked={Boolean(overrides.improvement)} onChange={(event) => set("improvement", event.target.checked || undefined)} /><span>Improvement</span></label>
        <label><input type="checkbox" checked={Boolean(overrides.reducedMotion)} onChange={(event) => set("reducedMotion", event.target.checked || undefined)} /><span>Reduced motion</span></label>
      </div>
      <div className={styles.visualDiagnostics}>
        <div><Gauge size={16} aria-hidden="true" /><span>Render</span><strong>{performance?.fps == null ? "measuring" : `${performance.fps} fps / ${performance.averageFrameMs} ms`}</strong><small>{performance?.svgElements ?? "-"} SVG nodes / 0 external asset bytes{performance?.memoryMb != null ? ` / ${performance.memoryMb} MB JS heap` : ""}</small></div>
        <div><TriangleAlert size={16} aria-hidden="true" /><span>Consistency</span><strong>{visual.warnings.filter((item) => item.severity !== "info").length === 0 ? "No contradictions" : `${visual.warnings.filter((item) => item.severity !== "info").length} warning(s)`}</strong><small>{visual.warnings.map((item) => item.code).join(", ") || "Engine and visual state agree"}</small></div>
      </div>
    </section>
  );
}
