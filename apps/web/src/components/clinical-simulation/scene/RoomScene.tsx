import type { PatientVisualState } from "@/lib/clinical-simulation/visual-state";

type Props = {
  visual: PatientVisualState;
  idPrefix: string;
};

function Headwall({ intensive = false }: { intensive?: boolean }) {
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
    </g>
  );
}

function RoomClock({ night }: { night: boolean }) {
  return <g transform="translate(1058 88)"><circle r="31" fill="#f8faf7" stroke="#83938e" strokeWidth="4" /><path d="M0 0 L0 -17 M0 0 L13 7" stroke="#405350" strokeWidth="4" strokeLinecap="round" /><circle r="3" fill="#405350" /><text y="48" textAnchor="middle" fill={night ? "#d4e0dc" : "#516663"} fontSize="13" fontWeight="700">{night ? "NIGHT" : "DAY"}</text></g>;
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

export default function RoomScene({ visual, idPrefix }: Props) {
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
      {psychiatric ? <PsychiatricRoom /> : procedural ? <ProceduralRoom /> : <Headwall intensive={intensive} />}
      {!psychiatric ? <><Window night={night} /><RoomClock night={night} /></> : null}
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
