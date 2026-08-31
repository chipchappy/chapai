"use client";

import { useMemo, useState } from "react";
import {
  Copy,
  Download,
  FastForward,
  Pause,
  Play,
  RefreshCcw,
  RotateCcw,
  TimerReset,
  Zap,
} from "lucide-react";
import type { ScenePerformanceSample } from "@/components/clinical-simulation/scene/PatientScene";
import VisualDeveloperControls from "@/components/clinical-simulation/scene/VisualDeveloperControls";
import { scoreSimulation, type PatientState } from "@/lib/clinical-simulation/engine";
import { getActiveSceneAssetIds, findMissingSceneAssets } from "@/lib/clinical-simulation/scene-assets";
import { getSceneAnchors, getSceneConnections } from "@/lib/clinical-simulation/scene-geometry";
import type { ClinicalScenario, ScenarioValidationIssue } from "@/lib/clinical-simulation/schema";
import type { PatientVisualState, VisualDebugOverrides } from "@/lib/clinical-simulation/visual-state";
import styles from "./clinical-simulation.module.css";

export type DeveloperScenarioInfo = {
  validation: { success: boolean; issues: ScenarioValidationIssue[] };
  events: Array<{ id: string; atMinute: number; severity: string; feedback: string }>;
};

type Props = {
  scenario: ClinicalScenario;
  attemptId: string;
  seed: number;
  state: PatientState;
  info: DeveloperScenarioInfo;
  busy: boolean;
  onPause: (paused: boolean) => Promise<void>;
  onAdvance: (minutes: 1 | 5) => Promise<void>;
  onAdvanceNext: () => Promise<void>;
  onReset: (seed?: number) => Promise<void>;
  onRestart: (seed?: number) => Promise<void>;
  onTriggerEvent: (eventId: string) => Promise<void>;
  visualState: PatientVisualState;
  visualOverrides: VisualDebugOverrides;
  scenePerformance: ScenePerformanceSample | null;
  onVisualOverrides: (next: VisualDebugOverrides) => void;
};

export default function SimulationDeveloperPanel({
  scenario,
  attemptId,
  seed,
  state,
  info,
  busy,
  onPause,
  onAdvance,
  onAdvanceNext,
  onReset,
  onRestart,
  onTriggerEvent,
  visualState,
  visualOverrides,
  scenePerformance,
  onVisualOverrides,
}: Props) {
  const [eventId, setEventId] = useState(info.events.find((event) => !state.processedEventIds.includes(event.id))?.id ?? info.events[0]?.id ?? "");
  const [message, setMessage] = useState<string | null>(null);
  const scores = useMemo(() => scoreSimulation(scenario, state), [scenario, state]);
  const sceneAnchors = useMemo(() => getSceneAnchors(visualState), [visualState]);
  const sceneConnections = useMemo(() => getSceneConnections(visualState, sceneAnchors), [sceneAnchors, visualState]);
  const activeSceneAssets = useMemo(() => getActiveSceneAssetIds(visualState), [visualState]);
  const missingSceneAssets = useMemo(() => findMissingSceneAssets(visualState), [visualState]);
  const pendingEvents = useMemo(() => [
    ...state.pendingEffects.map((effect) => ({ id: effect.id, dueMinute: effect.dueMinute, source: "delayed effect" })),
    ...info.events
      .filter((event) => !state.processedEventIds.includes(event.id) && event.atMinute > state.virtualMinute)
      .map((event) => ({ id: event.id, dueMinute: event.atMinute, source: "scenario event" })),
  ].sort((left, right) => left.dueMinute - right.dueMinute), [info.events, state.pendingEffects, state.processedEventIds, state.virtualMinute]);

  async function exportTrace() {
    setMessage(null);
    const response = await fetch(`/api/clinical-simulation/attempts/${encodeURIComponent(attemptId)}/trace`, { cache: "no-store" });
    if (!response.ok) {
      const body = await response.json().catch(() => null);
      throw new Error(body?.error?.message ?? body?.error ?? "Attempt trace could not be exported.");
    }
    const blob = await response.blob();
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = `clinical-simulation-${attemptId}.json`;
    document.body.appendChild(anchor);
    anchor.click();
    anchor.remove();
    URL.revokeObjectURL(url);
    setMessage("Sanitized attempt trace exported.");
  }

  async function copySummary() {
    const summary = {
      scenarioId: scenario.id,
      scenarioVersion: scenario.version,
      attemptId,
      seed,
      mode: state.mode,
      status: state.status,
      virtualMinute: state.virtualMinute,
      vitals: state.vitals,
      completedActionIds: state.completedActionIds,
      processedEventIds: state.processedEventIds,
      pendingEventIds: pendingEvents.map((event) => event.id),
      criticalErrors: state.criticalErrors,
      scores,
    };
    await navigator.clipboard.writeText(JSON.stringify(summary, null, 2));
    setMessage("Debug summary copied.");
  }

  async function confirmedReset() {
    if (!window.confirm("Reset this attempt and permanently remove its recorded actions?")) return;
    await onReset(seed);
    setMessage("Attempt reset with the same deterministic seed.");
  }

  async function restart(nextSeed?: number) {
    if (!window.confirm("Create a new attempt and leave this attempt in history?")) return;
    await onRestart(nextSeed);
  }

  return (
    <div className={styles.developerPanel}>
        <header>
          <div><span>Protected development controls</span><h2>Simulation inspector</h2></div>
          <dl>
            <div><dt>Attempt</dt><dd>{attemptId}</dd></div>
            <div><dt>Scenario</dt><dd>{scenario.id} / {scenario.version}</dd></div>
            <div><dt>Clock</dt><dd>minute {state.virtualMinute} / {state.clockPaused ? "paused" : "running"}</dd></div>
            <div><dt>Validation</dt><dd>{info.validation.success ? "passed" : `${info.validation.issues.length} errors`}</dd></div>
          </dl>
        </header>

        <div className={styles.developerControls}>
          <button type="button" disabled={busy} onClick={() => void onPause(!state.clockPaused)}>{state.clockPaused ? <Play size={15} /> : <Pause size={15} />} {state.clockPaused ? "Resume" : "Pause"}</button>
          <button type="button" disabled={busy} onClick={() => void onAdvance(1)}><FastForward size={15} /> +1 minute</button>
          <button type="button" disabled={busy} onClick={() => void onAdvance(5)}><FastForward size={15} /> +5 minutes</button>
          <button type="button" disabled={busy} onClick={() => void onAdvanceNext()}><TimerReset size={15} /> Next event</button>
          <button type="button" disabled={busy} onClick={() => void confirmedReset()}><RefreshCcw size={15} /> Reset attempt</button>
          <button type="button" disabled={busy} onClick={() => void restart(seed)}><RotateCcw size={15} /> Restart same seed</button>
          <button type="button" disabled={busy} onClick={() => void restart()}><RotateCcw size={15} /> Restart new seed</button>
          <button type="button" disabled={busy} onClick={() => void exportTrace().catch((error: Error) => setMessage(error.message))}><Download size={15} /> Export trace</button>
          <button type="button" disabled={busy} onClick={() => void copySummary().catch((error: Error) => setMessage(error.message))}><Copy size={15} /> Copy summary</button>
        </div>

        <div className={styles.eventTrigger}>
          <label><span>Trigger scenario event</span><select value={eventId} onChange={(event) => setEventId(event.target.value)}>{info.events.map((event) => <option key={event.id} value={event.id} disabled={state.processedEventIds.includes(event.id)}>{event.id} / minute {event.atMinute} / {event.severity}</option>)}</select></label>
          <button type="button" disabled={busy || !eventId || state.processedEventIds.includes(eventId)} onClick={() => void onTriggerEvent(eventId)}><Zap size={15} /> Trigger</button>
        </div>

        {message ? <p className={styles.developerMessage} role="status">{message}</p> : null}
        {!info.validation.success ? <div className={styles.validationErrors} role="alert"><strong>Scenario validation failed</strong><ul>{info.validation.issues.map((issue) => <li key={`${issue.path}-${issue.message}`}>{issue.path}: {issue.message}</li>)}</ul></div> : null}

        <VisualDeveloperControls visual={visualState} overrides={visualOverrides} performance={scenePerformance} disabled={busy} onChange={onVisualOverrides} />

        <div className={styles.developerGrid}>
          <details open><summary>Current and hidden patient state</summary><pre>{JSON.stringify(state, null, 2)}</pre></details>
          <details open><summary>Derived patient visual state</summary><pre>{JSON.stringify(visualState, null, 2)}</pre></details>
          <details><summary>Scene assets, anchors, and tubing ({activeSceneAssets.length} assets / {sceneConnections.length} connections)</summary><pre>{JSON.stringify({ activeSceneAssets, missingSceneAssets, anchors: sceneAnchors, connections: sceneConnections }, null, 2)}</pre></details>
          <details><summary>Visual consistency warnings ({visualState.warnings.length})</summary><pre>{JSON.stringify(visualState.warnings, null, 2)}</pre></details>
          <details><summary>Render performance</summary><pre>{JSON.stringify(scenePerformance, null, 2)}</pre></details>
          <details><summary>Pending event queue ({pendingEvents.length})</summary><pre>{JSON.stringify(pendingEvents, null, 2)}</pre></details>
          <details><summary>Current score breakdown</summary><pre>{JSON.stringify(scores, null, 2)}</pre></details>
          <details><summary>Completion conditions</summary><pre>{JSON.stringify(scenario.completion, null, 2)}</pre></details>
          <details><summary>Recent actions</summary><pre>{JSON.stringify(state.actionLog.slice(-10), null, 2)}</pre></details>
          <details><summary>Processed events</summary><pre>{JSON.stringify(state.notices.filter((notice) => state.processedEventIds.includes(notice.id)), null, 2)}</pre></details>
        </div>
    </div>
  );
}
