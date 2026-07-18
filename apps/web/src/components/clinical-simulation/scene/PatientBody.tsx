import type { CSSProperties } from "react";
import type { SceneAnchors } from "@/lib/clinical-simulation/scene-geometry";
import type { PatientVisualState } from "@/lib/clinical-simulation/visual-state";
import styles from "./patient-scene.module.css";

type Props = {
  visual: PatientVisualState;
  anchors: SceneAnchors;
  idPrefix: string;
};

function Hair({ visual, x, y }: { visual: PatientVisualState; x: number; y: number }) {
  const common = { fill: visual.profile.hairColor };
  if (visual.profile.hairStyle === "covered") return <path d={`M${x - 25} ${y - 10} Q${x} ${y - 39} ${x + 29} ${y - 8} L${x + 24} ${y + 2} Q${x} ${y - 17} ${x - 23} ${y + 4} Z`} {...common} />;
  if (visual.profile.hairStyle === "coiled") return <g fill={visual.profile.hairColor}>{[-22, -12, -2, 8, 18].map((offset, index) => <circle key={offset} cx={x + offset} cy={y - 15 - (index % 2) * 5} r="12" />)}</g>;
  if (visual.profile.hairStyle === "bob") return <path d={`M${x - 28} ${y - 8} Q${x} ${y - 39} ${x + 30} ${y - 6} L${x + 25} ${y + 25} L${x + 18} ${y + 7} Q${x} ${y - 13} ${x - 20} ${y + 5} L${x - 22} ${y + 25} Z`} {...common} />;
  if (visual.profile.hairStyle === "receding") return <path d={`M${x - 22} ${y - 12} Q${x} ${y - 30} ${x + 23} ${y - 10} Q${x + 9} ${y - 18} ${x + 2} ${y - 7} Q${x - 7} ${y - 18} ${x - 22} ${y - 12}`} fill="none" stroke={visual.profile.hairColor} strokeWidth="9" strokeLinecap="round" />;
  return <path d={`M${x - 25} ${y - 10} Q${x} ${y - 36} ${x + 27} ${y - 8} Q${x + 8} ${y - 19} ${x - 23} ${y + 2} Z`} {...common} />;
}

function Face({ visual, anchors }: { visual: PatientVisualState; anchors: SceneAnchors }) {
  const x = anchors.nose.x - 7;
  const y = anchors.nose.y + 1;
  const eyeHeight = Math.max(0.7, 4.4 * visual.consciousness.eyeOpenRatio);
  const gazeOffset = visual.pupils.gaze === "left" ? -1.5 : visual.pupils.gaze === "right" ? 1.5 : 0;
  const mouth = visual.expression === "pain" || visual.expression === "dyspnea"
    ? `M${x - 7} ${y + 15} Q${x} ${y + 10} ${x + 8} ${y + 15}`
    : visual.expression === "unresponsive" || visual.expression === "sedated"
      ? `M${x - 7} ${y + 14} Q${x} ${y + 17} ${x + 8} ${y + 14}`
      : visual.expression === "agitated"
        ? `M${x - 8} ${y + 15} Q${x} ${y + 5} ${x + 9} ${y + 15}`
        : `M${x - 7} ${y + 14} Q${x} ${y + 15} ${x + 8} ${y + 14}`;
  return (
    <g className={styles.headMotion} data-loc={visual.consciousness.level}>
      <ellipse cx={x} cy={y} rx="31" ry="35" fill="var(--skin-base)" stroke="var(--skin-shadow)" strokeWidth="1.4" />
      <ellipse cx={x - 13} cy={y + 1} rx="8" ry={eyeHeight} fill="#f5f3ec" opacity={visual.consciousness.eyeOpenRatio === 0 ? 0 : 1} />
      <ellipse cx={x + 13} cy={y + 1} rx="8" ry={eyeHeight} fill="#f5f3ec" opacity={visual.consciousness.eyeOpenRatio === 0 ? 0 : 1} />
      <g className={styles.eyeTrack} data-tracks={visual.consciousness.tracks}>
        <circle cx={x - 13 + gazeOffset} cy={y + 1} r="2.4" fill="#303535" opacity={visual.consciousness.eyeOpenRatio === 0 ? 0 : 1} />
        <circle cx={x + 13 + gazeOffset} cy={y + 1} r="2.4" fill="#303535" opacity={visual.consciousness.eyeOpenRatio === 0 ? 0 : 1} />
      </g>
      {visual.consciousness.eyeOpenRatio < 0.3 ? <><path d={`M${x - 21} ${y + 1} Q${x - 13} ${y + 4} ${x - 5} ${y + 1}`} stroke="var(--skin-shadow)" strokeWidth="2" fill="none" /><path d={`M${x + 5} ${y + 1} Q${x + 13} ${y + 4} ${x + 21} ${y + 1}`} stroke="var(--skin-shadow)" strokeWidth="2" fill="none" /></> : null}
      <path d={`M${x} ${y + 3} L${x - 2} ${y + 9} L${x + 2} ${y + 10}`} fill="none" stroke="var(--skin-shadow)" strokeWidth="1.2" />
      <path d={mouth} fill="none" stroke={visual.skin.cyanosis > 0 ? "var(--skin-cyanosis)" : "var(--skin-lip)"} strokeWidth={visual.expression === "dyspnea" ? 4 : 2.4} strokeLinecap="round" />
      {visual.skin.flushing > 0 ? <><circle cx={x - 21} cy={y + 9} r="8" fill="var(--skin-flush)" opacity={0.1 + visual.skin.flushing * 0.09} /><circle cx={x + 21} cy={y + 9} r="8" fill="var(--skin-flush)" opacity={0.1 + visual.skin.flushing * 0.09} /></> : null}
      {visual.skin.pallor > 0 ? <ellipse cx={x} cy={y + 7} rx="27" ry="27" fill="var(--skin-pallor)" opacity={visual.skin.pallor * 0.08} /> : null}
      {visual.skin.diaphoresis > 0 ? <g className={styles.diaphoresis} fill="#d9eff0" opacity={0.35 + visual.skin.diaphoresis * 0.13}><ellipse cx={x - 16} cy={y - 11} rx="2" ry="4" /><ellipse cx={x + 4} cy={y - 17} rx="1.6" ry="3.4" /><ellipse cx={x + 19} cy={y - 7} rx="1.8" ry="3.8" />{visual.skin.diaphoresis >= 3 ? <ellipse cx={x - 25} cy={y + 3} rx="1.6" ry="4" /> : null}</g> : null}
      <Hair visual={visual} x={x} y={y} />
    </g>
  );
}

function Bed({ visual }: { visual: PatientVisualState }) {
  const lift = Math.max(-20, Math.min(135, (visual.position.headOfBedDegrees / 90) * 135));
  const headY = 472 - lift;
  return (
    <g className={styles.bed} aria-hidden="true">
      <ellipse cx="612" cy="604" rx="390" ry="39" fill="#4c5c59" opacity="0.2" />
      <path d={`M214 ${headY + 22} L455 468 L933 468 L966 527 L403 533 L198 ${headY + 61} Z`} fill="#e6ece8" stroke="#718783" strokeWidth="5" />
      <path d={`M214 ${headY + 22} L455 468`} stroke="#9dafaa" strokeWidth="23" strokeLinecap="round" />
      <path d="M449 471 H932" stroke="#b7c7c1" strokeWidth="27" strokeLinecap="round" />
      <path d="M203 515 H960 V548 H208 Z" fill="#778d89" />
      <path d="M248 548 V594 M879 548 V594" stroke="#586b68" strokeWidth="11" />
      <circle cx="248" cy="603" r="16" fill="#465956" /><circle cx="879" cy="603" r="16" fill="#465956" />
      <path d="M238 423 V521 M915 438 V529" stroke="#5f7773" strokeWidth="10" strokeLinecap="round" />
      <path d="M229 423 H312 M852 438 H927" stroke="#5f7773" strokeWidth="10" strokeLinecap="round" />
      <path d={`M270 ${headY + 15} Q343 ${headY - 15} 405 ${headY + 37} L423 ${headY + 66} Q337 ${headY + 45} 260 ${headY + 48} Z`} fill="#f8faf7" stroke="#c3cfca" strokeWidth="3" />
      <g transform="translate(558 503)"><rect width="104" height="28" rx="8" fill="#526966" /><path d="M18 14 H86" stroke="#8ca6a0" strokeWidth="4" strokeDasharray="8 6" /></g>
    </g>
  );
}

function AmbulatoryPatient({ visual, anchors }: { visual: PatientVisualState; anchors: SceneAnchors }) {
  const torsoWidth = visual.profile.bodyVariant === "broad" ? 58 : visual.profile.bodyVariant === "slender" ? 43 : 51;
  return (
    <g className={styles.ambulatoryPatient} data-movement={visual.movement.intensity} data-seizure={visual.movement.seizure}>
      <ellipse cx={anchors.pelvis.x} cy="617" rx="76" ry="17" fill="#50605c" opacity="0.19" />
      <path d={`M${anchors.upperChest.x - torsoWidth} ${anchors.upperChest.y} Q${anchors.upperChest.x} ${anchors.upperChest.y - 25} ${anchors.upperChest.x + torsoWidth} ${anchors.upperChest.y} L${anchors.pelvis.x + 36} ${anchors.pelvis.y} Q${anchors.pelvis.x} ${anchors.pelvis.y + 20} ${anchors.pelvis.x - 36} ${anchors.pelvis.y} Z`} fill={visual.profile.clothing === "psychiatric-safe" ? "#6d8781" : "#718f95"} stroke="#486864" strokeWidth="2" />
      <path d={`M${anchors.leftUpperArm.x} ${anchors.leftUpperArm.y} Q${anchors.leftForearm.x - 14} ${anchors.leftForearm.y} ${anchors.leftHand.x} ${anchors.leftHand.y}`} stroke="var(--skin-base)" strokeWidth="21" strokeLinecap="round" fill="none" />
      <path d={`M${anchors.rightUpperArm.x} ${anchors.rightUpperArm.y} Q${anchors.rightForearm.x + 14} ${anchors.rightForearm.y} ${anchors.rightHand.x} ${anchors.rightHand.y}`} stroke="var(--skin-base)" strokeWidth="21" strokeLinecap="round" fill="none" />
      <path d={`M${anchors.leftThigh.x} ${anchors.leftThigh.y} L${anchors.leftLowerLeg.x} ${anchors.leftLowerLeg.y} L${anchors.leftFoot.x} ${anchors.leftFoot.y}`} stroke="#4f6463" strokeWidth="31" strokeLinecap="round" strokeLinejoin="round" fill="none" />
      <path d={`M${anchors.rightThigh.x} ${anchors.rightThigh.y} L${anchors.rightLowerLeg.x} ${anchors.rightLowerLeg.y} L${anchors.rightFoot.x} ${anchors.rightFoot.y}`} stroke="#455b5b" strokeWidth="31" strokeLinecap="round" strokeLinejoin="round" fill="none" />
      <path d={`M${anchors.neck.x} ${anchors.neck.y} L${anchors.upperChest.x} ${anchors.upperChest.y + 13}`} stroke="var(--skin-base)" strokeWidth="23" strokeLinecap="round" />
      <Face visual={visual} anchors={anchors} />
    </g>
  );
}

function BedPatient({ visual, anchors, idPrefix }: Props) {
  const torsoWidth = visual.profile.bodyVariant === "broad" ? 74 : visual.profile.bodyVariant === "slender" ? 54 : 64;
  const limbWidth = visual.skin.edema > 0 ? 21 + visual.skin.edema * 1.6 : 20;
  const lowerLegWidth = 21 + visual.skin.edema * 1.4;
  const gownColor = visual.profile.clothing === "procedural-gown" ? "#7b9ba0" : visual.profile.clothing === "icu-gown" ? "#668b8d" : "#77979b";
  return (
    <g className={styles.patient} data-loc={visual.consciousness.level} data-movement={visual.movement.intensity} data-seizure={visual.movement.seizure} data-guarding={visual.movement.guarding}>
      <path d={`M${anchors.neck.x} ${anchors.neck.y} L${anchors.upperChest.x} ${anchors.upperChest.y + 6}`} stroke="var(--skin-base)" strokeWidth="25" strokeLinecap="round" />
      <g className={styles.chestMotion}>
        <path d={`M${anchors.upperChest.x - torsoWidth} ${anchors.upperChest.y - 15} Q${anchors.upperChest.x} ${anchors.upperChest.y - 34} ${anchors.upperChest.x + torsoWidth} ${anchors.upperChest.y - 4} L${anchors.pelvis.x + 35} ${anchors.pelvis.y + 18} Q${anchors.abdomen.x} ${anchors.abdomen.y + 38} ${anchors.upperChest.x - torsoWidth + 15} ${anchors.upperChest.y + 35} Z`} fill={gownColor} stroke="#4d7172" strokeWidth="2.2" />
        <path d={`M${anchors.upperChest.x - 35} ${anchors.upperChest.y - 14} L${anchors.upperChest.x} ${anchors.upperChest.y + 12} L${anchors.upperChest.x + 36} ${anchors.upperChest.y - 7}`} fill="none" stroke="#bad0cf" strokeWidth="2.2" opacity="0.7" />
        <path d={`M${anchors.upperChest.x - 58} ${anchors.upperChest.y + 6} Q${anchors.lowerChest.x} ${anchors.lowerChest.y + 18} ${anchors.upperChest.x + 60} ${anchors.upperChest.y + 12}`} fill="none" stroke="#4b7273" strokeWidth="1.4" opacity="0.65" />
      </g>
      <g className={styles.accessoryMotion} data-active={visual.respiration.accessoryMuscleUse}>
        <path d={`M${anchors.upperChest.x - 54} ${anchors.upperChest.y - 9} Q${anchors.neck.x - 25} ${anchors.neck.y + 14} ${anchors.neck.x - 9} ${anchors.neck.y + 4}`} fill="none" stroke="var(--skin-shadow)" strokeWidth="3" opacity={visual.respiration.accessoryMuscleUse ? 0.55 : 0} />
        <path d={`M${anchors.upperChest.x + 54} ${anchors.upperChest.y - 4} Q${anchors.neck.x + 25} ${anchors.neck.y + 14} ${anchors.neck.x + 9} ${anchors.neck.y + 4}`} fill="none" stroke="var(--skin-shadow)" strokeWidth="3" opacity={visual.respiration.accessoryMuscleUse ? 0.55 : 0} />
      </g>
      <path d={`M${anchors.leftUpperArm.x} ${anchors.leftUpperArm.y} Q${anchors.leftForearm.x} ${anchors.leftForearm.y} ${anchors.leftHand.x} ${anchors.leftHand.y}`} stroke="var(--skin-base)" strokeWidth={limbWidth} strokeLinecap="round" fill="none" />
      <path d={`M${anchors.rightUpperArm.x} ${anchors.rightUpperArm.y} Q${anchors.rightForearm.x} ${anchors.rightForearm.y} ${anchors.rightHand.x} ${anchors.rightHand.y}`} stroke="var(--skin-base)" strokeWidth={limbWidth} strokeLinecap="round" fill="none" />
      <ellipse cx={anchors.leftHand.x} cy={anchors.leftHand.y} rx={11 + visual.skin.edema} ry={7 + visual.skin.edema * 0.7} fill="var(--skin-base)" />
      <ellipse cx={anchors.rightHand.x} cy={anchors.rightHand.y} rx={11 + visual.skin.edema} ry={7 + visual.skin.edema * 0.7} fill="var(--skin-base)" />
      <path d={`M${anchors.pelvis.x - 38} ${anchors.pelvis.y - 3} Q${anchors.leftThigh.x} ${anchors.leftThigh.y + 13} ${anchors.leftLowerLeg.x} ${anchors.leftLowerLeg.y} T${anchors.leftFoot.x} ${anchors.leftFoot.y}`} stroke="#d9e3df" strokeWidth={42 + visual.skin.edema * 1.4} strokeLinecap="round" fill="none" />
      <path d={`M${anchors.pelvis.x - 18} ${anchors.pelvis.y - 11} Q${anchors.rightThigh.x} ${anchors.rightThigh.y - 9} ${anchors.rightLowerLeg.x} ${anchors.rightLowerLeg.y} T${anchors.rightFoot.x} ${anchors.rightFoot.y}`} stroke="#cbdad5" strokeWidth={39 + visual.skin.edema * 1.4} strokeLinecap="round" fill="none" />
      <path d={`M${anchors.abdomen.x - 70} ${anchors.abdomen.y - 5} Q${anchors.pelvis.x} ${anchors.pelvis.y + 24} ${anchors.leftLowerLeg.x + 35} ${anchors.leftLowerLeg.y + 12} L${anchors.rightLowerLeg.x + 55} ${anchors.rightLowerLeg.y + 39} Q${anchors.pelvis.x} ${anchors.pelvis.y + 58} ${anchors.abdomen.x - 66} ${anchors.abdomen.y + 24} Z`} fill="#e2e8e3" stroke="#b5c3be" strokeWidth="2" />
      <g data-skin-region="distal-lower-extremities">
        <path d={`M${anchors.leftLowerLeg.x + 29} ${anchors.leftLowerLeg.y + 11} Q${anchors.leftFoot.x - 25} ${anchors.leftFoot.y + 5} ${anchors.leftFoot.x} ${anchors.leftFoot.y}`} stroke="var(--skin-base)" strokeWidth={lowerLegWidth} strokeLinecap="round" fill="none" />
        <path d={`M${anchors.rightLowerLeg.x + 35} ${anchors.rightLowerLeg.y + 24} Q${anchors.rightFoot.x - 22} ${anchors.rightFoot.y + 9} ${anchors.rightFoot.x} ${anchors.rightFoot.y + 5}`} stroke="var(--skin-base)" strokeWidth={lowerLegWidth} strokeLinecap="round" fill="none" />
        <ellipse cx={anchors.leftFoot.x + 5} cy={anchors.leftFoot.y} rx={15 + visual.skin.edema} ry={7 + visual.skin.edema * 0.7} fill="var(--skin-base)" />
        <ellipse cx={anchors.rightFoot.x + 5} cy={anchors.rightFoot.y + 5} rx={15 + visual.skin.edema} ry={7 + visual.skin.edema * 0.7} fill="var(--skin-base)" />
      </g>
      {visual.skin.bleeding > 0 && visual.roomPreset === "medical-surgical" ? <g><rect x={anchors.abdomen.x - 25} y={anchors.abdomen.y - 9} width="52" height="27" rx="5" fill="#f0eee6" stroke="#aab6b1" strokeWidth="2" /><ellipse cx={anchors.abdomen.x + 11} cy={anchors.abdomen.y + 5} rx={8 + visual.skin.bleeding * 3} ry={4 + visual.skin.bleeding * 2} fill="#9b4d4e" opacity={0.33 + visual.skin.bleeding * 0.13} /></g> : null}
      {visual.skin.mottling > 0 ? <g data-skin-overlay="mottling" opacity={0.12 + visual.skin.mottling * 0.1}><path d={`M${anchors.leftLowerLeg.x + 29} ${anchors.leftLowerLeg.y + 11} Q${anchors.leftFoot.x - 25} ${anchors.leftFoot.y + 5} ${anchors.leftFoot.x + 10} ${anchors.leftFoot.y}`} stroke={`url(#${idPrefix}-mottling)`} strokeWidth={Math.max(11, lowerLegWidth - 5)} strokeLinecap="round" fill="none" /><path d={`M${anchors.rightLowerLeg.x + 35} ${anchors.rightLowerLeg.y + 24} Q${anchors.rightFoot.x - 22} ${anchors.rightFoot.y + 9} ${anchors.rightFoot.x + 10} ${anchors.rightFoot.y + 5}`} stroke={`url(#${idPrefix}-mottling)`} strokeWidth={Math.max(11, lowerLegWidth - 5)} strokeLinecap="round" fill="none" /><ellipse cx={anchors.leftHand.x} cy={anchors.leftHand.y} rx="10" ry="5" fill={`url(#${idPrefix}-mottling)`} /><ellipse cx={anchors.rightHand.x} cy={anchors.rightHand.y} rx="10" ry="5" fill={`url(#${idPrefix}-mottling)`} /></g> : null}
      {visual.skin.cyanosis > 0 ? <g data-skin-overlay="cyanosis" fill="var(--skin-cyanosis)" opacity={0.16 + visual.skin.cyanosis * 0.1}><ellipse cx={anchors.leftHand.x} cy={anchors.leftHand.y} rx="10" ry="5" /><ellipse cx={anchors.rightHand.x} cy={anchors.rightHand.y} rx="10" ry="5" /><ellipse cx={anchors.leftFoot.x + 8} cy={anchors.leftFoot.y} rx="11" ry="4" /><ellipse cx={anchors.rightFoot.x + 8} cy={anchors.rightFoot.y + 5} rx="11" ry="4" /></g> : null}
      <Face visual={visual} anchors={anchors} />
    </g>
  );
}

export default function PatientBody({ visual, anchors, idPrefix }: Props) {
  return (
    <g
      style={{
        "--skin-base": visual.profile.palette.base,
        "--skin-highlight": visual.profile.palette.highlight,
        "--skin-shadow": visual.profile.palette.shadow,
        "--skin-lip": visual.profile.palette.lip,
        "--skin-pallor": visual.profile.palette.pallor,
        "--skin-flush": visual.profile.palette.flush,
        "--skin-cyanosis": visual.profile.palette.cyanosis,
      } as CSSProperties}
      data-body-variant={visual.profile.bodyVariant}
      data-skin-tone={visual.profile.skinTone}
      data-position={visual.position.kind}
      data-head-of-bed={Math.round(visual.position.headOfBedDegrees)}
    >
      {visual.position.ambulatory ? <AmbulatoryPatient visual={visual} anchors={anchors} /> : <><Bed visual={visual} /><BedPatient visual={visual} anchors={anchors} idPrefix={idPrefix} /></>}
    </g>
  );
}
