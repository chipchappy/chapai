import fs from "node:fs";
import path from "node:path";

const root = "C:/Users/Chapman/Desktop/ai/chapai";
const brandDir = path.join(root, "apps/web/public/brand/options");
const reviewDir = path.join(root, "apps/web/public/design-review");
const manifestPath = path.join(reviewDir, "review-manifest.json");

fs.mkdirSync(brandDir, { recursive: true });
fs.mkdirSync(reviewDir, { recursive: true });

const paper = "#FBF7F0";
const sand = "#F2EBDD";
const wash = "#E8DBC7";
const fog = "#F7F1E8";
const dark = "#1F1F21";
const muted = "#766D61";
const grid = "rgba(90,112,120,0.14)";
const gridSoft = "rgba(90,112,120,0.08)";
const teal = "#5A7F88";
const gold = "#C59B5E";
const clay = "#B67F67";
const sage = "#7C8D79";

function write(filePath, contents) {
  fs.writeFileSync(filePath, contents, "utf8");
}

function baseSvg(inner, { width = 1600, height = 960 } = {}) {
  return `<svg width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" fill="none" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <radialGradient id="paper-wash" cx="0" cy="0" r="1" gradientUnits="userSpaceOnUse" gradientTransform="translate(${width * 0.77} ${height * 0.36}) rotate(90) scale(${height * 0.5} ${height * 0.5})">
      <stop offset="0" stop-color="#fffdf8"/>
      <stop offset="0.48" stop-color="${sand}"/>
      <stop offset="1" stop-color="${paper}"/>
    </radialGradient>
    <radialGradient id="bleed-wash" cx="0" cy="0" r="1" gradientUnits="userSpaceOnUse" gradientTransform="translate(${width * 0.78} ${height * 0.4}) rotate(90) scale(${height * 0.28} ${height * 0.28})">
      <stop offset="0" stop-color="#fffaf2" stop-opacity="0.96"/>
      <stop offset="0.52" stop-color="${wash}" stop-opacity="0.58"/>
      <stop offset="1" stop-color="${wash}" stop-opacity="0"/>
    </radialGradient>
  </defs>
  <rect width="${width}" height="${height}" fill="${paper}"/>
  <rect x="24" y="24" width="${width - 48}" height="${height - 48}" rx="28" fill="url(#paper-wash)" stroke="rgba(208,192,168,0.38)"/>
  ${inner}
</svg>`;
}

function navBar() {
  return `
    <rect x="110" y="70" width="1380" height="82" rx="41" fill="rgba(255,252,247,0.84)" stroke="rgba(212,197,173,0.52)"/>
    <text x="186" y="120" fill="${dark}" font-family="'Source Serif 4', Georgia, serif" font-size="38" font-weight="600" letter-spacing="-2">ChapAI</text>
    <text x="1106" y="120" fill="${muted}" font-family="'DM Sans', Arial, sans-serif" font-size="20" font-weight="600">CCRN</text>
    <text x="1190" y="120" fill="${muted}" font-family="'DM Sans', Arial, sans-serif" font-size="20" font-weight="600">NCLEX</text>
    <text x="1284" y="120" fill="${muted}" font-family="'DM Sans', Arial, sans-serif" font-size="20" font-weight="600">PLANS</text>
    <rect x="1348" y="90" width="114" height="44" rx="22" fill="rgba(255,250,243,0.96)" stroke="rgba(212,197,173,0.54)"/>
    <text x="1384" y="118" fill="${dark}" font-family="'DM Sans', Arial, sans-serif" font-size="20" font-weight="700">SPRINT</text>
  `;
}

function textBlock({ eyebrow, title, body, proof }) {
  return `
    <text x="150" y="188" fill="${muted}" font-family="'DM Sans', Arial, sans-serif" font-size="15" font-weight="700" letter-spacing="5">${eyebrow.toUpperCase()}</text>
    <text x="150" y="286" fill="${dark}" font-family="'DM Sans', Arial, sans-serif" font-size="96" font-weight="500" letter-spacing="-7">${title[0]}</text>
    <text x="150" y="376" fill="${dark}" font-family="'DM Sans', Arial, sans-serif" font-size="96" font-weight="500" letter-spacing="-7">${title[1]}</text>
    <text x="150" y="466" fill="${dark}" font-family="'DM Sans', Arial, sans-serif" font-size="96" font-weight="500" letter-spacing="-7">${title[2]}</text>
    <text x="150" y="548" fill="${muted}" font-family="'DM Sans', Arial, sans-serif" font-size="30">${body}</text>
    <rect x="150" y="614" width="232" height="64" rx="32" fill="${teal}"/>
    <text x="192" y="654" fill="#fff" font-family="'DM Sans', Arial, sans-serif" font-size="25" font-weight="700">Start the $10 sprint</text>
    <rect x="400" y="614" width="196" height="64" rx="32" fill="rgba(255,252,247,0.88)" stroke="rgba(194,178,154,0.62)"/>
    <text x="454" y="654" fill="${dark}" font-family="'DM Sans', Arial, sans-serif" font-size="24" font-weight="600">See plans</text>
    <text x="150" y="738" fill="${muted}" font-family="'DM Sans', Arial, sans-serif" font-size="14" font-weight="700" letter-spacing="4">${proof}</text>
    <path d="M150 766H676" stroke="rgba(212,197,173,0.62)"/>
  `;
}

function sharedField() {
  return `
    <path d="M760 210C906 132 1056 98 1210 106C1352 114 1488 154 1618 226C1702 272 1768 326 1816 388" stroke="${grid}" stroke-width="1.4" fill="none" stroke-linecap="round"/>
    <path d="M722 422C874 336 1036 298 1208 306C1378 314 1538 356 1688 440C1776 488 1846 548 1896 616" stroke="${gridSoft}" stroke-width="1.1" fill="none" stroke-linecap="round"/>
    <path d="M806 694C944 640 1080 616 1214 624C1350 632 1478 670 1598 738C1678 784 1742 836 1788 896" stroke="${grid}" stroke-width="1.28" fill="none" stroke-linecap="round"/>
    <path d="M1048 74C1054 234 1066 394 1078 554C1090 712 1114 850 1148 956" stroke="${gridSoft}" stroke-width="1.1" fill="none" stroke-linecap="round"/>
    <path d="M1220 60C1224 222 1236 384 1248 548C1262 710 1288 846 1324 954" stroke="${grid}" stroke-width="1.18" fill="none" stroke-linecap="round"/>
    <path d="M1394 82C1360 220 1328 360 1298 500C1270 642 1248 792 1230 952" stroke="${gridSoft}" stroke-width="1.04" fill="none" stroke-linecap="round"/>
  `;
}

function corticalAtlasObject(variant = 0) {
  const shift = variant === 0 ? 0 : 28;
  return `
    <ellipse cx="${1228 + shift}" cy="520" rx="432" ry="482" fill="url(#bleed-wash)" opacity="0.88"/>
    <ellipse cx="${1228 + shift}" cy="520" rx="442" ry="492" stroke="rgba(90,112,120,0.2)" stroke-width="2.1"/>
    <ellipse cx="${1228 + shift}" cy="520" rx="404" ry="454" stroke="rgba(90,112,120,0.1)" stroke-width="1.14"/>
    <ellipse cx="${1228 + shift}" cy="520" rx="442" ry="108" stroke="${grid}" stroke-width="1.12"/>
    <ellipse cx="${1228 + shift}" cy="520" rx="442" ry="192" stroke="${gridSoft}" stroke-width="1"/>
    <ellipse cx="${1228 + shift}" cy="520" rx="442" ry="292" stroke="${gridSoft}" stroke-width="1"/>
    <ellipse cx="${1228 + shift}" cy="520" rx="492" ry="406" transform="rotate(18 ${1228 + shift} 520)" stroke="${gridSoft}" stroke-width="1"/>
    <ellipse cx="${1228 + shift}" cy="520" rx="492" ry="406" transform="rotate(-18 ${1228 + shift} 520)" stroke="${gridSoft}" stroke-width="1"/>
    <path d="M${1216 + shift} 168C1148 168 1090 180 1042 208C996 236 960 274 934 324C910 374 900 430 904 492C908 554 928 616 964 680C1000 744 1048 800 1108 846C1162 886 1202 910 1228 918C1260 910 1300 886 1350 846C1410 800 1458 744 1494 680C1530 616 1550 554 1554 492C1558 430 1548 374 1524 324C1498 274 1462 236 1416 208C1368 180 1310 168 1244 168" stroke="rgba(31,31,29,0.86)" stroke-width="2.82" fill="none" stroke-linecap="round" stroke-linejoin="round"/>
    <path d="M${1228 + shift} 184C1212 232 1206 284 1208 342C1210 402 1218 470 1228 548C1238 626 1244 692 1244 746C1244 804 1238 862 1228 918" stroke="${gold}" stroke-width="2" fill="none" stroke-linecap="round"/>
    <path d="M${1130 + shift} 264C1082 254 1044 270 1016 308C990 346 978 392 980 448C982 500 998 554 1028 610" stroke="rgba(84,112,120,0.56)" stroke-width="1.72" fill="none" stroke-linecap="round"/>
    <path d="M${1152 + shift} 326C1106 320 1070 336 1044 370C1022 402 1014 444 1018 496C1022 544 1038 592 1068 640" stroke="rgba(84,112,120,0.52)" stroke-width="1.64" fill="none" stroke-linecap="round"/>
    <path d="M${1176 + shift} 390C1130 390 1096 404 1074 434C1056 462 1052 498 1060 542C1070 586 1090 624 1120 658" stroke="rgba(84,112,120,0.5)" stroke-width="1.62" fill="none" stroke-linecap="round"/>
    <path d="M${1168 + shift} 468C1130 474 1104 490 1092 518C1082 546 1086 576 1104 610C1122 644 1148 670 1182 688" stroke="rgba(84,112,120,0.48)" stroke-width="1.58" fill="none" stroke-linecap="round"/>
    <path d="M${1326 + shift} 264C1374 254 1412 270 1440 308C1466 346 1478 392 1476 448C1474 500 1458 554 1428 610" stroke="rgba(84,112,120,0.56)" stroke-width="1.72" fill="none" stroke-linecap="round"/>
    <path d="M${1304 + shift} 326C1350 320 1386 336 1412 370C1434 402 1442 444 1438 496C1434 544 1418 592 1388 640" stroke="rgba(84,112,120,0.52)" stroke-width="1.64" fill="none" stroke-linecap="round"/>
    <path d="M${1280 + shift} 390C1326 390 1360 404 1382 434C1400 462 1404 498 1396 542C1386 586 1366 624 1336 658" stroke="rgba(84,112,120,0.5)" stroke-width="1.62" fill="none" stroke-linecap="round"/>
    <path d="M${1288 + shift} 468C1326 474 1352 490 1364 518C1374 546 1370 576 1352 610C1334 644 1308 670 1274 688" stroke="rgba(84,112,120,0.48)" stroke-width="1.58" fill="none" stroke-linecap="round"/>
    <path d="M${1228 + shift} 552C1286 532 1334 500 1374 454C1414 410 1442 360 1458 306" stroke="${teal}" stroke-width="1.86" fill="none" stroke-linecap="round"/>
    <path d="M${1228 + shift} 552C1170 532 1122 500 1082 454C1042 410 1014 360 998 306" stroke="${teal}" stroke-width="1.86" fill="none" stroke-linecap="round"/>
    <path d="M${1228 + shift} 760C1268 794 1300 834 1324 882C1348 930 1362 978 1366 1026" stroke="${gold}" stroke-width="1.82" fill="none" stroke-linecap="round"/>
    <path d="M${1228 + shift} 760C1188 794 1156 834 1132 882C1108 930 1094 978 1090 1026" stroke="${gold}" stroke-width="1.82" fill="none" stroke-linecap="round"/>
  `;
}

function coronaryLineObject(variant = 0) {
  const shift = variant === 0 ? 0 : 24;
  return `
    <path d="M${1038 + shift} 190C${1004 + shift} 132 ${952 + shift} 104 ${882 + shift} 112C${814 + shift} 120 ${766 + shift} 162 ${740 + shift} 224C${716 + shift} 286 ${720 + shift} 356 ${752 + shift} 434C${784 + shift} 512 ${842 + shift} 590 ${926 + shift} 666C${1008 + shift} 742 ${1068 + shift} 792 ${1106 + shift} 818C${1148 + shift} 790 ${1210 + shift} 742 ${1292 + shift} 674C${1374 + shift} 606 ${1432 + shift} 532 ${1466 + shift} 452C${1500 + shift} 372 ${1508 + shift} 300 ${1490 + shift} 236C${1470 + shift} 170 ${1426 + shift} 124 ${1358 + shift} 116C${1288 + shift} 108 ${1232 + shift} 136 ${1192 + shift} 200C${1146 + shift} 144 ${1086 + shift} 140 ${1038 + shift} 190Z" fill="url(#bleed-wash)" opacity="0.9"/>
    <path d="M${1038 + shift} 210C${1006 + shift} 162 ${960 + shift} 140 ${900 + shift} 146C${840 + shift} 152 ${798 + shift} 188 ${778 + shift} 240C${758 + shift} 292 ${764 + shift} 352 ${794 + shift} 420C${824 + shift} 488 ${882 + shift} 556 ${968 + shift} 626C${1038 + shift} 682 ${1086 + shift} 722 ${1110 + shift} 742C${1140 + shift} 718 ${1188 + shift} 678 ${1254 + shift} 620C${1324 + shift} 560 ${1374 + shift} 496 ${1404 + shift} 426C${1436 + shift} 352 ${1442 + shift} 290 ${1428 + shift} 238C${1414 + shift} 186 ${1382 + shift} 152 ${1334 + shift} 146C${1282 + shift} 140 ${1236 + shift} 166 ${1198 + shift} 226C${1150 + shift} 180 ${1092 + shift} 174 ${1038 + shift} 210Z" stroke="rgba(31,31,29,0.86)" stroke-width="2.8" fill="none" stroke-linejoin="round"/>
    <path d="M${1110 + shift} 220V760" stroke="${gold}" stroke-width="1.94" fill="none" stroke-linecap="round"/>
    <path d="M${1110 + shift} 262C${1048 + shift} 248 ${994 + shift} 254 ${946 + shift} 280" stroke="${teal}" stroke-width="1.72" fill="none" stroke-linecap="round"/>
    <path d="M${1110 + shift} 262C${1174 + shift} 246 ${1232 + shift} 252 ${1286 + shift} 284" stroke="${teal}" stroke-width="1.72" fill="none" stroke-linecap="round"/>
    <path d="M${1110 + shift} 368C${1048 + shift} 394 ${998 + shift} 432 ${960 + shift} 482" stroke="${gold}" stroke-width="1.72" fill="none" stroke-linecap="round"/>
    <path d="M${1110 + shift} 368C${1174 + shift} 394 ${1224 + shift} 434 ${1262 + shift} 486" stroke="${gold}" stroke-width="1.72" fill="none" stroke-linecap="round"/>
    <path d="M${1110 + shift} 510C${1074 + shift} 560 ${1048 + shift} 618 ${1032 + shift} 684" stroke="${teal}" stroke-width="1.68" fill="none" stroke-linecap="round"/>
    <path d="M${1110 + shift} 510C${1148 + shift} 558 ${1176 + shift} 614 ${1194 + shift} 680" stroke="${teal}" stroke-width="1.68" fill="none" stroke-linecap="round"/>
    <path d="M${936 + shift} 818H1364" stroke="${gridSoft}" stroke-width="1.2" fill="none" stroke-linecap="round"/>
    <path d="M${980 + shift} 818H1032L1058 780L1090 876L1132 714L1166 830L1196 798H1272" stroke="${clay}" stroke-width="2.14" fill="none" stroke-linecap="round" stroke-linejoin="round"/>
  `;
}

function neuronBloomObject(variant = 0) {
  const shift = variant === 0 ? 0 : 36;
  return `
    <circle cx="${1240 + shift}" cy="482" r="316" fill="url(#bleed-wash)" opacity="0.88"/>
    <circle cx="${1240 + shift}" cy="482" r="326" stroke="rgba(90,112,120,0.22)" stroke-width="2"/>
    <circle cx="${1240 + shift}" cy="482" r="286" stroke="rgba(90,112,120,0.1)" stroke-width="1.1"/>
    <path d="M${1238 + shift} 480C${1202 + shift} 432 ${1168 + shift} 390 ${1138 + shift} 356C${1108 + shift} 322 ${1062 + shift} 284 ${1000 + shift} 242" stroke="rgba(31,31,29,0.86)" stroke-width="2.74" fill="none" stroke-linecap="round"/>
    <path d="M${1238 + shift} 480C${1274 + shift} 426 ${1308 + shift} 380 ${1342 + shift} 340C${1376 + shift} 300 ${1426 + shift} 258 ${1492 + shift} 212" stroke="rgba(31,31,29,0.86)" stroke-width="2.74" fill="none" stroke-linecap="round"/>
    <path d="M${1238 + shift} 480C${1186 + shift} 516 ${1140 + shift} 552 ${1100 + shift} 590C${1060 + shift} 628 ${1022 + shift} 678 ${986 + shift} 742" stroke="rgba(31,31,29,0.82)" stroke-width="2.4" fill="none" stroke-linecap="round"/>
    <path d="M${1238 + shift} 480C${1290 + shift} 516 ${1336 + shift} 552 ${1376 + shift} 590C${1416 + shift} 628 ${1454 + shift} 678 ${1490 + shift} 742" stroke="rgba(31,31,29,0.82)" stroke-width="2.4" fill="none" stroke-linecap="round"/>
    <path d="M${1238 + shift} 480C${1238 + shift} 408 ${1238 + shift} 334 ${1238 + shift} 256" stroke="${gold}" stroke-width="1.94" fill="none" stroke-linecap="round"/>
    <path d="M${1238 + shift} 480C${1238 + shift} 560 ${1238 + shift} 638 ${1238 + shift} 728" stroke="${gold}" stroke-width="1.94" fill="none" stroke-linecap="round"/>
    <circle cx="${1238 + shift}" cy="480" r="36" fill="${fog}" stroke="rgba(31,31,29,0.18)" stroke-width="1.1"/>
    <path d="M${1238 + shift} 480C${1188 + shift} 470 ${1144 + shift} 470 ${1106 + shift} 484" stroke="${teal}" stroke-width="1.78" fill="none" stroke-linecap="round"/>
    <path d="M${1238 + shift} 480C${1288 + shift} 470 ${1332 + shift} 470 ${1370 + shift} 484" stroke="${teal}" stroke-width="1.78" fill="none" stroke-linecap="round"/>
    ${Array.from({ length: 18 }, (_, index) => {
      const angle = (Math.PI * 2 * index) / 18;
      const x = 1240 + shift + Math.cos(angle) * 250;
      const y = 482 + Math.sin(angle) * 250;
      const r = index % 3 === 0 ? 5.6 : 4.3;
      return `<circle cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="${r}" fill="rgba(90,112,120,0.26)"/>`;
    }).join("")}
  `;
}

function pulmonaryBloomObject(variant = 0) {
  const shift = variant === 0 ? 0 : 28;
  return `
    <ellipse cx="${1146 + shift}" cy="472" rx="176" ry="262" fill="url(#bleed-wash)" opacity="0.68"/>
    <ellipse cx="${1398 + shift}" cy="472" rx="176" ry="262" fill="url(#bleed-wash)" opacity="0.68"/>
    <ellipse cx="${1146 + shift}" cy="476" rx="182" ry="266" stroke="rgba(31,31,29,0.84)" stroke-width="2.6"/>
    <ellipse cx="${1398 + shift}" cy="476" rx="182" ry="266" stroke="rgba(31,31,29,0.84)" stroke-width="2.6"/>
    <path d="M${1272 + shift} 192V780" stroke="${gold}" stroke-width="1.96" stroke-linecap="round"/>
    <path d="M${1272 + shift} 238C${1212 + shift} 280 ${1164 + shift} 326 ${1128 + shift} 378" stroke="${teal}" stroke-width="1.86" fill="none" stroke-linecap="round"/>
    <path d="M${1272 + shift} 238C${1332 + shift} 280 ${1380 + shift} 326 ${1416 + shift} 378" stroke="${teal}" stroke-width="1.86" fill="none" stroke-linecap="round"/>
    <path d="M${1128 + shift} 378C${1080 + shift} 420 ${1044 + shift} 468 ${1020 + shift} 524" stroke="${gold}" stroke-width="1.72" fill="none" stroke-linecap="round"/>
    <path d="M${1128 + shift} 378C${1104 + shift} 434 ${1088 + shift} 494 ${1082 + shift} 560" stroke="${gold}" stroke-width="1.72" fill="none" stroke-linecap="round"/>
    <path d="M${1416 + shift} 378C${1464 + shift} 420 ${1500 + shift} 468 ${1524 + shift} 524" stroke="${gold}" stroke-width="1.72" fill="none" stroke-linecap="round"/>
    <path d="M${1416 + shift} 378C${1440 + shift} 434 ${1456 + shift} 494 ${1462 + shift} 560" stroke="${gold}" stroke-width="1.72" fill="none" stroke-linecap="round"/>
    <path d="M${1272 + shift} 520C${1242 + shift} 570 ${1222 + shift} 622 ${1212 + shift} 678" stroke="${teal}" stroke-width="1.74" fill="none" stroke-linecap="round"/>
    <path d="M${1272 + shift} 520C${1302 + shift} 570 ${1322 + shift} 622 ${1332 + shift} 678" stroke="${teal}" stroke-width="1.74" fill="none" stroke-linecap="round"/>
  `;
}

function angiogramDiscObject(variant = 0) {
  const shift = variant === 0 ? 0 : 22;
  return `
    <circle cx="${1248 + shift}" cy="478" r="306" fill="url(#bleed-wash)" opacity="0.82"/>
    <circle cx="${1248 + shift}" cy="478" r="314" stroke="rgba(90,112,120,0.18)" stroke-width="2.06"/>
    <circle cx="${1248 + shift}" cy="478" r="272" stroke="rgba(90,112,120,0.08)" stroke-width="1.1"/>
    <path d="M${1248 + shift} 748C${1242 + shift} 676 ${1240 + shift} 612 ${1244 + shift} 556C${1248 + shift} 500 ${1260 + shift} 444 ${1280 + shift} 388C${1300 + shift} 332 ${1330 + shift} 274 ${1370 + shift} 214" stroke="rgba(31,31,29,0.86)" stroke-width="2.9" fill="none" stroke-linecap="round"/>
    <path d="M${1272 + shift} 380C${1324 + shift} 362 ${1376 + shift} 360 ${1428 + shift} 374C${1480 + shift} 388 ${1524 + shift} 412 ${1560 + shift} 446" stroke="${teal}" stroke-width="1.82" fill="none" stroke-linecap="round"/>
    <path d="M${1268 + shift} 416C${1322 + shift} 418 ${1370 + shift} 438 ${1412 + shift} 474C${1454 + shift} 510 ${1488 + shift} 556 ${1516 + shift} 612" stroke="${gold}" stroke-width="1.82" fill="none" stroke-linecap="round"/>
    <path d="M${1250 + shift} 460C${1206 + shift} 436 ${1168 + shift} 432 ${1136 + shift} 446C${1104 + shift} 460 ${1072 + shift} 490 ${1040 + shift} 536" stroke="${teal}" stroke-width="1.74" fill="none" stroke-linecap="round"/>
    <path d="M${1238 + shift} 512C${1184 + shift} 520 ${1138 + shift} 546 ${1100 + shift} 590C${1062 + shift} 634 ${1034 + shift} 686 ${1018 + shift} 746" stroke="${gold}" stroke-width="1.74" fill="none" stroke-linecap="round"/>
    <path d="M${1280 + shift} 340C${1304 + shift} 286 ${1320 + shift} 236 ${1328 + shift} 190" stroke="rgba(31,31,29,0.72)" stroke-width="1.82" fill="none" stroke-linecap="round"/>
    <path d="M${1298 + shift} 332C${1348 + shift} 294 ${1392 + shift} 244 ${1430 + shift} 182" stroke="rgba(31,31,29,0.54)" stroke-width="1.46" fill="none" stroke-linecap="round"/>
    ${Array.from({ length: 22 }, (_, index) => {
      const angle = -2.2 + index * 0.2;
      const x = 1248 + shift + Math.cos(angle) * 282;
      const y = 478 + Math.sin(angle) * 282;
      return `<circle cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="${index % 4 === 0 ? 5.2 : 3.8}" fill="rgba(90,112,120,0.28)"/>`;
    }).join("")}
  `;
}

const heroFamilies = [
  {
    key: "cortical-atlas",
    label: "Cortical atlas",
    note: "Top-view brain field with stronger sulcal detail and vascular spine.",
    render: corticalAtlasObject,
    titles: [["A calmer, more", "intelligent way", "to prepare."], ["Medical prep,", "made crisp", "and spatial."]],
  },
  {
    key: "coronary-script",
    label: "Coronary script",
    note: "Continuous-line heart field with subtle wave telemetry.",
    render: coronaryLineObject,
    titles: [["Clinical prep", "with a cleaner", "pulse."], ["Signal-first", "study flow", "for nurses."]],
  },
  {
    key: "neuron-bloom",
    label: "Neuron bloom",
    note: "Branching neural canopy with dense internal structure and soft wash.",
    render: neuronBloomObject,
    titles: [["Original questions,", "richer patterns,", "better recall."], ["Study with", "more signal,", "less clutter."]],
  },
  {
    key: "pulmonary-bloom",
    label: "Pulmonary bloom",
    note: "Airway tree and lung shell with a more clinical silhouette.",
    render: pulmonaryBloomObject,
    titles: [["Vents, flow,", "oxygen, and", "clearer reasoning."], ["A steadier", "route through", "critical care."]],
  },
  {
    key: "angiogram-disc",
    label: "Angiogram disc",
    note: "Imaging-inspired vascular field with cath-lab influence.",
    render: angiogramDiscObject,
    titles: [["Bedside signal,", "without the", "qbank noise."], ["A premium", "medical object", "that teaches."]],
  },
];

function frontpageConcept(id, family, variant) {
  return baseSvg(`
    ${navBar()}
    ${textBlock({
      eyebrow: `${family.label} / premium medical hero`,
      title: family.titles[variant],
      body: "Original questions, elite rationale, and a direct path into the right plan.",
      proof: "AI TUTOR + VISUAL RATIONALE + CLEAN CLINICAL FLOW",
    })}
    ${sharedField()}
    ${family.render(variant)}
    <text x="150" y="842" fill="${muted}" font-family="'DM Sans', Arial, sans-serif" font-size="14" font-weight="700" letter-spacing="4">CURRENT ANGLE</text>
    <text x="150" y="888" fill="${dark}" font-family="'Source Serif 4', Georgia, serif" font-size="38" font-weight="600">${family.label}</text>
  `);
}

function socialHeader(id, family, variant) {
  return baseSvg(`
    <rect x="42" y="42" width="1516" height="434" rx="34" fill="rgba(255,252,247,0.9)" stroke="rgba(212,197,173,0.52)"/>
    <text x="112" y="164" fill="${dark}" font-family="'Source Serif 4', Georgia, serif" font-size="70" font-weight="600" letter-spacing="-3">ChapAI</text>
    <text x="112" y="226" fill="${muted}" font-family="'DM Sans', Arial, sans-serif" font-size="18" font-weight="700" letter-spacing="5">NCLEX + CCRN / CLEANER CLINICAL PREP</text>
    <text x="112" y="298" fill="${dark}" font-family="'DM Sans', Arial, sans-serif" font-size="48" font-weight="500" letter-spacing="-3">Original questions. Sharper clinical review.</text>
    <text x="112" y="354" fill="${muted}" font-family="'DM Sans', Arial, sans-serif" font-size="25">AI tutor, visual rationale, and a faster path into the right plan.</text>
    ${sharedField()}
    ${family.render(variant).replace(/translate/g, "translate")}
  `, { width: 1600, height: 520 });
}

function logoFrame(inner) {
  return `<svg width="480" height="480" viewBox="0 0 480 480" fill="none" xmlns="http://www.w3.org/2000/svg">
    <rect width="480" height="480" rx="48" fill="${paper}"/>
    <rect x="36" y="36" width="408" height="408" rx="36" fill="rgba(255,252,247,0.88)" stroke="rgba(205,189,165,0.46)"/>
    ${inner}
  </svg>`;
}

function lockup(mark, descriptor) {
  return `
    <circle cx="240" cy="166" r="78" fill="rgba(255,252,247,0.96)" stroke="rgba(205,189,165,0.5)"/>
    ${mark}
    <text x="240" y="308" fill="${dark}" text-anchor="middle" font-family="'Source Serif 4', Georgia, serif" font-size="60" font-weight="600" letter-spacing="-2.4">ChapAI</text>
    <text x="240" y="350" fill="${muted}" text-anchor="middle" font-family="'DM Sans', Arial, sans-serif" font-size="14" font-weight="700" letter-spacing="4">${descriptor}</text>
  `;
}

function colorPick(seed, colors) {
  return colors[seed % colors.length];
}

function logoCorticalSeal(seed) {
  const accent = colorPick(seed, [gold, teal, clay, sage]);
  return logoFrame(lockup(`
    <path d="M240 116C202 116 172 128 152 152C132 176 124 206 126 244C128 282 142 316 168 346C188 368 212 388 240 404C268 388 292 368 312 346C338 316 352 282 354 244C356 206 348 176 328 152C308 128 278 116 240 116Z" transform="translate(0 -30)" stroke="rgba(31,31,29,0.84)" stroke-width="2.2" fill="none"/>
    <path d="M240 128C230 156 226 190 228 230C230 270 234 312 240 356" transform="translate(0 -30)" stroke="${accent}" stroke-width="1.7" fill="none" stroke-linecap="round"/>
    <path d="M204 168C178 162 158 170 144 192" transform="translate(0 -30)" stroke="rgba(84,112,120,0.52)" stroke-width="1.5" fill="none" stroke-linecap="round"/>
    <path d="M204 224C178 224 160 234 148 254" transform="translate(0 -30)" stroke="rgba(84,112,120,0.48)" stroke-width="1.42" fill="none" stroke-linecap="round"/>
    <path d="M276 168C302 162 322 170 336 192" transform="translate(0 -30)" stroke="rgba(84,112,120,0.52)" stroke-width="1.5" fill="none" stroke-linecap="round"/>
    <path d="M276 224C302 224 320 234 332 254" transform="translate(0 -30)" stroke="rgba(84,112,120,0.48)" stroke-width="1.42" fill="none" stroke-linecap="round"/>
  `, "CORTICAL SEAL"));
}

function logoCoronaryLine(seed) {
  const accent = colorPick(seed, [clay, gold, teal, sage]);
  return logoFrame(lockup(`
    <path d="M240 122C224 102 202 92 174 96C146 100 126 118 116 148C108 176 112 208 130 246C148 284 184 324 240 366C292 326 328 286 346 246C366 204 370 170 360 142C350 114 330 98 302 96C272 94 250 104 240 122Z" transform="translate(0 -30)" stroke="rgba(31,31,29,0.86)" stroke-width="2.2" fill="none" stroke-linejoin="round"/>
    <path d="M240 126V208" transform="translate(0 -30)" stroke="${accent}" stroke-width="1.72" fill="none" stroke-linecap="round"/>
    <path d="M240 152C226 144 212 144 198 152" transform="translate(0 -30)" stroke="${accent}" stroke-width="1.54" fill="none" stroke-linecap="round"/>
    <path d="M240 152C254 144 268 144 282 152" transform="translate(0 -30)" stroke="${accent}" stroke-width="1.54" fill="none" stroke-linecap="round"/>
  `, "CORONARY LINE"));
}

function logoNeuronSeal(seed) {
  const accent = colorPick(seed, [teal, gold, sage, clay]);
  return logoFrame(lockup(`
    <circle cx="240" cy="140" r="18" fill="${fog}" stroke="rgba(31,31,29,0.18)" stroke-width="1.1"/>
    ${[
      [-62, -40], [-72, 12], [-42, 58], [4, -78], [48, -52], [74, 0], [52, 56]
    ].map(([dx, dy], index) => `<path d="M240 140C${240 + dx * 0.32} ${140 + dy * 0.12} ${240 + dx * 0.72} ${140 + dy * 0.72} ${240 + dx} ${140 + dy}" stroke="${index % 2 === 0 ? accent : "rgba(31,31,29,0.72)"}" stroke-width="${index % 2 === 0 ? 1.58 : 1.42}" fill="none" stroke-linecap="round"/>`).join("")}
  `, "NEURAL NODE"));
}

function logoWireMonogram(seed) {
  const accent = colorPick(seed, [gold, clay, teal, sage]);
  return logoFrame(lockup(`
    <path d="M184 136C202 118 224 110 250 110C274 110 294 118 312 136" stroke="rgba(31,31,29,0.84)" stroke-width="2.14" fill="none" stroke-linecap="round"/>
    <path d="M196 224C172 198 160 170 160 140C160 112 170 90 192 74C212 60 236 54 266 56" stroke="${accent}" stroke-width="1.74" fill="none" stroke-linecap="round"/>
    <path d="M286 86C304 104 314 126 316 152C318 178 312 204 296 230C280 256 258 274 230 284" stroke="rgba(31,31,29,0.72)" stroke-width="1.74" fill="none" stroke-linecap="round"/>
  `, "WIRE MONOGRAM"));
}

function logoPulmonaryMark(seed) {
  const accent = colorPick(seed, [sage, teal, gold, clay]);
  return logoFrame(lockup(`
    <ellipse cx="216" cy="146" rx="44" ry="62" stroke="rgba(31,31,29,0.84)" stroke-width="2.04"/>
    <ellipse cx="264" cy="146" rx="44" ry="62" stroke="rgba(31,31,29,0.84)" stroke-width="2.04"/>
    <path d="M240 88V232" stroke="${accent}" stroke-width="1.74" stroke-linecap="round"/>
    <path d="M240 116C224 126 210 140 198 158" stroke="${accent}" stroke-width="1.52" fill="none" stroke-linecap="round"/>
    <path d="M240 116C256 126 270 140 282 158" stroke="${accent}" stroke-width="1.52" fill="none" stroke-linecap="round"/>
  `, "PULMONARY MAP"));
}

function logoFamilies() {
  return [logoCorticalSeal, logoCoronaryLine, logoNeuronSeal, logoWireMonogram, logoPulmonaryMark];
}

const manifest = { heroes: {}, headers: {}, logos: {} };

for (let index = 0; index < 10; index += 1) {
  const family = heroFamilies[index % heroFamilies.length];
  const variant = index < 5 ? 0 : 1;
  const id = 1001 + index;
  const file = `frontpage-${id}.svg`;
  write(path.join(reviewDir, file), frontpageConcept(id, family, variant));
  manifest.heroes[file] = {
    title: `${family.label} ${variant === 0 ? "A" : "B"}`,
    note: family.note,
  };
}

for (let index = 0; index < 10; index += 1) {
  const family = heroFamilies[index % heroFamilies.length];
  const variant = index < 5 ? 0 : 1;
  const id = 61 + index;
  const file = `social-header-${id}.svg`;
  write(path.join(reviewDir, file), socialHeader(id, family, variant));
  manifest.headers[file] = {
    title: `${family.label} header ${variant === 0 ? "A" : "B"}`,
    note: `Social banner matching the ${family.label.toLowerCase()} homepage family.`,
  };
}

const logoFns = logoFamilies();
const logoDescriptors = ["Cortical seal", "Coronary line", "Neural node", "Wire monogram", "Pulmonary map"];
for (let index = 0; index < 50; index += 1) {
  const id = 951 + index;
  const familyIndex = index % logoFns.length;
  const file = `chapai-option-${id}.svg`;
  write(path.join(brandDir, file), logoFns[familyIndex](index));
  manifest.logos[file] = {
    title: `${logoDescriptors[familyIndex]} ${Math.floor(index / logoFns.length) + 1}`,
    note: "Refined medical mark exploration.",
  };
}

write(manifestPath, JSON.stringify(manifest, null, 2));
console.log(JSON.stringify({ ok: true, frontpages: "1001-1010", headers: "61-70", logos: "951-1000" }));
