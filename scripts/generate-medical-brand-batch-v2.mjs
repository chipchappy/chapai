import fs from "node:fs";
import path from "node:path";

const root = "C:/Users/Chapman/Desktop/ai/chapai";
const brandDir = path.join(root, "apps/web/public/brand/options");
const reviewDir = path.join(root, "apps/web/public/design-review");

fs.mkdirSync(brandDir, { recursive: true });
fs.mkdirSync(reviewDir, { recursive: true });

const colors = {
  paper: "#FBF7F0",
  wash: "#F3EADB",
  washDeep: "#E8DECD",
  ink: "#1F2328",
  muted: "#6F665A",
  teal: "#567A84",
  tealSoft: "#7F9CA4",
  gold: "#C39A63",
  clay: "#B67C60",
  slate: "#4E606A",
  sand: "#EEE4D4",
};

const palettes = [
  { stroke: colors.ink, accent: colors.gold, soft: colors.teal },
  { stroke: colors.ink, accent: colors.teal, soft: colors.gold },
  { stroke: colors.ink, accent: colors.clay, soft: colors.teal },
  { stroke: colors.ink, accent: colors.gold, soft: colors.slate },
  { stroke: colors.ink, accent: colors.tealSoft, soft: colors.gold },
];

function write(filePath, contents) {
  fs.writeFileSync(filePath, contents, "utf8");
}

function shell() {
  return `
    <defs>
      <radialGradient id="wash" cx="0" cy="0" r="1" gradientUnits="userSpaceOnUse" gradientTransform="translate(344 112) rotate(122) scale(430 430)">
        <stop offset="0" stop-color="#fffdf8" stop-opacity="0.98"/>
        <stop offset="0.64" stop-color="#f4ebdb" stop-opacity="0.88"/>
        <stop offset="1" stop-color="#eee4d4" stop-opacity="0.96"/>
      </radialGradient>
    </defs>
    <rect width="520" height="520" rx="54" fill="${colors.paper}"/>
    <rect x="34" y="34" width="452" height="452" rx="40" fill="url(#wash)" stroke="rgba(210,198,179,0.62)"/>
  `;
}

function globe(cx, cy, r, palette) {
  return `
    <circle cx="${cx}" cy="${cy}" r="${r}" stroke="${palette.stroke}" stroke-opacity="0.2" stroke-width="1.8"/>
    <ellipse cx="${cx}" cy="${cy}" rx="${Math.round(r * 0.78)}" ry="${r}" stroke="${palette.soft}" stroke-opacity="0.24" stroke-width="1.36"/>
    <ellipse cx="${cx}" cy="${cy}" rx="${Math.round(r * 0.58)}" ry="${r}" stroke="${palette.soft}" stroke-opacity="0.16" stroke-width="1.18"/>
    <path d="M${cx} ${cy - r}V${cy + r}" stroke="${palette.soft}" stroke-opacity="0.18" stroke-width="1.16"/>
    <path d="M${cx - r + 24} ${cy - r * 0.34}C${cx - 96} ${cy - r * 0.46} ${cx + 96} ${cy - r * 0.46} ${cx + r - 24} ${cy - r * 0.34}" stroke="${palette.soft}" stroke-opacity="0.17" stroke-width="1.1"/>
    <path d="M${cx - r + 18} ${cy + r * 0.08}C${cx - 106} ${cy - 2} ${cx + 106} ${cy - 2} ${cx + r - 18} ${cy + r * 0.08}" stroke="${palette.soft}" stroke-opacity="0.18" stroke-width="1.1"/>
    <path d="M${cx - r + 38} ${cy + r * 0.42}C${cx - 96} ${cy + r * 0.36} ${cx + 96} ${cy + r * 0.36} ${cx + r - 38} ${cy + r * 0.42}" stroke="${palette.soft}" stroke-opacity="0.15" stroke-width="1.06"/>
  `;
}

function brainMark(cx, cy, scale, palette) {
  return `
    <g transform="translate(${cx} ${cy}) scale(${scale}) translate(-120 -120)">
      <path d="M112 34C142 20 174 18 208 26C242 34 272 50 296 74C320 98 334 126 338 158C342 190 336 220 320 248C304 276 280 298 248 314C216 330 180 336 142 332C104 328 72 312 46 284C20 256 8 224 10 188C12 152 24 122 46 98C68 74 92 54 120 40" stroke="${palette.stroke}" stroke-width="4.5" stroke-linecap="round" stroke-linejoin="round"/>
      <path d="M116 88C136 74 160 68 188 70C214 72 236 82 254 100" stroke="${palette.accent}" stroke-width="2.8" stroke-linecap="round"/>
      <path d="M96 128C126 110 158 102 194 104C230 106 260 118 286 140" stroke="${palette.soft}" stroke-width="2.2" stroke-linecap="round"/>
      <path d="M88 174C122 154 160 144 202 144C244 144 280 156 308 180" stroke="${palette.soft}" stroke-width="2.2" stroke-linecap="round"/>
      <path d="M98 220C132 200 166 192 202 194C238 196 270 208 296 230" stroke="${palette.soft}" stroke-width="2.1" stroke-linecap="round"/>
      <path d="M126 262C154 248 182 242 210 244C238 246 262 256 282 274" stroke="${palette.accent}" stroke-width="2.4" stroke-linecap="round"/>
      <path d="M206 310C206 336 214 360 230 384C246 408 268 428 296 442" stroke="${palette.soft}" stroke-width="2.6" stroke-linecap="round"/>
    </g>
  `;
}

function heartMark(cx, cy, scale, palette) {
  return `
    <g transform="translate(${cx} ${cy}) scale(${scale}) translate(-120 -120)">
      <path d="M146 42V98" stroke="${palette.soft}" stroke-width="3" stroke-linecap="round"/>
      <path d="M146 42C160 28 176 18 194 12" stroke="${palette.soft}" stroke-width="2.4" stroke-linecap="round"/>
      <path d="M134 42C120 28 106 18 92 12" stroke="${palette.soft}" stroke-width="2.4" stroke-linecap="round"/>
      <path d="M150 72C176 54 204 46 232 48C260 50 282 64 298 90C314 116 320 144 314 174C308 204 292 228 266 246C240 264 214 286 188 312C166 288 142 268 116 250C90 232 72 210 62 184C52 158 52 132 62 106C72 80 90 62 116 52C142 42 170 48 200 70" stroke="${palette.stroke}" stroke-width="4.4" stroke-linecap="round" stroke-linejoin="round"/>
      <path d="M98 174C120 166 142 160 166 158C190 156 214 160 238 170" stroke="${palette.accent}" stroke-width="2.2" stroke-linecap="round"/>
      <path d="M118 218C142 208 166 204 192 206C218 208 242 218 264 236" stroke="${palette.soft}" stroke-width="2.1" stroke-linecap="round"/>
    </g>
  `;
}

function wordmark(x, y, size, text, fill = colors.ink) {
  return `<text x="${x}" y="${y}" fill="${fill}" font-family="Source Serif 4, Georgia, serif" font-size="${size}" font-weight="600" letter-spacing="-2">${text}</text>`;
}

function subcopy(x, y, text) {
  return `<text x="${x}" y="${y}" fill="${colors.muted}" font-family="DM Sans, Arial, sans-serif" font-size="13" letter-spacing="4">${text}</text>`;
}

function logoOption(index) {
  const palette = palettes[index % palettes.length];
  const family = index % 10;
  let inner = shell();

  if (family === 0) {
    inner += `${globe(164, 156, 74, palette)}${brainMark(164, 156, 0.32, palette)}
      ${wordmark(110, 386, 62, "ChapAI", palette.stroke)}
      ${subcopy(112, 422, "CLINICAL PREP")}`;
  } else if (family === 1) {
    inner += `
      <rect x="88" y="104" width="344" height="220" rx="28" fill="rgba(255,252,247,0.84)" stroke="rgba(208,196,177,0.62)"/>
      ${heartMark(334, 214, 0.28, palette)}
      ${wordmark(118, 206, 46, "ChapAI", palette.stroke)}
      ${subcopy(120, 238, "NCLEX + CCRN")}`;
  } else if (family === 2) {
    inner += `${heartMark(260, 176, 0.4, palette)}
      <path d="M112 304H186L202 278L224 334L246 248L266 304H408" stroke="${palette.stroke}" stroke-width="3.1" stroke-linecap="round" stroke-linejoin="round"/>
      ${wordmark(118, 420, 60, "ChapAI", palette.stroke)}`;
  } else if (family === 3) {
    inner += `${globe(262, 186, 88, palette)}${heartMark(262, 188, 0.26, palette)}
      <text x="136" y="402" fill="${palette.stroke}" font-family="DM Sans, Arial, sans-serif" font-size="40" font-weight="800" letter-spacing="5">CHAPAI</text>
      ${subcopy(164, 434, "PREMIUM NURSING")}`;
  } else if (family === 4) {
    inner += `
      <path d="M118 160C150 124 188 102 232 94C276 86 320 92 362 114C404 136 434 170 450 216" stroke="${palette.stroke}" stroke-width="3.2" stroke-linecap="round"/>
      <path d="M134 220C168 198 204 186 242 184C280 182 316 192 350 214" stroke="${palette.accent}" stroke-width="2.4" stroke-linecap="round"/>
      <path d="M150 270C184 252 220 244 258 246C296 248 330 260 362 282" stroke="${palette.soft}" stroke-width="2" stroke-linecap="round"/>
      ${wordmark(120, 402, 58, "ChapAI", palette.stroke)}
      ${subcopy(122, 438, "BEDSIDE FIRST")}`;
  } else if (family === 5) {
    inner += `
      <circle cx="164" cy="176" r="82" fill="rgba(255,252,247,0.82)" stroke="rgba(208,196,177,0.62)"/>
      ${brainMark(164, 176, 0.34, palette)}
      ${wordmark(108, 392, 58, "ChapAI", palette.stroke)}
      ${subcopy(112, 428, "MODERN EXAM PREP")}`;
  } else if (family === 6) {
    inner += `
      <rect x="96" y="106" width="328" height="96" rx="26" fill="rgba(255,252,247,0.84)" stroke="rgba(208,196,177,0.62)"/>
      ${wordmark(122, 166, 48, "ChapAI", palette.stroke)}
      ${subcopy(124, 192, "SMARTER REVIEW")}
      ${heartMark(334, 282, 0.32, palette)}
      <path d="M118 344H404" stroke="${palette.soft}" stroke-opacity="0.28" stroke-width="1.4"/>
      ${subcopy(126, 384, "NCLEX + CCRN")}`;
  } else if (family === 7) {
    inner += `
      ${globe(318, 210, 86, palette)}
      ${brainMark(318, 210, 0.28, palette)}
      <path d="M108 144H232" stroke="${palette.soft}" stroke-opacity="0.24" stroke-width="1.5"/>
      ${wordmark(108, 382, 64, "ChapAI", palette.stroke)}
      <text x="110" y="420" fill="${colors.muted}" font-family="DM Sans, Arial, sans-serif" font-size="14" letter-spacing="4">SHARPER NURSING QUESTIONS</text>`;
  } else if (family === 8) {
    inner += `
      <path d="M110 134C160 110 212 98 266 98C320 98 372 112 422 140" stroke="${palette.soft}" stroke-opacity="0.28" stroke-width="1.8"/>
      ${heartMark(160, 238, 0.26, palette)}
      ${brainMark(352, 238, 0.24, palette)}
      ${wordmark(118, 404, 58, "ChapAI", palette.stroke)}
      ${subcopy(120, 438, "TWO EXAMS. ONE CALMER STANDARD.")}`;
  } else {
    inner += `
      <rect x="96" y="94" width="328" height="320" rx="32" fill="rgba(255,252,247,0.8)" stroke="rgba(208,196,177,0.62)"/>
      ${globe(260, 194, 88, palette)}
      ${brainMark(260, 194, 0.24, palette)}
      ${wordmark(140, 348, 54, "ChapAI", palette.stroke)}
      ${subcopy(150, 382, "PREMIUM CLINICAL REVIEW")}`;
  }

  return `<svg width="520" height="520" viewBox="0 0 520 520" fill="none" xmlns="http://www.w3.org/2000/svg">${inner}</svg>`;
}

function frontpageConcept(id, headline, body, badge, graphic) {
  return `<svg width="1600" height="980" viewBox="0 0 1600 980" fill="none" xmlns="http://www.w3.org/2000/svg">
  <rect width="1600" height="980" fill="${colors.paper}"/>
  <rect x="28" y="28" width="1544" height="924" rx="36" fill="url(#heroWash)" stroke="rgba(208,196,177,0.56)"/>
  <defs>
    <radialGradient id="heroWash" cx="0" cy="0" r="1" gradientUnits="userSpaceOnUse" gradientTransform="translate(1040 182) rotate(118) scale(980 980)">
      <stop offset="0" stop-color="#fffdf8" stop-opacity="0.98"/>
      <stop offset="0.55" stop-color="#f4ebdb" stop-opacity="0.82"/>
      <stop offset="1" stop-color="#efe4d3" stop-opacity="0.92"/>
    </radialGradient>
  </defs>
  <rect x="94" y="74" width="1410" height="72" rx="32" fill="rgba(255,252,247,0.78)" stroke="rgba(213,202,184,0.58)"/>
  <text x="142" y="118" fill="${colors.ink}" font-family="Source Serif 4, Georgia, serif" font-size="34" font-weight="600">ChapAI</text>
  <text x="142" y="146" fill="${colors.muted}" font-family="DM Sans, Arial, sans-serif" font-size="15" letter-spacing="4">NCLEX + CCRN</text>
  <text x="1132" y="118" fill="${colors.muted}" font-family="DM Sans, Arial, sans-serif" font-size="16" letter-spacing="2">CCRN</text>
  <text x="1202" y="118" fill="${colors.muted}" font-family="DM Sans, Arial, sans-serif" font-size="16" letter-spacing="2">NCLEX</text>
  <text x="1278" y="118" fill="${colors.muted}" font-family="DM Sans, Arial, sans-serif" font-size="16" letter-spacing="2">PLANS</text>
  <rect x="1394" y="92" width="110" height="42" rx="20" fill="rgba(255,252,247,0.88)" stroke="rgba(213,202,184,0.68)"/>
  <text x="1426" y="118" fill="${colors.ink}" font-family="DM Sans, Arial, sans-serif" font-size="18" font-weight="600">START</text>
  <text x="128" y="224" fill="${colors.muted}" font-family="DM Sans, Arial, sans-serif" font-size="14" letter-spacing="5">ADULT CRITICAL CARE PREP</text>
  <rect x="468" y="198" width="${Math.max(110, badge.length * 10)}" height="34" rx="17" fill="rgba(255,252,247,0.74)" stroke="rgba(213,202,184,0.62)"/>
  <text x="490" y="220" fill="${colors.ink}" font-family="DM Sans, Arial, sans-serif" font-size="14" font-weight="700" letter-spacing="2">${badge}</text>
  <text x="128" y="356" fill="${colors.ink}" font-family="Source Serif 4, Georgia, serif" font-size="116" font-weight="600" letter-spacing="-6">${headline}</text>
  <text x="128" y="424" fill="${colors.muted}" font-family="Source Serif 4, Georgia, serif" font-size="22">${body}</text>
  <rect x="128" y="506" width="214" height="52" rx="26" fill="${colors.teal}"/>
  <text x="156" y="540" fill="white" font-family="DM Sans, Arial, sans-serif" font-size="22" font-weight="700">Start the $10 sprint</text>
  <rect x="356" y="506" width="164" height="52" rx="26" fill="rgba(255,252,247,0.86)" stroke="rgba(213,202,184,0.62)"/>
  <text x="398" y="540" fill="${colors.ink}" font-family="DM Sans, Arial, sans-serif" font-size="22" font-weight="600">See plans</text>
  <text x="128" y="610" fill="${colors.muted}" font-family="DM Sans, Arial, sans-serif" font-size="13" letter-spacing="4">ORIGINAL QUESTIONS + AI TUTOR</text>
  <path d="M128 644H510" stroke="rgba(213,202,184,0.68)"/>
  <text x="128" y="700" fill="${colors.muted}" font-family="DM Sans, Arial, sans-serif" font-size="12" letter-spacing="3">CURRENT BUILD</text>
  <text x="128" y="730" fill="${colors.ink}" font-family="DM Sans, Arial, sans-serif" font-size="18" font-weight="700">492 live CCRN questions</text>
  <text x="398" y="700" fill="${colors.muted}" font-family="DM Sans, Arial, sans-serif" font-size="12" letter-spacing="3">EDGE</text>
  <text x="398" y="730" fill="${colors.ink}" font-family="DM Sans, Arial, sans-serif" font-size="18" font-weight="700">Cleaner than generic qbanks</text>
  ${graphic}
</svg>`;
}

function headerGraphic(kind) {
  const palette = palettes[kind % palettes.length];
  const cx = 1160;
  const cy = 284;
  const globeBlock = globe(cx, cy, 208, palette);
  return kind % 2 === 0
    ? `${globeBlock}${brainMark(cx, cy, 0.46, palette)}`
    : `${globeBlock}${heartMark(cx, cy, 0.42, palette)}`;
}

function socialHeader(id, headline, subhead, badge, kind) {
  return `<svg width="1500" height="560" viewBox="0 0 1500 560" fill="none" xmlns="http://www.w3.org/2000/svg">
  <rect width="1500" height="560" fill="${colors.paper}"/>
  <rect x="22" y="22" width="1456" height="516" rx="32" fill="url(#headerWash)" stroke="rgba(208,196,177,0.58)"/>
  <defs>
    <radialGradient id="headerWash" cx="0" cy="0" r="1" gradientUnits="userSpaceOnUse" gradientTransform="translate(1040 120) rotate(120) scale(860 860)">
      <stop offset="0" stop-color="#fffdf8" stop-opacity="0.98"/>
      <stop offset="0.62" stop-color="#f4ebdb" stop-opacity="0.84"/>
      <stop offset="1" stop-color="#efe4d3" stop-opacity="0.92"/>
    </radialGradient>
  </defs>
  <text x="96" y="116" fill="${colors.ink}" font-family="Source Serif 4, Georgia, serif" font-size="34" font-weight="600">ChapAI</text>
  <text x="96" y="144" fill="${colors.muted}" font-family="DM Sans, Arial, sans-serif" font-size="14" letter-spacing="4">NCLEX + CCRN</text>
  <rect x="96" y="182" width="${Math.max(146, badge.length * 10)}" height="34" rx="17" fill="rgba(255,252,247,0.74)" stroke="rgba(213,202,184,0.62)"/>
  <text x="120" y="205" fill="${colors.muted}" font-family="DM Sans, Arial, sans-serif" font-size="13" font-weight="700" letter-spacing="2">${badge}</text>
  <text x="96" y="292" fill="${colors.ink}" font-family="Source Serif 4, Georgia, serif" font-size="72" font-weight="600" letter-spacing="-3">${headline}</text>
  <text x="96" y="344" fill="${colors.muted}" font-family="Source Serif 4, Georgia, serif" font-size="24">${subhead}</text>
  <rect x="96" y="390" width="220" height="50" rx="24" fill="${colors.teal}"/>
  <text x="142" y="422" fill="white" font-family="DM Sans, Arial, sans-serif" font-size="22" font-weight="700">Try the $10 sprint</text>
  ${headerGraphic(kind)}
</svg>`;
}

function conceptGraphic(kind) {
  const palette = palettes[kind % palettes.length];
  const baseGlobe = globe(1168, 514, 396, palette);
  if (kind % 3 === 0) {
    return `${baseGlobe}${brainMark(1166, 508, 1.08, palette)}
      <path d="M1328 738H1532" stroke="rgba(86,122,132,0.22)" stroke-width="2"/>
      <path d="M1328 738H1390L1404 706L1424 782L1446 684L1462 752L1482 728H1532" stroke="rgba(31,35,40,0.58)" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"/>`;
  }
  if (kind % 3 === 1) {
    return `${baseGlobe}${heartMark(1162, 514, 1.02, palette)}
      <path d="M1338 314H1548" stroke="rgba(86,122,132,0.2)" stroke-width="1.9"/>
      <path d="M1360 474H1560" stroke="rgba(86,122,132,0.18)" stroke-width="1.9"/>
      <path d="M1338 664H1540" stroke="rgba(86,122,132,0.16)" stroke-width="1.9"/>`;
  }
  return `${baseGlobe}${brainMark(1128, 462, 0.92, palette)}${heartMark(1256, 694, 0.38, palette)}`;
}

const conceptCopy = [
  ["Clinical prep should open with one real medical object.", "A cleaner anatomy globe gives the page a stronger premium center of gravity.", "ANATOMY GLOBE"],
  ["The right side should feel expensive, not empty.", "Make the brain or heart do the visual selling instead of generic decoration.", "PREMIUM REVIEW"],
  ["One calmer field. More medical signal.", "Cleaner linework, stronger contrast, and a more distinct bedside identity.", "BEDSIDE FIRST"],
  ["The first screen should explain the product without more cards.", "One editorial shell, one anatomy object, one clear buying path.", "CCRN"],
  ["A better qbank brand starts with a more memorable object.", "The anatomy globe should feel intentional enough for creator outreach.", "NCLEX + CCRN"],
  ["The hero has to feel like a high-value medical product.", "Sharper linework is doing the trust work here.", "TRUST OBJECT"],
  ["Medical, minimal, premium.", "The background should feel like a clinical diagram placed inside a calm globe.", "MEDICAL FIELD"],
  ["Bold enough to stand out, quiet enough to trust.", "More anatomy. Less filler.", "PREMIUM PREP"],
  ["The linework should read at a glance.", "A bigger brain or heart globe solves the empty right side problem.", "FRONT PAGE"],
  ["The object should be the brand.", "Not a stick figure. Not a vague flourish. One strong anatomy globe.", "FINALIST"],
];

const socialCopy = [
  ["CCRN prep should feel sharper, calmer, and more clinical.", "Original questions, clearer rationales, and a faster route into the right plan.", "FOUNDER ACCESS"],
  ["A daily nursing question can become a real subscriber loop.", "Use one clean touchpoint and one better rationale every day.", "DAILY QUESTION"],
  ["If you are cramming, start with the sprint.", "The 24-hour pass gives high-intent buyers a low-friction first step.", "24-HOUR SPRINT"],
  ["NCLEX review should feel less punitive.", "Priority, delegation, safety, and cleaner next-step teaching.", "NCLEX"],
  ["ICU nurses want signal, not noise.", "Vents, shock, hemodynamics, and calmer bedside review.", "CCRN"],
  ["A better prep brand is easier to recommend.", "Less clutter. More confidence. Better questions.", "PREMIUM PREP"],
  ["The anatomy field is the identity.", "Let the graphic sell the standard before the copy does.", "VISUAL SYSTEM"],
  ["Build a product people want to share.", "Make the first impression look expensive and exact.", "CREATOR READY"],
];

for (let i = 0; i < 50; i += 1) {
  const id = 701 + i;
  write(path.join(brandDir, `chapai-option-${id}.svg`), logoOption(i));
}

conceptCopy.forEach((item, index) => {
  const id = 89 + index;
  write(path.join(reviewDir, `frontpage-${id}.svg`), frontpageConcept(id, item[0], item[1], item[2], conceptGraphic(index)));
});

socialCopy.forEach((item, index) => {
  const id = String(index + 9).padStart(2, "0");
  write(path.join(reviewDir, `social-header-${id}.svg`), socialHeader(id, item[0], item[1], item[2], index));
});
