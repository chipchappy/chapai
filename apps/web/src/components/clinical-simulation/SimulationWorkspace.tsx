"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  Activity,
  AlertTriangle,
  BookOpen,
  Check,
  ChevronRight,
  ClipboardCheck,
  Clock3,
  HeartPulse,
  ListChecks,
  Lock,
  LogOut,
  MessageSquareText,
  Pause,
  Pill,
  Play,
  Save,
  ShieldAlert,
  Siren,
  Stethoscope,
  TestTube2,
  Zap,
} from "lucide-react";
import BedsideMonitor from "@/components/clinical-simulation/BedsideMonitor";
import ClinicalImpactPanel from "@/components/clinical-simulation/ClinicalImpactPanel";
import ChartEhr from "@/components/clinical-simulation/ChartEhr";
import SimEventFeed from "@/components/clinical-simulation/SimEventFeed";
import DeviceStation from "@/components/clinical-simulation/DeviceStation";
import AssessmentStation from "@/components/clinical-simulation/AssessmentStation";
import PatientScene, { type ScenePerformanceSample } from "@/components/clinical-simulation/scene/PatientScene";
import PatientPhotoScene, { getPhotoPatient } from "@/components/clinical-simulation/scene/PatientPhotoScene";
import SimulationDeveloperPanel, { type DeveloperScenarioInfo } from "@/components/clinical-simulation/SimulationDeveloperPanel";
import SimulationDebrief from "@/components/clinical-simulation/SimulationDebrief";
import { canCompleteSimulation, type PatientState, type SimulationDebrief as Debrief } from "@/lib/clinical-simulation/engine";
import { gradeBestPracticeRoute } from "@/lib/clinical-simulation/best-practice";
import type { ClinicalScenario, ScenarioAction } from "@/lib/clinical-simulation/schema";
import { derivePatientVisualState, type SceneQuality, type VisualDebugOverrides } from "@/lib/clinical-simulation/visual-state";
import { trackEvent } from "@/lib/analytics";
import styles from "./clinical-simulation.module.css";

type StationId = "assessment" | "computer" | "phone" | "interventions";
type TabId = "patient" | "assessment" | "chart" | "orders" | "mar" | "labs" | "diagnostics" | "interventions" | "communication" | "documentation" | "timeline";
type Operation =
  | { operation: "act"; actionId: string; selectedElements: string[] }
  | { operation: "advance"; minutes: number }
  | { operation: "advance_next" }
  | { operation: "set_paused"; paused: boolean }
  | { operation: "complete" }
  | { operation: "debrief_viewed" }
  | { operation: "abandon" }
  | { operation: "reset"; seed?: number }
  | { operation: "trigger_event"; eventId: string }
  | { operation: "rewind"; keepActions: number };

type AttemptMeta = {
  id: string;
  seed: number;
  mode: "guided" | "independent";
  status: "in_progress" | "completed" | "abandoned";
  scenarioVersion: string;
};

function errorMessage(body: unknown, fallback: string) {
  if (!body || typeof body !== "object") return fallback;
  const error = (body as { error?: unknown }).error;
  if (typeof error === "string") return error;
  if (error && typeof error === "object" && typeof (error as { message?: unknown }).message === "string") return (error as { message: string }).message;
  return fallback;
}

const tabs: Array<{ id: TabId; label: string; icon: typeof Activity }> = [
  { id: "patient", label: "Patient", icon: HeartPulse },
  { id: "assessment", label: "Assessment", icon: Stethoscope },
  { id: "chart", label: "Chart", icon: BookOpen },
  { id: "orders", label: "Orders", icon: ListChecks },
  { id: "mar", label: "MAR", icon: Pill },
  { id: "labs", label: "Labs", icon: TestTube2 },
  { id: "diagnostics", label: "Diagnostics", icon: Activity },
  { id: "interventions", label: "Interventions", icon: ShieldAlert },
  { id: "communication", label: "Communication", icon: MessageSquareText },
  { id: "documentation", label: "Documentation", icon: ClipboardCheck },
  { id: "timeline", label: "Timeline", icon: Clock3 },
];

/** Groups the workspace tabs by clinical workflow so the nav reads as a shift routine rather than a flat list. */
/** The only four things a student chooses between; everything else is inside one. */
const STATIONS: Array<{ id: StationId; label: string; hint: string; icon: typeof Activity }> = [
  { id: "assessment", label: "Assessment", hint: "Systems · talk to patient", icon: Stethoscope },
  { id: "computer", label: "Computer", hint: "Chart · MAR · labs · orders", icon: BookOpen },
  { id: "phone", label: "Phone", hint: "Provider · RRT · RT", icon: MessageSquareText },
  { id: "interventions", label: "Interventions", hint: "Treat · position · safety", icon: ShieldAlert },
];

const tabGroups: Array<{ label: string; ids: TabId[] }> = [
  { label: "Bedside", ids: ["patient", "assessment"] },
  { label: "Chart", ids: ["chart", "orders", "labs", "diagnostics"] },
  { label: "Act", ids: ["mar", "interventions"] },
  { label: "Team", ids: ["communication", "documentation"] },
  { label: "Review", ids: ["timeline"] },
];

function formatClock(minute: number) {
  const hour = 7 + Math.floor(minute / 60);
  return `${String(hour % 24).padStart(2, "0")}:${String(minute % 60).padStart(2, "0")}`;
}

/** Actions a nurse reaches for during a resuscitation, matched from the scenario definition. */
const CODE_ACTION_PATTERN = /defib|shock|cardiovert|\bcpr\b|compress|epinephrine|amiodarone|bag-?mask|bag-?valve|resuscitat|\bpads?\b|\bacls\b|code team|airway/i;

function rhythmCodeState(rhythm: string): "shockable" | "nonshockable" | null {
  const value = rhythm.toLowerCase();
  if (/v-?fib|ventricular fib/.test(value)) return "shockable";
  if (/v-?tach|ventricular tach/.test(value)) return "shockable";
  if (/asystole|\bpea\b|pulseless electrical/.test(value)) return "nonshockable";
  return null;
}

function CodeBluePanel({ scenario, state, busy, onAct }: { scenario: ClinicalScenario; state: PatientState; busy: boolean; onAct: (actionId: string) => void }) {
  const codeState = rhythmCodeState(state.cardiacRhythm);
  const startRef = useRef<number | null>(null);
  if (codeState === null) {
    startRef.current = null;
    return null;
  }
  if (startRef.current === null) startRef.current = state.virtualMinute;
  const elapsed = Math.max(0, state.virtualMinute - startRef.current);
  const codeActions = scenario.actions
    .filter((action) => (action.category === "intervention" || action.category === "medication" || action.category === "safety" || action.category === "communication") && CODE_ACTION_PATTERN.test(`${action.label} ${action.description}`))
    .slice(0, 6);
  return (
    <section className={styles.codePanel} role="alert" data-code={codeState} data-testid="code-blue-panel">
      <header>
        <strong><Siren size={17} aria-hidden="true" /> CODE — {state.cardiacRhythm}</strong>
        <span>{elapsed} min into the arrest</span>
      </header>
      <p>{codeState === "shockable"
        ? "Shockable rhythm: start compressions, apply pads, and defibrillate without delay. Resume CPR immediately after each shock."
        : "Non-shockable rhythm: high-quality CPR, epinephrine every 3-5 minutes, and work the reversible causes (Hs and Ts)."}</p>
      {codeActions.length ? <div className={styles.codeActions}>
        {codeActions.map((action) => {
          const done = state.completedActionIds.includes(action.id);
          return <button key={action.id} type="button" disabled={busy || (done && !action.repeatable)} data-completed={done} onClick={() => onAct(action.id)}>
            {done ? <Check size={14} aria-hidden="true" /> : <Zap size={14} aria-hidden="true" />} {action.label}
          </button>;
        })}
      </div> : null}
    </section>
  );
}

type PatientIdentity = { name: string; room: string; allergies: string[] };

function ActionControl({
  action,
  state,
  patient,
  selected,
  onSelection,
  onPerform,
  disabled,
}: {
  action: ScenarioAction;
  state: PatientState;
  patient: PatientIdentity;
  selected: string[];
  onSelection: (ids: string[]) => void;
  onPerform: () => void;
  disabled: boolean;
}) {
  const completed = state.completedActionIds.includes(action.id);
  const elements = action.communication?.elements ?? action.documentation?.fields ?? [];
  const toggle = (id: string) => onSelection(selected.includes(id) ? selected.filter((item) => item !== id) : [...selected, id]);

  // Medication safety: the MAR order must be pulled from the Pyxis and verified
  // against the rights of administration before the administer control unlocks.
  const [pyxisPulled, setPyxisPulled] = useState(false);
  const [verifiedRights, setVerifiedRights] = useState<string[]>([]);
  const rights = action.medication ? [
    { id: "patient", label: `Right patient — ${patient.name}, Room ${patient.room}` },
    { id: "drug", label: `Right drug — ${action.medication.genericName}${action.medication.brandName ? ` (${action.medication.brandName})` : ""}` },
    { id: "dose", label: `Right dose — ${action.medication.orderedDose}` },
    { id: "route", label: `Right route — ${action.medication.route}` },
    { id: "time", label: `Right time — ${action.medication.frequency}` },
    { id: "allergy", label: `Allergies reviewed — ${patient.allergies.join(", ") || "none documented"}` },
    ...(action.medication.independentDoubleCheck ? [{ id: "double-check", label: "Independent double-check completed with a second nurse" }] : []),
  ] : [];
  const rightsVerified = rights.every((right) => verifiedRights.includes(right.id));
  const medicationGateOpen = !action.medication || completed || (pyxisPulled && rightsVerified);
  const toggleRight = (id: string) => setVerifiedRights((current) => current.includes(id) ? current.filter((item) => item !== id) : [...current, id]);
  return (
    <article className={styles.actionRow} data-completed={completed}>
      <div className={styles.actionHeading}>
        <div>
          <h3>{action.label}</h3>
          <p>{action.description}</p>
        </div>
        {completed ? <span className={styles.completedMark}><Check size={14} aria-hidden="true" /> Performed</span> : null}
      </div>
      {action.medication ? (
        <div className={styles.medicationSheet}>
          <div><span>Medication</span><strong>{action.medication.genericName}{action.medication.brandName ? ` (${action.medication.brandName})` : ""}</strong></div>
          <div><span>Order</span><strong>{action.medication.orderedDose} {action.medication.route} / {action.medication.frequency}</strong></div>
          <div><span>Available</span><strong>{action.medication.availableConcentration ?? "Patient-specific supplied dose"}</strong></div>
          <div><span>Indication</span><strong>{action.medication.indication}</strong></div>
          <div><span>Required assessment</span><strong>{action.medication.requiredAssessment.join(", ") || "Per order and policy"}</strong></div>
          <div><span>Hold parameters</span><strong>{action.medication.holdParameters.join(", ") || "None scenario-specific"}</strong></div>
          <div><span>Required labs</span><strong>{action.medication.requiredLabs.join(", ") || "None scenario-specific"}</strong></div>
          <div><span>Compatibility</span><strong>{action.medication.compatibility.join(", ") || "Verify per active policy"}</strong></div>
          <div><span>Expected response</span><strong>{action.medication.expectedEffect ?? `Reassess after onset at approximately ${action.medication.onsetMinutes} minutes`}</strong></div>
          <div><span>Adverse effects</span><strong>{action.medication.adverseEffects.join(", ") || "Monitor patient-specific response"}</strong></div>
          {action.medication.highAlert ? <em><AlertTriangle size={14} aria-hidden="true" /> High-alert workflow</em> : null}
          {action.medication.independentDoubleCheck ? <em><ShieldAlert size={14} aria-hidden="true" /> Independent double-check required</em> : null}
        </div>
      ) : null}
      {action.medication && !completed ? (
        <div className={styles.pyxisGate} data-pulled={pyxisPulled}>
          <header>
            <span><Lock size={14} aria-hidden="true" /> Automated dispensing cabinet</span>
            {pyxisPulled
              ? <em><Check size={13} aria-hidden="true" /> Dispensed to {patient.name}</em>
              : <button type="button" disabled={disabled} onClick={() => setPyxisPulled(true)}>Pull medication</button>}
          </header>
          {pyxisPulled ? (
            <fieldset>
              <legend>Verify against the MAR before administering</legend>
              {rights.map((right) => <label key={right.id}>
                <input type="checkbox" checked={verifiedRights.includes(right.id)} onChange={() => toggleRight(right.id)} />
                <span>{right.label}</span>
              </label>)}
            </fieldset>
          ) : <p>Pull the medication from the cabinet, then verify each right of administration against the MAR.</p>}
        </div>
      ) : null}
      {elements.length ? (
        <fieldset className={styles.structuredFields}>
          <legend>{action.communication?.prompt ?? action.documentation?.prompt}</legend>
          {elements.map((element) => <label key={element.id}>
            <input type="checkbox" checked={selected.includes(element.id)} onChange={() => toggle(element.id)} />
            <span>{element.label}</span>
          </label>)}
        </fieldset>
      ) : null}
      <div className={styles.actionFooter}>
        {action.safetyChecks.length ? <span><ShieldAlert size={14} aria-hidden="true" /> Requires {action.safetyChecks.length} safety check{action.safetyChecks.length === 1 ? "" : "s"}</span> : <span />}
        <button type="button" onClick={onPerform} disabled={disabled || (completed && !action.repeatable) || !medicationGateOpen} title={medicationGateOpen ? undefined : "Pull the medication and verify every right of administration first"}>
          {completed && !action.repeatable ? <Check size={16} aria-hidden="true" /> : <Play size={16} aria-hidden="true" />}
          {completed && !action.repeatable ? "Completed" : action.medication ? "Administer" : action.category === "communication" ? "Send communication" : action.category === "documentation" ? "Submit documentation" : "Perform action"}
        </button>
      </div>
    </article>
  );
}

export default function SimulationWorkspace({ scenario, attemptId }: { scenario: ClinicalScenario; attemptId: string }) {
  const router = useRouter();
  const [state, setState] = useState<PatientState | null>(null);
  const [debrief, setDebrief] = useState<Debrief | null>(null);
  const [attemptMeta, setAttemptMeta] = useState<AttemptMeta | null>(null);
  const [developerInfo, setDeveloperInfo] = useState<DeveloperScenarioInfo | null>(null);
  const [developerToolsEnabled, setDeveloperToolsEnabled] = useState(false);
  const [visualOverrides, setVisualOverrides] = useState<VisualDebugOverrides>({});
  const [scenePerformance, setScenePerformance] = useState<ScenePerformanceSample | null>(null);
  const [sceneQuality, setSceneQuality] = useState<SceneQuality>("full");
  const [activeTab, setActiveTab] = useState<TabId>("patient");
  const [station, setStation] = useState<StationId | null>(null);
  /** Virtual minute each tab was last opened — drives "new result" badges. */
  const [tabSeenAt, setTabSeenAt] = useState<Partial<Record<TabId, number>>>({});
  const [selections, setSelections] = useState<Record<string, string[]>>({});
  const [speed, setSpeed] = useState<1 | 5>(1);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const workingRef = useRef(false);
  const debriefTracked = useRef(false);

  // Immersive mode: hide site chrome while a simulation is running so the room
  // fills the viewport. Reverted on unmount so navigating away restores the site.
  useEffect(() => {
    document.body.setAttribute("data-sim-immersive", "true");
    return () => document.body.removeAttribute("data-sim-immersive");
  }, []);

  useEffect(() => {
    const connection = navigator as Navigator & { connection?: { saveData?: boolean } };
    const constrained = (navigator.hardwareConcurrency ?? 8) <= 4 || Boolean(connection.connection?.saveData) || window.matchMedia("(max-width: 520px)").matches;
    setSceneQuality(constrained ? "reduced" : "full");
  }, []);

  useEffect(() => {
    let active = true;
    fetch(`/api/clinical-simulation/attempts/${encodeURIComponent(attemptId)}`, { cache: "no-store" })
      .then(async (response) => {
        const body = await response.json();
        if (!response.ok) throw new Error(errorMessage(body, "The simulation could not be loaded."));
        if (!active) return;
        setState(body.data.attempt.state);
        setAttemptMeta(body.data.attempt);
        setDebrief(body.data.debrief);
        setDeveloperToolsEnabled(Boolean(body.data.developerToolsEnabled));
        setDeveloperInfo(body.data.developer ?? null);
        if (body.data.attempt.virtualMinute > 0) trackEvent("simulation_resumed", { scenarioId: scenario.id, unit: scenario.unit });
      })
      .catch((loadError: Error) => active && setError(loadError.message))
      .finally(() => active && setLoading(false));
    return () => { active = false; };
  }, [attemptId, scenario.id, scenario.unit]);

  const perform = useCallback(async (operation: Operation) => {
    if (workingRef.current) return;
    workingRef.current = true;
    setSaving(true);
    setError(null);
    try {
      const response = await fetch(`/api/clinical-simulation/attempts/${encodeURIComponent(attemptId)}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(operation),
      });
      const body = await response.json();
      if (!response.ok) throw new Error(errorMessage(body, "The clinical action could not be saved."));
      if (body.data.state) setState(body.data.state);
      if (body.data.attempt) setAttemptMeta(body.data.attempt);
      if (body.data.debrief) {
        setDebrief(body.data.debrief);
      }
      if (operation.operation === "act" && body.data.entry) {
        if (["unsafe", "critical_error"].includes(body.data.entry.classification)) {
          trackEvent("simulation_unsafe_action_attempted", { scenarioId: scenario.id, unit: scenario.unit, actionId: operation.actionId });
        }
        if (body.data.entry.classification === "essential") {
          trackEvent("simulation_critical_action_completed", { scenarioId: scenario.id, unit: scenario.unit, actionId: operation.actionId });
        }
      }
      if (operation.operation === "complete") trackEvent("simulation_completed", { scenarioId: scenario.id, unit: scenario.unit, mode: state?.mode ?? "guided" });
    } catch (actionError) {
      setError(actionError instanceof Error ? actionError.message : "The clinical action could not be saved.");
    } finally {
      workingRef.current = false;
      setSaving(false);
    }
  }, [attemptId, scenario.id, scenario.unit, state?.mode]);

  useEffect(() => {
    if (!state || state.clockPaused || state.status !== "in_progress") return;
    const timer = window.setInterval(() => void perform({ operation: "advance", minutes: 1 }), speed === 1 ? 15_000 : 3_000);
    return () => window.clearInterval(timer);
  }, [perform, speed, state]);

  useEffect(() => {
    if (!state || state.status !== "in_progress") return;
    const warn = (event: BeforeUnloadEvent) => { event.preventDefault(); };
    window.addEventListener("beforeunload", warn);
    return () => window.removeEventListener("beforeunload", warn);
  }, [state]);

  useEffect(() => {
    if (!debrief || debriefTracked.current) return;
    debriefTracked.current = true;
    trackEvent("simulation_debrief_viewed", { scenarioId: scenario.id, unit: scenario.unit });
    void perform({ operation: "debrief_viewed" });
  }, [debrief, perform, scenario.id, scenario.unit]);

  // Results that landed after the student last opened that tab.
  const newResultCounts = useMemo(() => {
    const minute = state?.virtualMinute ?? 0;
    const since = (tab: TabId) => tabSeenAt[tab] ?? -1;
    return {
      labs: scenario.chart.labs.filter((lab) => lab.availableAtMinute > 0 && lab.availableAtMinute <= minute && lab.availableAtMinute > since("labs")).length,
      diagnostics: scenario.chart.diagnostics.filter((item) => item.availableAtMinute > 0 && item.availableAtMinute <= minute && item.availableAtMinute > since("diagnostics")).length,
    } as Partial<Record<TabId, number>>;
  }, [scenario.chart.diagnostics, scenario.chart.labs, state?.virtualMinute, tabSeenAt]);

  useEffect(() => {
    if (!state) return;
    setTabSeenAt((current) => (current[activeTab] === state.virtualMinute ? current : { ...current, [activeTab]: state.virtualMinute }));
  }, [activeTab, state]);

  const actionsByCategory = useMemo(() => {
    const map = new Map<ScenarioAction["category"], ScenarioAction[]>();
    for (const action of scenario.actions) map.set(action.category, [...(map.get(action.category) ?? []), action]);
    return map;
  }, [scenario.actions]);

  async function restartAttempt(seed?: number) {
    if (!state) return;
    setSaving(true);
    setError(null);
    try {
      const abandonResponse = await fetch(`/api/clinical-simulation/attempts/${encodeURIComponent(attemptId)}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ operation: "abandon" }),
      });
      const abandonBody = await abandonResponse.json();
      if (!abandonResponse.ok) throw new Error(errorMessage(abandonBody, "The current attempt could not be closed before restart."));
      const response = await fetch("/api/clinical-simulation/attempts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ scenarioSlug: scenario.slug, mode: state.mode, ...(seed ? { seed } : {}) }),
      });
      const body = await response.json();
      if (!response.ok) throw new Error(errorMessage(body, "A new simulation attempt could not be created."));
      router.push(`/clinical-simulation/${scenario.slug}/run?attempt=${body.data.id}`);
    } catch (restartError) {
      setError(restartError instanceof Error ? restartError.message : "A new simulation attempt could not be created.");
    } finally {
      setSaving(false);
    }
  }

  async function abandonAttempt() {
    if (!window.confirm("Abandon this attempt? Its history will remain available, but it cannot be resumed.")) return;
    await perform({ operation: "abandon" });
    router.push("/clinical-simulation");
  }

  const patientVisualState = useMemo(
    () => state ? derivePatientVisualState(scenario, state, developerToolsEnabled ? visualOverrides : undefined, sceneQuality) : null,
    [developerToolsEnabled, scenario, sceneQuality, state, visualOverrides],
  );
  const updateScenePerformance = useCallback((sample: ScenePerformanceSample) => setScenePerformance(sample), []);
  const photoPatient = useMemo(() => getPhotoPatient(scenario.slug), [scenario.slug]);

  if (loading) return <main className={styles.workspaceLoading}><Activity className={styles.spin} aria-hidden="true" /><span>Loading patient state</span></main>;
  if (!state || !patientVisualState) return <main className={styles.workspaceError}><AlertTriangle aria-hidden="true" /><h1>Simulation unavailable</h1><p>{error}</p><Link href="/clinical-simulation">Return to catalog</Link></main>;
  if (debrief) return <SimulationDebrief scenario={scenario} debrief={debrief} attemptId={attemptId} grade={gradeBestPracticeRoute(scenario, state)} traceExportEnabled={developerToolsEnabled} />;

  const simulationState = state;
  const canComplete = canCompleteSimulation(scenario, state);
  const visibleFindings = scenario.assessments
    .filter((assessment) => state.revealedFindingIds.includes(assessment.id))
    .map((assessment) => ({ ...assessment, record: state.assessmentRecords.find((record) => record.assessmentId === assessment.id) }));
  const latestNotices = state.notices.slice(-4).reverse();

  function renderActions(actions: ScenarioAction[] | undefined) {
    if (!actions?.length) return <p className={styles.emptyState}>No actions are available in this workspace for the current scenario.</p>;
    return <div className={styles.actionList}>{actions.map((action) => <ActionControl
      key={action.id}
      action={action}
      state={simulationState}
      patient={{ name: scenario.patient.name, room: scenario.patient.room, allergies: scenario.patient.allergies }}
      selected={selections[action.id] ?? []}
      onSelection={(ids) => setSelections((current) => ({ ...current, [action.id]: ids }))}
      onPerform={() => void perform({ operation: "act", actionId: action.id, selectedElements: selections[action.id] ?? [] })}
      disabled={saving}
    />)}</div>;
  }

  return (
    <main className={styles.workspace}>
      <header className={styles.patientHeader}>
        <div className={styles.patientCompact}>
          <div aria-hidden="true">{scenario.patient.name.split(" ").map((part) => part[0]).join("")}</div>
          <span><strong>{scenario.patient.name}</strong><small>{scenario.patient.age} years / {scenario.patient.sex} / Room {scenario.patient.room}</small></span>
        </div>
        <div className={styles.headerVitals} aria-label="Current vital signs">
          {[
            { key: "HR", value: Math.round(state.vitals.heartRate), unit: "bpm", bad: state.vitals.heartRate < 50 || state.vitals.heartRate > 120 },
            { key: "BP", value: `${Math.round(state.vitals.systolic)}/${Math.round(state.vitals.diastolic)}`, unit: `MAP ${Math.round(state.vitals.map)}`, bad: state.vitals.map < 65 },
            { key: "SpO₂", value: Math.round(state.vitals.spo2), unit: "%", bad: state.vitals.spo2 < 92 },
            { key: "RR", value: Math.round(state.vitals.respiratoryRate), unit: "/min", bad: state.vitals.respiratoryRate < 10 || state.vitals.respiratoryRate > 24 },
            { key: "Temp", value: state.vitals.temperatureC.toFixed(1), unit: "°C", bad: state.vitals.temperatureC >= 38.3 },
          ].map((v) => (
            <div key={v.key} data-bad={v.bad}>
              <span>{v.key}</span>
              <strong>{v.value}</strong>
              <small>{v.unit}</small>
            </div>
          ))}
          <div className={styles.headerFlags}>
            {scenario.patient.allergies.length ? <em data-kind="allergy" title={`Allergies: ${scenario.patient.allergies.join(", ")}`}>⚠ {scenario.patient.allergies[0]}</em> : <em data-kind="ok">No known allergies</em>}
            <em data-kind="code">{scenario.patient.codeStatus}</em>
            {/^(?!none)/i.test(scenario.patient.isolation) ? <em data-kind="iso" title={scenario.patient.isolation}>{scenario.patient.isolation.split(" ").slice(0, 2).join(" ")}</em> : null}
          </div>
        </div>
        <div className={styles.clockControls}>
          <output aria-label={`Simulation time ${formatClock(state.virtualMinute)}`}>{formatClock(state.virtualMinute)}</output>
          <button type="button" disabled={saving} title={state.clockPaused ? "Resume clock" : "Pause clock"} aria-label={state.clockPaused ? "Resume simulation clock" : "Pause simulation clock"} onClick={() => void perform({ operation: "set_paused", paused: !state.clockPaused })}>{state.clockPaused ? <Play aria-hidden="true" /> : <Pause aria-hidden="true" />}</button>
          <div className={styles.speedControl} aria-label="Clock speed"><button type="button" data-active={speed === 1} onClick={() => setSpeed(1)}>1x</button><button type="button" data-active={speed === 5} onClick={() => setSpeed(5)}>5x</button></div>
          <div className={styles.manualAdvance} aria-label="Advance simulation time">
            <button type="button" disabled={saving} onClick={() => void perform({ operation: "advance", minutes: 1 })}>+1m</button>
            <button type="button" disabled={saving} onClick={() => void perform({ operation: "advance", minutes: 5 })}>+5m</button>
            <button type="button" disabled={saving} onClick={() => void perform({ operation: "advance_next" })}>Next event</button>
          </div>
          <Link href="/clinical-simulation" title="Save and exit"><Save size={17} aria-hidden="true" /> Save & exit</Link>
        </div>
      </header>

      <section className={styles.clinicalView} data-photo={Boolean(photoPatient)}>
        {photoPatient ? (
          <PatientPhotoScene scenario={scenario} state={state} visual={patientVisualState} config={photoPatient} onOpenAssessment={() => setStation("assessment")} onPerformAction={(actionId) => void perform({ operation: "act", actionId, selectedElements: selections[actionId] ?? [] })} onOpenTab={(tab) => setStation(tab === "chart" || tab === "mar" ? "computer" : tab === "assessment" ? "assessment" : "interventions")} busy={saving} />
        ) : (
          <>
            <PatientScene scenario={scenario} state={state} visual={patientVisualState} onOpenAssessment={() => setStation("assessment")} onPerformAction={(actionId) => void perform({ operation: "act", actionId, selectedElements: selections[actionId] ?? [] })} busy={saving} onPerformanceSample={developerToolsEnabled ? updateScenePerformance : undefined} />
            <BedsideMonitor state={state} />
          </>
        )}
        <SimEventFeed scenario={scenario} state={state} busy={saving} onRewind={(keepActions) => void perform({ operation: "rewind", keepActions })} />
      </section>

      {error ? <div className={styles.workspaceAlert} role="alert"><AlertTriangle size={17} aria-hidden="true" /> {error}</div> : null}

      <CodeBluePanel scenario={scenario} state={simulationState} busy={saving} onAct={(actionId) => void perform({ operation: "act", actionId, selectedElements: selections[actionId] ?? [] })} />


      {/* ── Four bedside actions. Everything else lives inside a station. ── */}
      <nav className={styles.actionBar} aria-label="Bedside actions">
        {STATIONS.map((item) => {
          const Icon = item.icon;
          const badge = item.id === "computer" ? (newResultCounts.labs ?? 0) + (newResultCounts.diagnostics ?? 0) : 0;
          return (
            <button key={item.id} type="button" data-active={station === item.id} onClick={() => setStation(item.id)} aria-haspopup="dialog">
              <Icon size={19} aria-hidden="true" />
              <span>{item.label}</span>
              <small>{item.hint}</small>
              {badge > 0 ? <em className={styles.actionBadge} aria-label={`${badge} new results`}>{badge}</em> : null}
            </button>
          );
        })}
      </nav>

      <DeviceStation open={station === "assessment"} title="Patient assessment" subtitle="Bedside" onClose={() => setStation(null)}>
        <AssessmentStation scenario={scenario} state={simulationState} busy={saving} onPerform={(actionId) => void perform({ operation: "act", actionId, selectedElements: selections[actionId] ?? [] })} />
      </DeviceStation>

      <DeviceStation open={station === "computer"} title="Workstation — patient chart" subtitle="Computer" tone="screen" onClose={() => setStation(null)}>
        <ChartEhr scenario={scenario} state={state} />
        <div className={styles.stationSection}>
          <h3><Pill size={15} aria-hidden="true" /> Medication administration record</h3>
          <p className={styles.stationHint}>Pull from the cabinet and verify every right before administering.</p>
          {renderActions(actionsByCategory.get("medication"))}
        </div>
        <div className={styles.stationSection}>
          <h3><ClipboardCheck size={15} aria-hidden="true" /> Documentation</h3>
          {renderActions(actionsByCategory.get("documentation"))}
        </div>
      </DeviceStation>

      <DeviceStation open={station === "phone"} title="Care team" subtitle="Phone" tone="phone" onClose={() => setStation(null)}>
        <p className={styles.stationHint}>Report what you have actually assessed. The response depends on what you include and how urgent the patient truly is.</p>
        {renderActions(actionsByCategory.get("communication"))}
      </DeviceStation>

      <DeviceStation open={station === "interventions"} title="Interventions" subtitle="Bedside care" onClose={() => setStation(null)}>
        <p className={styles.stationHint}>Actions are judged on indication, timing, sequence, and patient-specific safety.</p>
        {renderActions([...(actionsByCategory.get("intervention") ?? []), ...(actionsByCategory.get("safety") ?? [])])}
      </DeviceStation>


      {developerToolsEnabled && developerInfo && attemptMeta ? <SimulationDeveloperPanel
        scenario={scenario}
        attemptId={attemptId}
        seed={attemptMeta.seed}
        state={state}
        info={developerInfo}
        busy={saving}
        onPause={async (paused) => { await perform({ operation: "set_paused", paused }); }}
        onAdvance={async (minutes) => { await perform({ operation: "advance", minutes }); }}
        onAdvanceNext={async () => { await perform({ operation: "advance_next" }); }}
        onReset={async (seed) => { await perform({ operation: "reset", ...(seed ? { seed } : {}) }); setSelections({}); }}
        onRestart={restartAttempt}
        onTriggerEvent={async (eventId) => { await perform({ operation: "trigger_event", eventId }); }}
        visualState={patientVisualState}
        visualOverrides={visualOverrides}
        scenePerformance={scenePerformance}
        onVisualOverrides={setVisualOverrides}
      /> : null}

      <footer className={styles.workspaceFooter}>
        <div><span>{state.actionLog.length} actions recorded</span><span>{state.criticalErrors.length} critical errors</span><span>{state.clockPaused ? "Clock paused" : `${speed}x clock active`}</span>{saving ? <span>Saving...</span> : null}</div>
        <button type="button" disabled={!canComplete || saving} onClick={() => void perform({ operation: "complete" })}><ClipboardCheck size={17} aria-hidden="true" /> Complete and debrief</button>
        <button className={styles.abandonAction} type="button" disabled={saving} onClick={() => void abandonAttempt()}><LogOut size={17} aria-hidden="true" /> Abandon</button>
        <Link href="/clinical-simulation"><LogOut size={17} aria-hidden="true" /> Save & exit</Link>
      </footer>
    </main>
  );
}
