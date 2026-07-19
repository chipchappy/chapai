"use client";

// DEV-ONLY visual harness for iterating on the clinical-simulation scene graphics
// without the DB-backed worker. Not linked anywhere; 404s in production.
import { useEffect, useMemo, useState } from "react";
import { notFound } from "next/navigation";
import BedsideMonitor from "@/components/clinical-simulation/BedsideMonitor";
import PatientScene from "@/components/clinical-simulation/scene/PatientScene";
import { createInitialPatientState, type PatientState } from "@/lib/clinical-simulation/engine";
import { clinicalScenarios } from "@/lib/clinical-simulation/scenarios";
import { derivePatientVisualState, type VisualDebugOverrides } from "@/lib/clinical-simulation/visual-state";

const presets: Array<{ id: string; label: string; overrides: VisualDebugOverrides; patch?: (s: PatientState) => PatientState }> = [
  { id: "baseline", label: "Baseline", overrides: {} },
  {
    id: "septic",
    label: "Septic / mottled",
    overrides: { mottling: 3, diaphoresis: 2, consciousness: "drowsy", respiratoryRate: 28, workOfBreathing: "moderate", oxygenDevice: "nasal-cannula", ivSites: "dual" },
    patch: (s) => ({ ...s, vitals: { ...s.vitals, heartRate: 122, systolic: 84, diastolic: 48, map: 60, spo2: 91, respiratoryRate: 28 }, perfusion: "Cool, mottled knees with delayed capillary refill" }),
  },
  {
    id: "obtunded",
    label: "Obtunded / crashing",
    overrides: { mottling: 4, diaphoresis: 3, consciousness: "unresponsive", respiratoryRate: 8, workOfBreathing: "exhaustion", oxygenDevice: "non-rebreather", ivSites: "central", pupils: "dilated" },
    patch: (s) => ({ ...s, vitals: { ...s.vitals, heartRate: 138, systolic: 62, diastolic: 36, map: 45, spo2: 82, respiratoryRate: 8 } }),
  },
  {
    id: "code",
    label: "Code / defib",
    overrides: { consciousness: "unresponsive", defibrillationPads: "anterior-lateral", ecgLeads: true, oxygenDevice: "bag-mask", ivSites: "central" },
    patch: (s) => ({ ...s, cardiacRhythm: "Ventricular fibrillation", vitals: { ...s.vitals, heartRate: 0, systolic: 0, diastolic: 0, map: 0, spo2: 0 } }),
  },
];

export default function SimScenePreview() {
  if (process.env.NODE_ENV === "production") notFound();
  const [scenarioIndex, setScenarioIndex] = useState(0);
  const [presetIndex, setPresetIndex] = useState(0);
  const scenario = clinicalScenarios[scenarioIndex] ?? clinicalScenarios[0];
  const preset = presets[presetIndex] ?? presets[0];

  // Local dev only: the root layout's client shell can leave the app-wide
  // loading fallback mounted over this route. Dismiss it so the harness is
  // reliably viewable.
  useEffect(() => {
    const reveal = () => {
      document.querySelectorAll("main").forEach((m) => {
        if (m.textContent?.includes("Preparing the Clarity")) (m as HTMLElement).style.display = "none";
      });
      let el: HTMLElement | null = document.querySelector('[data-testid="patient-scene"]');
      while (el && el !== document.body) {
        if (getComputedStyle(el).display === "none") el.style.display = "block";
        if (el.hidden) el.hidden = false;
        el = el.parentElement;
      }
    };
    reveal();
    const t = window.setTimeout(reveal, 400);
    return () => window.clearTimeout(t);
  }, []);

  const state = useMemo(() => {
    const initial = createInitialPatientState(scenario, 7, "guided");
    return preset.patch ? preset.patch(initial) : initial;
  }, [scenario, preset]);
  const visual = useMemo(() => derivePatientVisualState(scenario, state, preset.overrides, "full"), [scenario, state, preset]);

  return (
    <main style={{ padding: 20, display: "grid", gap: 16, fontFamily: "system-ui, sans-serif", background: "#eef1ee", minHeight: "100vh" }}>
      <div style={{ display: "flex", gap: 8, flexWrap: "wrap", alignItems: "center" }}>
        <strong style={{ marginRight: 8 }}>Scenario:</strong>
        {clinicalScenarios.map((s, i) => (
          <button key={s.slug} type="button" onClick={() => setScenarioIndex(i)} style={{ padding: "5px 10px", borderRadius: 8, border: "1px solid #99a", background: i === scenarioIndex ? "#334" : "#fff", color: i === scenarioIndex ? "#fff" : "#334", cursor: "pointer" }}>{s.title.slice(0, 34)}</button>
        ))}
      </div>
      <div style={{ display: "flex", gap: 8, flexWrap: "wrap", alignItems: "center" }}>
        <strong style={{ marginRight: 8 }}>State:</strong>
        {presets.map((p, i) => (
          <button key={p.id} type="button" onClick={() => setPresetIndex(i)} style={{ padding: "5px 10px", borderRadius: 8, border: "1px solid #99a", background: i === presetIndex ? "#7a3d2b" : "#fff", color: i === presetIndex ? "#fff" : "#334", cursor: "pointer" }}>{p.label}</button>
        ))}
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "minmax(0, 1fr) 340px", gap: 16, alignItems: "start" }}>
        <div style={{ borderRadius: 16, overflow: "hidden", boxShadow: "0 12px 40px rgba(0,0,0,0.18)" }}>
          <PatientScene scenario={scenario} state={state} visual={visual} onOpenAssessment={() => {}} />
        </div>
        <BedsideMonitor state={state} />
      </div>
    </main>
  );
}
