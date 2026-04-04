import fs from "node:fs";
import path from "node:path";

const root = "C:/Users/Chapman/Desktop/ai/chapai";
const brandDir = path.join(root, "apps/web/public/brand/options");
const reviewDir = path.join(root, "apps/web/public/design-review");

fs.mkdirSync(brandDir, { recursive: true });
fs.mkdirSync(reviewDir, { recursive: true });

const paper = "#FBF7F0";
const shell = "#F4ECDE";
const dark = "#1F2024";
const muted = "#74685A";
const gold = "#C39A61";
const teal = "#5D8590";
const sage = "#7B8D7E";
const clay = "#9E775E";

const palettes = [
  { stroke: dark, accent: gold, soft: teal },
  { stroke: dark, accent: teal, soft: gold },
  { stroke: dark, accent: clay, soft: sage },
  { stroke: dark, accent: gold, soft: sage },
  { stroke: dark, accent: teal, soft: clay },
];

function write(filePath, contents) {
  fs.writeFileSync(filePath, contents, "utf8");
}

function markFrame(inner) {
  return `<svg width="480" height="480" viewBox="0 0 480 480" fill="none" xmlns="http://www.w3.org/2000/svg">
  <rect width="480" height="480" rx="44" fill="${paper}"/>
  <rect x="34" y="34" width="412" height="412" rx="34" fill="${shell}" stroke="rgba(214,201,181,0.6)"/>
  ${inner}
</svg>`;
}

function orbitalTorso({ stroke, accent, soft }, seed) {
  return markFrame(`
    <circle cx="246" cy="218" r="112" stroke="rgba(118,108,93,0.18)" stroke-width="1.45"/>
    <ellipse cx="${258 + (seed % 4) * 4}" cy="218" rx="78" ry="112" stroke="${soft}" stroke-opacity="0.34" stroke-width="1.18"/>
    <path d="M246 122V336" stroke="${accent}" stroke-width="2.2" stroke-linecap="round"/>
    <path d="M226 154C239 142 252 136 266 136C281 136 294 142 306 154C318 166 324 181 324 200C324 219 318 234 306 246C294 258 281 264 266 264C252 264 239 258 226 246C214 234 208 219 208 200C208 181 214 166 226 154Z" stroke="${stroke}" stroke-width="2.35"/>
    <path d="M196 280C224 262 240 252 246 250C252 252 268 262 296 280" stroke="${soft}" stroke-opacity="0.82" stroke-width="1.7" stroke-linecap="round"/>
    <path d="M220 322C232 304 240 292 246 288C252 292 260 304 272 322" stroke="${accent}" stroke-opacity="0.76" stroke-width="1.75" stroke-linecap="round"/>
  `);
}

function haloMonogram({ stroke, accent, soft }, seed) {
  const letters = ["C", "H", "A", "P", "I"];
  const glyph = letters[seed % letters.length];
  return markFrame(`
    <circle cx="240" cy="178" r="84" stroke="rgba(118,108,93,0.18)" stroke-width="1.45"/>
    <ellipse cx="240" cy="178" rx="58" ry="84" stroke="${soft}" stroke-opacity="0.28" stroke-width="1.08"/>
    <text x="208" y="202" fill="${stroke}" font-family="'Source Serif 4', Georgia, serif" font-size="66" letter-spacing="-4">${glyph}</text>
    <path d="M138 292H342" stroke="${accent}" stroke-opacity="0.7" stroke-width="1.85"/>
    <text x="138" y="340" fill="${stroke}" font-family="'DM Sans', Arial, sans-serif" font-size="28" font-weight="700" letter-spacing="4">CHAPAI</text>
    <text x="138" y="368" fill="${muted}" font-family="'DM Sans', Arial, sans-serif" font-size="14" letter-spacing="3">PREMIUM NURSING PREP</text>
  `);
}

function heartbeatWindow({ stroke, accent, soft }, seed) {
  return markFrame(`
    <rect x="144" y="118" width="192" height="228" rx="92" stroke="rgba(118,108,93,0.18)" stroke-width="1.4"/>
    <path d="M168 224H214L232 192L252 258L274 214H312" stroke="${accent}" stroke-width="2.25" stroke-linecap="round" stroke-linejoin="round"/>
    <path d="M240 136V328" stroke="${soft}" stroke-opacity="0.65" stroke-width="1.25" stroke-linecap="round"/>
    <path d="M192 294C206 278 222 270 240 270C258 270 274 278 288 294" stroke="${stroke}" stroke-opacity="0.42" stroke-width="1.75" stroke-linecap="round"/>
  `);
}

function lanternSeal({ stroke, accent, soft }, seed) {
  return markFrame(`
    <path d="M240 108C278 138 306 170 322 206C338 242 346 280 346 320C346 360 338 394 322 422C306 450 278 476 240 500C202 476 174 450 158 422C142 394 134 360 134 320C134 280 142 242 158 206C174 170 202 138 240 108Z" stroke="rgba(118,108,93,0.18)" stroke-width="1.35"/>
    <path d="M240 138V380" stroke="${accent}" stroke-width="2.2" stroke-linecap="round"/>
    <path d="M198 212C210 196 224 188 240 188C256 188 270 196 282 212C294 227 300 245 300 266C300 287 294 305 282 320C270 336 256 344 240 344C224 344 210 336 198 320C186 305 180 287 180 266C180 245 186 227 198 212Z" stroke="${stroke}" stroke-width="2.3"/>
    <path d="M194 250H286" stroke="${soft}" stroke-opacity="0.72" stroke-width="1.7" stroke-linecap="round"/>
  `);
}

function serifWordmark({ stroke, accent, soft }, seed) {
  return markFrame(`
    <path d="M162 184C198 146 224 128 240 128C256 128 282 146 318 184" stroke="${soft}" stroke-opacity="0.44" stroke-width="1.55" stroke-linecap="round"/>
    <path d="M186 208C212 184 230 172 240 172C250 172 268 184 294 208" stroke="${accent}" stroke-opacity="0.74" stroke-width="1.75" stroke-linecap="round"/>
    <text x="108" y="278" fill="${stroke}" font-family="'Source Serif 4', Georgia, serif" font-size="74" letter-spacing="-5">ChapAI</text>
    <path d="M118 316H360" stroke="rgba(118,108,93,0.14)" stroke-width="1.25"/>
    <text x="120" y="350" fill="${muted}" font-family="'DM Sans', Arial, sans-serif" font-size="14" letter-spacing="4">NCLEX + CCRN</text>
  `);
}

const logoFamilies = [orbitalTorso, haloMonogram, heartbeatWindow, lanternSeal, serifWordmark];
let option = 451;
for (const family of logoFamilies) {
  for (let i = 0; i < 10; i += 1) {
    write(path.join(brandDir, `chapai-option-${option}.svg`), family(palettes[i % palettes.length], i));
    option += 1;
  }
}

function frontpage(title, subtitle, mode) {
  const shellBlock = mode % 2 === 0
    ? `
      <circle cx="1102" cy="500" r="430" class="shell main"/>
      <ellipse cx="1102" cy="500" rx="316" ry="430" class="shell soft"/>
      <ellipse cx="1154" cy="500" rx="224" ry="430" class="shell soft"/>
      <path d="M1102 70V930" class="shell faint"/>
      <path d="M694 312C834 264 972 240 1102 240C1232 240 1370 264 1498 312" class="shell main"/>
      <path d="M676 456C820 418 964 399 1102 399C1242 399 1386 418 1528 456" class="shell faint"/>
      <path d="M686 610C826 576 966 559 1102 559C1238 559 1378 576 1518 610" class="shell faint"/>
      <path d="M710 756C842 726 974 710 1102 710C1230 710 1360 726 1488 756" class="shell soft"/>
      <path d="M782 134C872 218 946 324 1004 452C1060 578 1108 708 1152 836" class="shell main"/>
      <path d="M1324 126C1242 214 1176 322 1126 448C1078 572 1038 704 1008 836" class="shell soft"/>
    `
    : `
      <circle cx="1044" cy="512" r="392" class="shell main"/>
      <ellipse cx="1044" cy="512" rx="280" ry="392" class="shell soft"/>
      <ellipse cx="1090" cy="512" rx="194" ry="392" class="shell soft"/>
      <path d="M1044 120V904" class="shell faint"/>
      <path d="M676 340C806 300 928 280 1044 280C1160 280 1284 300 1410 340" class="shell main"/>
      <path d="M664 492C796 458 922 442 1044 442C1168 442 1294 458 1422 492" class="shell faint"/>
      <path d="M680 648C804 620 928 606 1046 606C1166 606 1288 620 1406 648" class="shell faint"/>
      <path d="M760 184C846 258 916 356 970 474C1022 592 1068 706 1110 816" class="shell main"/>
      <path d="M1278 178C1204 264 1144 362 1098 472C1052 582 1014 694 986 806" class="shell soft"/>
    `;

  const figureBlock = mode % 3 === 0
    ? `
      <path d="M1120 178C1154 176 1182 188 1202 212C1222 236 1232 266 1230 302C1227 338 1214 368 1192 394C1170 422 1156 454 1148 490" class="figure"/>
      <path d="M1124 178V906" class="accent"/>
      <path d="M1102 238C1046 296 986 344 920 382C852 420 778 448 700 466" class="figure"/>
      <path d="M1126 296C1182 276 1230 270 1272 276C1314 282 1348 302 1372 336" class="organ"/>
      <path d="M1088 378C1148 354 1204 348 1258 356C1312 364 1352 388 1380 428" class="organ"/>
      <path d="M1116 454C1182 476 1230 512 1260 562" class="detail"/>
      <path d="M1096 498C1088 602 1068 706 1038 810C1020 872 1008 936 1004 1000" class="figure"/>
      <path d="M1146 500C1188 592 1240 674 1302 746C1360 812 1416 876 1470 938" class="figure"/>
      <path d="M1134 324C1152 310 1174 302 1198 302C1222 302 1244 310 1260 324C1276 338 1284 358 1284 382C1284 406 1276 426 1260 442C1244 458 1222 466 1198 466C1174 466 1152 458 1134 442C1118 426 1110 406 1110 382C1110 358 1118 338 1134 324Z" class="figure"/>
    `
    : mode % 3 === 1
      ? `
        <path d="M1116 188V888" class="accent"/>
        <path d="M1058 230C1020 260 988 302 962 356C936 410 924 462 926 512C928 562 944 608 974 650" class="figure"/>
        <path d="M1174 230C1212 260 1244 302 1270 356C1296 410 1308 462 1306 512C1304 562 1288 608 1258 650" class="figure"/>
        <path d="M1072 320C1102 300 1130 292 1158 294C1188 296 1214 312 1238 342" class="organ"/>
        <path d="M1032 406C1074 384 1114 374 1156 378C1198 382 1234 402 1264 438" class="organ"/>
        <path d="M1090 498C1118 600 1128 704 1122 810" class="figure"/>
        <path d="M1160 496C1186 590 1228 676 1286 752" class="figure"/>
      `
      : `
        <path d="M1118 182C1150 180 1178 190 1200 212C1222 234 1232 262 1230 296C1228 330 1216 360 1194 386C1172 412 1158 444 1150 482" class="figure"/>
        <path d="M1122 182V890" class="accent"/>
        <path d="M1130 298C1160 274 1192 262 1224 264C1258 266 1286 282 1308 312C1330 342 1340 374 1338 410C1336 446 1320 480 1290 512C1260 544 1222 594 1178 662C1134 594 1096 544 1066 512C1036 480 1020 446 1018 410C1016 374 1026 342 1048 312C1070 282 1098 266 1132 264C1164 262 1194 274 1220 298" class="figure"/>
        <path d="M1146 554C1188 582 1234 602 1284 616" class="detail"/>
        <path d="M1100 556C1060 582 1018 602 972 614" class="detail"/>
      `;

  return `<svg width="1600" height="1024" viewBox="0 0 1600 1024" fill="none" xmlns="http://www.w3.org/2000/svg">
  <rect width="1600" height="1024" fill="${shell}"/>
  <defs>
    <radialGradient id="wash-${mode}" cx="0" cy="0" r="1" gradientUnits="userSpaceOnUse" gradientTransform="translate(1132 458) rotate(90) scale(402 402)">
      <stop stop-color="#fffaf2" stop-opacity="0.96"/>
      <stop offset="1" stop-color="#fffaf2" stop-opacity="0"/>
    </radialGradient>
  </defs>
  <style>
    .shell { fill: none; stroke-linecap: round; stroke-linejoin: round; }
    .shell.main { stroke: rgba(122,113,99,0.28); stroke-width: 1.64; }
    .shell.soft { stroke: rgba(122,113,99,0.15); stroke-width: 1.18; }
    .shell.faint { stroke: rgba(122,113,99,0.1); stroke-width: 1.04; }
    .figure { fill: none; stroke: rgba(47,42,37,0.34); stroke-width: 2.26; stroke-linecap: round; stroke-linejoin: round; }
    .detail { fill: none; stroke: rgba(104,93,79,0.18); stroke-width: 1.34; stroke-linecap: round; stroke-linejoin: round; }
    .organ { fill: none; stroke: rgba(194,154,86,0.42); stroke-width: 1.92; stroke-linecap: round; stroke-linejoin: round; }
    .accent { fill: none; stroke: rgba(93,133,144,0.9); stroke-width: 2.16; stroke-linecap: round; stroke-linejoin: round; }
  </style>
  <rect x="264" y="74" width="1072" height="72" rx="36" fill="rgba(255,252,247,0.74)" stroke="rgba(218,206,188,0.62)"/>
  <circle cx="304" cy="110" r="21" fill="rgba(255,252,247,0.98)" stroke="rgba(218,206,188,0.74)"/>
  <path d="M304 96V126" stroke="${gold}" stroke-width="1.45" stroke-linecap="round"/>
  <path d="M293 108C297 102 301 99 304 99C307 99 311 102 315 108" stroke="${dark}" stroke-width="1.75" stroke-linecap="round"/>
  <path d="M292 116C297 110 301 107 304 107C307 107 311 110 316 116" stroke="${teal}" stroke-width="1.35" stroke-linecap="round"/>
  <text x="338" y="111" fill="${dark}" font-family="'DM Sans', Arial, sans-serif" font-size="22" font-weight="600">ChapAI</text>
  <text x="338" y="136" fill="${muted}" font-family="'DM Sans', Arial, sans-serif" font-size="12" letter-spacing="3">NCLEX + CCRN</text>
  <text x="1126" y="117" fill="${muted}" font-family="'DM Sans', Arial, sans-serif" font-size="15" letter-spacing="2">CCRN</text>
  <text x="1179" y="117" fill="${muted}" font-family="'DM Sans', Arial, sans-serif" font-size="15" letter-spacing="2">NCLEX</text>
  <text x="1244" y="117" fill="${muted}" font-family="'DM Sans', Arial, sans-serif" font-size="15" letter-spacing="2">PLANS</text>
  <rect x="1298" y="88" width="72" height="44" rx="22" fill="rgba(255,252,247,0.96)" stroke="rgba(218,206,188,0.72)"/>
  <text x="1320" y="116" fill="${dark}" font-family="'DM Sans', Arial, sans-serif" font-size="16" font-weight="700">START</text>
  <text x="300" y="214" fill="${muted}" font-family="'DM Sans', Arial, sans-serif" font-size="13" font-weight="700" letter-spacing="4">ANATOMY GLOBE / PREMIUM CLINICAL PREP</text>
  <text x="300" y="340" fill="${dark}" font-family="'DM Sans', Arial, sans-serif" font-size="106" font-weight="500" letter-spacing="-7">${title}</text>
  <text x="300" y="640" fill="${muted}" font-family="'DM Sans', Arial, sans-serif" font-size="22">${subtitle}</text>
  <rect x="300" y="694" width="188" height="54" rx="27" fill="${teal}"/>
  <text x="338" y="728" fill="${paper}" font-family="'DM Sans', Arial, sans-serif" font-size="22" font-weight="700">Choose plan</text>
  <rect x="502" y="694" width="168" height="54" rx="27" fill="rgba(255,252,247,0.94)" stroke="rgba(218,206,188,0.64)"/>
  <text x="544" y="728" fill="${dark}" font-family="'DM Sans', Arial, sans-serif" font-size="22" font-weight="600">Try free</text>
  <path d="M300 792H852" stroke="rgba(214,203,188,0.72)"/>
  <text x="300" y="822" fill="${muted}" font-family="'DM Sans', Arial, sans-serif" font-size="13" letter-spacing="4">ONE DISTINCT HERO OBJECT / CLEANER QUESTION BANK / FASTER BUYING PATH</text>
  <text x="300" y="906" fill="${dark}" font-family="'DM Sans', Arial, sans-serif" font-size="34" font-weight="700">463 live CCRN questions</text>
  <text x="622" y="906" fill="${dark}" font-family="'DM Sans', Arial, sans-serif" font-size="34" font-weight="700">Free / Plus / Pro</text>
  <ellipse cx="${mode % 2 === 0 ? 1120 : 1068}" cy="${mode % 2 === 0 ? 500 : 512}" rx="${mode % 2 === 0 ? 442 : 394}" ry="${mode % 2 === 0 ? 442 : 394}" fill="url(#wash-${mode})"/>
  ${shellBlock}
  ${figureBlock}
</svg>`;
}

const titles = [
  "A calmer, more premium way to prepare.",
  "A sharper clinical standard for test prep.",
  "Built for bedside reasoning, not qbank noise.",
  "The premium nursing prep shell we actually wanted.",
  "One clearer anatomy globe. Two tighter paths.",
  "A stronger front page for serious buyers.",
  "Premium nursing prep with a distinct medical signature.",
  "A cleaner, bolder way to study.",
  "A more memorable anatomy-first homepage.",
  "A premium shell that feels built, not assembled.",
];

const subtitles = [
  "Cleaner rationale, stronger linework, and a direct path into the right plan.",
  "One hero object, fewer distractions, and a more confident product surface.",
  "A calmer clinical product for ICU nurses, NCLEX crammers, and educators.",
  "More presence on the right, less generic SaaS structure everywhere else.",
  "Sharper visual trust cues for creators, institutions, and paid buyers.",
  "A homepage designed to sell confidence before the first CTA click.",
  "More visible globe lines, cleaner medical detail, and warmer light.",
  "The anatomy field becomes the signature instead of a background afterthought.",
  "Minimalist, medical, and more premium at first glance.",
  "A cleaner buying surface with one unmistakable visual idea.",
];

for (let i = 0; i < 10; i += 1) {
  write(path.join(reviewDir, `frontpage-${67 + i}.svg`), frontpage(titles[i], subtitles[i], i));
}

console.log("Generated premium review assets: logo options 451-500 and front pages 67-76.");
