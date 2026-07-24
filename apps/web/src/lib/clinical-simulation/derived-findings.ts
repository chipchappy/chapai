import type { PatientState } from "@/lib/clinical-simulation/engine";

// ─────────────────────────────────────────────────────────────────────────────
// Derived physical-exam findings.
//
// Scenario authors write the *notable* findings. This fills in everything else a
// nurse would actually observe, computed from live state — so every system
// returns real data, and that data changes as the patient does. A student who
// auscultates the chest after a fluid bolus should hear something different than
// they did before it.
//
// These are OBSERVATIONS, never instructions: they describe the patient, they do
// not tell the student what to do about it.
// ─────────────────────────────────────────────────────────────────────────────

export type DerivedFinding = { label: string; value: string; abnormal: boolean };

function pulseCharacter(map: number, hr: number) {
  if (map < 55) return "thready and difficult to palpate";
  if (map < 65) return "weak but palpable";
  if (hr > 120) return "rapid and bounding";
  return "regular and equal bilaterally";
}

function capRefill(map: number, mottling: boolean) {
  if (map < 55 || mottling) return "greater than 4 seconds";
  if (map < 65) return "3 to 4 seconds";
  return "less than 3 seconds";
}

function breathPattern(rr: number, effort: string) {
  if (rr < 8) return "slow and shallow";
  if (rr > 30) return "rapid and shallow";
  if (/labor|accessory|distress/i.test(effort)) return "laboured with accessory-muscle use";
  return "regular and unlaboured";
}

export function derivedFindings(state: PatientState, systemId: string): DerivedFinding[] {
  const v = state.vitals;
  const mottled = /mottl/i.test(state.perfusion) || /mottl/i.test(state.skin);

  switch (systemId) {
    case "general":
      return [
        { label: "Appearance", value: `${state.levelOfConsciousness}; ${state.behavior}`, abnormal: !/alert|calm/i.test(state.levelOfConsciousness) },
        { label: "Position", value: `${state.position.replaceAll("-", " ")}, head of bed ${Math.round(state.headOfBedDegrees)}°`, abnormal: false },
        { label: "Distress", value: v.respiratoryRate > 28 || v.pain >= 7 ? "Visible distress" : "No acute distress", abnormal: v.respiratoryRate > 28 || v.pain >= 7 },
        { label: "Temperature", value: `${v.temperatureC.toFixed(1)} °C`, abnormal: v.temperatureC >= 38.3 || v.temperatureC <= 35.9 },
      ];

    case "airway":
      return [
        { label: "Patency", value: /unrespons|obtund/i.test(state.levelOfConsciousness) ? "Patent but not self-protected — no gag observed" : "Patent and self-maintained", abnormal: /unrespons|obtund/i.test(state.levelOfConsciousness) },
        { label: "Secretions", value: /secretion|sputum/i.test(state.breathSounds) ? "Audible secretions" : "No audible secretions", abnormal: /secretion|sputum/i.test(state.breathSounds) },
        { label: "Airway support", value: state.oxygenDevice === "room-air" ? "None in place" : `${state.oxygenDevice.replaceAll("-", " ")} at ${state.oxygenFlow}`, abnormal: false },
      ];

    case "respiratory":
      return [
        { label: "Rate", value: `${Math.round(v.respiratoryRate)} breaths/min`, abnormal: v.respiratoryRate < 10 || v.respiratoryRate > 24 },
        { label: "Pattern", value: breathPattern(v.respiratoryRate, state.respiratoryEffort), abnormal: !/regular and unlaboured/.test(breathPattern(v.respiratoryRate, state.respiratoryEffort)) },
        { label: "Breath sounds", value: state.breathSounds, abnormal: !/clear/i.test(state.breathSounds) },
        { label: "Oxygen saturation", value: `${Math.round(v.spo2)}% on ${state.oxygenDevice === "room-air" ? "room air" : `${state.oxygenDevice.replaceAll("-", " ")} ${state.oxygenFlow}`}`, abnormal: v.spo2 < 92 },
        { label: "Effort", value: state.respiratoryEffort, abnormal: /labor|accessory|distress|agonal/i.test(state.respiratoryEffort) },
      ];

    case "cardiovascular":
      return [
        { label: "Rhythm", value: state.cardiacRhythm, abnormal: !/sinus/i.test(state.cardiacRhythm) || v.heartRate > 100 },
        { label: "Heart rate", value: `${Math.round(v.heartRate)} bpm`, abnormal: v.heartRate < 50 || v.heartRate > 100 },
        { label: "Blood pressure", value: `${Math.round(v.systolic)}/${Math.round(v.diastolic)} (MAP ${Math.round(v.map)})`, abnormal: v.map < 65 || v.systolic > 180 },
        { label: "Peripheral pulses", value: pulseCharacter(v.map, v.heartRate), abnormal: v.map < 65 },
        { label: "Capillary refill", value: capRefill(v.map, mottled), abnormal: v.map < 65 || mottled },
        { label: "Perfusion", value: state.perfusion, abnormal: /cool|mottl|delay|poor/i.test(state.perfusion) },
      ];

    case "neuro":
      return [
        { label: "Level of consciousness", value: state.levelOfConsciousness, abnormal: !/alert/i.test(state.levelOfConsciousness) },
        { label: "Orientation", value: state.orientation, abnormal: !/x\s*4|person, place, time/i.test(state.orientation) },
        { label: "Pupils", value: state.pupils ?? "Not assessed", abnormal: Boolean(state.pupils && !/equal|reactive|perrl/i.test(state.pupils)) },
        ...(state.gcs != null ? [{ label: "GCS", value: String(state.gcs), abnormal: state.gcs < 15 }] : []),
        { label: "Focal deficit", value: state.neurologicDeficits, abnormal: !/no focal/i.test(state.neurologicDeficits) },
      ];

    case "abdomen":
      return [
        { label: "Abdomen", value: state.gastrointestinal, abnormal: !/no acute/i.test(state.gastrointestinal) },
        { label: "Nausea/vomiting", value: /nausea|vomit/i.test(state.gastrointestinal) ? "Present" : "Denies", abnormal: /nausea|vomit/i.test(state.gastrointestinal) },
      ];

    case "gu":
      return [
        { label: "Urine output", value: `${Math.round(state.urineOutputMlHr)} mL/hr`, abnormal: state.urineOutputMlHr < 30 },
        { label: "Fluid balance", value: `${state.fluidBalanceMl > 0 ? "+" : ""}${Math.round(state.fluidBalanceMl)} mL`, abnormal: Math.abs(state.fluidBalanceMl) > 2000 },
      ];

    case "skin":
      return [
        { label: "Skin", value: state.skin, abnormal: !/warm|dry|intact/i.test(state.skin) },
        { label: "Edema", value: state.edema, abnormal: !/no edema/i.test(state.edema) },
        ...(state.bleedingMl > 0 ? [{ label: "Bleeding", value: `${Math.round(state.bleedingMl)} mL documented`, abnormal: true }] : []),
        ...(state.drainOutputMl > 0 ? [{ label: "Drain output", value: `${Math.round(state.drainOutputMl)} mL`, abnormal: state.drainOutputMl > 100 }] : []),
      ];

    case "lines":
      return [
        { label: "IV access", value: state.ivPatency, abnormal: !/patent/i.test(state.ivPatency) },
        ...Object.entries(state.devices).map(([device, detail]) => ({
          label: device.replaceAll("_", " "),
          value: String(detail),
          abnormal: /infiltrat|occlud|leak|dislodg|not verified|pending/i.test(String(detail)),
        })),
        ...(Object.keys(state.infusionRates).length
          ? [{ label: "Infusions", value: Object.entries(state.infusionRates).map(([k, val]) => `${k}: ${val}`).join(" · "), abnormal: false }]
          : []),
      ];

    case "pain":
      return [
        { label: "Pain score", value: `${v.pain}/10`, abnormal: v.pain >= 4 },
        { label: "Anxiety", value: `${state.anxiety}/10`, abnormal: state.anxiety >= 6 },
        { label: "Agitation", value: `${state.agitation}/10`, abnormal: state.agitation >= 5 },
      ];

    case "safety":
      return [
        { label: "Head of bed", value: `${Math.round(state.headOfBedDegrees)}°`, abnormal: state.headOfBedDegrees < 30 && /aspiration|vent/i.test(JSON.stringify(state.devices)) },
        { label: "Active complications", value: state.activeComplications.length ? state.activeComplications.join(", ") : "None documented", abnormal: state.activeComplications.length > 0 },
        { label: "Time since reassessment", value: `${state.timeSinceLastReassessment} min`, abnormal: state.timeSinceLastReassessment > 15 },
      ];

    default:
      return [];
  }
}
