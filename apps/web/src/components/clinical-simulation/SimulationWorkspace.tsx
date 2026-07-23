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
import PatientScene, { type ScenePerformanceSample } from "@/components/clinical-simulation/scene/PatientScene";
import PatientPhotoScene, { getPhotoPatient } from "@/components/clinical-simulation/scene/PatientPhotoScene";
import SimulationDeveloperPanel, { type DeveloperScenarioInfo } from "@/components/clinical-simulation/SimulationDeveloperPanel";
import SimulationDebrief from "@/components/clinical-simulation/SimulationDebrief";
import { canCompleteSimulation, type PatientState, type SimulationDebrief as Debrief } from "@/lib/clinical-simulation/engine";
import type { ClinicalScenario, ScenarioAction } from "@/lib/clinical-simulation/schema";
import { derivePatientVisualState, type SceneQuality, type VisualDebugOverrides } from "@/lib/clinical-simulation/visual-state";
import { trackEvent } from "@/lib/analytics";
import styles from "./clinical-simulation.module.css";

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
  | { operation: "trigger_event"; eventId: string };

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
  /** Virtual minute each tab was last opened — drives "new result" badges. */
  const [tabSeenAt, setTabSeenAt] = useState<Partial<Record<TabId, number>>>({});
  const [selections, setSelections] = useState<Record<string, string[]>>({});
  const [speed, setSpeed] = useState<1 | 5>(1);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const workingRef = useRef(false);
  const debriefTracked = useRef(false);

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
  if (debrief) return <SimulationDebrief scenario={scenario} debrief={debrief} attemptId={attemptId} traceExportEnabled={developerToolsEnabled} />;

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
        <dl>
          <div><dt>Allergies</dt><dd>{scenario.patient.allergies.join(", ")}</dd></div>
          <div><dt>Code</dt><dd>{scenario.patient.codeStatus}</dd></div>
          <div><dt>Isolation</dt><dd>{scenario.patient.isolation}</dd></div>
        </dl>
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
          <PatientPhotoScene scenario={scenario} state={state} visual={patientVisualState} config={photoPatient} onOpenAssessment={() => setActiveTab("assessment")} onPerformAction={(actionId) => void perform({ operation: "act", actionId, selectedElements: selections[actionId] ?? [] })} busy={saving} />
        ) : (
          <>
            <PatientScene scenario={scenario} state={state} visual={patientVisualState} onOpenAssessment={() => setActiveTab("assessment")} onPerformAction={(actionId) => void perform({ operation: "act", actionId, selectedElements: selections[actionId] ?? [] })} busy={saving} onPerformanceSample={developerToolsEnabled ? updateScenePerformance : undefined} />
            <BedsideMonitor state={state} />
          </>
        )}
        <aside className={styles.responseFeed} aria-live="polite">
          <header><Activity size={16} aria-hidden="true" /> Patient response</header>
          {latestNotices.map((notice) => <div key={notice.id} data-severity={notice.severity}><time>+{notice.virtualMinute}</time><p>{notice.message}</p></div>)}
          {state.mode === "guided" ? <p className={styles.guidedCue}>Guided cue: verify immediate threats, collect focused data, intervene, then reassess and communicate the trend.</p> : null}
        </aside>
      </section>

      {error ? <div className={styles.workspaceAlert} role="alert"><AlertTriangle size={17} aria-hidden="true" /> {error}</div> : null}

      <CodeBluePanel scenario={scenario} state={simulationState} busy={saving} onAct={(actionId) => void perform({ operation: "act", actionId, selectedElements: selections[actionId] ?? [] })} />


      <nav className={styles.workspaceTabs} role="tablist" aria-label="Clinical workspace">
        {tabGroups.map((group) => <div key={group.label} className={styles.tabGroup}>
          <span aria-hidden="true">{group.label}</span>
          <div>
            {group.ids.map((id) => {
              const tab = tabs.find((item) => item.id === id);
              if (!tab) return null;
              const Icon = tab.icon;
              const fresh = newResultCounts[tab.id] ?? 0;
              return <button key={tab.id} type="button" role="tab" aria-selected={activeTab === tab.id} data-active={activeTab === tab.id} onClick={() => setActiveTab(tab.id)}>
                <Icon size={16} aria-hidden="true" /> {tab.label}
                {fresh > 0 ? <em className={styles.tabBadge} aria-label={`${fresh} new result${fresh === 1 ? "" : "s"}`}>{fresh}</em> : null}
              </button>;
            })}
          </div>
        </div>)}
      </nav>

      <section className={styles.tabPanel} role="tabpanel">
        {activeTab === "patient" ? <div className={styles.patientOverview}>
          <section><h2>Current patient state</h2><dl>
            <div><dt>Neurologic</dt><dd>{state.levelOfConsciousness}; {state.orientation}</dd></div>
            <div><dt>Respiratory</dt><dd>{state.respiratoryEffort}; {state.breathSounds}</dd></div>
            <div><dt>Cardiovascular</dt><dd>{state.cardiacRhythm}; {state.perfusion}</dd></div>
            <div><dt>Output</dt><dd>{Math.round(state.urineOutputMlHr)} mL/hr urine; {Math.round(state.drainOutputMl)} mL drain output</dd></div>
            <div><dt>Pain</dt><dd>{state.vitals.pain}/10</dd></div>
            <div><dt>Safety</dt><dd>Fall {scenario.patient.risks.fall}; suicide {scenario.patient.risks.suicide}; elopement {scenario.patient.risks.elopement}</dd></div>
          </dl></section>
          <section><h2>Lines and devices</h2><ul>{Object.entries(state.devices).map(([device, detail]) => <li key={device}><strong>{device.replaceAll("_", " ")}</strong><span>{detail}</span></li>)}</ul></section>
        </div> : null}

        {activeTab === "assessment" ? <div className={styles.splitWorkspace}><section><h2>Focused assessments</h2>{renderActions(actionsByCategory.get("assessment"))}</section><aside><h2>Revealed findings</h2>{visibleFindings.length ? <ul>{visibleFindings.map((finding) => {
          const age = finding.record ? state.virtualMinute - finding.record.virtualMinute : 0;
          return <li key={finding.id} data-stale={age >= 5}><strong>{finding.label}</strong><span>{finding.finding}</span><small>Assessed at +{finding.record?.virtualMinute ?? 0} min{age >= 5 ? " / may no longer reflect the current patient state" : " / current"}</small></li>;
        })}</ul> : <p>Perform a relevant assessment to reveal patient-specific findings.</p>}</aside></div> : null}

        {activeTab === "chart" ? <div className={styles.chartGrid}>
          <section><h2>History</h2><dl><div><dt>Presenting problem</dt><dd>{scenario.patient.presentingProblem}</dd></div><div><dt>Medical history</dt><dd>{scenario.patient.history.join(", ")}</dd></div><div><dt>Surgical history</dt><dd>{scenario.patient.surgicalHistory.join(", ") || "None documented"}</dd></div><div><dt>Psychiatric history</dt><dd>{scenario.patient.psychiatricHistory.join(", ") || "None documented"}</dd></div><div><dt>Social history</dt><dd>{scenario.patient.socialHistory.join(", ") || "No additional history"}</dd></div></dl></section>
          <section><h2>Home medications</h2><ul>{scenario.chart.homeMedications.map((item) => <li key={item}>{item}</li>)}</ul><h2>Active medications</h2><ul>{scenario.chart.activeMedications.map((item) => <li key={item}>{item}</li>)}</ul></section>
          <section><h2>Lines, tubes and drains</h2><ul>{scenario.chart.linesDevices.map((item) => <li key={item}>{item}</li>)}</ul></section>
        </div> : null}

        {activeTab === "orders" ? <div className={styles.orderList}><section><h2>Active orders</h2>{scenario.chart.orders.map((order) => <div key={order}><Check size={15} aria-hidden="true" /><span>{order}</span></div>)}</section><section><h2>PRN orders</h2>{scenario.chart.prnOrders.map((order) => <div key={order}><ChevronRight size={15} aria-hidden="true" /><span>{order}</span></div>)}</section></div> : null}
        {activeTab === "mar" ? <><div className={styles.panelIntro}><h2>Medication administration record</h2><p>Review the scenario order, required assessment, laboratory data, hold parameters, and safety checks before administration.</p></div>{renderActions(actionsByCategory.get("medication"))}</> : null}
        {activeTab === "labs" ? <div className={styles.resultTable}><h2>Laboratory results</h2>{scenario.chart.labs.filter((lab) => lab.availableAtMinute <= state.virtualMinute).map((lab) => {
          const value = state.labs[lab.stateKey ?? lab.name] ?? lab.value;
          return <div key={lab.name} data-flag={lab.flag}><strong>{lab.name}</strong><span>{String(value)}{lab.unit ? ` ${lab.unit}` : ""}</span><em>{lab.flag}</em></div>;
        })}{scenario.chart.labs.some((lab) => lab.availableAtMinute > state.virtualMinute) ? <p>Additional ordered results remain pending.</p> : null}</div> : null}
        {activeTab === "diagnostics" ? <div className={styles.resultTable}><h2>Diagnostics</h2>{scenario.chart.diagnostics.filter((item) => item.availableAtMinute <= state.virtualMinute).map((item) => <div key={item.name}><strong>{item.name}</strong><span>{item.result}</span><em>available</em></div>)}{!scenario.chart.diagnostics.some((item) => item.availableAtMinute <= state.virtualMinute) ? <p>No diagnostic results are currently available.</p> : null}</div> : null}
        {activeTab === "interventions" ? <><div className={styles.panelIntro}><h2>Nursing interventions and safety</h2><p>Actions are evaluated by indication, timing, sequence, patient-specific safety, and response.</p></div>{renderActions([...(actionsByCategory.get("intervention") ?? []), ...(actionsByCategory.get("safety") ?? [])])}</> : null}
        {activeTab === "communication" ? <><div className={styles.panelIntro}><h2>Care-team communication</h2><p>Select the clinically relevant SBAR or escalation elements. Exact scripted wording is not required.</p></div>{renderActions(actionsByCategory.get("communication"))}</> : null}
        {activeTab === "documentation" ? <><div className={styles.panelIntro}><h2>Structured nursing documentation</h2><p>Record the assessment, intervention, response, notification, and safety elements required by this scenario.</p></div>{renderActions(actionsByCategory.get("documentation"))}</> : null}
        {activeTab === "timeline" ? <div className={styles.liveTimeline}><h2>Clinical timeline</h2>{state.actionLog.length ? <ol>{state.actionLog.map((entry) => <li key={entry.id} data-classification={entry.classification}><time>+{entry.virtualMinute} min</time><div><strong>{entry.label}</strong><span>{entry.classification.replaceAll("_", " ")}</span><p>{entry.feedback}</p></div></li>)}</ol> : <p>No clinical actions have been recorded.</p>}</div> : null}
      </section>

      <ClinicalImpactPanel scenario={scenario} state={simulationState} busy={saving} onAct={(actionId) => void perform({ operation: "act", actionId, selectedElements: selections[actionId] ?? [] })} />

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
