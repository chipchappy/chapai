import fs from "node:fs";
import path from "node:path";

const root = "C:/Users/Chapman/Desktop/ai/chapai";
const brandDir = path.join(root, "apps/web/public/brand/options");
const reviewDir = path.join(root, "apps/web/public/design-review");

fs.mkdirSync(brandDir, { recursive: true });
fs.mkdirSync(reviewDir, { recursive: true });

const paper = "#FBF7F0";
const sand = "#F5EFE5";
const warm = "#ECE2D2";
const dark = "#1F2024";
const muted = "#776B5A";
const gold = "#C39A61";
const teal = "#5D8590";
const clay = "#A27A62";
const sage = "#7D8C73";

const palettes = [
  { stroke: dark, accent: gold, soft: teal },
  { stroke: dark, accent: teal, soft: gold },
  { stroke: dark, accent: clay, soft: sage },
  { stroke: dark, accent: gold, soft: clay },
  { stroke: dark, accent: teal, soft: sage },
];

function write(filePath, contents) {
  fs.writeFileSync(filePath, contents, "utf8");
}

function frame(inner) {
  return `<svg width="480" height="480" viewBox="0 0 480 480" fill="none" xmlns="http://www.w3.org/2000/svg">
  <rect width="480" height="480" rx="44" fill="${paper}"/>
  <rect x="34" y="34" width="412" height="412" rx="34" fill="url(#wash)" stroke="rgba(214,201,181,0.62)"/>
  <defs>
    <radialGradient id="wash" cx="0" cy="0" r="1" gradientUnits="userSpaceOnUse" gradientTransform="translate(150 94) rotate(50) scale(334 334)">
      <stop stop-color="rgba(255,255,255,0.92)"/>
      <stop offset="1" stop-color="rgba(242,233,220,0.94)"/>
    </radialGradient>
  </defs>
  ${inner}
</svg>`;
}

function anatomyOrbit({ stroke, accent, soft }, seed) {
  const shift = (seed % 5) * 3;
  return frame(`
    <circle cx="250" cy="240" r="138" stroke="rgba(120,112,99,0.16)" stroke-width="1.4"/>
    <ellipse cx="${250 + shift}" cy="240" rx="98" ry="138" stroke="${soft}" stroke-opacity="0.28" stroke-width="1.15"/>
    <ellipse cx="${264 + shift}" cy="240" rx="68" ry="138" stroke="rgba(120,112,99,0.08)" stroke-width="1.05"/>
    <path d="M250 110V350" stroke="${accent}" stroke-width="2.2" stroke-linecap="round"/>
    <path d="M222 148C231 136 243 130 258 130C273 130 286 136 296 148C305 160 310 174 310 192C310 210 305 224 296 236C286 248 273 254 258 254C243 254 231 248 222 236C212 224 207 210 207 192C207 174 212 160 222 148Z" stroke="${stroke}" stroke-width="2.5"/>
    <path d="M232 282C243 270 255 264 268 264C281 264 293 270 304 282" stroke="${soft}" stroke-opacity="0.84" stroke-width="1.8" stroke-linecap="round"/>
    <path d="M236 322C246 306 251 292 251 280" stroke="${accent}" stroke-opacity="0.76" stroke-width="1.8" stroke-linecap="round"/>
  `);
}

function ribCrest({ stroke, accent, soft }, seed) {
  return frame(`
    <path d="M240 118C269 136 292 161 308 194C323 226 331 262 331 302C331 342 323 377 308 406C292 435 269 459 240 478C211 459 188 435 172 406C157 377 149 342 149 302C149 262 157 226 172 194C188 161 211 136 240 118Z" stroke="rgba(120,112,99,0.18)" stroke-width="1.35"/>
    <path d="M240 144V382" stroke="${accent}" stroke-width="2.25" stroke-linecap="round"/>
    <path d="M196 194C210 182 225 176 240 176C255 176 270 182 284 194" stroke="${stroke}" stroke-width="2.3" stroke-linecap="round"/>
    <path d="M186 236C204 224 222 218 240 218C258 218 276 224 294 236" stroke="${soft}" stroke-opacity="0.8" stroke-width="2" stroke-linecap="round"/>
    <path d="M180 280C200 270 220 265 240 265C260 265 280 270 300 280" stroke="${accent}" stroke-opacity="0.74" stroke-width="1.85" stroke-linecap="round"/>
    <path d="M184 326C202 318 221 314 240 314C259 314 278 318 296 326" stroke="${stroke}" stroke-opacity="0.4" stroke-width="1.7" stroke-linecap="round"/>
  `);
}

function carePill({ stroke, accent, soft }, seed) {
  return frame(`
    <rect x="126" y="116" width="228" height="248" rx="112" stroke="rgba(120,112,99,0.18)" stroke-width="1.4"/>
    <path d="M240 136V344" stroke="${accent}" stroke-width="2.2" stroke-linecap="round"/>
    <path d="M198 180C211 168 225 162 240 162C255 162 269 168 282 180C294 193 300 208 300 226C300 244 294 259 282 272C269 284 255 290 240 290C225 290 211 284 198 272C186 259 180 244 180 226C180 208 186 193 198 180Z" stroke="${stroke}" stroke-width="2.45"/>
    <path d="M212 320H268" stroke="${soft}" stroke-opacity="0.82" stroke-width="1.9" stroke-linecap="round"/>
    <path d="M196 340H284" stroke="${stroke}" stroke-opacity="0.34" stroke-width="1.6" stroke-linecap="round"/>
  `);
}

function beaconArc({ stroke, accent, soft }, seed) {
  const lift = seed % 4;
  return frame(`
    <circle cx="240" cy="240" r="138" stroke="rgba(120,112,99,0.16)" stroke-width="1.35"/>
    <path d="M160 316C160 252 176 202 208 168C222 154 233 146 240 144C247 146 258 154 272 168C304 202 320 252 320 316" stroke="${stroke}" stroke-width="2.35"/>
    <path d="M188 318C188 273 198 238 218 214C227 203 234 198 240 197C246 198 253 203 262 214C282 238 292 273 292 318" stroke="${soft}" stroke-opacity="0.78" stroke-width="1.9"/>
    <path d="M240 144V338" stroke="${accent}" stroke-width="2.2" stroke-linecap="round"/>
    <path d="M204 ${336 + lift}H276" stroke="${stroke}" stroke-opacity="0.38" stroke-width="1.8" stroke-linecap="round"/>
  `);
}

function medallionWordmark({ stroke, accent, soft }, seed) {
  const initials = ["C", "A", "N", "P", "I"][seed % 5];
  return frame(`
    <circle cx="240" cy="188" r="82" stroke="rgba(120,112,99,0.17)" stroke-width="1.35"/>
    <circle cx="240" cy="188" r="58" stroke="${soft}" stroke-opacity="0.24" stroke-width="1.1"/>
    <text x="208" y="208" fill="${stroke}" font-family="Georgia, 'Times New Roman', serif" font-size="62" letter-spacing="-3">${initials}</text>
    <path d="M132 288H348" stroke="${accent}" stroke-opacity="0.66" stroke-width="1.8"/>
    <text x="132" y="336" fill="${stroke}" font-family="'DM Sans', Arial, sans-serif" font-size="30" font-weight="700" letter-spacing="4">CHAPAI</text>
    <text x="132" y="366" fill="${muted}" font-family="'DM Sans', Arial, sans-serif" font-size="14" letter-spacing="4">CALMER CLINICAL PREP</text>
  `);
}

const families = [anatomyOrbit, ribCrest, carePill, beaconArc, medallionWordmark];

let option = 401;
for (const family of families) {
  for (let i = 0; i < 10; i += 1) {
    const palette = palettes[i % palettes.length];
    write(path.join(brandDir, `chapai-option-${option}.svg`), family(palette, i));
    option += 1;
  }
}

function frontpageFrame(title, subtitle, shell, figure) {
  return `<svg width="1600" height="1024" viewBox="0 0 1600 1024" fill="none" xmlns="http://www.w3.org/2000/svg">
  <rect width="1600" height="1024" fill="${sand}"/>
  <style>
    .shell { fill: none; stroke-linecap: round; stroke-linejoin: round; }
    .shell.main { stroke: rgba(122,113,99,0.18); stroke-width: 1.45; }
    .shell.soft { stroke: rgba(122,113,99,0.09); stroke-width: 1.06; }
    .shell.faint { stroke: rgba(122,113,99,0.055); stroke-width: 1.01; }
    .figure { fill: none; stroke: rgba(50,45,40,0.31); stroke-width: 2.2; stroke-linecap: round; stroke-linejoin: round; }
    .detail { fill: none; stroke: rgba(104,93,79,0.14); stroke-width: 1.35; stroke-linecap: round; stroke-linejoin: round; }
    .organ { fill: none; stroke: rgba(194,154,86,0.38); stroke-width: 1.9; stroke-linecap: round; stroke-linejoin: round; }
    .accent { fill: none; stroke: rgba(93,133,144,0.88); stroke-width: 2.15; stroke-linecap: round; stroke-linejoin: round; }
  </style>
  <rect x="262" y="74" width="1076" height="72" rx="36" fill="rgba(255,252,247,0.74)" stroke="rgba(218,206,188,0.62)"/>
  <circle cx="301" cy="110" r="21" fill="rgba(255,252,247,0.98)" stroke="rgba(218,206,188,0.74)"/>
  <path d="M301 96V126" stroke="${gold}" stroke-width="1.5" stroke-linecap="round"/>
  <path d="M289 106C294 101 300 99 306 99C312 99 318 101 322 106C326 110 329 116 330 122" stroke="${dark}" stroke-width="1.8" stroke-linecap="round"/>
  <text x="336" y="111" fill="${dark}" font-family="'DM Sans', Arial, sans-serif" font-size="22" font-weight="600">ChapAI</text>
  <text x="336" y="136" fill="${muted}" font-family="'DM Sans', Arial, sans-serif" font-size="12" letter-spacing="3">NCLEX + CCRN</text>
  <text x="1130" y="117" fill="${muted}" font-family="'DM Sans', Arial, sans-serif" font-size="15" letter-spacing="2">CCRN</text>
  <text x="1183" y="117" fill="${muted}" font-family="'DM Sans', Arial, sans-serif" font-size="15" letter-spacing="2">NCLEX</text>
  <text x="1248" y="117" fill="${muted}" font-family="'DM Sans', Arial, sans-serif" font-size="15" letter-spacing="2">PLANS</text>
  <rect x="1298" y="88" width="72" height="44" rx="22" fill="rgba(255,252,247,0.96)" stroke="rgba(218,206,188,0.72)"/>
  <text x="1320" y="116" fill="${dark}" font-family="'DM Sans', Arial, sans-serif" font-size="16" font-weight="700">START</text>
  <text x="300" y="212" fill="${muted}" font-family="'DM Sans', Arial, sans-serif" font-size="13" font-weight="700" letter-spacing="4">APRIL DESIGN PASS</text>
  <text x="300" y="340" fill="${dark}" font-family="'DM Sans', Arial, sans-serif" font-size="106" font-weight="500" letter-spacing="-7">${title}</text>
  <text x="300" y="638" fill="${muted}" font-family="'DM Sans', Arial, sans-serif" font-size="22">${subtitle}</text>
  <rect x="300" y="692" width="188" height="54" rx="27" fill="${teal}"/>
  <text x="338" y="726" fill="${paper}" font-family="'DM Sans', Arial, sans-serif" font-size="22" font-weight="700">Choose plan</text>
  <rect x="502" y="692" width="168" height="54" rx="27" fill="rgba(255,252,247,0.94)" stroke="rgba(218,206,188,0.64)"/>
  <text x="544" y="726" fill="${dark}" font-family="'DM Sans', Arial, sans-serif" font-size="22" font-weight="600">Try free</text>
  <path d="M300 792H840" stroke="rgba(214,203,188,0.72)"/>
  <text x="300" y="822" fill="${muted}" font-family="'DM Sans', Arial, sans-serif" font-size="13" letter-spacing="4">ANATOMY GLOBE + CLEANER RATIONALE</text>
  <text x="300" y="906" fill="${dark}" font-family="'DM Sans', Arial, sans-serif" font-size="34" font-weight="700">435 live CCRN questions</text>
  <text x="614" y="906" fill="${dark}" font-family="'DM Sans', Arial, sans-serif" font-size="34" font-weight="700">Free / Plus / Pro</text>
  ${shell}
  ${figure}
</svg>`;
}

function shellWide() {
  return `
    <circle cx="1092" cy="492" r="420" class="shell main"/>
    <ellipse cx="1092" cy="492" rx="308" ry="420" class="shell soft"/>
    <ellipse cx="1126" cy="492" rx="222" ry="420" class="shell soft"/>
    <path d="M1092 72V912" class="shell faint"/>
    <path d="M794 332C902 292 1000 272 1092 272C1184 272 1282 292 1390 332" class="shell faint"/>
    <path d="M760 482C874 444 984 425 1092 425C1202 425 1314 444 1424 482" class="shell faint"/>
    <path d="M778 650C886 614 992 596 1096 596C1200 596 1306 614 1412 650" class="shell faint"/>
    <ellipse cx="1124" cy="492" rx="178" ry="392" fill="rgba(255,249,241,0.84)"/>
  `;
}

function shellOffAxis() {
  return `
    <circle cx="1046" cy="500" r="378" class="shell main"/>
    <ellipse cx="1046" cy="500" rx="262" ry="378" class="shell soft"/>
    <ellipse cx="1092" cy="500" rx="178" ry="378" class="shell soft"/>
    <path d="M1046 122V878" class="shell faint"/>
    <path d="M786 364C881 328 968 310 1046 310C1125 310 1212 328 1300 364" class="shell faint"/>
    <path d="M760 516C860 482 955 466 1046 466C1138 466 1234 482 1326 516" class="shell faint"/>
    <path d="M778 670C868 642 958 628 1048 628C1138 628 1226 642 1314 670" class="shell faint"/>
    <ellipse cx="1086" cy="500" rx="164" ry="346" fill="rgba(255,249,241,0.88)"/>
  `;
}

function figureVesalius() {
  return `
    <path d="M1088 176C1116 173 1140 183 1158 205C1176 226 1184 253 1182 286C1179 319 1167 346 1146 368C1124 391 1110 422 1102 462" class="figure"/>
    <path d="M1094 176V876" class="accent"/>
    <path d="M1088 230C1124 218 1158 201 1192 180C1225 160 1257 132 1288 98" class="figure"/>
    <path d="M1068 292C1030 328 988 358 942 382C896 406 848 424 800 438" class="figure"/>
    <path d="M1112 334C1134 338 1153 350 1168 370C1183 390 1192 412 1196 436" class="detail"/>
    <path d="M1098 462C1118 514 1144 566 1176 618C1205 666 1235 712 1266 758" class="figure"/>
    <path d="M1080 462C1074 524 1062 588 1044 652C1027 716 1016 790 1010 874" class="figure"/>
  `;
}

function figureLungs() {
  return `
    <path d="M1096 170V854" class="accent"/>
    <path d="M1048 212C1014 232 983 264 956 308C929 351 912 397 904 446C896 494 900 544 918 596" class="figure"/>
    <path d="M1146 212C1180 232 1211 264 1238 308C1265 351 1282 397 1290 446C1298 494 1294 544 1276 596" class="figure"/>
    <path d="M1060 336C1082 322 1105 315 1128 316C1151 317 1171 327 1188 348" class="organ"/>
    <path d="M1024 412C1057 392 1091 384 1127 389C1162 394 1193 411 1218 440" class="organ"/>
    <path d="M1134 336C1111 324 1088 322 1065 328C1041 334 1019 347 998 366" class="detail"/>
  `;
}

function figureHeart() {
  return `
    <path d="M1092 176C1117 174 1139 183 1156 203C1172 223 1179 248 1177 279C1174 309 1163 334 1144 354C1125 375 1112 403 1106 438" class="figure"/>
    <path d="M1098 176V840" class="accent"/>
    <path d="M1094 280C1123 257 1152 246 1182 248C1212 251 1236 264 1254 288C1272 312 1280 339 1278 370C1275 401 1263 430 1240 456C1217 483 1187 523 1148 578C1109 523 1079 483 1057 456C1034 430 1021 401 1018 370C1016 339 1024 312 1042 288C1060 264 1084 251 1114 248C1143 246 1170 257 1194 280" class="figure"/>
    <path d="M1120 476C1156 502 1194 523 1236 540" class="detail"/>
    <path d="M1084 476C1052 501 1017 521 980 538" class="detail"/>
  `;
}

const frontpages = [
  ["57", "A calmer, more serious way to prepare.", "One anatomy globe, cleaner rationale, and a much sharper package path.", shellWide(), figureVesalius()],
  ["58", "Built for ICU nurses who want signal.", "Less clutter, stronger anatomy linework, and a cleaner buying surface.", shellWide(), figureLungs()],
  ["59", "Premium nursing prep that feels distinct.", "A cleaner globe object with sharper medical detail and calmer typography.", shellOffAxis(), figureHeart()],
  ["60", "A sharper clinical standard for CCRN and NCLEX.", "One stronger hero object instead of a stack of generic SaaS cards.", shellWide(), figureVesalius()],
  ["61", "Clinical prep with one clearer visual idea.", "Open space, stronger linework, and a more premium silhouette.", shellOffAxis(), figureLungs()],
  ["62", "A bolder anatomy field for serious buyers.", "More presence on the right, less noise everywhere else.", shellWide(), figureHeart()],
  ["63", "A cleaner premium shell with a medical signature.", "Better line discipline, calmer orbit geometry, and warmer light.", shellOffAxis(), figureVesalius()],
  ["64", "A more premium nursing front page.", "Sharper visual trust cues for creators, educators, and paid buyers.", shellWide(), figureLungs()],
  ["65", "One anatomy globe. Two tighter exam paths.", "A calmer homepage built to sell confidence instead of clutter.", shellOffAxis(), figureHeart()],
  ["66", "A stronger hero object for ChapAI.", "Minimalist, medical, and more memorable at first glance.", shellWide(), figureVesalius()],
];

for (const [id, title, subtitle, shell, figure] of frontpages) {
  write(path.join(reviewDir, `frontpage-${id}.svg`), frontpageFrame(title, subtitle, shell, figure));
}

console.log("Generated premium review assets: logo options 401-450 and front pages 57-66.");
