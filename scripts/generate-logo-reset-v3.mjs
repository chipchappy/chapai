import fs from "node:fs";
import path from "node:path";

const root = "C:/Users/Chapman/Desktop/ai/chapai";
const optionsDir = path.join(root, "apps/web/public/brand/options");
const reviewDir = path.join(root, "apps/web/public/logo-review");

const base = {
  bg: "#F7F2E8",
  card: "#FBF8F2",
  border: "#DCCFBD",
  ink: "rgba(28, 26, 23, 0.94)",
  muted: "rgba(111, 98, 83, 0.78)",
  accent: "#B9875A",
  accentSoft: "#7A9AA1",
  serif: "'Source Serif 4', Georgia, serif",
  sans: "'DM Sans', Arial, sans-serif",
};

const iconTemplates = {
  heartline: {
    title: "Heartline editorial wordmark",
    descriptor: "C-shaped heartline motif",
    icon: `
      <path d="M55 91C55 63 74 43 100 43C118 43 131 51 143 67C155 51 168 43 186 43C212 43 231 63 231 91C231 124 212 148 164 190C161 193 157 195 153 195C149 195 145 193 142 190C94 148 55 124 55 91Z" fill="none" stroke="${base.ink}" stroke-width="4.4" stroke-linejoin="round"/>
      <path d="M72 111H112L129 89L147 128L167 82L187 110H214" fill="none" stroke="${base.accent}" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/>
      <path d="M97 58C94 74 97 87 107 101C115 112 121 122 122 134" fill="none" stroke="${base.accentSoft}" stroke-width="2.1" stroke-linecap="round"/>
      <circle cx="102" cy="78" r="4.6" fill="#FFF9F1" stroke="${base.accent}" stroke-width="1.6"/>
      <circle cx="156" cy="76" r="4.6" fill="#FFF9F1" stroke="${base.accent}" stroke-width="1.6"/>
    `,
  },
  cortical: {
    title: "Cortical editorial wordmark",
    descriptor: "Brain plate linework",
    icon: `
      <path d="M63 107C63 68 86 42 121 42C133 42 144 45 154 51C164 46 175 43 188 43C222 43 246 69 246 107C246 147 222 174 188 174C180 174 172 173 165 171C157 181 145 189 130 193C111 198 94 194 80 184C67 174 63 164 63 153C63 145 64 137 67 129C64 123 63 115 63 107Z" fill="none" stroke="${base.ink}" stroke-width="4.2" stroke-linecap="round" stroke-linejoin="round"/>
      <path d="M88 64C101 58 117 56 136 58C153 60 168 66 181 76C193 86 202 101 206 119C209 137 207 155 199 171" fill="none" stroke="${base.accent}" stroke-width="2.4" stroke-linecap="round"/>
      <path d="M84 77C95 74 105 76 112 82C118 88 121 97 120 109" fill="none" stroke="${base.accentSoft}" stroke-width="1.9" stroke-linecap="round"/>
      <path d="M132 62C130 76 132 89 138 100C144 111 148 122 149 134" fill="none" stroke="${base.ink}" stroke-width="1.9" stroke-linecap="round" opacity="0.56"/>
      <path d="M157 67C160 80 166 92 174 101C182 110 188 121 190 133" fill="none" stroke="${base.accentSoft}" stroke-width="1.9" stroke-linecap="round"/>
      <circle cx="112" cy="95" r="4.2" fill="#FFF9F1" stroke="${base.accent}" stroke-width="1.5"/>
      <circle cx="158" cy="96" r="4.2" fill="#FFF9F1" stroke="${base.accent}" stroke-width="1.5"/>
      <circle cx="140" cy="120" r="4.2" fill="#FFF9F1" stroke="${base.accent}" stroke-width="1.5"/>
    `,
  },
  coronary: {
    title: "Coronary editorial wordmark",
    descriptor: "Heart and vessel study line",
    icon: `
      <path d="M86 61C86 61 94 44 115 44C130 44 140 52 147 63C154 52 164 44 179 44C200 44 208 61 208 61C216 72 218 85 214 98C210 112 201 121 189 128C177 136 166 147 160 160C156 169 154 181 154 193C154 196 151 198 148 198C145 198 142 196 142 193C142 181 140 169 136 160C130 147 119 136 107 128C95 121 86 112 82 98C78 85 80 72 86 61Z" fill="none" stroke="${base.ink}" stroke-width="4.3" stroke-linejoin="round"/>
      <path d="M146 64C155 71 163 79 168 88C173 97 177 107 178 118C179 130 177 142 171 155" fill="none" stroke="${base.accent}" stroke-width="2.6" stroke-linecap="round"/>
      <path d="M134 80C129 92 126 103 126 115C126 127 129 138 135 149" fill="none" stroke="${base.accentSoft}" stroke-width="2" stroke-linecap="round"/>
      <path d="M104 101H124L135 90L145 116L158 84L169 101H198" fill="none" stroke="${base.accent}" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/>
      <circle cx="117" cy="92" r="4.2" fill="#FFF9F1" stroke="${base.accent}" stroke-width="1.5"/>
      <circle cx="169" cy="92" r="4.2" fill="#FFF9F1" stroke="${base.accent}" stroke-width="1.5"/>
    `,
  },
  pulmonary: {
    title: "Pulmonary editorial wordmark",
    descriptor: "Lungs and airway branch",
    icon: `
      <path d="M127 44V104" fill="none" stroke="${base.ink}" stroke-width="4.2" stroke-linecap="round"/>
      <path d="M127 104C96 84 76 70 61 54" fill="none" stroke="${base.ink}" stroke-width="3.8" stroke-linecap="round" stroke-linejoin="round"/>
      <path d="M127 104C158 84 178 70 193 54" fill="none" stroke="${base.ink}" stroke-width="3.8" stroke-linecap="round" stroke-linejoin="round"/>
      <path d="M127 104C109 123 97 148 91 180" fill="none" stroke="${base.accentSoft}" stroke-width="2.4" stroke-linecap="round"/>
      <path d="M127 104C145 123 157 148 163 180" fill="none" stroke="${base.accentSoft}" stroke-width="2.4" stroke-linecap="round"/>
      <path d="M86 82C79 106 79 127 86 147C93 167 106 183 125 195C125 195 127 191 127 187C127 179 127 169 127 159C120 133 107 111 86 82Z" fill="none" stroke="${base.accent}" stroke-width="4.1" stroke-linejoin="round"/>
      <path d="M168 82C175 106 175 127 168 147C161 167 148 183 129 195C129 195 127 191 127 187C127 179 127 169 127 159C134 133 147 111 168 82Z" fill="none" stroke="${base.accent}" stroke-width="4.1" stroke-linejoin="round"/>
      <path d="M108 121C113 118 117 118 122 121" fill="none" stroke="${base.ink}" stroke-width="1.7" stroke-linecap="round"/>
      <path d="M134 121C139 118 143 118 148 121" fill="none" stroke="${base.ink}" stroke-width="1.7" stroke-linecap="round"/>
    `,
  },
  angiogram: {
    title: "Angiogram editorial wordmark",
    descriptor: "Cath-lab vessel geometry",
    icon: `
      <path d="M61 114C76 95 93 79 113 67C133 56 154 50 176 50C199 50 219 55 237 66" fill="none" stroke="${base.ink}" stroke-width="3.8" stroke-linecap="round"/>
      <path d="M68 134C86 127 104 123 123 123C143 123 160 126 175 132C190 139 205 148 220 161" fill="none" stroke="${base.accent}" stroke-width="3" stroke-linecap="round"/>
      <path d="M74 161C88 149 103 141 119 136C135 131 152 129 171 131C189 133 205 138 219 146" fill="none" stroke="${base.accentSoft}" stroke-width="2.2" stroke-linecap="round"/>
      <path d="M111 78C117 92 121 109 122 129C123 149 121 169 115 189" fill="none" stroke="${base.ink}" stroke-width="2" stroke-linecap="round"/>
      <circle cx="122" cy="129" r="33" fill="none" stroke="${base.ink}" stroke-width="4"/>
      <path d="M122 96C140 105 152 118 158 135C164 152 165 170 160 187" fill="none" stroke="${base.ink}" stroke-width="3.2" stroke-linecap="round"/>
      <path d="M101 154H143L156 142L166 168L182 136L195 154H226" fill="none" stroke="${base.accent}" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round"/>
    `,
  },
  neural: {
    title: "Neural editorial wordmark",
    descriptor: "Neuron canopy and branching",
    icon: `
      <circle cx="128" cy="117" r="27" fill="none" stroke="${base.ink}" stroke-width="4.2"/>
      <path d="M128 90V47" fill="none" stroke="${base.accent}" stroke-width="3" stroke-linecap="round"/>
      <path d="M128 144C103 154 82 167 61 184" fill="none" stroke="${base.ink}" stroke-width="3.4" stroke-linecap="round"/>
      <path d="M128 144C153 154 174 167 195 184" fill="none" stroke="${base.ink}" stroke-width="3.4" stroke-linecap="round"/>
      <path d="M110 113C97 104 84 91 72 74" fill="none" stroke="${base.accentSoft}" stroke-width="2.2" stroke-linecap="round"/>
      <path d="M146 113C159 104 172 91 184 74" fill="none" stroke="${base.accentSoft}" stroke-width="2.2" stroke-linecap="round"/>
      <path d="M113 127C98 132 84 140 71 150" fill="none" stroke="${base.accent}" stroke-width="2.4" stroke-linecap="round"/>
      <path d="M143 127C158 132 172 140 185 150" fill="none" stroke="${base.accent}" stroke-width="2.4" stroke-linecap="round"/>
      <circle cx="72" cy="74" r="4.2" fill="#FFF9F1" stroke="${base.accent}" stroke-width="1.5"/>
      <circle cx="184" cy="74" r="4.2" fill="#FFF9F1" stroke="${base.accent}" stroke-width="1.5"/>
      <circle cx="71" cy="150" r="4.2" fill="#FFF9F1" stroke="${base.accent}" stroke-width="1.5"/>
      <circle cx="185" cy="150" r="4.2" fill="#FFF9F1" stroke="${base.accent}" stroke-width="1.5"/>
    `,
  },
  seal: {
    title: "Instrument seal wordmark",
    descriptor: "Premium medical seal",
    icon: `
      <circle cx="128" cy="118" r="84" fill="none" stroke="${base.ink}" stroke-width="4"/>
      <circle cx="128" cy="118" r="63" fill="none" stroke="${base.accentSoft}" stroke-width="2.2"/>
      <path d="M128 55C128 76 128 98 128 118C128 138 128 160 128 181" fill="none" stroke="${base.accent}" stroke-width="3.2" stroke-linecap="round"/>
      <path d="M86 118H110L121 106L133 134L146 96L159 118H173" fill="none" stroke="${base.accent}" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/>
      <circle cx="97" cy="91" r="4.1" fill="#FFF9F1" stroke="${base.accent}" stroke-width="1.4"/>
      <circle cx="159" cy="91" r="4.1" fill="#FFF9F1" stroke="${base.accent}" stroke-width="1.4"/>
      <circle cx="97" cy="145" r="4.1" fill="#FFF9F1" stroke="${base.accent}" stroke-width="1.4"/>
      <circle cx="159" cy="145" r="4.1" fill="#FFF9F1" stroke="${base.accent}" stroke-width="1.4"/>
    `,
  },
  bodyline: {
    title: "Bodyline editorial wordmark",
    descriptor: "Human figure and spine",
    icon: `
      <path d="M128 40C141 44 148 54 148 67C148 80 143 88 138 96C154 107 164 122 166 142C168 167 160 185 128 198C96 185 88 167 90 142C92 122 102 107 118 96C113 88 108 80 108 67C108 54 115 44 128 40Z" fill="none" stroke="${base.ink}" stroke-width="4.1" stroke-linejoin="round"/>
      <path d="M128 67V180" fill="none" stroke="${base.accentSoft}" stroke-width="2.6" stroke-linecap="round"/>
      <path d="M112 112H144" fill="none" stroke="${base.accent}" stroke-width="2.8" stroke-linecap="round"/>
      <path d="M104 129H152" fill="none" stroke="${base.accent}" stroke-width="2.8" stroke-linecap="round"/>
      <path d="M95 149H161" fill="none" stroke="${base.accent}" stroke-width="2.8" stroke-linecap="round"/>
    `,
  },
  vesselC: {
    title: "Vessel editorial wordmark",
    descriptor: "C-shaped vessel network",
    icon: `
      <path d="M191 64C171 46 149 37 128 37C90 37 58 69 58 117C58 165 90 197 128 197C149 197 171 188 191 170" fill="none" stroke="${base.ink}" stroke-width="4.4" stroke-linecap="round"/>
      <path d="M79 87C94 93 110 101 128 117C144 131 160 145 178 158" fill="none" stroke="${base.accent}" stroke-width="3" stroke-linecap="round"/>
      <path d="M78 145C98 138 116 132 130 125C147 116 164 103 179 87" fill="none" stroke="${base.accentSoft}" stroke-width="2.2" stroke-linecap="round"/>
      <circle cx="128" cy="117" r="5" fill="#FFF9F1" stroke="${base.accent}" stroke-width="1.6"/>
    `,
  },
  pulseC: {
    title: "Pulse editorial wordmark",
    descriptor: "C with waveform bridge",
    icon: `
      <path d="M197 68C180 50 157 40 132 40C90 40 58 72 58 117C58 162 90 194 132 194C157 194 180 184 197 166" fill="none" stroke="${base.ink}" stroke-width="4.3" stroke-linecap="round"/>
      <path d="M84 117H110L123 98L135 142L148 86L160 117H184" fill="none" stroke="${base.accent}" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/>
      <path d="M92 90C105 83 117 79 131 79C149 79 165 85 179 96" fill="none" stroke="${base.accentSoft}" stroke-width="2" stroke-linecap="round"/>
    `,
  },
  circleBrain: {
    title: "Circle brain wordmark",
    descriptor: "Brain plate with halo",
    icon: `
      <circle cx="128" cy="118" r="77" fill="none" stroke="${base.ink}" stroke-width="4"/>
      <path d="M128 62C112 64 98 70 88 80C78 90 73 104 73 118C73 138 82 154 99 166C110 174 122 178 128 178C138 178 148 176 157 172C171 165 181 154 187 140C193 125 194 111 189 96C184 83 176 73 164 67C153 61 141 59 128 62Z" fill="none" stroke="${base.accent}" stroke-width="3"/>
      <path d="M94 93C107 88 119 87 128 90C138 93 147 100 154 111" fill="none" stroke="${base.accentSoft}" stroke-width="2.2" stroke-linecap="round"/>
      <path d="M90 116C104 109 118 107 130 111C142 115 152 123 160 136" fill="none" stroke="${base.accentSoft}" stroke-width="2.2" stroke-linecap="round"/>
      <path d="M94 141C108 137 121 136 133 140C145 144 155 151 163 162" fill="none" stroke="${base.accentSoft}" stroke-width="2.2" stroke-linecap="round"/>
    `,
  },
};

const logoSpecs = [
  ["1201", "heartline", "Heartline", "#5B7F87"],
  ["1202", "cortical", "Cortical", "#647F71"],
  ["1203", "coronary", "Coronary", "#B77B5A"],
  ["1204", "pulmonary", "Pulmonary", "#738E79"],
  ["1205", "angiogram", "Angiogram", "#4E7E86"],
  ["1206", "neural", "Neural", "#5F7382"],
  ["1207", "seal", "Seal", "#8A7661"],
  ["1208", "bodyline", "Bodyline", "#62807A"],
  ["1209", "vesselC", "Vessel", "#A86F56"],
  ["1210", "pulseC", "Pulse", "#6C8188"],
  ["1211", "circleBrain", "Cortical Halo", "#617B73"],
  ["1212", "heartline", "Heartline C", "#A87957"],
  ["1213", "cortical", "Neural Atlas", "#5D7783"],
  ["1214", "coronary", "Coronary Seal", "#8E745E"],
  ["1215", "pulmonary", "Pulmonary Arc", "#65857A"],
  ["1216", "angiogram", "Angio Field", "#507D84"],
  ["1217", "neural", "Neuron Branch", "#667382"],
  ["1218", "seal", "ChapAI Seal", "#85745F"],
  ["1219", "bodyline", "Bedside Line", "#6A8077"],
  ["1220", "vesselC", "Vessel Ring", "#A76D58"],
];

function svgFor(spec) {
  const [id, iconKey, label, accent] = spec;
  const icon = iconTemplates[iconKey];
  const accentTint = accent;

  return `<?xml version="1.0" encoding="UTF-8"?>
<svg width="840" height="320" viewBox="0 0 840 320" fill="none" xmlns="http://www.w3.org/2000/svg">
  <rect width="840" height="320" rx="34" fill="${base.bg}"/>
  <rect x="18" y="18" width="804" height="284" rx="28" fill="${base.card}" stroke="${base.border}"/>
  <circle cx="128" cy="160" r="108" fill="rgba(255,255,255,0.46)"/>
  <circle cx="128" cy="160" r="92" fill="none" stroke="rgba(195,176,150,0.44)" stroke-width="1.2"/>
  <g transform="translate(32 36)">
    <rect x="0" y="0" width="220" height="248" rx="30" fill="rgba(255,252,247,0.92)" stroke="rgba(210,196,174,0.82)"/>
    <g transform="translate(6 12)">
      ${icon.icon}
    </g>
  </g>
  <g transform="translate(300 76)">
    <text x="0" y="20" fill="${base.muted}" font-family="${base.sans}" font-size="13" font-weight="700" letter-spacing="4">CHAPAI CLARITY</text>
    <text x="0" y="90" fill="${base.ink}" font-family="${base.serif}" font-size="82" font-weight="600" letter-spacing="-4">ChapAI</text>
    <text x="2" y="132" fill="${base.muted}" font-family="${base.sans}" font-size="16" font-weight="700" letter-spacing="4">NCLEX + CCRN</text>
    <path d="M0 154H224" stroke="rgba(202,188,168,0.7)" stroke-width="1.4"/>
    <text x="0" y="188" fill="${accentTint}" font-family="${base.sans}" font-size="12" font-weight="800" letter-spacing="3">${label.toUpperCase()}</text>
    <text x="0" y="218" fill="${base.ink}" font-family="${base.sans}" font-size="21" font-weight="500">${icon.title}</text>
    <text x="0" y="248" fill="${base.muted}" font-family="${base.sans}" font-size="15" font-weight="500">${icon.descriptor}</text>
  </g>
</svg>`;
}

function contactSheet(sources) {
  const cards = sources.map(([id, key, label]) => {
    const col = (Number(id) - 1201) % 4;
    const row = Math.floor((Number(id) - 1201) / 4);
    const x = 24 + col * 420;
    const y = 24 + row * 340;
    return `
      <a href="/logo-review/chapai-option-${id}.svg">
        <rect x="${x}" y="${y}" width="388" height="296" rx="26" fill="rgba(255,255,255,0.92)" stroke="rgba(208,193,172,0.72)"/>
        <image href="/logo-review/chapai-option-${id}.svg" x="${x + 14}" y="${y + 12}" width="360" height="190" preserveAspectRatio="xMidYMid meet"/>
        <text x="${x + 18}" y="${y + 226}" fill="${base.ink}" font-family="${base.serif}" font-size="28" font-weight="600" letter-spacing="-1.4">Option ${id}</text>
        <text x="${x + 18}" y="${y + 252}" fill="${base.muted}" font-family="${base.sans}" font-size="13" font-weight="700" letter-spacing="3">${label.toUpperCase()}</text>
      </a>`;
  }).join("\n");

  return `<?xml version="1.0" encoding="UTF-8"?>
<svg width="1680" height="1760" viewBox="0 0 1680 1760" fill="none" xmlns="http://www.w3.org/2000/svg">
  <rect width="1680" height="1760" fill="#F3ECDD"/>
  <text x="32" y="48" fill="${base.ink}" font-family="${base.serif}" font-size="36" font-weight="600" letter-spacing="-1.2">ChapAI logo review board</text>
  <text x="32" y="80" fill="${base.muted}" font-family="${base.sans}" font-size="14" font-weight="600" letter-spacing="2.8">15 refined medical mark directions built from the supplied C logo reference</text>
  <g>${cards}</g>
</svg>`;
}

function writeFile(dir, name, content) {
  fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(path.join(dir, name), content, "utf8");
}

for (const spec of logoSpecs) {
  const [id] = spec;
  const svg = svgFor(spec);
  writeFile(optionsDir, `chapai-option-${id}.svg`, svg);
  writeFile(reviewDir, `chapai-option-${id}.svg`, svg);
}

writeFile(reviewDir, "logo-contact-sheet.svg", contactSheet(logoSpecs));

console.log(`Wrote ${logoSpecs.length} logo options to brand/options and logo-review.`);
