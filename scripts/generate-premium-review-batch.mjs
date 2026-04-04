import fs from "node:fs";
import path from "node:path";

const root = "C:/Users/Chapman/Desktop/ai/chapai";
const brandDir = path.join(root, "apps/web/public/brand/options");
const reviewDir = path.join(root, "apps/web/public/design-review");

fs.mkdirSync(brandDir, { recursive: true });
fs.mkdirSync(reviewDir, { recursive: true });

const colors = {
  paper: "#FBF7F0",
  sand: "#F4EEE3",
  warm: "#EDE2D0",
  ink: "#1E222B",
  muted: "#746A5D",
  teal: "#537985",
  gold: "#C49B59",
  clay: "#B57D63",
  sage: "#708370",
};

const palettes = [
  { stroke: colors.ink, accent: colors.gold, soft: colors.teal },
  { stroke: colors.ink, accent: colors.teal, soft: colors.gold },
  { stroke: colors.ink, accent: colors.clay, soft: colors.teal },
  { stroke: colors.ink, accent: colors.sage, soft: colors.gold },
  { stroke: colors.ink, accent: colors.gold, soft: colors.clay },
];

function write(filePath, contents) {
  fs.writeFileSync(filePath, contents, "utf8");
}

function baseSquare(inner) {
  return `<svg width="520" height="520" viewBox="0 0 520 520" fill="none" xmlns="http://www.w3.org/2000/svg">
  <rect width="520" height="520" rx="52" fill="${colors.paper}"/>
  <rect x="36" y="36" width="448" height="448" rx="40" fill="url(#wash)" stroke="rgba(208,196,177,0.58)"/>
  <defs>
    <radialGradient id="wash" cx="0" cy="0" r="1" gradientUnits="userSpaceOnUse" gradientTransform="translate(338 118) rotate(120) scale(420 420)">
      <stop offset="0" stop-color="#fffdf8" stop-opacity="0.94"/>
      <stop offset="0.64" stop-color="#f3eadb" stop-opacity="0.86"/>
      <stop offset="1" stop-color="#efe5d5" stop-opacity="0.96"/>
    </radialGradient>
  </defs>
  ${inner}
</svg>`;
}

function heroFrame(title, subtitle, body, rightGraphic) {
  return `<svg width="1600" height="980" viewBox="0 0 1600 980" fill="none" xmlns="http://www.w3.org/2000/svg">
  <rect width="1600" height="980" fill="${colors.paper}"/>
  <rect x="28" y="28" width="1544" height="924" rx="36" fill="url(#heroWash)" stroke="rgba(208,196,177,0.56)"/>
  <defs>
    <radialGradient id="heroWash" cx="0" cy="0" r="1" gradientUnits="userSpaceOnUse" gradientTransform="translate(1060 182) rotate(118) scale(980 980)">
      <stop offset="0" stop-color="#fffdf8" stop-opacity="0.98"/>
      <stop offset="0.55" stop-color="#f4ebdb" stop-opacity="0.82"/>
      <stop offset="1" stop-color="#efe4d3" stop-opacity="0.92"/>
    </radialGradient>
  </defs>
  <rect x="96" y="74" width="1408" height="72" rx="32" fill="rgba(255,252,247,0.78)" stroke="rgba(213,202,184,0.58)"/>
  <text x="144" y="118" fill="${colors.ink}" font-family="Source Serif 4, Georgia, serif" font-size="34" font-weight="600">ChapAI</text>
  <text x="144" y="146" fill="${colors.muted}" font-family="DM Sans, Arial, sans-serif" font-size="15" letter-spacing="4">NCLEX + CCRN</text>
  <text x="1118" y="118" fill="${colors.muted}" font-family="DM Sans, Arial, sans-serif" font-size="16" letter-spacing="2">CCRN</text>
  <text x="1188" y="118" fill="${colors.muted}" font-family="DM Sans, Arial, sans-serif" font-size="16" letter-spacing="2">NCLEX</text>
  <text x="1265" y="118" fill="${colors.muted}" font-family="DM Sans, Arial, sans-serif" font-size="16" letter-spacing="2">PLANS</text>
  <rect x="1378" y="92" width="106" height="42" rx="20" fill="rgba(255,252,247,0.88)" stroke="rgba(213,202,184,0.68)"/>
  <text x="1414" y="118" fill="${colors.ink}" font-family="DM Sans, Arial, sans-serif" font-size="18" font-weight="600">START</text>

  <text x="130" y="224" fill="${colors.muted}" font-family="DM Sans, Arial, sans-serif" font-size="14" letter-spacing="5">ADULT CRITICAL CARE PREP</text>
  <rect x="476" y="196" width="64" height="34" rx="17" fill="rgba(255,252,247,0.74)" stroke="rgba(213,202,184,0.62)"/>
  <text x="497" y="218" fill="${colors.ink}" font-family="DM Sans, Arial, sans-serif" font-size="15" font-weight="600">CCRN</text>

  <text x="130" y="360" fill="${colors.ink}" font-family="DM Sans, Arial, sans-serif" font-size="120" font-weight="500" letter-spacing="-8">${title[0]}</text>
  <text x="186" y="360" fill="${colors.ink}" font-family="DM Sans, Arial, sans-serif" font-size="116" font-weight="500" letter-spacing="-8">${title.slice(1)}</text>
  <text x="130" y="418" fill="${colors.muted}" font-family="Source Serif 4, Georgia, serif" font-size="22">${subtitle}</text>
  <text x="130" y="468" fill="${colors.muted}" font-family="Source Serif 4, Georgia, serif" font-size="20">${body}</text>
  <rect x="130" y="520" width="208" height="52" rx="26" fill="${colors.teal}"/>
  <text x="154" y="553" fill="white" font-family="DM Sans, Arial, sans-serif" font-size="22" font-weight="700">Choose CCRN plan</text>
  <rect x="354" y="520" width="166" height="52" rx="26" fill="rgba(255,252,247,0.86)" stroke="rgba(213,202,184,0.62)"/>
  <text x="396" y="553" fill="${colors.ink}" font-family="DM Sans, Arial, sans-serif" font-size="22" font-weight="600">See plans</text>

  <text x="130" y="620" fill="${colors.muted}" font-family="DM Sans, Arial, sans-serif" font-size="13" letter-spacing="4">AI REVIEW + VISUAL RATIONALE</text>
  <path d="M130 654H486" stroke="rgba(213,202,184,0.68)"/>
  <text x="130" y="700" fill="${colors.muted}" font-family="DM Sans, Arial, sans-serif" font-size="12" letter-spacing="3">CURRENT BUILD</text>
  <text x="130" y="730" fill="${colors.ink}" font-family="DM Sans, Arial, sans-serif" font-size="18" font-weight="700">486 live CCRN questions</text>
  <text x="392" y="700" fill="${colors.muted}" font-family="DM Sans, Arial, sans-serif" font-size="12" letter-spacing="3">REVIEW STYLE</text>
  <text x="392" y="730" fill="${colors.ink}" font-family="DM Sans, Arial, sans-serif" font-size="18" font-weight="700">Pattern-first bedside reasoning</text>

  ${rightGraphic}
</svg>`;
}

function socialHeaderFrame(headline, subhead, rightGraphic, badge) {
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
  <text x="96" y="292" fill="${colors.ink}" font-family="Source Serif 4, Georgia, serif" font-size="74" font-weight="600" letter-spacing="-3">${headline}</text>
  <text x="96" y="344" fill="${colors.muted}" font-family="Source Serif 4, Georgia, serif" font-size="24">${subhead}</text>
  <rect x="96" y="390" width="220" height="50" rx="24" fill="${colors.teal}"/>
  <text x="142" y="422" fill="white" font-family="DM Sans, Arial, sans-serif" font-size="22" font-weight="700">Try the $10 sprint</text>
  ${rightGraphic}
</svg>`;
}

function globeShell(cx, cy, r, stroke, soft, accent) {
  return `
    <circle cx="${cx}" cy="${cy}" r="${r}" stroke="${stroke}" stroke-opacity="0.22" stroke-width="1.8"/>
    <ellipse cx="${cx}" cy="${cy}" rx="${Math.round(r * 0.78)}" ry="${r}" stroke="${soft}" stroke-opacity="0.26" stroke-width="1.5"/>
    <ellipse cx="${cx}" cy="${cy}" rx="${Math.round(r * 0.58)}" ry="${r}" stroke="${soft}" stroke-opacity="0.18" stroke-width="1.3"/>
    <ellipse cx="${cx}" cy="${cy}" rx="${Math.round(r * 0.9)}" ry="${r}" stroke="${soft}" stroke-opacity="0.13" stroke-width="1.2"/>
    <path d="M${cx} ${cy - r}V${cy + r}" stroke="${soft}" stroke-opacity="0.22" stroke-width="1.3"/>
    <path d="M${cx - r + 48} ${cy - r * 0.68}C${cx - 130} ${cy - r * 0.78} ${cx + 130} ${cy - r * 0.78} ${cx + r - 48} ${cy - r * 0.68}" stroke="${soft}" stroke-opacity="0.18" stroke-width="1.18"/>
    <path d="M${cx - r + 22} ${cy - r * 0.28}C${cx - 142} ${cy - r * 0.4} ${cx + 142} ${cy - r * 0.4} ${cx + r - 22} ${cy - r * 0.28}" stroke="${soft}" stroke-opacity="0.22" stroke-width="1.18"/>
    <path d="M${cx - r + 18} ${cy + r * 0.12}C${cx - 156} ${cy + r * 0.03} ${cx + 156} ${cy + r * 0.03} ${cx + r - 18} ${cy + r * 0.12}" stroke="${soft}" stroke-opacity="0.2" stroke-width="1.18"/>
    <path d="M${cx - r + 44} ${cy + r * 0.48}C${cx - 136} ${cy + r * 0.42} ${cx + 136} ${cy + r * 0.42} ${cx + r - 44} ${cy + r * 0.48}" stroke="${soft}" stroke-opacity="0.16" stroke-width="1.16"/>
    <ellipse cx="${cx}" cy="${cy}" rx="${r - 28}" ry="${r}" stroke="${accent}" stroke-opacity="0.08" stroke-width="1.1" stroke-dasharray="1 12"/>
  `;
}

function chestPlate(cx, cy, scale, stroke, accent, soft) {
  return `
    <g transform="translate(${cx} ${cy}) scale(${scale}) translate(-240 -260)">
      <path d="M240 78V420" stroke="${soft}" stroke-opacity="0.96" stroke-width="2.4" stroke-linecap="round"/>
      <path d="M182 110C152 124 126 149 104 187C82 225 70 269 68 319C66 369 74 412 94 448C114 484 142 511 178 528" stroke="${stroke}" stroke-opacity="0.72" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/>
      <path d="M298 110C328 124 354 149 376 187C398 225 410 269 412 319C414 369 406 412 386 448C366 484 338 511 302 528" stroke="${stroke}" stroke-opacity="0.72" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/>
      <path d="M198 164C170 176 146 198 127 228C108 258 98 293 96 332C94 371 100 407 116 440C132 473 155 498 186 516" stroke="${accent}" stroke-opacity="0.78" stroke-width="2.4" stroke-linecap="round"/>
      <path d="M282 164C310 176 334 198 353 228C372 258 382 293 384 332C386 371 380 407 364 440C348 473 325 498 294 516" stroke="${accent}" stroke-opacity="0.78" stroke-width="2.4" stroke-linecap="round"/>
      <path d="M240 156C258 142 278 135 300 136C322 138 339 148 352 167C365 186 371 208 369 232C367 256 358 278 341 300C324 321 297 355 260 402C223 355 196 321 179 300C162 278 153 256 151 232C149 208 155 186 168 167C181 148 198 138 220 136C242 135 262 142 280 156" stroke="${accent}" stroke-opacity="0.92" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round"/>
      <path d="M182 214C198 202 217 194 240 192C263 190 282 196 298 210" stroke="${soft}" stroke-opacity="0.38" stroke-width="1.8" stroke-linecap="round"/>
      <path d="M160 262C186 248 212 242 240 242C268 242 294 248 320 262" stroke="${soft}" stroke-opacity="0.42" stroke-width="1.8" stroke-linecap="round"/>
      <path d="M146 314C178 300 210 294 240 294C270 294 302 300 334 314" stroke="${soft}" stroke-opacity="0.44" stroke-width="1.8" stroke-linecap="round"/>
      <path d="M148 366C178 355 209 350 240 350C271 350 302 355 332 366" stroke="${soft}" stroke-opacity="0.38" stroke-width="1.7" stroke-linecap="round"/>
      <path d="M236 104C216 98 197 90 178 80C159 70 140 56 122 40" stroke="${soft}" stroke-opacity="0.3" stroke-width="1.4" stroke-linecap="round"/>
      <path d="M248 104C272 96 295 84 316 68C337 52 357 34 376 14" stroke="${soft}" stroke-opacity="0.3" stroke-width="1.4" stroke-linecap="round"/>
      <path d="M310 158H476" stroke="${soft}" stroke-opacity="0.24" stroke-width="1.5" stroke-linecap="round"/>
      <path d="M336 300H500" stroke="${soft}" stroke-opacity="0.22" stroke-width="1.5" stroke-linecap="round"/>
      <path d="M316 470H482" stroke="${soft}" stroke-opacity="0.2" stroke-width="1.5" stroke-linecap="round"/>
      <circle cx="478" cy="158" r="7" fill="${colors.paper}" stroke="${accent}" stroke-opacity="0.64" stroke-width="1.1"/>
      <circle cx="502" cy="300" r="7" fill="${colors.paper}" stroke="${accent}" stroke-opacity="0.64" stroke-width="1.1"/>
      <circle cx="484" cy="470" r="7" fill="${colors.paper}" stroke="${soft}" stroke-opacity="0.54" stroke-width="1.1"/>
    </g>
  `;
}

function logoLockup(id, palette) {
  const families = [
    () => baseSquare(`
      ${globeShell(260, 236, 126, palette.stroke, palette.soft, palette.accent)}
      ${chestPlate(260, 236, 0.44, palette.stroke, palette.accent, palette.soft)}
      <text x="106" y="424" fill="${palette.stroke}" font-family="Source Serif 4, Georgia, serif" font-size="56" letter-spacing="-2">ChapAI</text>
      <text x="110" y="454" fill="${colors.muted}" font-family="DM Sans, Arial, sans-serif" font-size="15" letter-spacing="4">CLINICAL PREP</text>
    `),
    () => baseSquare(`
      <path d="M112 300C146 246 188 208 236 186C284 164 330 166 374 192C418 218 448 260 464 318" stroke="${palette.stroke}" stroke-width="3.2" stroke-linecap="round"/>
      <path d="M128 350C164 326 198 312 230 308C262 304 292 310 322 326" stroke="${palette.accent}" stroke-width="2.4" stroke-linecap="round"/>
      <path d="M120 194H404" stroke="${palette.soft}" stroke-opacity="0.24" stroke-width="1.4"/>
      <text x="122" y="146" fill="${colors.muted}" font-family="DM Sans, Arial, sans-serif" font-size="13" letter-spacing="5">PREMIUM NURSING PREP</text>
      <text x="120" y="410" fill="${palette.stroke}" font-family="Source Serif 4, Georgia, serif" font-size="62" letter-spacing="-2">ChapAI</text>
    `),
    () => baseSquare(`
      ${globeShell(252, 224, 114, palette.stroke, palette.soft, palette.accent)}
      <path d="M252 136V322" stroke="${palette.accent}" stroke-width="2.3" stroke-linecap="round"/>
      <path d="M210 176C226 164 243 158 262 158C281 158 298 164 314 176C329 188 336 205 336 226C336 247 329 264 314 278C298 292 281 299 262 299C243 299 226 292 210 278C195 264 188 247 188 226C188 205 195 188 210 176Z" stroke="${palette.stroke}" stroke-width="2.6"/>
      <path d="M224 228C236 216 248 210 261 210C274 210 286 216 297 228" stroke="${palette.soft}" stroke-opacity="0.88" stroke-width="1.9" stroke-linecap="round"/>
      <text x="164" y="398" fill="${palette.stroke}" font-family="DM Sans, Arial, sans-serif" font-size="38" font-weight="700" letter-spacing="3">CHAPAI</text>
      <text x="174" y="432" fill="${colors.muted}" font-family="DM Sans, Arial, sans-serif" font-size="13" letter-spacing="4">NCLEX + CCRN</text>
    `),
    () => baseSquare(`
      <rect x="108" y="122" width="304" height="250" rx="30" fill="rgba(255,252,246,0.84)" stroke="rgba(208,196,177,0.7)"/>
      ${globeShell(330, 246, 88, palette.stroke, palette.soft, palette.accent)}
      ${chestPlate(330, 246, 0.28, palette.stroke, palette.accent, palette.soft)}
      <text x="136" y="240" fill="${palette.stroke}" font-family="Source Serif 4, Georgia, serif" font-size="46" font-weight="600">ChapAI</text>
      <text x="136" y="274" fill="${colors.muted}" font-family="DM Sans, Arial, sans-serif" font-size="13" letter-spacing="4">SHARPER NURSING PREP</text>
      <path d="M136 304H290" stroke="${palette.soft}" stroke-opacity="0.28" stroke-width="1.3"/>
      <text x="136" y="338" fill="${palette.stroke}" font-family="DM Sans, Arial, sans-serif" font-size="16" font-weight="600">quiet clinical confidence</text>
    `),
    () => baseSquare(`
      <path d="M120 266H186L204 228L228 314L252 198L278 266H400" stroke="${palette.stroke}" stroke-width="3.1" stroke-linecap="round" stroke-linejoin="round"/>
      <path d="M252 136C272 120 293 112 316 114C338 116 356 126 370 144C384 162 390 182 388 206C386 229 377 250 360 269C343 288 317 322 282 372C247 322 221 288 204 269C187 250 178 229 176 206C174 182 180 162 194 144C208 126 226 116 249 114C272 112 293 120 312 136" stroke="${palette.accent}" stroke-width="2.3" stroke-linecap="round" stroke-linejoin="round"/>
      <text x="132" y="434" fill="${palette.stroke}" font-family="Source Serif 4, Georgia, serif" font-size="58" letter-spacing="-2">ChapAI</text>
    `),
  ];
  return families[id % families.length]();
}

function conceptGraphic(kind) {
  if (kind === 0) {
    return `${globeShell(1168, 520, 402, colors.ink, colors.teal, colors.gold)}${chestPlate(1164, 514, 1.06, colors.ink, colors.gold, colors.teal)}`;
  }
  if (kind === 1) {
    return `${globeShell(1170, 512, 414, colors.ink, colors.clay, colors.gold)}
      ${chestPlate(1170, 514, 1.02, colors.ink, colors.clay, colors.gold)}
      <path d="M1312 690H1524" stroke="rgba(83,121,133,0.22)" stroke-width="2" stroke-linecap="round"/>
      <path d="M1312 690H1368L1382 654L1402 728L1424 620L1440 694L1460 672H1524" stroke="rgba(30,34,43,0.58)" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"/>`;
  }
  if (kind === 2) {
    return `${globeShell(1174, 520, 410, colors.ink, colors.sage, colors.gold)}
      <g opacity="0.96">
        <path d="M1106 258V814" stroke="rgba(83,121,133,0.92)" stroke-width="3"/>
        <path d="M1040 286C998 312 964 354 938 410C912 466 900 526 902 588C904 650 918 708 944 760" stroke="rgba(30,34,43,0.7)" stroke-width="3"/>
        <path d="M1172 286C1214 312 1248 354 1274 410C1300 466 1312 526 1310 588C1308 650 1294 708 1268 760" stroke="rgba(30,34,43,0.7)" stroke-width="3"/>
        <path d="M1116 334C1140 318 1165 311 1192 314C1218 317 1240 330 1256 354" stroke="rgba(196,155,89,0.9)" stroke-width="2.4"/>
        <path d="M1096 392C1136 374 1176 368 1218 374C1260 380 1292 402 1312 440" stroke="rgba(196,155,89,0.72)" stroke-width="2.4"/>
      </g>`;
  }
  if (kind === 3) {
    return `${globeShell(1184, 520, 404, colors.ink, colors.teal, colors.gold)}
      ${chestPlate(1178, 516, 0.92, colors.ink, colors.gold, colors.teal)}
      <path d="M1348 274H1542" stroke="rgba(83,121,133,0.2)" stroke-width="1.8"/>
      <path d="M1372 436H1552" stroke="rgba(83,121,133,0.18)" stroke-width="1.8"/>
      <path d="M1352 676H1530" stroke="rgba(83,121,133,0.16)" stroke-width="1.8"/>`;
  }
  if (kind === 4) {
    return `${globeShell(1174, 522, 408, colors.ink, colors.teal, colors.gold)}
      <path d="M1154 260C1190 250 1220 232 1248 208C1276 184 1302 156 1326 124" stroke="rgba(83,121,133,0.22)" stroke-width="2"/>
      <path d="M1142 308C1180 308 1214 320 1246 344C1276 368 1298 398 1310 434" stroke="rgba(196,155,89,0.72)" stroke-width="2.4"/>
      <path d="M1088 266V836" stroke="rgba(83,121,133,0.94)" stroke-width="2.8"/>
      <path d="M1058 328C1012 356 976 402 950 466C924 530 920 594 938 658" stroke="rgba(30,34,43,0.68)" stroke-width="2.8"/>
      <path d="M1118 328C1162 346 1198 380 1228 430C1256 480 1270 538 1270 602" stroke="rgba(30,34,43,0.68)" stroke-width="2.8"/>`;
  }
  if (kind === 5) {
    return `${globeShell(1166, 520, 398, colors.ink, colors.clay, colors.gold)}
      ${chestPlate(1160, 514, 1, colors.ink, colors.gold, colors.clay)}
      <circle cx="1454" cy="286" r="10" fill="rgba(255,251,244,0.96)" stroke="rgba(196,155,89,0.7)"/>
      <circle cx="1492" cy="468" r="10" fill="rgba(255,251,244,0.96)" stroke="rgba(196,155,89,0.7)"/>
      <circle cx="1456" cy="694" r="10" fill="rgba(255,251,244,0.96)" stroke="rgba(83,121,133,0.6)"/>`;
  }
  if (kind === 6) {
    return `${globeShell(1178, 518, 412, colors.ink, colors.teal, colors.gold)}
      <path d="M980 522C1040 494 1106 480 1178 480C1250 480 1318 494 1382 522" stroke="rgba(83,121,133,0.28)" stroke-width="2"/>
      <path d="M1000 606C1060 588 1120 580 1178 580C1236 580 1296 588 1356 606" stroke="rgba(83,121,133,0.22)" stroke-width="2"/>
      <path d="M1130 338C1156 320 1184 312 1212 314C1240 316 1263 330 1280 356C1296 382 1302 412 1298 446C1294 480 1280 512 1256 544C1230 578 1198 624 1160 682C1122 624 1090 578 1064 544C1040 512 1026 480 1022 446C1018 412 1024 382 1040 356C1058 330 1081 316 1108 314C1136 312 1163 320 1188 338" stroke="rgba(196,155,89,0.88)" stroke-width="2.6"/>`;
  }
  return `${globeShell(1170, 520, 404, colors.ink, colors.sage, colors.gold)}
    ${chestPlate(1172, 514, 0.96, colors.ink, colors.gold, colors.sage)}
    <path d="M1298 770H1520" stroke="rgba(83,121,133,0.2)" stroke-width="2"/>
    <path d="M1298 770H1356L1370 734L1388 808L1412 696L1428 778L1446 754H1520" stroke="rgba(30,34,43,0.62)" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"/>`;
}

function socialGraphic(kind) {
  return globeShell(1160, 284, 206, colors.ink, colors.teal, colors.gold) +
    chestPlate(1158, 284, 0.48 + kind * 0.01, colors.ink, kind % 2 ? colors.gold : colors.clay, colors.teal);
}

for (let i = 0; i < 50; i += 1) {
  const id = 601 + i;
  const palette = palettes[i % palettes.length];
  write(path.join(brandDir, `chapai-option-${id}.svg`), logoLockup(i, palette));
}

const conceptTitles = [
  ["The premium anatomy globe for cleaner nursing prep.", "One large medical object. Less clutter. More trust.", "A calmer way to prepare for CCRN."],
  ["The cardio-pulmonary field that actually owns the page.", "Built for the bedside, not generic qbank chrome.", "A calmer way to prepare for CCRN."],
  ["The hero should look like a clinical object, not a template.", "Original questions, AI-guided rationale, and a sharper path.", "A calmer way to prepare for CCRN."],
  ["The right side should feel valuable, not empty.", "A medical globe with lungs, heart, rib detail, and telemetry.", "A calmer way to prepare for CCRN."],
  ["The first screen should feel expensive and exact.", "Cleaner linework. Better hierarchy. More clinical trust.", "A calmer way to prepare for CCRN."],
  ["Premium nursing prep needs a stronger visual object.", "This direction makes the anatomy-globe do the selling.", "A calmer way to prepare for CCRN."],
  ["More signal on the right, less noise everywhere else.", "The linework is the identity now, not filler.", "A calmer way to prepare for CCRN."],
  ["A bigger medical field, still minimal and calm.", "The anatomy lives inside the globe instead of beside it.", "A calmer way to prepare for CCRN."],
];

conceptTitles.forEach((item, index) => {
  const id = 81 + index;
  write(path.join(reviewDir, `frontpage-${id}.svg`), heroFrame(item[2], item[0], item[1], conceptGraphic(index)));
});

const socialHeaders = [
  ["CCRN review should feel calmer, not cheaper.", "Original questions, AI rationale, and a cleaner bedside study flow.", "FOUNDER ACCESS"],
  ["A $10 sprint for last-minute CCRN buyers.", "24-hour access when you need to cram with more structure and less clutter.", "24-HOUR SPRINT"],
  ["NCLEX safety review with better pattern teaching.", "Priority, delegation, pharmacology, and one cleaner next step.", "NCLEX PATH"],
  ["Daily nursing questions that actually teach.", "Use the free daily question to start the repeat-touchpoint loop.", "DAILY QUESTION"],
  ["The qbank should not feel punitive.", "ChapAI is built to guide, not punish.", "MODERN QBANK"],
  ["Clinical prep for nurses who work long shifts.", "Sharper rationales, simpler UI, faster pattern recognition.", "BEDSIDE FIRST"],
  ["Built for ICU nurses who need signal.", "Hemodynamics, vent changes, shock patterns, and cleaner review.", "CCRN"],
  ["A cleaner nursing product is easier to trust.", "Less qbank drift. More clinical confidence.", "PREMIUM PREP"],
];

socialHeaders.forEach((item, index) => {
  write(
    path.join(reviewDir, `social-header-${String(index + 1).padStart(2, "0")}.svg`),
    socialHeaderFrame(item[0], item[1], socialGraphic(index), item[2]),
  );
});
