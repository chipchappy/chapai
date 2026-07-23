import type { SceneAnchors, SceneConnection } from "@/lib/clinical-simulation/scene-geometry";
import type { PatientVisualState } from "@/lib/clinical-simulation/visual-state";
import styles from "./patient-scene.module.css";

type SceneVitals = {
  heartRate: number;
  spo2: number;
  systolic: number;
  diastolic: number;
  respiratoryRate: number;
};

type Props = {
  visual: PatientVisualState;
  anchors: SceneAnchors;
  connections: SceneConnection[];
  idPrefix: string;
  vitals?: SceneVitals;
};

function ConnectionLines({ connections }: { connections: SceneConnection[] }) {
  return <g className={styles.connectionLayer} data-testid="scene-connections" aria-hidden="true">{connections.map((item) => <g key={item.id}><path d={item.path} fill="none" stroke="#f5f7f5" strokeWidth={item.width + 2.2} opacity="0.58" strokeLinecap="round" /><path d={item.path} fill="none" stroke={item.stroke} strokeWidth={item.width} strokeDasharray={item.dashed ? "8 6" : undefined} strokeLinecap="round" data-connection={item.kind} /></g>)}</g>;
}

function OxygenDevice({ visual, anchors }: Pick<Props, "visual" | "anchors">) {
  const { oxygen } = visual.devices;
  if (oxygen === "room-air") return null;
  const nose = anchors.nose;
  const mouth = anchors.mouth;
  if (oxygen === "nasal-cannula" || oxygen === "high-flow-nasal-cannula") {
    const thick = oxygen === "high-flow-nasal-cannula" ? 5.2 : 2.7;
    return <g className={styles.oxygenDevice} data-device={oxygen}><path d={`M${nose.x - 7} ${nose.y + 1} Q${nose.x} ${nose.y + 6} ${nose.x + 7} ${nose.y + 1}`} fill="none" stroke="#a8d8d4" strokeWidth={thick} strokeLinecap="round" /><path d={`M${nose.x - 4} ${nose.y + 1} V${nose.y - 3} M${nose.x + 4} ${nose.y + 1} V${nose.y - 3}`} stroke="#9bd0cd" strokeWidth={oxygen === "high-flow-nasal-cannula" ? 3.4 : 1.8} strokeLinecap="round" /><path d={`M${nose.x - 7} ${nose.y + 1} Q${nose.x - 26} ${nose.y + 4} ${anchors.leftCheek.x - 8} ${anchors.leftCheek.y + 8} M${nose.x + 7} ${nose.y + 1} Q${nose.x + 27} ${nose.y + 4} ${anchors.rightCheek.x + 8} ${anchors.rightCheek.y + 8}`} fill="none" stroke="#9ecfcd" strokeWidth={thick * 0.7} /></g>;
  }
  if (oxygen === "tracheostomy-collar" || oxygen === "t-piece") {
    return <g className={styles.oxygenDevice} data-device={oxygen}><rect x={anchors.neck.x - 13} y={anchors.neck.y - 7} width="26" height="16" rx="6" fill="#dbe9e5" stroke="#7fa9a2" strokeWidth="2" /><circle cx={anchors.neck.x} cy={anchors.neck.y} r="5" fill="#8fbeb5" /></g>;
  }
  if (oxygen === "mechanical-ventilation") {
    return <g className={styles.oxygenDevice} data-device={oxygen}><path d={`M${mouth.x - 3} ${mouth.y - 1} L${mouth.x + 4} ${mouth.y + 3} L${mouth.x + 19} ${mouth.y + 2}`} stroke="#dde8e5" strokeWidth="7" strokeLinecap="round" /><rect x={mouth.x + 11} y={mouth.y - 5} width="11" height="13" rx="2" fill="#8aa59f" /><path d={`M${mouth.x - 15} ${mouth.y - 10} Q${mouth.x} ${mouth.y - 21} ${mouth.x + 18} ${mouth.y - 8}`} fill="none" stroke="#738c87" strokeWidth="3" /></g>;
  }
  if (oxygen === "bag-mask") {
    return <g className={styles.oxygenDevice} data-device={oxygen}><path d={`M${nose.x - 17} ${nose.y - 8} Q${nose.x} ${nose.y - 19} ${nose.x + 18} ${nose.y - 7} L${mouth.x + 14} ${mouth.y + 14} Q${mouth.x} ${mouth.y + 22} ${mouth.x - 15} ${mouth.y + 13} Z`} fill="#a9c7c0" opacity="0.72" stroke="#618780" strokeWidth="2.5" /><path d={`M${mouth.x + 15} ${mouth.y + 7} C${mouth.x + 49} ${mouth.y + 13} ${mouth.x + 44} ${mouth.y + 45} ${mouth.x + 80} ${mouth.y + 43}`} fill="none" stroke="#7fa39b" strokeWidth="8" /><ellipse cx={mouth.x + 105} cy={mouth.y + 45} rx="30" ry="18" fill="#75a998" stroke="#426b5f" strokeWidth="3" /></g>;
  }
  const reservoir = oxygen === "non-rebreather";
  return <g className={styles.oxygenDevice} data-device={oxygen}><path d={`M${nose.x - 17} ${nose.y - 8} Q${nose.x} ${nose.y - 18} ${nose.x + 18} ${nose.y - 7} L${mouth.x + 14} ${mouth.y + 14} Q${mouth.x} ${mouth.y + 22} ${mouth.x - 15} ${mouth.y + 13} Z`} fill={oxygen === "venturi-mask" ? "#c8d8cc" : "#b8d0cc"} opacity="0.72" stroke="#668e88" strokeWidth="2.3" /><path d={`M${nose.x - 17} ${nose.y - 5} Q${nose.x - 29} ${nose.y + 2} ${anchors.leftCheek.x - 8} ${anchors.leftCheek.y + 8} M${nose.x + 18} ${nose.y - 5} Q${nose.x + 30} ${nose.y + 1} ${anchors.rightCheek.x + 8} ${anchors.rightCheek.y + 8}`} fill="none" stroke="#6c918b" strokeWidth="2.2" />{reservoir ? <path d={`M${mouth.x + 3} ${mouth.y + 19} Q${mouth.x + 27} ${mouth.y + 30} ${mouth.x + 17} ${mouth.y + 65} Q${mouth.x - 2} ${mouth.y + 76} ${mouth.x - 12} ${mouth.y + 49} Z`} fill="#dce9e4" stroke="#809c97" strokeWidth="2" opacity="0.88" /> : null}{oxygen === "bipap" || oxygen === "cpap" ? <path d={`M${nose.x - 20} ${nose.y - 11} Q${mouth.x} ${mouth.y + 1} ${mouth.x + 19} ${mouth.y + 17}`} fill="none" stroke="#517b76" strokeWidth="5" /> : null}</g>;
}

function EcgLeads({ visual, anchors }: Pick<Props, "visual" | "anchors">) {
  if (!visual.devices.ecgLeads) return null;
  const junction = { x: anchors.upperChest.x + 82, y: anchors.upperChest.y - 50 };
  const electrodes = [
    { x: anchors.upperChest.x - 38, y: anchors.upperChest.y - 2 },
    { x: anchors.upperChest.x + 38, y: anchors.upperChest.y + 2 },
    { x: anchors.lowerChest.x - 29, y: anchors.lowerChest.y + 20 },
    { x: anchors.lowerChest.x + 27, y: anchors.lowerChest.y + 20 },
  ];
  return <g className={styles.ecgLeadLayer} data-device="ecg-leads" aria-hidden="true"><path d={`M${anchors.monitor.x - 42} ${anchors.monitor.y + 40} C${anchors.monitor.x - 120} ${anchors.monitor.y + 125} ${junction.x + 105} ${junction.y - 36} ${junction.x} ${junction.y}`} fill="none" stroke="#f4f6f4" strokeWidth="6" opacity="0.56" strokeLinecap="round" /><path d={`M${anchors.monitor.x - 42} ${anchors.monitor.y + 40} C${anchors.monitor.x - 120} ${anchors.monitor.y + 125} ${junction.x + 105} ${junction.y - 36} ${junction.x} ${junction.y}`} fill="none" stroke="#566664" strokeWidth="3" strokeLinecap="round" />{electrodes.map((item, index) => <g key={`${item.x}-${item.y}`}><path d={`M${junction.x} ${junction.y} Q${junction.x - 22 - index * 5} ${junction.y + 22 + index * 7} ${item.x} ${item.y}`} fill="none" stroke={["#b9c6c4", "#d8c387", "#8ab0a6", "#c48b8b"][index]} strokeWidth="1.5" opacity="0.88" /><circle cx={item.x} cy={item.y} r="8" fill="#e6ebe7" stroke="#6e817d" strokeWidth="2" /><circle cx={item.x} cy={item.y} r="3" fill="#8ca19c" /></g>)}</g>;
}

function DefibrillationPads({ visual, anchors }: Pick<Props, "visual" | "anchors">) {
  if (visual.devices.defibrillationPads === "none") return null;
  const anteriorPosterior = visual.devices.defibrillationPads === "anterior-posterior";
  return <g className={styles.defibPads} data-device="defibrillation-pads" data-placement={visual.devices.defibrillationPads} aria-hidden="true"><g transform={`translate(${anchors.upperChest.x - 42} ${anchors.upperChest.y - 1}) rotate(-12)`}><rect x="-17" y="-23" width="34" height="46" rx="6" fill="#ecebe1" stroke="#8a8e86" strokeWidth="2" /><path d="M-8 -13 H8 M0 -19 V-7" stroke="#b76459" strokeWidth="3" /></g><g transform={`translate(${anchors.lowerChest.x + (anteriorPosterior ? 0 : 43)} ${anchors.lowerChest.y + 17}) rotate(13)`}><rect x="-18" y="-23" width="36" height="46" rx="6" fill="#ecebe1" stroke="#8a8e86" strokeWidth="2" /><path d="M-9 -13 H9 M0 -19 V-7" stroke="#b76459" strokeWidth="3" /></g></g>;
}

function IvSites({ visual, anchors }: Pick<Props, "visual" | "anchors">) {
  return <g data-device="iv-access" aria-hidden="true">{visual.devices.ivSites.map((site) => {
    const anchor = site.side === "left" ? (site.site === "hand" ? anchors.leftHand : site.site === "neck" ? anchors.neck : anchors.leftForearm) : (site.site === "hand" ? anchors.rightHand : site.site === "neck" ? anchors.neck : anchors.rightForearm);
    const concerning = /infiltrat|leak|phlebit|bleed|dislodg|occlud/i.test(site.status);
    return <g key={site.id} transform={`translate(${anchor.x} ${anchor.y}) rotate(${site.side === "left" ? -12 : 12})`}><rect x="-16" y="-7" width="32" height="14" rx="5" fill="#edf1ed" stroke={concerning ? "#bd6359" : "#7f9993"} strokeWidth="2" opacity="0.95" /><path d="M-10 0 H10" stroke={concerning ? "#bd6359" : "#5a8b88"} strokeWidth="3" /><circle cx="13" cy="0" r="4" fill="#78a7a4" /></g>;
  })}</g>;
}

function IvBag({ x, tone }: { x: number; tone: string }) {
  const fluid = tone === "vasopressor" ? "#e8d9a8" : tone === "antibiotic" ? "#d5e8de" : "#dfe9ec";
  return (
    <g transform={`translate(${x} -188)`} data-device="iv-bag">
      <path d="M0 0 V9" stroke="#758782" strokeWidth="2.5" />
      <path d="M-14 12 Q-14 9 -10 9 H10 Q14 9 14 12 L14 50 Q14 56 8 58 H-8 Q-14 56 -14 50 Z" fill="#eff4f1" stroke="#8fa39d" strokeWidth="2" opacity="0.95" />
      <path d="M-11 30 H11 V50 Q11 53 7 55 H-7 Q-11 53 -11 50 Z" fill={fluid} opacity="0.85" />
      <path d="M-8 20 H8" stroke="#b7c6c0" strokeWidth="4" opacity="0.8" />
      <path d="M0 58 V66" stroke="#9db1ab" strokeWidth="2.2" />
      <rect x="-3.5" y="66" width="7" height="11" rx="3" fill="#eef3f0" stroke="#8fa39d" strokeWidth="1.4" />
      <circle cx="0" cy="70.5" r="1.5" fill="#9fc3ba" />
    </g>
  );
}

function IvPoleAndPumps({ visual, anchors }: Pick<Props, "visual" | "anchors">) {
  const visible = visual.devices.ivSites.length > 0 || visual.devices.pumps.length > 0;
  if (!visible) return null;
  return (
    <g transform={`translate(${anchors.ivPole.x} ${anchors.ivPole.y})`} data-device="infusion-pumps" aria-hidden="true">
      <path d="M0 -190 V267" stroke="#667976" strokeWidth="7" /><path d="M-56 -190 H56 M0 267 L-44 292 M0 267 L44 292" stroke="#667976" strokeWidth="7" strokeLinecap="round" /><circle cx="-44" cy="293" r="9" fill="#425451" /><circle cx="44" cy="293" r="9" fill="#425451" />
      <path d="M-44 -190 v6 M44 -190 v6" stroke="#667976" strokeWidth="4" strokeLinecap="round" />
      {visual.devices.pumps.length === 0
        ? <IvBag x={0} tone="fluid" />
        : visual.devices.pumps.slice(0, 2).map((pump, index) => <IvBag key={`bag-${pump.id}`} x={index === 0 ? -36 : 36} tone={pump.tone} />)}
      {visual.devices.pumps.slice(0, 3).map((pump, index) => <g key={pump.id} transform={`translate(-78 ${-112 + index * 85})`}>
        <rect width="142" height="72" rx="8" fill="#e6ece9" stroke="#657976" strokeWidth="3" />
        <rect x="12" y="11" width="93" height="31" rx="4" fill="#1f3331" />
        <text x="19" y="24" fill={pump.tone === "vasopressor" ? "#f3d36f" : pump.tone === "antibiotic" ? "#87d4c4" : "#b5d5dc"} fontSize="9" fontWeight="700">{pump.label.toUpperCase().slice(0, 18)}</text>
        <text x="19" y="36" fill="#dce8e4" fontSize="8">{pump.rate.slice(0, 22)}</text>
        <circle cx="120" cy="20" r="6" fill={pump.state === "alarm" ? "#d15f56" : pump.state === "running" ? "#6cad7e" : "#899996"} />
        <g fill="#95a8a3"><circle cx="22" cy="55" r="3.4" /><circle cx="36" cy="55" r="3.4" /><circle cx="50" cy="55" r="3.4" /><circle cx="64" cy="55" r="3.4" /></g>
        <rect x="110" y="36" width="22" height="28" rx="3" fill="#d7e0dc" stroke="#7c8f8a" strokeWidth="1.6" />
        <path d="M114 42 L128 58" stroke="#67807a" strokeWidth="2.5" strokeLinecap="round" />
      </g>)}
    </g>
  );
}

function UrinaryDrainage({ visual, anchors }: Pick<Props, "visual" | "anchors">) {
  if (!visual.devices.urinaryDrainage.visible) return null;
  const fill = 14 + visual.devices.urinaryDrainage.fillRatio * 50;
  const color = { straw: "#e1ca72", amber: "#c69242", dark: "#9a6d33", red: "#9e5351" }[visual.devices.urinaryDrainage.color];
  return <g transform={`translate(${anchors.urinaryBag.x} ${anchors.urinaryBag.y})`} data-device="urinary-drainage" aria-hidden="true"><path d="M-43 -80 H43 L36 15 Q0 34 -36 15 Z" fill="#eaf0ed" stroke="#728d87" strokeWidth="3" opacity="0.91" /><path d={`M-32 ${15 - fill} H32 L29 13 Q0 26 -29 13 Z`} fill={color} opacity="0.75" /><path d="M-24 -63 H24 M-24 -45 H24 M-24 -27 H24" stroke="#9baba7" strokeWidth="1.4" /><text x="0" y="2" textAnchor="middle" fill="#596f6a" fontSize="10" fontWeight="700">UROMETER</text></g>;
}

function DrainSystem({ visual, anchors }: Pick<Props, "visual" | "anchors">) {
  if (!visual.devices.drain.visible) return null;
  const fluid = visual.devices.drain.color === "sanguineous" ? "#9f4e50" : visual.devices.drain.color === "serosanguineous" ? "#c5796d" : "#d7c58f";
  if (visual.devices.chestTube) return <g transform={`translate(${anchors.drainSystem.x} ${anchors.drainSystem.y})`} data-device="chest-tube" aria-hidden="true"><rect x="-45" y="-77" width="90" height="94" rx="6" fill="#e9efed" stroke="#718984" strokeWidth="3" opacity="0.95" /><rect x="-34" y="-21" width="68" height="26" fill={fluid} opacity="0.72" /><path d="M-22 -63 V-5 M0 -63 V-5 M22 -63 V-5" stroke="#9baaa6" strokeWidth="2" /><text x="0" y="35" textAnchor="middle" fill="#516863" fontSize="10" fontWeight="700">PLEURAL DRAIN</text></g>;
  return <g transform={`translate(${anchors.drainSystem.x} ${anchors.drainSystem.y})`} data-device="surgical-drain" data-drain-kind={visual.devices.drain.kind} aria-hidden="true"><path d="M-20 -36 Q0 -56 20 -36 L17 10 Q0 24 -17 10 Z" fill="#e9efeb" stroke="#758c87" strokeWidth="3" /><path d="M-15 -3 Q0 11 15 -3 L14 9 Q0 19 -14 9 Z" fill={fluid} opacity="0.78" /><text x="0" y="38" textAnchor="middle" fill="#536a65" fontSize="10" fontWeight="700">{visual.devices.drain.kind === "jp" ? "JP" : "DRAIN"}</text></g>;
}

function Ventilator({ visual, anchors }: Pick<Props, "visual" | "anchors">) {
  if (!visual.devices.mechanicalVentilation) return null;
  const settings = visual.devices.ventilator;
  return <g transform={`translate(${anchors.ventilator.x} ${anchors.ventilator.y})`} data-device="ventilator" aria-hidden="true"><rect x="-84" y="-117" width="168" height="142" rx="12" fill="#e3eae7" stroke="#5f7772" strokeWidth="5" /><rect x="-68" y="-99" width="136" height="76" rx="6" fill="#152b29" /><path d="M-58 -55 Q-36 -89 -14 -52 T30 -55 T58 -55" fill="none" stroke="#77d4a5" strokeWidth="3" /><text x="-58" y="-83" fill="#9fc7bc" fontSize="10" fontWeight="700">{settings.mode}</text><text x="-58" y="-32" fill="#dce9e5" fontSize="9">RR {settings.setRate}  PEEP {settings.peep}</text><text x="58" y="-32" textAnchor="end" fill="#d6ba6e" fontSize="9">FiO2 {settings.fio2}</text><circle cx="-52" cy="1" r="8" fill={settings.alarm ? "#d8685c" : "#72ae83"} /><path d="M-31 1 H49" stroke="#9eafab" strokeWidth="7" strokeLinecap="round" /><path d="M-57 25 V108 M57 25 V108" stroke="#667b77" strokeWidth="7" /><circle cx="-57" cy="116" r="11" fill="#5a4f40" /><circle cx="57" cy="116" r="11" fill="#5a4f40" /><text x="0" y="50" textAnchor="middle" fill="#4c625e" fontSize="10" fontWeight="700">{settings.synchrony.toUpperCase()}</text></g>;
}

function Defibrillator({ visual, anchors }: Pick<Props, "visual" | "anchors">) {
  if (!visual.devices.defibrillatorVisible) return null;
  return <g transform={`translate(${anchors.defibrillator.x} ${anchors.defibrillator.y})`} data-device="defibrillator-monitor" aria-hidden="true"><rect x="-68" y="-62" width="136" height="93" rx="9" fill="#e1e6e3" stroke="#5e706d" strokeWidth="4" /><rect x="-53" y="-48" width="78" height="45" rx="4" fill="#172725" /><path d="M-45 -25 H-29 L-24 -39 L-16 -11 L-8 -26 H16" fill="none" stroke="#65d596" strokeWidth="2" /><circle cx="45" cy="-37" r="10" fill="#d5b35d" /><circle cx="45" cy="-10" r="10" fill="#c86158" /><text x="0" y="19" textAnchor="middle" fill="#4d615e" fontSize="9" fontWeight="700">DEFIBRILLATOR / MONITOR</text><path d="M-48 31 V69 M48 31 V69" stroke="#60736f" strokeWidth="6" /><circle cx="-48" cy="75" r="9" fill="#455754" /><circle cx="48" cy="75" r="9" fill="#455754" /></g>;
}

function SceneMonitor({ visual, anchors, vitals }: Pick<Props, "visual" | "anchors" | "vitals">) {
  if (!visual.devices.ecgLeads) return null;
  const alarm = visual.roomLighting === "emergency" || (vitals ? vitals.spo2 < 90 || vitals.heartRate > 125 || vitals.heartRate < 50 : false);
  return (
    <g transform={`translate(${anchors.monitor.x} ${anchors.monitor.y})`} aria-hidden="true">
      <rect x="-79" y="-53" width="158" height="106" rx="11" fill="#3c4a47" />
      <rect x="-76" y="-49" width="152" height="94" rx="8" fill="#0d1d1a" stroke="#607773" strokeWidth="3" />
      <text x="-66" y="-37" fill="#8ca39c" fontSize="7.5">BEDSIDE MONITOR</text>
      <circle cx="62" cy="-39" r="4.5" fill={alarm ? "#dc6459" : "#6bb082"} />
      {/* waveform lanes: ECG / pleth / resp */}
      <path d="M-66 -18 H-56 L-51 -30 L-46 2 L-41 -18 H-30 L-26 -26 L-21 -12 H-8 L-4 -30 L2 -6 L6 -18 H22" fill="none" stroke="#67dc98" strokeWidth="2" />
      <path d="M-66 6 q5 -12 10 0 t10 0 t10 0 t10 0 t10 0 t10 0 t10 0 t10 0 t8 0" fill="none" stroke="#56c8ea" strokeWidth="1.6" />
      <path d="M-66 26 q11 -10 22 0 t22 0 t22 0 t22 0" fill="none" stroke="#e0b866" strokeWidth="1.6" />
      <path d="M26 -46 V40" stroke="#1f332f" strokeWidth="1.5" />
      {/* numeric column */}
      <text x="32" y="-24" fill="#5f7b74" fontSize="6">HR</text>
      <text x="32" y="-10" fill="#67dc98" fontSize="14" fontWeight="700" fontFamily="ui-monospace, monospace">{vitals ? Math.round(vitals.heartRate) : "--"}</text>
      <text x="32" y="2" fill="#5f7b74" fontSize="6">SpO₂</text>
      <text x="32" y="15" fill="#56c8ea" fontSize="12" fontWeight="700" fontFamily="ui-monospace, monospace">{vitals ? Math.round(vitals.spo2) : "--"}</text>
      <text x="32" y="26" fill="#5f7b74" fontSize="6">RR</text>
      <text x="32" y="38" fill="#e0b866" fontSize="11" fontWeight="700" fontFamily="ui-monospace, monospace">{vitals ? Math.round(vitals.respiratoryRate) : "--"}</text>
      <text x="-66" y="38" fill="#cfe0da" fontSize="8" fontFamily="ui-monospace, monospace">{vitals ? `${Math.round(vitals.systolic)}/${Math.round(vitals.diastolic)}` : "--/--"} NIBP</text>
    </g>
  );
}

export default function MedicalDevices({ visual, anchors, connections, vitals }: Props) {
  return (
    <g>
      <ConnectionLines connections={connections} />
      <SceneMonitor visual={visual} anchors={anchors} vitals={vitals} />
      <IvPoleAndPumps visual={visual} anchors={anchors} />
      <Ventilator visual={visual} anchors={anchors} />
      <Defibrillator visual={visual} anchors={anchors} />
      <UrinaryDrainage visual={visual} anchors={anchors} />
      <DrainSystem visual={visual} anchors={anchors} />
      <EcgLeads visual={visual} anchors={anchors} />
      <DefibrillationPads visual={visual} anchors={anchors} />
      <IvSites visual={visual} anchors={anchors} />
      <OxygenDevice visual={visual} anchors={anchors} />
      {visual.devices.ecgLeads ? <g data-device="basic-monitoring" aria-hidden="true"><rect x={anchors.leftUpperArm.x - 17} y={anchors.leftUpperArm.y - 14} width="34" height="28" rx="7" fill="#677d7a" opacity="0.9" /><rect x={anchors.rightHand.x - 8} y={anchors.rightHand.y - 5} width="16" height="10" rx="4" fill="#bdc8c4" stroke="#687d79" strokeWidth="1.5" /></g> : null}
    </g>
  );
}
