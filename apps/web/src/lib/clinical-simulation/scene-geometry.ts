import type { PatientVisualState } from "./visual-state";

export type ScenePoint = { x: number; y: number };
export type PatientAnchorName =
  | "mouth"
  | "nose"
  | "leftCheek"
  | "rightCheek"
  | "neck"
  | "upperChest"
  | "lowerChest"
  | "leftUpperArm"
  | "rightUpperArm"
  | "leftForearm"
  | "rightForearm"
  | "leftHand"
  | "rightHand"
  | "abdomen"
  | "pelvis"
  | "leftThigh"
  | "rightThigh"
  | "leftLowerLeg"
  | "rightLowerLeg"
  | "leftFoot"
  | "rightFoot";

export type SceneAnchors = Record<PatientAnchorName, ScenePoint> & {
  bedRail: ScenePoint;
  ivPole: ScenePoint;
  infusionPump: ScenePoint;
  oxygenOutlet: ScenePoint;
  monitor: ScenePoint;
  ventilator: ScenePoint;
  defibrillator: ScenePoint;
  urinaryBag: ScenePoint;
  drainSystem: ScenePoint;
  suction: ScenePoint;
};

export type SceneConnection = {
  id: string;
  kind: "oxygen" | "ventilator" | "ecg" | "iv" | "arterial" | "urinary" | "drain" | "defibrillator" | "suction";
  from: ScenePoint;
  to: ScenePoint;
  path: string;
  stroke: string;
  width: number;
  dashed?: boolean;
  label: string;
};

function round(value: number) {
  return Math.round(value * 10) / 10;
}

function point(x: number, y: number): ScenePoint {
  return { x: round(x), y: round(y) };
}

export function buildTubePath(from: ScenePoint, to: ScenePoint, sag = 36) {
  const direction = to.x >= from.x ? 1 : -1;
  const horizontal = Math.abs(to.x - from.x);
  const firstControl = point(from.x + direction * Math.max(28, horizontal * 0.28), from.y + sag);
  const secondControl = point(to.x - direction * Math.max(28, horizontal * 0.24), to.y + sag * 0.55);
  return `M ${from.x} ${from.y} C ${firstControl.x} ${firstControl.y}, ${secondControl.x} ${secondControl.y}, ${to.x} ${to.y}`;
}

export function getSceneAnchors(visual: PatientVisualState): SceneAnchors {
  if (visual.position.ambulatory) {
    return {
      mouth: point(560, 215), nose: point(557, 207), leftCheek: point(548, 213), rightCheek: point(568, 213), neck: point(558, 236),
      upperChest: point(557, 284), lowerChest: point(558, 338), abdomen: point(558, 375), pelvis: point(560, 420),
      leftUpperArm: point(520, 298), rightUpperArm: point(596, 298), leftForearm: point(505, 357), rightForearm: point(614, 357), leftHand: point(500, 401), rightHand: point(620, 401),
      leftThigh: point(542, 466), rightThigh: point(580, 466), leftLowerLeg: point(536, 535), rightLowerLeg: point(588, 535), leftFoot: point(525, 598), rightFoot: point(598, 598),
      bedRail: point(655, 500), ivPole: point(980, 270), infusionPump: point(968, 336), oxygenOutlet: point(1080, 170), monitor: point(1065, 106), ventilator: point(1035, 420), defibrillator: point(1050, 505), urinaryBag: point(780, 570), drainSystem: point(820, 525), suction: point(1100, 305),
    };
  }

  const angle = visual.position.headOfBedDegrees;
  const lift = Math.max(-20, Math.min(135, (angle / 90) * 135));
  const lateral = visual.position.lateralDirection === "left" ? -9 : visual.position.lateralDirection === "right" ? 9 : 0;
  const proneOffset = visual.position.kind === "prone" ? 10 : 0;
  const head = point(338 - lift * 0.2, 405 - lift + lateral + proneOffset);
  const shoulder = point(438 - lift * 0.08, 420 - lift * 0.72 + lateral + proneOffset);
  const chest = point(495, 425 - lift * 0.5 + lateral + proneOffset);
  const pelvis = point(650, 445 + lateral);

  return {
    mouth: point(head.x + 10, head.y + 7),
    nose: point(head.x + 7, head.y - 1),
    leftCheek: point(head.x - 5, head.y + 4),
    rightCheek: point(head.x + 15, head.y + 4),
    neck: point((head.x + shoulder.x) / 2, (head.y + shoulder.y) / 2 + 4),
    upperChest: shoulder,
    lowerChest: chest,
    leftUpperArm: point(460, chest.y + 25),
    rightUpperArm: point(475, chest.y - 18),
    leftForearm: point(525, chest.y + 45),
    rightForearm: point(540, chest.y - 24),
    leftHand: point(580, chest.y + 43),
    rightHand: point(590, chest.y - 21),
    abdomen: point(585, (chest.y + pelvis.y) / 2 + 10),
    pelvis,
    leftThigh: point(705, pelvis.y + 8),
    rightThigh: point(710, pelvis.y - 9),
    leftLowerLeg: point(790, pelvis.y + 15),
    rightLowerLeg: point(800, pelvis.y - 5),
    leftFoot: point(875, pelvis.y + 15),
    rightFoot: point(885, pelvis.y - 3),
    bedRail: point(610, 492),
    ivPole: point(995, 258),
    infusionPump: point(978, 333),
    oxygenOutlet: point(1100, 170),
    monitor: point(1065, 105),
    ventilator: point(1030, 414),
    defibrillator: point(1050, 505),
    urinaryBag: point(800, 575),
    drainSystem: point(855, 525),
    suction: point(1110, 300),
  };
}

function connection(id: string, kind: SceneConnection["kind"], from: ScenePoint, to: ScenePoint, label: string, stroke: string, width: number, sag?: number, dashed?: boolean): SceneConnection {
  return { id, kind, from, to, path: buildTubePath(from, to, sag), stroke, width, label, dashed };
}

export function getSceneConnections(visual: PatientVisualState, anchors: SceneAnchors): SceneConnection[] {
  const result: SceneConnection[] = [];
  if (visual.devices.oxygen !== "room-air") {
    const from = visual.devices.mechanicalVentilation ? anchors.ventilator : anchors.oxygenOutlet;
    const to = visual.devices.oxygen === "tracheostomy-collar" || visual.devices.oxygen === "t-piece" ? anchors.neck : visual.devices.oxygen === "mechanical-ventilation" || visual.devices.oxygen === "bag-mask" ? anchors.mouth : anchors.nose;
    result.push(connection("oxygen", visual.devices.mechanicalVentilation ? "ventilator" : "oxygen", from, to, `${visual.devices.oxygenLabel} tubing`, visual.devices.mechanicalVentilation ? "#b7c7c7" : "#7fbab6", visual.devices.mechanicalVentilation ? 7 : 3.2, visual.devices.mechanicalVentilation ? 12 : 42));
  }
  if (visual.devices.arterialLine) {
    result.push(connection("arterial-line", "arterial", anchors.monitor, anchors.rightForearm, "Arterial pressure tubing", "#e16f70", 2.3, 46));
  }
  visual.devices.ivSites.forEach((site, index) => {
    const to = site.side === "left" ? (site.site === "hand" ? anchors.leftHand : site.site === "neck" ? anchors.neck : anchors.leftForearm) : (site.site === "hand" ? anchors.rightHand : site.site === "neck" ? anchors.neck : anchors.rightForearm);
    result.push(connection(`iv-${site.id}`, "iv", visual.devices.pumps.length > 0 ? anchors.infusionPump : anchors.ivPole, to, `${site.status} IV tubing`, index % 2 === 0 ? "#7ea7ac" : "#a78e72", 2.6, 62 + index * 9));
  });
  if (visual.devices.urinaryDrainage.visible) result.push(connection("urinary", "urinary", anchors.pelvis, anchors.urinaryBag, "Urinary catheter tubing", "#d6c28a", 3.4, 58));
  if (visual.devices.drain.visible) result.push(connection("drain", "drain", visual.devices.chestTube ? anchors.lowerChest : anchors.abdomen, anchors.drainSystem, `${visual.devices.drain.kind} tubing`, visual.devices.drain.color === "sanguineous" ? "#9d5654" : "#c48b72", visual.devices.chestTube ? 5 : 3, 48));
  if (visual.devices.defibrillationPads !== "none") result.push(connection("defibrillator", "defibrillator", anchors.defibrillator, anchors.upperChest, "Defibrillation pad cable", "#52575b", 4.2, 35));
  if (visual.devices.suction && visual.roomPreset === "procedural") result.push(connection("suction", "suction", anchors.suction, anchors.mouth, "Suction tubing", "#91b6a4", 3, 35));
  return result;
}

export function sceneGeometryIsFinite(anchors: SceneAnchors, connections: SceneConnection[]) {
  const anchorValues = Object.values(anchors).every((value) => Number.isFinite(value.x) && Number.isFinite(value.y));
  const connectionsValid = connections.every((item) => Number.isFinite(item.from.x) && Number.isFinite(item.from.y) && Number.isFinite(item.to.x) && Number.isFinite(item.to.y) && !item.path.includes("NaN"));
  return anchorValues && connectionsValid;
}
