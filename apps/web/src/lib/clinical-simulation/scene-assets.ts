import type { PatientVisualState } from "./visual-state";
import { roomPresetIds, skinToneIds } from "./visual-state";
import { patientPositions } from "./schema";

export type SceneAssetCategory = "patient-base" | "room" | "bed" | "clothing" | "skin-overlay" | "oxygen" | "monitoring" | "vascular" | "drainage" | "emergency";

export type SceneAssetDefinition = {
  id: string;
  category: SceneAssetCategory;
  bodyRegion: string;
  compatiblePatientBases: readonly string[];
  compatiblePositions: readonly string[];
  compatibleDevices: readonly string[];
  layerOrder: number;
  anchors: readonly string[];
  mask: string | null;
  transformOrigin: string;
  requiredState: string;
  excludedStates: readonly string[];
  accessibilityDescription: string;
  source: { kind: "programmatic-svg"; creator: "Chapai Solutions LLC"; license: "original" };
  version: string;
};

const originalSource = { kind: "programmatic-svg", creator: "Chapai Solutions LLC", license: "original" } as const;
const allBases = ["slender", "average", "broad"] as const;

function asset(input: Omit<SceneAssetDefinition, "compatiblePatientBases" | "compatiblePositions" | "compatibleDevices" | "mask" | "transformOrigin" | "excludedStates" | "source" | "version"> & Partial<Pick<SceneAssetDefinition, "compatiblePatientBases" | "compatiblePositions" | "compatibleDevices" | "mask" | "transformOrigin" | "excludedStates">>): SceneAssetDefinition {
  return {
    compatiblePatientBases: allBases,
    compatiblePositions: patientPositions,
    compatibleDevices: [],
    mask: null,
    transformOrigin: "scene-anchor",
    excludedStates: [],
    source: originalSource,
    version: "1.0.0",
    ...input,
  };
}

const oxygenAssets = ["nasal-cannula", "high-flow-nasal-cannula", "simple-mask", "venturi-mask", "non-rebreather", "cpap", "bipap", "bag-mask", "tracheostomy-collar", "t-piece", "mechanical-ventilation"].map((device) => asset({
  id: `oxygen-${device}`,
  category: "oxygen",
  bodyRegion: device === "tracheostomy-collar" || device === "t-piece" ? "neck" : "face",
  compatibleDevices: [device],
  layerOrder: 74,
  anchors: device === "mechanical-ventilation" || device === "bag-mask" ? ["mouth"] : ["nose"],
  requiredState: `devices.oxygen=${device}`,
  accessibilityDescription: `${device.replaceAll("-", " ")} delivery interface`,
}));

export const sceneAssetRegistry: readonly SceneAssetDefinition[] = [
  ...roomPresetIds.map((room) => asset({ id: `room-${room}`, category: "room", bodyRegion: "environment", layerOrder: 1, anchors: [], requiredState: `roomPreset=${room}`, accessibilityDescription: `${room.replaceAll("-", " ")} room preset` })),
  asset({ id: "patient-bed-base", category: "patient-base", bodyRegion: "whole-body", layerOrder: 30, anchors: ["nose", "upperChest", "pelvis", "leftHand", "rightHand"], requiredState: "position.ambulatory=false", excludedStates: ["position.ambulatory=true"], accessibilityDescription: "Patient positioned in a hospital bed" }),
  asset({ id: "patient-ambulatory-base", category: "patient-base", bodyRegion: "whole-body", layerOrder: 30, anchors: ["nose", "upperChest", "pelvis", "leftFoot", "rightFoot"], requiredState: "position.ambulatory=true", excludedStates: ["position.ambulatory=false"], accessibilityDescription: "Ambulatory patient figure" }),
  asset({ id: "hospital-bed", category: "bed", bodyRegion: "environment", layerOrder: 20, anchors: ["bedRail"], requiredState: "position.ambulatory=false", excludedStates: ["position.ambulatory=true"], accessibilityDescription: "Adjustable hospital bed" }),
  asset({ id: "patient-clothing", category: "clothing", bodyRegion: "trunk", layerOrder: 42, anchors: ["upperChest", "abdomen", "pelvis"], requiredState: "profile.clothing", accessibilityDescription: "Unit-appropriate patient clothing" }),
  ...skinToneIds.map((tone) => asset({ id: `skin-${tone}`, category: "skin-overlay", bodyRegion: "visible-skin", layerOrder: 40, anchors: ["leftCheek", "rightCheek", "leftHand", "rightHand"], requiredState: `profile.skinTone=${tone}`, accessibilityDescription: `${tone} baseline skin palette` })),
  asset({ id: "skin-mottling", category: "skin-overlay", bodyRegion: "distal-extremities", layerOrder: 66, anchors: ["leftHand", "rightHand", "leftFoot", "rightFoot"], mask: "distal-extremities", requiredState: "skin.mottling>0", accessibilityDescription: "Regional distal mottling overlay" }),
  asset({ id: "skin-diaphoresis", category: "skin-overlay", bodyRegion: "face-hairline", layerOrder: 67, anchors: ["leftCheek", "rightCheek"], mask: "face-hairline", requiredState: "skin.diaphoresis>0", accessibilityDescription: "Forehead and hairline moisture overlay" }),
  ...oxygenAssets,
  asset({ id: "monitor-ecg-leads", category: "monitoring", bodyRegion: "chest", layerOrder: 72, anchors: ["monitor", "upperChest", "lowerChest"], requiredState: "devices.ecgLeads=true", accessibilityDescription: "Bedside monitor with connected ECG leads" }),
  asset({ id: "monitor-arterial-line", category: "monitoring", bodyRegion: "forearm", layerOrder: 73, anchors: ["monitor", "rightForearm"], requiredState: "devices.arterialLine=true", accessibilityDescription: "Connected invasive arterial pressure line" }),
  asset({ id: "vascular-iv-access", category: "vascular", bodyRegion: "extremity-or-neck", layerOrder: 75, anchors: ["leftForearm", "rightHand", "neck", "ivPole"], requiredState: "devices.ivSites.length>0", accessibilityDescription: "Intravenous access and connected tubing" }),
  asset({ id: "vascular-infusion-pumps", category: "vascular", bodyRegion: "environment", layerOrder: 76, anchors: ["ivPole", "infusionPump"], requiredState: "devices.pumps.length>0", accessibilityDescription: "Infusion pole and active pump channels" }),
  asset({ id: "drainage-urinary", category: "drainage", bodyRegion: "pelvis", layerOrder: 75, anchors: ["pelvis", "urinaryBag"], requiredState: "devices.urinaryDrainage.visible=true", accessibilityDescription: "Urinary catheter and collection system" }),
  asset({ id: "drainage-surgical", category: "drainage", bodyRegion: "abdomen-or-chest", layerOrder: 75, anchors: ["abdomen", "lowerChest", "drainSystem"], requiredState: "devices.drain.visible=true", accessibilityDescription: "Surgical or pleural drainage system" }),
  asset({ id: "emergency-ventilator", category: "emergency", bodyRegion: "airway", layerOrder: 73, anchors: ["mouth", "ventilator"], requiredState: "devices.mechanicalVentilation=true", accessibilityDescription: "Mechanical ventilator and connected airway circuit" }),
  asset({ id: "emergency-defibrillator", category: "emergency", bodyRegion: "environment", layerOrder: 73, anchors: ["defibrillator"], requiredState: "devices.defibrillatorVisible=true", accessibilityDescription: "Emergency defibrillator monitor" }),
  asset({ id: "emergency-defibrillation-pads", category: "emergency", bodyRegion: "chest", layerOrder: 78, anchors: ["upperChest", "lowerChest", "defibrillator"], requiredState: "devices.defibrillationPads!=none", accessibilityDescription: "Applied defibrillation pads and cable" }),
];

export function getActiveSceneAssetIds(visual: PatientVisualState) {
  const ids = [
    `room-${visual.roomPreset}`,
    visual.position.ambulatory ? "patient-ambulatory-base" : "patient-bed-base",
    ...(visual.position.ambulatory ? [] : ["hospital-bed"]),
    "patient-clothing",
    `skin-${visual.profile.skinTone}`,
  ];
  if (visual.skin.mottling > 0) ids.push("skin-mottling");
  if (visual.skin.diaphoresis > 0) ids.push("skin-diaphoresis");
  if (visual.devices.oxygen !== "room-air") ids.push(`oxygen-${visual.devices.oxygen}`);
  if (visual.devices.ecgLeads) ids.push("monitor-ecg-leads");
  if (visual.devices.arterialLine) ids.push("monitor-arterial-line");
  if (visual.devices.ivSites.length > 0) ids.push("vascular-iv-access");
  if (visual.devices.pumps.length > 0) ids.push("vascular-infusion-pumps");
  if (visual.devices.urinaryDrainage.visible) ids.push("drainage-urinary");
  if (visual.devices.drain.visible) ids.push("drainage-surgical");
  if (visual.devices.mechanicalVentilation) ids.push("emergency-ventilator");
  if (visual.devices.defibrillatorVisible) ids.push("emergency-defibrillator");
  if (visual.devices.defibrillationPads !== "none") ids.push("emergency-defibrillation-pads");
  return ids;
}

export function findMissingSceneAssets(visual: PatientVisualState) {
  const registered = new Set(sceneAssetRegistry.map((item) => item.id));
  return getActiveSceneAssetIds(visual).filter((id) => !registered.has(id));
}
