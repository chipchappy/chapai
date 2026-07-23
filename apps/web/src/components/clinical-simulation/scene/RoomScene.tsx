import type { PatientVisualState } from "@/lib/clinical-simulation/visual-state";

type Props = {
  visual: PatientVisualState;
  idPrefix: string;
  /** Sim virtual minute — drives the wall clock (shift starts at 07:00). */
  virtualMinute?: number;
  roomLabel?: string;
  patientName?: string;
};

/** Parses "4 L/min" / "6L" into a float so the flowmeter ball can ride the scale. */
function parseFlow(raw: string | undefined): number | null {
  if (!raw) return null;
  const match = /([\d.]+)/.exec(raw);
  const value = match ? Number(match[1]) : Number.NaN;
  return Number.isFinite(value) ? value : null;
}

function Headwall({ intensive = false, oxygen = "room-air", oxygenFlow = "none" }: { intensive?: boolean; oxygen?: string; oxygenFlow?: string }) {
  return (
    <g>
      <rect x="220" y="86" width="785" height={intensive ? 164 : 118} rx="13" fill="#e7ece9" stroke="#bac7c2" strokeWidth="2" />
      <rect x="246" y="117" width="735" height="22" rx="5" fill="#99aaa5" />
      <rect x="262" y="122" width="28" height="12" rx="3" fill="#f7fbf8" />
      <circle cx="318" cy="128" r="8" fill="#d7e8de" stroke="#647f76" strokeWidth="3" />
      <circle cx="350" cy="128" r="8" fill="#f0d8ca" stroke="#a36d62" strokeWidth="3" />
      <rect x="388" y="119" width="58" height="17" rx="4" fill="#f4f6f3" stroke="#869994" />
      <rect x="856" y="119" width="42" height="17" rx="4" fill="#f4f6f3" stroke="#869994" />
      <rect x="910" y="119" width="42" height="17" rx="4" fill="#f4f6f3" stroke="#869994" />
      {intensive ? <>
        <rect x="260" y="157" width="188" height="58" rx="6" fill="#f5f7f4" stroke="#c5cfcb" />
        <path d="M278 188 H426" stroke="#a1b0ab" strokeWidth="3" />
        <rect x="751" y="157" width="206" height="58" rx="6" fill="#f5f7f4" stroke="#c5cfcb" />
        <circle cx="782" cy="186" r="12" fill="#d3e0dc" stroke="#78928a" strokeWidth="3" />
        <circle cx="824" cy="186" r="12" fill="#ead6cb" stroke="#9d7068" strokeWidth="3" />
        <rect x="853" y="174" width="81" height="25" rx="5" fill="#dce4e1" />
      </> : null}
      {/* Wall gas station. The flowmeter is LIVE: the indicator ball rides the
          0-15 L/min scale at the flow the engine is actually delivering, and the
          device in use is named — so a student can read the wall the way they
          would at a real bedside. */}
      <g transform={`translate(${intensive ? 600 : 842} ${intensive ? 152 : 146})`} data-room-item="gas-station">
        <rect width="126" height="58" rx="6" fill="#eef2ef" stroke="#b5c2bd" strokeWidth="2" />
        {/* thorpe-tube flowmeter, graduated 0-15 */}
        <rect x="11" y="6" width="15" height="34" rx="3" fill="#f8fbf8" stroke="#7d938d" strokeWidth="1.5" />
        {[0, 1, 2, 3, 4, 5].map((tick) => <path key={tick} d={`M13 ${37 - tick * 6} H${tick % 2 === 0 ? 24 : 20}`} stroke="#c1d0c9" strokeWidth="1" />)}
        {(() => {
          const flow = parseFlow(oxygenFlow) ?? 0;
          const clamped = Math.max(0, Math.min(15, flow));
          const ballY = 37 - (clamped / 15) * 30;
          const flowing = clamped > 0 && oxygen !== "room-air";
          return <>
            {flowing ? <rect x="12.5" y={ballY} width="12" height={38 - ballY} rx="2" fill="#8fc9ad" opacity="0.3" /> : null}
            <circle cx="18.5" cy={ballY} r="3.6" fill={flowing ? "#3f8a63" : "#9fb0a8"} stroke="#2f6449" strokeWidth="1" />
          </>;
        })()}
        <path d="M18.5 40 V44" stroke="#6b7f79" strokeWidth="2" />
        <circle cx="18.5" cy="47" r="4.6" fill="#4f8a67" stroke="#38624a" strokeWidth="1.5" />
        <path d="M16.4 47 H20.6 M18.5 44.9 V49.1" stroke="#dcefe3" strokeWidth="1.1" />
        <text x="33" y="15" fill="#4f8a67" fontSize="8.5" fontWeight="700">O₂ {oxygenFlow !== "none" ? oxygenFlow : "off"}</text>
        <text x="33" y="25" fill="#7d938d" fontSize="6.5" fontWeight="700">{oxygen === "room-air" ? "ROOM AIR" : oxygen.replaceAll("-", " ").toUpperCase().slice(0, 17)}</text>
        {/* christmas-tree adapter */}
        <path d="M36 31 h10 M37.5 35 h7 M39 39 h4" stroke="#5c8f6f" strokeWidth="3" strokeLinecap="round" />
        {/* suction regulator + canister */}
        <rect x="68" y="8" width="20" height="15" rx="3" fill="#dfe7e2" stroke="#7d938d" strokeWidth="1.5" />
        <circle cx="78" cy="15.5" r="4.6" fill="#f4f7f3" stroke="#8a9b95" strokeWidth="1.3" />
        <path d="M78 12.6 V15.5 L80 17.4" stroke="#5c716b" strokeWidth="1.1" fill="none" />
        <rect x="94" y="12" width="18" height="32" rx="4" fill="#f2f6f2" stroke="#8a9b95" strokeWidth="1.5" />
        <rect x="96" y="29" width="14" height="13" rx="2" fill="#d9c98e" opacity="0.55" />
        <path d="M96 33 H110" stroke="#bda86a" strokeWidth="1" opacity="0.7" />
        <rect x="93" y="7" width="20" height="7" rx="2.5" fill="#c98d5f" />
        <text x="65" y="53" fill="#8a9b95" fontSize="6.5" fontWeight="700">SUCTION</text>
      </g>
      {/* spare oxygen devices on wall hooks: nasal cannula coil, simple mask, non-rebreather */}
      <g transform={`translate(${intensive ? 524 : 398} ${intensive ? 158 : 146})`} stroke="#7f938d" fill="none" strokeWidth="1.6">
        <path d="M8 0 v6 M50 0 v6 M92 0 v6" strokeWidth="2.4" stroke="#93a5a0" strokeLinecap="round" />
        <circle cx="8" cy="17" r="9" /><circle cx="8" cy="17" r="5.5" /><path d="M4 27 q4 4 8 0" strokeWidth="1.2" />
        <path d="M42 8 q8 -4 16 0 l-2 14 q-6 5 -12 0 z" fill="#eef4f0" /><path d="M42 10 q-6 3 -4 8 M58 10 q6 3 4 8" strokeWidth="1.1" />
        <path d="M84 8 q8 -4 16 0 l-2 12 q-6 5 -12 0 z" fill="#eef4f0" /><ellipse cx="92" cy="31" rx="6" ry="8" fill="#e3ece6" />
      </g>
    </g>
  );
}

function RoomClock({ night, minute = 0 }: { night: boolean; minute?: number }) {
  // Shift starts at 07:00; the hands advance with virtual time.
  const totalMinutes = 7 * 60 + minute;
  const minuteAngle = ((totalMinutes % 60) * 6 * Math.PI) / 180;
  const hourAngle = (((totalMinutes / 60) % 12) * 30 * Math.PI) / 180;
  const mx = (19 * Math.sin(minuteAngle)).toFixed(1);
  const my = (-19 * Math.cos(minuteAngle)).toFixed(1);
  const hx = (12 * Math.sin(hourAngle)).toFixed(1);
  const hy = (-12 * Math.cos(hourAngle)).toFixed(1);
  return <g transform="translate(1058 88)"><circle r="31" fill="#f8faf7" stroke="#83938e" strokeWidth="4" /><path d="M0 -24 V-21 M24 0 H21 M0 24 V21 M-24 0 H-21" stroke="#9aa8a3" strokeWidth="2" /><path d={`M0 0 L${mx} ${my}`} stroke="#405350" strokeWidth="3" strokeLinecap="round" /><path d={`M0 0 L${hx} ${hy}`} stroke="#405350" strokeWidth="4.4" strokeLinecap="round" /><circle r="3" fill="#405350" /><text y="48" textAnchor="middle" fill={night ? "#d4e0dc" : "#516663"} fontSize="13" fontWeight="700">{night ? "NIGHT" : "DAY"}</text></g>;
}

function PatientWhiteboard({ roomLabel, patientName }: { roomLabel?: string; patientName?: string }) {
  return (
    <g transform="translate(40 282)" data-room-item="whiteboard">
      <rect width="150" height="98" rx="7" fill="#fbfcfa" stroke="#a9b7b1" strokeWidth="3.5" />
      <rect x="8" y="8" width="134" height="20" rx="4" fill="#e3ebe6" />
      <text x="14" y="22" fill="#43615a" fontSize="11" fontWeight="800">ROOM {roomLabel ?? "—"}</text>
      <text x="12" y="44" fill="#4d6a92" fontSize="10.5" fontWeight="700" fontStyle="italic">{(patientName ?? "").slice(0, 20) || "Patient"}</text>
      <text x="12" y="60" fill="#4d6a92" fontSize="9" fontStyle="italic">RN: Student Nurse</text>
      <text x="12" y="75" fill="#4d6a92" fontSize="9" fontStyle="italic">Goal: call, don&apos;t fall</text>
      <path d="M12 84 H100" stroke="#c6d2cc" strokeWidth="1.5" />
      <rect x="118" y="86" width="22" height="6" rx="3" fill="#7d938d" />
    </g>
  );
}

function PrivacyCurtain() {
  return (
    <g data-room-item="curtain" opacity="0.96">
      <path d="M196 78 H236" stroke="#7d8f89" strokeWidth="5" strokeLinecap="round" />
      <path d="M199 82 Q194 200 200 368 Q205 374 210 368 Q206 200 209 82 Z" fill="#b7c9bf" stroke="#93a89e" strokeWidth="1.5" />
      <path d="M212 82 Q209 210 214 372 Q219 378 224 372 Q219 210 222 82 Z" fill="#aec2b7" stroke="#8ba095" strokeWidth="1.5" />
      <path d="M226 82 Q224 190 228 352 Q232 358 236 352 Q233 190 234 82 Z" fill="#b7c9bf" stroke="#93a89e" strokeWidth="1.5" />
      <circle cx="201" cy="80" r="2.4" fill="#5f736d" /><circle cx="214" cy="80" r="2.4" fill="#5f736d" /><circle cx="228" cy="80" r="2.4" fill="#5f736d" />
    </g>
  );
}

function SharpsContainer() {
  return (
    <g transform="translate(968 152)" data-room-item="sharps">
      <rect width="30" height="36" rx="4" fill="#b05a4c" stroke="#8a4238" strokeWidth="2" />
      <rect x="-2" y="-6" width="34" height="9" rx="3" fill="#8a4238" />
      <path d="M9 -1.5 H21" stroke="#f3e6e0" strokeWidth="3" strokeLinecap="round" />
      <circle cx="15" cy="19" r="8" fill="none" stroke="#f3e6e0" strokeWidth="1.8" />
      <path d="M15 13 V25 M9.8 16 L20.2 22 M20.2 16 L9.8 22" stroke="#f3e6e0" strokeWidth="1.6" />
    </g>
  );
}

function Window({ night }: { night: boolean }) {
  return (
    <g transform="translate(38 78)">
      <rect width="150" height="178" rx="9" fill={night ? "#20343c" : "#b9d8df"} stroke="#8ea4a5" strokeWidth="7" />
      <path d="M75 4 V174 M4 89 H146" stroke="#d9e4e1" strokeWidth="5" />
      {night ? <><circle cx="36" cy="39" r="12" fill="#e9deb2" /><circle cx="43" cy="34" r="12" fill="#20343c" /><circle cx="117" cy="52" r="2" fill="#eef4df" /><circle cx="99" cy="26" r="2" fill="#eef4df" /></> : <><circle cx="121" cy="30" r="16" fill="#f1d690" /><path d="M7 139 Q48 102 78 136 Q108 96 146 128 V174 H7 Z" fill="#88aba0" /></>}
    </g>
  );
}

function ProceduralRoom() {
  return <g><Headwall intensive /><g transform="translate(665 55)"><path d="M0 0 V88" stroke="#727f7e" strokeWidth="8" /><ellipse cy="109" rx="77" ry="28" fill="#e9ebe6" stroke="#788684" strokeWidth="7" /><ellipse cy="109" rx="46" ry="14" fill="#f8f3d2" /></g><g transform="translate(43 345)"><rect width="145" height="132" rx="7" fill="#d8e0dd" stroke="#7f9290" strokeWidth="3" /><rect x="13" y="15" width="119" height="25" rx="4" fill="#f6f8f5" /><rect x="13" y="51" width="119" height="25" rx="4" fill="#f6f8f5" /><circle cx="27" cy="139" r="10" fill="#4e6160" /><circle cx="118" cy="139" r="10" fill="#4e6160" /></g></g>;
}

function PsychiatricRoom() {
  return (
    <g>
      <rect x="70" y="92" width="152" height="146" rx="18" fill="#a9c0ba" stroke="#778f89" strokeWidth="8" />
      <rect x="91" y="113" width="110" height="104" rx="8" fill="#d5e3df" />
      <path d="M91 166 H201" stroke="#91aaa4" strokeWidth="6" />
      <rect x="822" y="142" width="284" height="165" rx="10" fill="#e2e7e1" stroke="#a6b3ae" strokeWidth="4" />
      <rect x="845" y="169" width="238" height="95" rx="8" fill="#f5f7f2" />
      <path d="M848 276 H1080" stroke="#899b97" strokeWidth="10" strokeLinecap="round" />
      <g transform="translate(78 432)"><path d="M0 44 Q0 0 44 0 H182 Q226 0 226 44 V85 H0 Z" fill="#a8bbb5" /><path d="M19 32 H206 V67 H19 Z" fill="#d8e2de" /><rect y="80" width="226" height="18" rx="8" fill="#637a76" /></g>
      <text x="964" y="338" textAnchor="middle" fill="#6a7c78" fontSize="15" fontWeight="700">LOW-STIMULATION AREA</text>
    </g>
  );
}

export default function RoomScene({ visual, idPrefix, virtualMinute, roomLabel, patientName }: Props) {
  const night = visual.roomLighting === "night";
  const psychiatric = visual.roomPreset === "psychiatric";
  const procedural = visual.roomPreset === "procedural";
  const intensive = visual.roomPreset === "intensive-care" || visual.roomPreset === "step-down";
  return (
    <g aria-hidden="true" data-room-preset={visual.roomPreset}>
      {/* Depth pass: shading layered over the base fills so every room/lighting
          variant keeps its own palette and only gains dimension. */}
      <defs>
        <linearGradient id={`${idPrefix}-wall-shade`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#243230" stopOpacity="0.17" />
          <stop offset="0.72" stopColor="#243230" stopOpacity="0.03" />
          <stop offset="1" stopColor="#243230" stopOpacity="0" />
        </linearGradient>
        <linearGradient id={`${idPrefix}-floor-shade`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#1d2b29" stopOpacity="0.24" />
          <stop offset="1" stopColor="#1d2b29" stopOpacity="0" />
        </linearGradient>
        <radialGradient id={`${idPrefix}-room-vignette`} cx="50%" cy="45%" r="74%">
          <stop offset="0.55" stopColor="#0e1a19" stopOpacity="0" />
          <stop offset="1" stopColor="#0e1a19" stopOpacity="0.19" />
        </radialGradient>
      </defs>
      <rect width="1200" height="680" fill={night ? "#9ba9a7" : psychiatric ? "#d9e4dd" : "#dce5e1"} />
      <path d="M0 0 H1200 V405 H0 Z" fill={night ? "#9ba9a7" : psychiatric ? "#d8e4dd" : "#e3e9e6"} />
      <rect width="1200" height="405" fill={`url(#${idPrefix}-wall-shade)`} />
      <path d="M0 405 H1200 V680 H0 Z" fill={psychiatric ? "#bfcac2" : "#c8ceca"} />
      <rect y="405" width="1200" height="275" fill={`url(#${idPrefix}-floor-shade)`} />
      <path d="M0 405 H1200" stroke="#aab6b1" strokeWidth="8" />
      <path d="M0 403 H1200" stroke="#8d9c97" strokeWidth="2" opacity="0.5" />
      <path d="M0 680 L350 405 H850 L1200 680" fill={night ? "#8c9694" : "#bdc4c0"} opacity="0.46" />
      {psychiatric ? <PsychiatricRoom /> : procedural ? <ProceduralRoom /> : <Headwall intensive={intensive} oxygen={visual.devices.oxygen} oxygenFlow={visual.devices.oxygenFlow} />}
      {/* ceiling luminaire — fills the empty upper band and gives the room a light source */}
      <g data-room-item="ceiling-light" opacity={night ? 0.5 : 1}>
        <rect x="470" y="24" width="268" height="34" rx="7" fill={night ? "#c3cfca" : "#f7fbf6"} stroke="#b0bfb8" strokeWidth="3" />
        <path d="M492 41 H716" stroke={night ? "#9fb0a8" : "#e8efe6"} strokeWidth="14" strokeLinecap="round" />
        <path d="M508 58 L480 84 M700 58 L728 84" stroke="#c8d4ce" strokeWidth="2" opacity="0.55" />
        {!night ? <ellipse cx="604" cy="120" rx="196" ry="66" fill="#fffdf0" opacity="0.16" /> : null}
      </g>
      {/* visitor chair — the foreground floor read as dead space without it */}
      {!psychiatric ? <g data-room-item="visitor-chair" transform="translate(64 452)">
        <path d="M6 106 V150 M96 106 V150" stroke="#7d8f88" strokeWidth="7" strokeLinecap="round" />
        <path d="M0 60 Q0 44 16 44 H86 Q102 44 102 60 V78 Q102 92 86 92 H16 Q0 92 0 78 Z" fill="#9db3a8" stroke="#789086" strokeWidth="3" />
        <path d="M8 0 Q8 -12 22 -12 H80 Q94 -12 94 0 V48 H8 Z" fill="#adc2b7" stroke="#7d948a" strokeWidth="3" />
        <path d="M20 6 H82" stroke="#c6d6cc" strokeWidth="3" opacity="0.7" />
      </g> : null}
      {!psychiatric ? <><Window night={night} /><RoomClock night={night} minute={virtualMinute} /><PrivacyCurtain /><SharpsContainer /></> : null}
      <PatientWhiteboard roomLabel={roomLabel} patientName={patientName} />
      {visual.roomPreset === "medical-surgical" ? <g transform="translate(1007 338)"><rect width="143" height="92" rx="7" fill="#d8dfdc" stroke="#839592" strokeWidth="3" /><rect x="14" y="13" width="114" height="29" rx="4" fill="#f7f8f5" /><path d="M18 59 H125" stroke="#9aaba7" strokeWidth="4" /><circle cx="23" cy="100" r="9" fill="#4d5f5e" /><circle cx="119" cy="100" r="9" fill="#4d5f5e" /></g> : null}
      {visual.roomPreset === "telemetry" ? <g transform="translate(972 184)"><rect width="152" height="82" rx="9" fill="#293c3b" stroke="#70827f" strokeWidth="4" /><path d="M15 43 H34 L42 24 L52 61 L62 42 H137" fill="none" stroke="#69d899" strokeWidth="3" /><text x="76" y="73" textAnchor="middle" fill="#9eb2ad" fontSize="10">TELEMETRY</text></g> : null}
      {visual.roomPreset === "step-down" ? <g transform="translate(1041 328)"><rect width="79" height="106" rx="8" fill="#e9efec" stroke="#819590" strokeWidth="4" /><circle cx="39" cy="32" r="17" fill="#b9d4cc" /><path d="M20 76 H59" stroke="#708783" strokeWidth="6" strokeLinecap="round" /></g> : null}
      <rect width="1200" height="680" fill={`url(#${idPrefix}-room-vignette)`} />
      {visual.roomLighting === "emergency" ? <rect width="1200" height="680" fill={`url(#${idPrefix}-alarm-light)`} opacity="0.22" /> : null}
      {visual.roomLighting === "procedure" ? <ellipse cx="670" cy="355" rx="330" ry="245" fill="#fff7d9" opacity="0.12" /> : null}
      {visual.roomLighting === "calming" ? <rect width="1200" height="680" fill="#b9d7c6" opacity="0.08" /> : null}
    </g>
  );
}
