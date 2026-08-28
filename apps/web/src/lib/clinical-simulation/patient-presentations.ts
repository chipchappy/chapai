import type { PatientState } from "./engine";

export type PatientPresentationStage = 1 | 2 | 3 | 4 | 5;

type PresentationFamily = {
  patientName: string;
  stateLabels: readonly [string, string, string, string, string];
  sources: readonly [string, string, string, string, string];
};

const presentationFamilies: Record<string, PresentationFamily> = {
  "postoperative-deterioration": {
    patientName: "Maria Gonzalez",
    stateLabels: ["stable baseline", "diaphoretic and dyspneic", "lethargic", "altered and anxious", "obtunded"],
    sources: [
      "/clinical-simulation/patients/maria-gonzalez-stable-baseline.png",
      "/clinical-simulation/patients/maria-gonzalez-diaphoretic-dyspneic.png",
      "/clinical-simulation/patients/maria-gonzalez-lethargic.png",
      "/clinical-simulation/patients/maria-gonzalez-altered-anxious.png",
      "/clinical-simulation/patients/maria-gonzalez-obtunded.png",
    ],
  },
  "evolving-acute-coronary-syndrome": {
    patientName: "David Lee",
    stateLabels: ["stable baseline", "diaphoretic and febrile", "lethargic", "altered and agitated", "obtunded"],
    sources: [
      "/clinical-simulation/patients/david-lee-stable-baseline.png",
      "/clinical-simulation/patients/david-lee-diaphoretic-febrile.png",
      "/clinical-simulation/patients/david-lee-lethargic.png",
      "/clinical-simulation/patients/david-lee-altered-agitated.png",
      "/clinical-simulation/patients/david-lee-obtunded.png",
    ],
  },
  "acute-respiratory-deterioration": {
    patientName: "James Carter",
    stateLabels: ["stable baseline", "diaphoretic and distressed", "lethargic", "altered and confused", "obtunded"],
    sources: [
      "/clinical-simulation/patients/james-carter-stable-baseline.png",
      "/clinical-simulation/patients/james-carter-diaphoretic-distressed.png",
      "/clinical-simulation/patients/james-carter-lethargic.png",
      "/clinical-simulation/patients/james-carter-altered-confused.png",
      "/clinical-simulation/patients/james-carter-obtunded.png",
    ],
  },
  "septic-shock": {
    patientName: "Sarah Johnson",
    stateLabels: ["stable baseline", "diaphoretic and nauseated", "lethargic", "altered and confused", "obtunded"],
    sources: [
      "/clinical-simulation/patients/sarah-johnson-stable-baseline.png",
      "/clinical-simulation/patients/sarah-johnson-diaphoretic-nauseated.png",
      "/clinical-simulation/patients/sarah-johnson-lethargic.png",
      "/clinical-simulation/patients/sarah-johnson-altered-confused.png",
      "/clinical-simulation/patients/sarah-johnson-obtunded.png",
    ],
  },
  "sedation-airway-compromise": {
    patientName: "William Thompson",
    stateLabels: ["stable baseline", "pale and diaphoretic", "lethargic", "altered and agitated", "obtunded"],
    sources: [
      "/clinical-simulation/patients/william-thompson-stable-baseline.png",
      "/clinical-simulation/patients/william-thompson-pale-diaphoretic.png",
      "/clinical-simulation/patients/william-thompson-lethargic.png",
      "/clinical-simulation/patients/william-thompson-altered-agitated.png",
      "/clinical-simulation/patients/william-thompson-obtunded.png",
    ],
  },
};

export type PatientPresentation = {
  stage: PatientPresentationStage;
  src: string;
  alt: string;
};

export function derivePatientPresentationStage(state: PatientState): PatientPresentationStage {
  const consciousness = state.levelOfConsciousness.toLowerCase();
  const effort = state.respiratoryEffort.toLowerCase();
  const skin = state.skin.toLowerCase();
  const gcs = state.gcs ?? 15;

  if (
    gcs <= 8
    || state.vitals.respiratoryRate <= 2
    || /obtund|coma|responds only to painful|unresponsive$|no response/.test(consciousness)
    || /apne/.test(effort)
  ) return 5;

  if (state.agitation >= 7 || /confus|disorient|altered|agitat/.test(`${consciousness} ${state.behavior}`)) return 4;
  if (gcs <= 12 || /letharg|somnol|difficult to arouse|unresponsive to voice/.test(consciousness)) return 3;

  if (
    state.vitals.spo2 < 92
    || state.vitals.respiratoryRate > 26
    || state.vitals.temperatureC >= 38.3
    || state.vitals.pain >= 7
    || state.anxiety >= 7
    || /diaphor|pale|clammy/.test(skin)
    || /\b(?:labored|distressed?|accessory|shallow|snoring)\b/.test(effort)
  ) return 2;

  return 1;
}

export function getPatientPresentation(scenarioSlug: string, patientName: string, state: PatientState): PatientPresentation | null {
  const family = presentationFamilies[scenarioSlug];
  if (!family || family.patientName !== patientName) return null;
  const stage = derivePatientPresentationStage(state);
  return {
    stage,
    src: family.sources[stage - 1],
    alt: `${patientName}, ${family.stateLabels[stage - 1]}, at virtual minute ${state.virtualMinute}`,
  };
}
