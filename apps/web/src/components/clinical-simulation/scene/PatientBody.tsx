import type { CSSProperties } from "react";
import type { SceneAnchors } from "@/lib/clinical-simulation/scene-geometry";
import type { PatientVisualState } from "@/lib/clinical-simulation/visual-state";
import styles from "./patient-scene.module.css";

type Props = {
  visual: PatientVisualState;
  anchors: SceneAnchors;
  idPrefix: string;
};

// Palette-driven skin shading. Stops read the --skin-* custom properties set on
// the PatientBody root group, so the gradients track each patient's tone and any
// reactive pallor/flush/cyanosis without hard-coding colors here.
function SkinDefs({ idPrefix }: { idPrefix: string }) {
  return (
    <defs>
      <radialGradient id={`${idPrefix}-skin-face`} cx="42%" cy="32%" r="78%">
        <stop offset="0" stopColor="var(--skin-highlight)" />
        <stop offset="0.52" stopColor="var(--skin-base)" />
        <stop offset="1" stopColor="var(--skin-shadow)" />
      </radialGradient>
      <linearGradient id={`${idPrefix}-skin-limb`} x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" stopColor="var(--skin-highlight)" />
        <stop offset="0.55" stopColor="var(--skin-base)" />
        <stop offset="1" stopColor="var(--skin-shadow)" />
      </linearGradient>
      <radialGradient id={`${idPrefix}-skin-cheek`} cx="50%" cy="50%" r="50%">
        <stop offset="0" stopColor="var(--skin-highlight)" stopOpacity="0.9" />
        <stop offset="1" stopColor="var(--skin-highlight)" stopOpacity="0" />
      </radialGradient>
      {/* Translucent so it shades any gown colorway rather than replacing it. */}
      <linearGradient id={`${idPrefix}-gown-shade`} x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" stopColor="#ffffff" stopOpacity="0.16" />
        <stop offset="0.45" stopColor="#ffffff" stopOpacity="0" />
        <stop offset="1" stopColor="#14312f" stopOpacity="0.2" />
      </linearGradient>
    </defs>
  );
}

function Hair({ visual, x, y }: { visual: PatientVisualState; x: number; y: number }) {
  const common = { fill: visual.profile.hairColor };
  if (visual.profile.hairStyle === "covered") return <path d={`M${x - 25} ${y - 10} Q${x} ${y - 39} ${x + 29} ${y - 8} L${x + 24} ${y + 2} Q${x} ${y - 17} ${x - 23} ${y + 4} Z`} {...common} />;
  if (visual.profile.hairStyle === "coiled") return <g fill={visual.profile.hairColor}>{[-22, -12, -2, 8, 18].map((offset, index) => <circle key={offset} cx={x + offset} cy={y - 15 - (index % 2) * 5} r="12" />)}</g>;
  if (visual.profile.hairStyle === "bob") return <path d={`M${x - 28} ${y - 8} Q${x} ${y - 39} ${x + 30} ${y - 6} L${x + 25} ${y + 25} L${x + 18} ${y + 7} Q${x} ${y - 13} ${x - 20} ${y + 5} L${x - 22} ${y + 25} Z`} {...common} />;
  if (visual.profile.hairStyle === "receding") return <path d={`M${x - 22} ${y - 12} Q${x} ${y - 30} ${x + 23} ${y - 10} Q${x + 9} ${y - 18} ${x + 2} ${y - 7} Q${x - 7} ${y - 18} ${x - 22} ${y - 12}`} fill="none" stroke={visual.profile.hairColor} strokeWidth="9" strokeLinecap="round" />;
  return <path d={`M${x - 25} ${y - 10} Q${x} ${y - 36} ${x + 27} ${y - 8} Q${x + 8} ${y - 19} ${x - 23} ${y + 2} Z`} {...common} />;
}

function Face({ visual, anchors, idPrefix }: { visual: PatientVisualState; anchors: SceneAnchors; idPrefix: string }) {
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
    // Scaled about the face centre: the head read slightly large against the
    // foreshortened torso, and scaling the group keeps hair, features, and
    // overlays in proportion with each other.
    <g className={styles.headMotion} data-loc={visual.consciousness.level} transform={`translate(${x} ${y}) scale(0.9) translate(${-x} ${-y})`}>
      {/* Anatomical silhouette: rounded cranium tapering through the cheekbone to
          a chin, rather than a plain oval — the oval is what made the face read
          as a mannequin. */}
      <path
        d={`M${x - 30} ${y - 6} C${x - 31} ${y - 26} ${x - 16} ${y - 38} ${x + 2} ${y - 37} C${x + 21} ${y - 36} ${x + 31} ${y - 22} ${x + 30} ${y - 3} C${x + 29} ${y + 12} ${x + 24} ${y + 23} ${x + 15} ${y + 31} C${x + 8} ${y + 37} ${x - 5} ${y + 38} ${x - 13} ${y + 31} C${x - 23} ${y + 23} ${x - 29} ${y + 10} ${x - 30} ${y - 6} Z`}
        fill={`url(#${idPrefix}-skin-face)`}
        stroke="var(--skin-shadow)"
        strokeWidth="1.4"
      />
      {/* ear at the mandible hinge */}
      <path d={`M${x - 30} ${y - 4} q-7 1 -6 9 q1 8 7 10`} fill={`url(#${idPrefix}-skin-face)`} stroke="var(--skin-shadow)" strokeWidth="1.2" />
      <path d={`M${x - 30} ${y} q-3 2 -2 7`} fill="none" stroke="var(--skin-shadow)" strokeWidth="1" opacity="0.55" />
      <path d={`M${x - 28} ${y + 10} Q${x - 22} ${y + 28} ${x} ${y + 33} Q${x + 22} ${y + 28} ${x + 28} ${y + 8} Q${x + 21} ${y + 21} ${x} ${y + 25} Q${x - 21} ${y + 21} ${x - 28} ${y + 10} Z`} fill="var(--skin-shadow)" opacity="0.16" />
      <ellipse cx={x - 17} cy={y + 8} rx="9" ry="7" fill={`url(#${idPrefix}-skin-cheek)`} />
      <ellipse cx={x + 17} cy={y + 8} rx="9" ry="7" fill={`url(#${idPrefix}-skin-cheek)`} />
      <path d={`M${x - 22} ${y - 8} Q${x - 13} ${y - 12} ${x - 4} ${y - 8}`} fill="none" stroke="var(--skin-shadow)" strokeWidth="1.6" strokeLinecap="round" opacity="0.5" />
      <path d={`M${x + 4} ${y - 8} Q${x + 13} ${y - 12} ${x + 22} ${y - 8}`} fill="none" stroke="var(--skin-shadow)" strokeWidth="1.6" strokeLinecap="round" opacity="0.5" />
      <ellipse cx={x - 13} cy={y + 1} rx="8" ry={eyeHeight} fill="#f5f3ec" opacity={visual.consciousness.eyeOpenRatio === 0 ? 0 : 1} />
      <ellipse cx={x + 13} cy={y + 1} rx="8" ry={eyeHeight} fill="#f5f3ec" opacity={visual.consciousness.eyeOpenRatio === 0 ? 0 : 1} />
      <g className={styles.eyeTrack} data-tracks={visual.consciousness.tracks}>
        <circle cx={x - 13 + gazeOffset} cy={y + 1} r="2.4" fill="#303535" opacity={visual.consciousness.eyeOpenRatio === 0 ? 0 : 1} />
        <circle cx={x + 13 + gazeOffset} cy={y + 1} r="2.4" fill="#303535" opacity={visual.consciousness.eyeOpenRatio === 0 ? 0 : 1} />
      </g>
      {visual.consciousness.eyeOpenRatio < 0.3 ? <><path d={`M${x - 21} ${y + 1} Q${x - 13} ${y + 4} ${x - 5} ${y + 1}`} stroke="var(--skin-shadow)" strokeWidth="2" fill="none" /><path d={`M${x + 5} ${y + 1} Q${x + 13} ${y + 4} ${x + 21} ${y + 1}`} stroke="var(--skin-shadow)" strokeWidth="2" fill="none" /></> : null}
      <path d={`M${x - 2} ${y - 3} Q${x - 4} ${y + 4} ${x - 4} ${y + 9} Q${x} ${y + 12} ${x + 4} ${y + 9}`} fill="none" stroke="var(--skin-shadow)" strokeWidth="1.3" strokeLinecap="round" opacity="0.55" />
      <ellipse cx={x} cy={y + 9} rx="4" ry="2.3" fill="var(--skin-shadow)" opacity="0.15" />
      <path d={`M${x - 1.6} ${y + 11.4} q1.6 1.5 3.2 0`} fill="none" stroke="var(--skin-shadow)" strokeWidth="0.9" strokeLinecap="round" opacity="0.4" />
      <path d={mouth} fill="none" stroke={visual.skin.cyanosis > 0 ? "var(--skin-cyanosis)" : "var(--skin-lip)"} strokeWidth={visual.expression === "dyspnea" ? 4 : 2.4} strokeLinecap="round" />
      {visual.skin.flushing > 0 ? <><circle cx={x - 21} cy={y + 9} r="8" fill="var(--skin-flush)" opacity={0.1 + visual.skin.flushing * 0.09} /><circle cx={x + 21} cy={y + 9} r="8" fill="var(--skin-flush)" opacity={0.1 + visual.skin.flushing * 0.09} /></> : null}
      {visual.skin.pallor > 0 ? <ellipse cx={x} cy={y + 7} rx="27" ry="27" fill="var(--skin-pallor)" opacity={visual.skin.pallor * 0.08} /> : null}
      {visual.skin.diaphoresis > 0 ? <g className={styles.diaphoresis} fill="#d9eff0" opacity={0.35 + visual.skin.diaphoresis * 0.13}><ellipse cx={x - 16} cy={y - 11} rx="2" ry="4" /><ellipse cx={x + 4} cy={y - 17} rx="1.6" ry="3.4" /><ellipse cx={x + 19} cy={y - 7} rx="1.8" ry="3.8" />{visual.skin.diaphoresis >= 3 ? <ellipse cx={x - 25} cy={y + 3} rx="1.6" ry="4" /> : null}</g> : null}
      <Hair visual={visual} x={x} y={y} />
    </g>
  );
}

// The bed is derived from the SAME anchors that place the patient, so the body
// always rests on the mattress at any head-of-bed angle. (Previously the bed used
// its own hardcoded baseline and the patient visibly floated above it.)
function Bed({ anchors, idPrefix }: { anchors: SceneAnchors; idPrefix: string }) {
  const footAnchorX = Math.max(anchors.leftFoot.x, anchors.rightFoot.x);
  const footAnchorY = Math.max(anchors.leftFoot.y, anchors.rightFoot.y);
  const headX = anchors.nose.x - 96;
  const footX = footAnchorX + 84;
  // Mattress surface: tucked just under the body along its whole length.
  const surfHead = anchors.nose.y + 56;
  const surfChest = anchors.upperChest.y + 50;
  const surfPelvis = anchors.pelvis.y + 27;
  const surfFoot = footAnchorY + 27;
  const thickness = 26;
  const deckY = surfPelvis + 58;
  const frameY = deckY + 33;
  const wheelY = frameY + 55;
  const midX = (headX + anchors.upperChest.x) / 2;
  const surface = `M${headX} ${surfHead} Q${midX} ${surfChest - 8} ${anchors.upperChest.x} ${surfChest} L${anchors.pelvis.x} ${surfPelvis} L${footX} ${surfFoot}`;
  return (
    <g className={styles.bed} aria-hidden="true">
      <defs>
        <linearGradient id={`${idPrefix}-mattress`} x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#fbf5e8" /><stop offset="0.6" stopColor="#ece1cb" /><stop offset="1" stopColor="#d6c9b0" /></linearGradient>
        <linearGradient id={`${idPrefix}-bedmetal`} x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#b6a68d" /><stop offset="1" stopColor="#7a6a52" /></linearGradient>
      </defs>
      <ellipse cx={(headX + footX) / 2} cy={wheelY + 6} rx={(footX - headX) / 2 + 18} ry="34" fill="#5c5040" opacity="0.18" />
      {/* mattress: inclined backrest + flat seat, following the body line */}
      <path d={`${surface} L${footX} ${surfFoot + thickness} L${anchors.pelvis.x} ${surfPelvis + thickness} Q${midX} ${surfChest + thickness - 8} ${headX} ${surfHead + thickness} Z`} fill={`url(#${idPrefix}-mattress)`} stroke="#8c7c63" strokeWidth="4" />
      <path d={surface} fill="none" stroke="#fdf9ee" strokeWidth="3" opacity="0.9" />
      <path d={`M${headX + 12} ${surfHead + thickness - 7} Q${midX} ${surfChest + thickness - 14} ${anchors.pelvis.x} ${surfPelvis + thickness - 6} L${footX - 10} ${surfFoot + thickness - 6}`} fill="none" stroke="#d2c5ad" strokeWidth="2" opacity="0.8" />
      {/* draw sheet across the hips */}
      <path d={`M${anchors.pelvis.x - 92} ${surfPelvis + 4} L${anchors.pelvis.x + 96} ${surfPelvis + 12} L${anchors.pelvis.x + 96} ${surfPelvis + thickness + 3} L${anchors.pelvis.x - 92} ${surfPelvis + thickness - 5} Z`} fill="#f7f0e1" stroke="#cfc2a9" strokeWidth="2" opacity="0.92" />
      {/* deck + frame rail */}
      <path d={`M${headX + 6} ${deckY} H${footX - 4} V${frameY} H${headX + 10} Z`} fill={`url(#${idPrefix}-bedmetal)`} />
      <path d={`M${headX + 14} ${deckY + 5} H${footX - 14}`} stroke="#d5c8b0" strokeWidth="2" opacity="0.6" />
      {/* caster columns, forks, wheels, brake pedal */}
      <path d={`M${headX + 48} ${frameY} V${wheelY - 15} M${footX - 78} ${frameY} V${wheelY - 15}`} stroke="#6e6150" strokeWidth="11" />
      <path d={`M${headX + 39} ${wheelY - 16} H${headX + 57} M${footX - 87} ${wheelY - 16} H${footX - 69}`} stroke="#5e5344" strokeWidth="7" strokeLinecap="round" />
      <circle cx={headX + 48} cy={wheelY} r="16" fill="#5a4f40" /><circle cx={headX + 48} cy={wheelY} r="6" fill="#786a56" />
      <circle cx={footX - 78} cy={wheelY} r="16" fill="#5a4f40" /><circle cx={footX - 78} cy={wheelY} r="6" fill="#786a56" />
      <path d={`M${headX + 66} ${wheelY - 7} L${headX + 84} ${wheelY + 2}`} stroke="#bc8b58" strokeWidth="5" strokeLinecap="round" />
      {/* side rails, parallel to the deck */}
      <g stroke={`url(#${idPrefix}-bedmetal)`} strokeWidth="9" strokeLinecap="round" fill="none">
        <path d={`M${headX + 34} ${surfHead + 34} V${deckY - 4} M${headX + 92} ${surfHead + 40} V${surfChest + 44}`} />
        <path d={`M${headX + 25} ${surfHead + 34} H${headX + 108} M${headX + 25} ${surfHead + 60} H${headX + 108}`} />
        <path d={`M${footX - 44} ${surfFoot + 32} V${deckY - 4} M${footX - 96} ${surfFoot + 30} V${surfFoot + 74}`} />
        <path d={`M${footX - 112} ${surfFoot + 30} H${footX - 34} M${footX - 112} ${surfFoot + 56} H${footX - 34}`} />
      </g>
      {/* rail-mounted patient control pod */}
      <g transform={`translate(${footX - 108} ${surfFoot + 40})`}><rect width="24" height="36" rx="6" fill="#736553" /><circle cx="12" cy="9" r="3" fill="#e0a95c" /><circle cx="12" cy="18" r="3" fill="#8fd1a8" /><circle cx="12" cy="27" r="3" fill="#cfe0da" /></g>
      {/* pillow: cradles the occiput, angled with the backrest */}
      <g transform={`translate(${anchors.nose.x - 34} ${anchors.nose.y + 4}) rotate(-13)`}>
        <path d="M-62 -34 Q-52 -62 6 -58 Q62 -52 70 -12 Q76 16 34 22 Q-30 26 -60 12 Q-72 2 -62 -34 Z" fill="#fcf7ea" stroke="#d0c3aa" strokeWidth="3" />
        <path d="M-46 -40 Q4 -50 56 -22" fill="none" stroke="#e5dac4" strokeWidth="2.5" />
        <path d="M-44 4 Q6 -6 58 6" fill="none" stroke="#ece2cc" strokeWidth="2" opacity="0.8" />
      </g>
    </g>
  );
}

function AmbulatoryPatient({ visual, anchors, idPrefix }: { visual: PatientVisualState; anchors: SceneAnchors; idPrefix: string }) {
  const torsoWidth = visual.profile.bodyVariant === "broad" ? 58 : visual.profile.bodyVariant === "slender" ? 43 : 51;
  return (
    <g className={styles.ambulatoryPatient} data-movement={visual.movement.intensity} data-seizure={visual.movement.seizure}>
      <ellipse cx={anchors.pelvis.x} cy="617" rx="76" ry="17" fill="#50605c" opacity="0.19" />
      <path d={`M${anchors.upperChest.x - torsoWidth} ${anchors.upperChest.y} Q${anchors.upperChest.x} ${anchors.upperChest.y - 25} ${anchors.upperChest.x + torsoWidth} ${anchors.upperChest.y} L${anchors.pelvis.x + 36} ${anchors.pelvis.y} Q${anchors.pelvis.x} ${anchors.pelvis.y + 20} ${anchors.pelvis.x - 36} ${anchors.pelvis.y} Z`} fill={visual.profile.clothing === "psychiatric-safe" ? "#6d8781" : "#718f95"} stroke="#486864" strokeWidth="2" />
      <path d={`M${anchors.leftUpperArm.x} ${anchors.leftUpperArm.y} Q${anchors.leftForearm.x - 14} ${anchors.leftForearm.y} ${anchors.leftHand.x} ${anchors.leftHand.y}`} stroke={`url(#${idPrefix}-skin-limb)`} strokeWidth="21" strokeLinecap="round" fill="none" />
      <path d={`M${anchors.rightUpperArm.x} ${anchors.rightUpperArm.y} Q${anchors.rightForearm.x + 14} ${anchors.rightForearm.y} ${anchors.rightHand.x} ${anchors.rightHand.y}`} stroke={`url(#${idPrefix}-skin-limb)`} strokeWidth="21" strokeLinecap="round" fill="none" />
      <path d={`M${anchors.leftThigh.x} ${anchors.leftThigh.y} L${anchors.leftLowerLeg.x} ${anchors.leftLowerLeg.y} L${anchors.leftFoot.x} ${anchors.leftFoot.y}`} stroke="#4f6463" strokeWidth="31" strokeLinecap="round" strokeLinejoin="round" fill="none" />
      <path d={`M${anchors.rightThigh.x} ${anchors.rightThigh.y} L${anchors.rightLowerLeg.x} ${anchors.rightLowerLeg.y} L${anchors.rightFoot.x} ${anchors.rightFoot.y}`} stroke="#455b5b" strokeWidth="31" strokeLinecap="round" strokeLinejoin="round" fill="none" />
      <path d={`M${anchors.nose.x - 18} ${anchors.nose.y + 27} Q${anchors.nose.x - 19} ${anchors.nose.y + 46} ${anchors.nose.x - 23} ${anchors.nose.y + 63} L${anchors.nose.x + 9} ${anchors.nose.y + 63} Q${anchors.nose.x + 5} ${anchors.nose.y + 46} ${anchors.nose.x + 4} ${anchors.nose.y + 27} Z`} fill={`url(#${idPrefix}-skin-limb)`} />
      <Face visual={visual} anchors={anchors} idPrefix={idPrefix} />
    </g>
  );
}

function BedPatient({ visual, anchors, idPrefix }: Props) {
  const torsoWidth = visual.profile.bodyVariant === "broad" ? 74 : visual.profile.bodyVariant === "slender" ? 54 : 64;
  const limbWidth = visual.skin.edema > 0 ? 21 + visual.skin.edema * 1.6 : 20;
  const lowerLegWidth = 21 + visual.skin.edema * 1.4;
  const gownColor = visual.profile.clothing === "procedural-gown" ? "#7b9ba0" : visual.profile.clothing === "icu-gown" ? "#668b8d" : "#77979b";
  // Face-ellipse center; the neck is drawn as a tapered polygon from inside the
  // head ellipse to under the gown collar so the join never gaps or bulges.
  const fx = anchors.nose.x - 7;
  const fy = anchors.nose.y + 1;
  const midX = (fx + anchors.upperChest.x) / 2;
  const midY = (fy + anchors.upperChest.y) / 2;
  return (
    <g className={styles.patient} data-loc={visual.consciousness.level} data-movement={visual.movement.intensity} data-seizure={visual.movement.seizure} data-guarding={visual.movement.guarding}>
      <path d={`M${fx + 6} ${fy + 26} Q${midX - 4} ${midY + 15} ${anchors.upperChest.x - 24} ${anchors.upperChest.y + 14} L${anchors.upperChest.x + 4} ${anchors.upperChest.y - 4} Q${midX + 12} ${midY - 15} ${fx + 25} ${fy + 9} Z`} fill={`url(#${idPrefix}-skin-limb)`} />
      <path d={`M${fx + 9} ${fy + 26} Q${fx + 19} ${fy + 32} ${fx + 27} ${fy + 22}`} fill="none" stroke="var(--skin-shadow)" strokeWidth="2" strokeLinecap="round" opacity="0.28" />
      <path d={`M${fx + 22} ${fy + 16} Q${midX + 2} ${midY + 2} ${anchors.upperChest.x - 12} ${anchors.upperChest.y + 4}`} fill="none" stroke="var(--skin-shadow)" strokeWidth="1.2" strokeLinecap="round" opacity="0.3" />
      <g className={styles.chestMotion}>
        <path d={`M${anchors.upperChest.x - torsoWidth} ${anchors.upperChest.y - 15} Q${anchors.upperChest.x} ${anchors.upperChest.y - 34} ${anchors.upperChest.x + torsoWidth} ${anchors.upperChest.y - 4} L${anchors.pelvis.x + 35} ${anchors.pelvis.y + 18} Q${anchors.abdomen.x} ${anchors.abdomen.y + 38} ${anchors.upperChest.x - torsoWidth + 15} ${anchors.upperChest.y + 35} Z`} fill={gownColor} stroke="#4d7172" strokeWidth="2.2" />
        <path d={`M${anchors.upperChest.x - torsoWidth} ${anchors.upperChest.y - 15} Q${anchors.upperChest.x} ${anchors.upperChest.y - 34} ${anchors.upperChest.x + torsoWidth} ${anchors.upperChest.y - 4} L${anchors.pelvis.x + 35} ${anchors.pelvis.y + 18} Q${anchors.abdomen.x} ${anchors.abdomen.y + 38} ${anchors.upperChest.x - torsoWidth + 15} ${anchors.upperChest.y + 35} Z`} fill={`url(#${idPrefix}-gown-shade)`} />
        <path d={`M${anchors.upperChest.x - 35} ${anchors.upperChest.y - 14} L${anchors.upperChest.x} ${anchors.upperChest.y + 12} L${anchors.upperChest.x + 36} ${anchors.upperChest.y - 7}`} fill="none" stroke="#bad0cf" strokeWidth="2.2" opacity="0.7" />
        <path d={`M${anchors.upperChest.x - 58} ${anchors.upperChest.y + 6} Q${anchors.lowerChest.x} ${anchors.lowerChest.y + 18} ${anchors.upperChest.x + 60} ${anchors.upperChest.y + 12}`} fill="none" stroke="#4b7273" strokeWidth="1.4" opacity="0.65" />
      </g>
      <g className={styles.accessoryMotion} data-active={visual.respiration.accessoryMuscleUse}>
        <path d={`M${anchors.upperChest.x - 54} ${anchors.upperChest.y - 9} Q${anchors.neck.x - 25} ${anchors.neck.y + 14} ${anchors.neck.x - 9} ${anchors.neck.y + 4}`} fill="none" stroke="var(--skin-shadow)" strokeWidth="3" opacity={visual.respiration.accessoryMuscleUse ? 0.55 : 0} />
        <path d={`M${anchors.upperChest.x + 54} ${anchors.upperChest.y - 4} Q${anchors.neck.x + 25} ${anchors.neck.y + 14} ${anchors.neck.x + 9} ${anchors.neck.y + 4}`} fill="none" stroke="var(--skin-shadow)" strokeWidth="3" opacity={visual.respiration.accessoryMuscleUse ? 0.55 : 0} />
      </g>
      <path d={`M${anchors.leftUpperArm.x} ${anchors.leftUpperArm.y} Q${anchors.leftForearm.x} ${anchors.leftForearm.y} ${anchors.leftHand.x} ${anchors.leftHand.y}`} stroke={`url(#${idPrefix}-skin-limb)`} strokeWidth={limbWidth} strokeLinecap="round" fill="none" />
      <path d={`M${anchors.rightUpperArm.x} ${anchors.rightUpperArm.y} Q${anchors.rightForearm.x} ${anchors.rightForearm.y} ${anchors.rightHand.x} ${anchors.rightHand.y}`} stroke={`url(#${idPrefix}-skin-limb)`} strokeWidth={limbWidth} strokeLinecap="round" fill="none" />
      <ellipse cx={anchors.leftHand.x} cy={anchors.leftHand.y} rx={11 + visual.skin.edema} ry={7 + visual.skin.edema * 0.7} fill={`url(#${idPrefix}-skin-limb)`} />
      <ellipse cx={anchors.rightHand.x} cy={anchors.rightHand.y} rx={11 + visual.skin.edema} ry={7 + visual.skin.edema * 0.7} fill={`url(#${idPrefix}-skin-limb)`} />
      <path d={`M${anchors.pelvis.x - 38} ${anchors.pelvis.y - 3} Q${anchors.leftThigh.x} ${anchors.leftThigh.y + 13} ${anchors.leftLowerLeg.x} ${anchors.leftLowerLeg.y} T${anchors.leftFoot.x} ${anchors.leftFoot.y}`} stroke="#d9e3df" strokeWidth={42 + visual.skin.edema * 1.4} strokeLinecap="round" fill="none" />
      <path d={`M${anchors.pelvis.x - 18} ${anchors.pelvis.y - 11} Q${anchors.rightThigh.x} ${anchors.rightThigh.y - 9} ${anchors.rightLowerLeg.x} ${anchors.rightLowerLeg.y} T${anchors.rightFoot.x} ${anchors.rightFoot.y}`} stroke="#cbdad5" strokeWidth={39 + visual.skin.edema * 1.4} strokeLinecap="round" fill="none" />
      {/* Blanket over the legs. Toned distinctly from the white mattress with a
          turned-down cuff and drape folds, so covered limbs read as a body under
          bedding rather than as empty bed — and the feet emerging below read as
          attached. */}
      <g data-bedding="blanket">
        <path d={`M${anchors.abdomen.x - 70} ${anchors.abdomen.y - 5} Q${anchors.pelvis.x} ${anchors.pelvis.y + 24} ${anchors.leftLowerLeg.x + 8} ${anchors.leftLowerLeg.y + 12} L${anchors.rightLowerLeg.x + 26} ${anchors.rightLowerLeg.y + 39} Q${anchors.pelvis.x} ${anchors.pelvis.y + 58} ${anchors.abdomen.x - 66} ${anchors.abdomen.y + 24} Z`} fill="#b7cbc2" stroke="#8fa89d" strokeWidth="2" />
        {/* drape folds following the limbs beneath */}
        <path d={`M${anchors.pelvis.x - 10} ${anchors.pelvis.y + 6} Q${anchors.leftThigh.x + 20} ${anchors.leftThigh.y + 20} ${anchors.leftLowerLeg.x + 30} ${anchors.leftLowerLeg.y + 16}`} fill="none" stroke="#a3bcb1" strokeWidth="2.4" opacity="0.85" />
        <path d={`M${anchors.pelvis.x + 6} ${anchors.pelvis.y + 26} Q${anchors.rightThigh.x + 26} ${anchors.rightThigh.y + 34} ${anchors.rightLowerLeg.x + 44} ${anchors.rightLowerLeg.y + 32}`} fill="none" stroke="#a3bcb1" strokeWidth="2.4" opacity="0.7" />
        <path d={`M${anchors.leftThigh.x - 4} ${anchors.leftThigh.y + 2} Q${anchors.leftThigh.x + 4} ${anchors.leftThigh.y + 22} ${anchors.leftThigh.x - 2} ${anchors.leftThigh.y + 40}`} fill="none" stroke="#a3bcb1" strokeWidth="1.8" opacity="0.6" />
        {/* turned-down cuff at the chest edge */}
        <path d={`M${anchors.abdomen.x - 72} ${anchors.abdomen.y - 6} Q${anchors.pelvis.x - 40} ${anchors.pelvis.y + 12} ${anchors.pelvis.x + 4} ${anchors.pelvis.y + 20} L${anchors.pelvis.x + 2} ${anchors.pelvis.y + 34} Q${anchors.pelvis.x - 44} ${anchors.pelvis.y + 26} ${anchors.abdomen.x - 68} ${anchors.abdomen.y + 9} Z`} fill="#dfeae4" stroke="#a9c0b6" strokeWidth="1.8" />
        {/* hem shadow where the blanket ends and the shins emerge */}
        <path d={`M${anchors.leftLowerLeg.x + 6} ${anchors.leftLowerLeg.y + 11} L${anchors.rightLowerLeg.x + 24} ${anchors.rightLowerLeg.y + 38}`} stroke="#8fa89d" strokeWidth="3" strokeLinecap="round" opacity="0.75" />
      </g>
      <g data-skin-region="distal-lower-extremities">
        <path d={`M${anchors.leftLowerLeg.x + 2} ${anchors.leftLowerLeg.y + 11} Q${anchors.leftFoot.x - 25} ${anchors.leftFoot.y + 5} ${anchors.leftFoot.x} ${anchors.leftFoot.y}`} stroke={`url(#${idPrefix}-skin-limb)`} strokeWidth={lowerLegWidth} strokeLinecap="round" fill="none" />
        <path d={`M${anchors.rightLowerLeg.x + 20} ${anchors.rightLowerLeg.y + 24} Q${anchors.rightFoot.x - 22} ${anchors.rightFoot.y + 9} ${anchors.rightFoot.x} ${anchors.rightFoot.y + 5}`} stroke={`url(#${idPrefix}-skin-limb)`} strokeWidth={lowerLegWidth} strokeLinecap="round" fill="none" />
        <ellipse cx={anchors.leftFoot.x + 5} cy={anchors.leftFoot.y} rx={15 + visual.skin.edema} ry={7 + visual.skin.edema * 0.7} fill={`url(#${idPrefix}-skin-limb)`} />
        <ellipse cx={anchors.rightFoot.x + 5} cy={anchors.rightFoot.y + 5} rx={15 + visual.skin.edema} ry={7 + visual.skin.edema * 0.7} fill={`url(#${idPrefix}-skin-limb)`} />
      </g>
      {visual.skin.bleeding > 0 && visual.roomPreset === "medical-surgical" ? <g><rect x={anchors.abdomen.x - 25} y={anchors.abdomen.y - 9} width="52" height="27" rx="5" fill="#f0eee6" stroke="#b6a68b" strokeWidth="2" /><ellipse cx={anchors.abdomen.x + 11} cy={anchors.abdomen.y + 5} rx={8 + visual.skin.bleeding * 3} ry={4 + visual.skin.bleeding * 2} fill="#9b4d4e" opacity={0.33 + visual.skin.bleeding * 0.13} /></g> : null}
      {visual.skin.mottling > 0 ? <g data-skin-overlay="mottling" opacity={0.12 + visual.skin.mottling * 0.1}><path d={`M${anchors.leftLowerLeg.x + 2} ${anchors.leftLowerLeg.y + 11} Q${anchors.leftFoot.x - 25} ${anchors.leftFoot.y + 5} ${anchors.leftFoot.x + 10} ${anchors.leftFoot.y}`} stroke={`url(#${idPrefix}-mottling)`} strokeWidth={Math.max(11, lowerLegWidth - 5)} strokeLinecap="round" fill="none" /><path d={`M${anchors.rightLowerLeg.x + 20} ${anchors.rightLowerLeg.y + 24} Q${anchors.rightFoot.x - 22} ${anchors.rightFoot.y + 9} ${anchors.rightFoot.x + 10} ${anchors.rightFoot.y + 5}`} stroke={`url(#${idPrefix}-mottling)`} strokeWidth={Math.max(11, lowerLegWidth - 5)} strokeLinecap="round" fill="none" /><ellipse cx={anchors.leftHand.x} cy={anchors.leftHand.y} rx="10" ry="5" fill={`url(#${idPrefix}-mottling)`} /><ellipse cx={anchors.rightHand.x} cy={anchors.rightHand.y} rx="10" ry="5" fill={`url(#${idPrefix}-mottling)`} /></g> : null}
      {visual.skin.cyanosis > 0 ? <g data-skin-overlay="cyanosis" fill="var(--skin-cyanosis)" opacity={0.16 + visual.skin.cyanosis * 0.1}><ellipse cx={anchors.leftHand.x} cy={anchors.leftHand.y} rx="10" ry="5" /><ellipse cx={anchors.rightHand.x} cy={anchors.rightHand.y} rx="10" ry="5" /><ellipse cx={anchors.leftFoot.x + 8} cy={anchors.leftFoot.y} rx="11" ry="4" /><ellipse cx={anchors.rightFoot.x + 8} cy={anchors.rightFoot.y + 5} rx="11" ry="4" /></g> : null}
      <Face visual={visual} anchors={anchors} idPrefix={idPrefix} />
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
      <SkinDefs idPrefix={idPrefix} />
      {visual.position.ambulatory ? <AmbulatoryPatient visual={visual} anchors={anchors} idPrefix={idPrefix} /> : <><Bed anchors={anchors} idPrefix={idPrefix} /><BedPatient visual={visual} anchors={anchors} idPrefix={idPrefix} /></>}
    </g>
  );
}
