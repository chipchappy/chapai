import fs from "node:fs";
import path from "node:path";

const root = "C:/Users/Chapman/Desktop/ai/chapai";
const publicRoot = path.join(root, "apps/web/public");
const brandDir = path.join(publicRoot, "brand/options");
const logoReviewDir = path.join(publicRoot, "logo-review");
const designDir = path.join(publicRoot, "design-review");
const reviewAssetsDir = path.join(publicRoot, "review-assets");
const manifestPath = path.join(designDir, "review-manifest.json");

for (const dir of [brandDir, logoReviewDir, designDir, reviewAssetsDir]) {
  fs.mkdirSync(dir, { recursive: true });
}

const paper = "#FBF7F0";
const sand = "#F2EBDD";
const wash = "#E9DBC7";
const fog = "#FFFDF8";
const dark = "#1F1F21";
const muted = "#766D61";
const teal = "#5A7F88";
const gold = "#C59B5E";
const clay = "#B67F67";
const sage = "#7C8D79";

function write(filePath, contents) {
  fs.writeFileSync(filePath, contents, "utf8");
}

function baseSvg(inner, width = 1600, height = 960) {
  return `<svg width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" fill="none" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <radialGradient id="paper-wash" cx="0" cy="0" r="1" gradientUnits="userSpaceOnUse" gradientTransform="translate(1180 404) rotate(90) scale(420 420)">
      <stop offset="0" stop-color="${fog}" />
      <stop offset="0.46" stop-color="${sand}" />
      <stop offset="1" stop-color="${paper}" />
    </radialGradient>
    <radialGradient id="bleed-wash" cx="0" cy="0" r="1" gradientUnits="userSpaceOnUse" gradientTransform="translate(1260 430) rotate(90) scale(340 340)">
      <stop offset="0" stop-color="#fffaf2" stop-opacity="0.98" />
      <stop offset="0.5" stop-color="${wash}" stop-opacity="0.56" />
      <stop offset="1" stop-color="${wash}" stop-opacity="0" />
    </radialGradient>
  </defs>
  <rect width="${width}" height="${height}" fill="${paper}" />
  ${inner}
</svg>`;
}

function navBar() {
  return `
    <rect x="108" y="68" width="1388" height="84" rx="42" fill="rgba(255,252,247,0.88)" stroke="rgba(213,198,175,0.56)"/>
    <text x="156" y="122" fill="${dark}" font-family="'Source Serif 4', Georgia, serif" font-size="38" font-weight="600" letter-spacing="-2">ChapAI</text>
    <text x="1170" y="120" fill="${muted}" font-family="'DM Sans', Arial, sans-serif" font-size="20" font-weight="600">CCRN</text>
    <text x="1252" y="120" fill="${muted}" font-family="'DM Sans', Arial, sans-serif" font-size="20" font-weight="600">NCLEX</text>
    <text x="1340" y="120" fill="${muted}" font-family="'DM Sans', Arial, sans-serif" font-size="20" font-weight="600">PLANS</text>
    <rect x="1388" y="88" width="102" height="44" rx="22" fill="rgba(255,250,243,0.96)" stroke="rgba(212,197,173,0.56)"/>
    <text x="1422" y="117" fill="${dark}" font-family="'DM Sans', Arial, sans-serif" font-size="20" font-weight="700">SPRINT</text>
  `;
}

function textBlock(lines, body, proof) {
  return `
    <text x="148" y="194" fill="${muted}" font-family="'DM Sans', Arial, sans-serif" font-size="15" font-weight="700" letter-spacing="4">PREMIUM MEDICAL PREP</text>
    <text x="148" y="292" fill="${dark}" font-family="'DM Sans', Arial, sans-serif" font-size="96" font-weight="500" letter-spacing="-7">${lines[0]}</text>
    <text x="148" y="382" fill="${dark}" font-family="'DM Sans', Arial, sans-serif" font-size="96" font-weight="500" letter-spacing="-7">${lines[1]}</text>
    <text x="148" y="472" fill="${dark}" font-family="'DM Sans', Arial, sans-serif" font-size="96" font-weight="500" letter-spacing="-7">${lines[2]}</text>
    <text x="148" y="554" fill="${muted}" font-family="'DM Sans', Arial, sans-serif" font-size="30">${body}</text>
    <rect x="148" y="618" width="236" height="64" rx="32" fill="${teal}"/>
    <text x="192" y="658" fill="#fff" font-family="'DM Sans', Arial, sans-serif" font-size="25" font-weight="700">Start the $10 sprint</text>
    <rect x="402" y="618" width="190" height="64" rx="32" fill="rgba(255,252,247,0.92)" stroke="rgba(203,187,162,0.62)"/>
    <text x="454" y="658" fill="${dark}" font-family="'DM Sans', Arial, sans-serif" font-size="24" font-weight="600">See plans</text>
    <text x="148" y="744" fill="${muted}" font-family="'DM Sans', Arial, sans-serif" font-size="14" font-weight="700" letter-spacing="4">${proof}</text>
    <path d="M148 770H664" stroke="rgba(209,194,170,0.62)"/>
  `;
}

function fieldLines() {
  return `
    <path d="M786 174C920 130 1066 112 1224 122C1372 132 1514 174 1650 248C1734 294 1810 356 1878 434" stroke="rgba(96,110,114,0.16)" stroke-width="1.24" fill="none" stroke-linecap="round"/>
    <path d="M742 338C882 306 1018 298 1152 312C1290 326 1420 362 1542 420C1658 476 1764 560 1860 672" stroke="rgba(96,110,114,0.1)" stroke-width="1.06" fill="none" stroke-linecap="round"/>
    <path d="M770 574C910 544 1046 540 1178 554C1312 568 1440 604 1562 662C1676 716 1782 802 1880 922" stroke="rgba(96,110,114,0.14)" stroke-width="1.16" fill="none" stroke-linecap="round"/>
    <path d="M1028 92C1062 250 1088 410 1106 572C1120 734 1126 892 1122 1048" stroke="rgba(96,110,114,0.08)" stroke-width="1.02" fill="none" stroke-linecap="round"/>
    <path d="M1224 82C1224 238 1228 398 1236 560C1246 722 1264 886 1290 1048" stroke="rgba(96,110,114,0.14)" stroke-width="1.04" fill="none" stroke-linecap="round"/>
    <path d="M1466 132C1424 292 1384 446 1346 594C1308 744 1282 896 1268 1048" stroke="rgba(96,110,114,0.08)" stroke-width="1.02" fill="none" stroke-linecap="round"/>
  `;
}

function corticalObject(variant = 0) {
  const x = variant === 0 ? 1236 : 1262;
  return `
    <path d="M1000 172C1096 136 1208 120 1336 126C1468 132 1580 164 1674 222C1768 280 1832 360 1866 462C1900 562 1894 668 1848 780C1800 892 1720 980 1608 1044C1496 1108 1368 1140 1224 1138C1088 1136 972 1106 876 1048C780 990 710 912 668 814C628 716 620 612 646 504C672 396 724 306 802 236C858 186 924 164 1000 172Z" fill="url(#bleed-wash)" opacity="0.9"/>
    <path d="M1058 168C1124 152 1200 144 1288 146C1400 148 1494 170 1570 212C1650 254 1704 312 1734 386C1764 458 1768 546 1748 650C1726 754 1678 842 1602 916C1526 990 1434 1042 1326 1072C1218 1102 1114 1106 1014 1084C918 1062 842 1014 786 940C730 866 702 780 702 682C702 578 720 482 758 394C796 306 852 240 926 196C968 174 1012 164 1058 168Z" stroke="rgba(24,22,20,0.9)" stroke-width="2.9" fill="none" stroke-linecap="round" stroke-linejoin="round"/>
    <path d="M${x} 166C${x - 14} 262 ${x - 8} 370 ${x} 490C${x + 8} 614 ${x + 8} 732 ${x - 2} 844C${x - 10} 936 ${x - 12} 1012 ${x} 1072" stroke="${gold}" stroke-width="2.08" fill="none" stroke-linecap="round"/>
    <path d="M1106 202C1048 212 998 236 956 276C918 314 898 360 896 414C894 468 908 518 938 564" stroke="rgba(46,42,38,0.58)" stroke-width="1.58" fill="none" stroke-linecap="round"/>
    <path d="M1144 236C1082 246 1030 272 988 314C950 354 932 400 934 452C938 504 956 554 988 602" stroke="rgba(46,42,38,0.56)" stroke-width="1.56" fill="none" stroke-linecap="round"/>
    <path d="M1184 274C1124 284 1076 308 1040 348C1008 386 996 430 1002 480C1010 530 1032 576 1068 620" stroke="rgba(46,42,38,0.54)" stroke-width="1.54" fill="none" stroke-linecap="round"/>
    <path d="M1212 326C1158 336 1118 358 1092 394C1068 428 1062 468 1072 512C1082 556 1104 592 1138 622" stroke="rgba(46,42,38,0.52)" stroke-width="1.52" fill="none" stroke-linecap="round"/>
    <path d="M1222 394C1178 402 1148 418 1132 442C1118 466 1118 494 1132 526C1148 558 1170 584 1200 604" stroke="rgba(46,42,38,0.5)" stroke-width="1.48" fill="none" stroke-linecap="round"/>
    <path d="M1358 202C1416 212 1466 236 1508 276C1546 314 1566 360 1568 414C1570 468 1556 518 1526 564" stroke="rgba(46,42,38,0.58)" stroke-width="1.58" fill="none" stroke-linecap="round"/>
    <path d="M1320 236C1382 246 1434 272 1476 314C1514 354 1532 400 1530 452C1526 504 1508 554 1476 602" stroke="rgba(46,42,38,0.56)" stroke-width="1.56" fill="none" stroke-linecap="round"/>
    <path d="M1280 274C1340 284 1388 308 1424 348C1456 386 1468 430 1462 480C1454 530 1432 576 1396 620" stroke="rgba(46,42,38,0.54)" stroke-width="1.54" fill="none" stroke-linecap="round"/>
    <path d="M1252 326C1306 336 1346 358 1372 394C1396 428 1402 468 1392 512C1382 556 1360 592 1326 622" stroke="rgba(46,42,38,0.52)" stroke-width="1.52" fill="none" stroke-linecap="round"/>
    <path d="M1242 394C1286 402 1316 418 1332 442C1346 466 1346 494 1332 526C1316 558 1294 584 1264 604" stroke="rgba(46,42,38,0.5)" stroke-width="1.48" fill="none" stroke-linecap="round"/>
    <path d="M1030 1040C964 1064 902 1100 844 1148" stroke="rgba(31,31,29,0.3)" stroke-width="1.12" fill="none" stroke-linecap="round"/>
    <path d="M1496 1030C1564 1054 1634 1092 1706 1144" stroke="rgba(31,31,29,0.3)" stroke-width="1.12" fill="none" stroke-linecap="round"/>
  `;
}

function coronaryObject(variant = 0) {
  const x = variant === 0 ? 1126 : 1152;
  return `
    <path d="M1012 168C952 176 900 210 856 270C814 330 792 402 790 486C790 568 810 644 850 714C892 784 950 850 1024 912C1098 974 1170 1026 1240 1068C1310 1028 1380 976 1450 912C1528 840 1588 762 1630 678C1674 592 1694 512 1690 438C1688 362 1668 300 1630 252C1590 202 1540 168 1480 152C1422 136 1364 138 1306 158C1248 178 1192 220 1138 284C1094 220 1052 182 1012 168Z" fill="url(#bleed-wash)" opacity="0.92"/>
    <path d="M1028 208C982 180 934 168 884 172C832 176 792 206 764 262C736 318 730 386 746 466C762 548 798 626 854 700C910 774 988 854 1088 938" stroke="rgba(24,22,20,0.9)" stroke-width="2.86" fill="none" stroke-linecap="round" stroke-linejoin="round"/>
    <path d="M1138 284C1186 216 1238 174 1294 158C1352 142 1410 144 1468 164C1528 186 1576 224 1612 278C1648 332 1666 394 1666 464C1664 534 1640 608 1594 686C1548 764 1484 842 1402 918C1344 972 1288 1020 1236 1060" stroke="rgba(24,22,20,0.9)" stroke-width="2.86" fill="none" stroke-linecap="round" stroke-linejoin="round"/>
    <path d="M${x} 270C${x} 366 ${x + 8} 458 ${x + 22} 546C${x + 36} 634 ${x + 42} 724 ${x + 38} 818" stroke="${gold}" stroke-width="2.02" fill="none" stroke-linecap="round"/>
    <path d="M${x - 78} 308C${x - 126} 298 ${x - 166} 306 ${x - 198} 332" stroke="${teal}" stroke-width="1.78" fill="none" stroke-linecap="round"/>
    <path d="M${x - 60} 386C${x - 120} 410 ${x - 168} 448 ${x - 204} 500" stroke="${gold}" stroke-width="1.76" fill="none" stroke-linecap="round"/>
    <path d="M${x - 54} 488C${x - 96} 538 ${x - 126} 594 ${x - 144} 656" stroke="${teal}" stroke-width="1.72" fill="none" stroke-linecap="round"/>
    <path d="M${x + 10} 300C${x + 66} 286 ${x + 116} 292 ${x + 160} 318" stroke="${teal}" stroke-width="1.78" fill="none" stroke-linecap="round"/>
    <path d="M${x + 28} 390C${x + 88} 392 ${x + 144} 416 ${x + 196} 462" stroke="${gold}" stroke-width="1.76" fill="none" stroke-linecap="round"/>
    <path d="M${x + 36} 500C${x + 86} 542 ${x + 124} 590 ${x + 150} 644" stroke="${teal}" stroke-width="1.72" fill="none" stroke-linecap="round"/>
    <path d="M936 1022H1018L1062 972L1116 1118L1170 872L1212 1040L1252 998H1350" stroke="${clay}" stroke-width="2.16" fill="none" stroke-linecap="round" stroke-linejoin="round"/>
  `;
}

function neuronObject(variant = 0) {
  const x = variant === 0 ? 1260 : 1280;
  return `
    <circle cx="${x}" cy="496" r="312" fill="url(#bleed-wash)" opacity="0.9"/>
    <circle cx="${x}" cy="496" r="322" stroke="rgba(90,112,120,0.18)" stroke-width="1.92"/>
    <path d="M${x} 496C${x - 54} 426 ${x - 116} 366 ${x - 186} 316C${x - 256} 266 ${x - 338} 230 ${x - 432} 208" stroke="rgba(24,22,20,0.9)" stroke-width="2.78" fill="none" stroke-linecap="round"/>
    <path d="M${x} 496C${x + 54} 426 ${x + 116} 366 ${x + 186} 316C${x + 256} 266 ${x + 338} 230 ${x + 432} 208" stroke="rgba(24,22,20,0.9)" stroke-width="2.78" fill="none" stroke-linecap="round"/>
    <path d="M${x} 496C${x - 56} 564 ${x - 116} 636 ${x - 180} 712C${x - 244} 788 ${x - 302} 874 ${x - 354} 970" stroke="rgba(24,22,20,0.84)" stroke-width="2.42" fill="none" stroke-linecap="round"/>
    <path d="M${x} 496C${x + 56} 564 ${x + 116} 636 ${x + 180} 712C${x + 244} 788 ${x + 302} 874 ${x + 354} 970" stroke="rgba(24,22,20,0.84)" stroke-width="2.42" fill="none" stroke-linecap="round"/>
    <path d="M${x} 496C${x} 422 ${x + 6} 334 ${x + 16} 232" stroke="${gold}" stroke-width="1.92" fill="none" stroke-linecap="round"/>
    <path d="M${x} 496C${x} 582 ${x} 674 ${x + 6} 774" stroke="${gold}" stroke-width="1.92" fill="none" stroke-linecap="round"/>
    <circle cx="${x}" cy="496" r="42" fill="${fog}" stroke="rgba(24,22,20,0.18)" stroke-width="1.1"/>
  `;
}

function pulmonaryObject(variant = 0) {
  const x = variant === 0 ? 1248 : 1270;
  return `
    <path d="M982 252C926 306 892 368 880 438C868 508 876 590 904 684C932 776 976 864 1036 948C1092 900 1132 848 1156 792C1180 736 1194 652 1198 540C1202 420 1188 326 1156 258C1124 190 1066 188 982 252Z" fill="url(#bleed-wash)" opacity="0.84"/>
    <path d="M1542 252C1598 306 1632 368 1644 438C1656 508 1648 590 1620 684C1592 776 1548 864 1488 948C1432 900 1392 848 1368 792C1344 736 1330 652 1326 540C1322 420 1336 326 1368 258C1400 190 1458 188 1542 252Z" fill="url(#bleed-wash)" opacity="0.84"/>
    <path d="M982 252C926 306 892 368 880 438C868 508 876 590 904 684C932 776 976 864 1036 948" stroke="rgba(24,22,20,0.88)" stroke-width="2.72" fill="none"/>
    <path d="M1542 252C1598 306 1632 368 1644 438C1656 508 1648 590 1620 684C1592 776 1548 864 1488 948" stroke="rgba(24,22,20,0.88)" stroke-width="2.72" fill="none"/>
    <path d="M${x} 206V902" stroke="${gold}" stroke-width="1.96" stroke-linecap="round"/>
    <path d="M${x} 254C${x - 54} 292 ${x - 100} 336 ${x - 138} 386" stroke="${teal}" stroke-width="1.78" fill="none" stroke-linecap="round"/>
    <path d="M${x} 254C${x + 54} 292 ${x + 100} 336 ${x + 138} 386" stroke="${teal}" stroke-width="1.78" fill="none" stroke-linecap="round"/>
    <path d="M${x - 138} 386C${x - 186} 432 ${x - 220} 484 ${x - 240} 542" stroke="${gold}" stroke-width="1.72" fill="none" stroke-linecap="round"/>
    <path d="M${x + 138} 386C${x + 186} 432 ${x + 220} 484 ${x + 240} 542" stroke="${gold}" stroke-width="1.72" fill="none" stroke-linecap="round"/>
    <path d="M${x} 470C${x - 30} 522 ${x - 52} 582 ${x - 66} 650" stroke="${teal}" stroke-width="1.68" fill="none" stroke-linecap="round"/>
    <path d="M${x} 470C${x + 30} 522 ${x + 52} 582 ${x + 66} 650" stroke="${teal}" stroke-width="1.68" fill="none" stroke-linecap="round"/>
  `;
}

const heroFamilies = [
  {
    key: "cortical-atlas",
    label: "Cortical atlas",
    note: "Top-view brain plate with more literal engraved medical linework.",
    render: corticalObject,
    titles: [["The cleaner", "clinical study", "surface."], ["Premium nursing", "prep with", "actual signal."]],
  },
  {
    key: "coronary-script",
    label: "Coronary script",
    note: "Continuous-line anatomical heart with telemetry understructure.",
    render: coronaryObject,
    titles: [["Clinical prep", "with a steadier", "pulse."], ["Bedside logic,", "cleaned up", "and taught."]],
  },
  {
    key: "neuron-bloom",
    label: "Neuron bloom",
    note: "A literal neural object instead of symbolic brand geometry.",
    render: neuronObject,
    titles: [["Pattern first.", "Noise out.", "Study better."], ["Original questions,", "clearer patterns,", "better recall."]],
  },
  {
    key: "pulmonary-atlas",
    label: "Pulmonary atlas",
    note: "Airway map and lung shell with a softer wash and harder line edges.",
    render: pulmonaryObject,
    titles: [["Shock, vents,", "oxygen, and", "clearer review."], ["A calmer", "critical-care", "workflow."]],
  },
];

function frontpageConcept(id, family, variant) {
  return baseSvg(`
    ${navBar()}
    ${textBlock(family.titles[variant], "Original questions, AI-guided rationale, and a faster path into the right plan.", "AI TUTOR + LIVE BANK + VISUAL RATIONALE")}
    ${fieldLines()}
    ${family.render(variant)}
    <text x="148" y="840" fill="${muted}" font-family="'DM Sans', Arial, sans-serif" font-size="14" font-weight="700" letter-spacing="4">CURRENT ANGLE</text>
    <text x="148" y="886" fill="${dark}" font-family="'Source Serif 4', Georgia, serif" font-size="38" font-weight="600">${family.label}</text>
  `);
}

function socialHeader(id, family, variant) {
  return baseSvg(`
    <rect x="42" y="42" width="1516" height="434" rx="34" fill="rgba(255,252,247,0.9)" stroke="rgba(212,197,173,0.52)"/>
    <text x="112" y="164" fill="${dark}" font-family="'Source Serif 4', Georgia, serif" font-size="70" font-weight="600" letter-spacing="-3">ChapAI</text>
    <text x="112" y="224" fill="${muted}" font-family="'DM Sans', Arial, sans-serif" font-size="18" font-weight="700" letter-spacing="5">NCLEX + CCRN / CLEANER CLINICAL PREP</text>
    <text x="112" y="294" fill="${dark}" font-family="'DM Sans', Arial, sans-serif" font-size="48" font-weight="500" letter-spacing="-3">Original questions. Better bedside reasoning.</text>
    <text x="112" y="350" fill="${muted}" font-family="'DM Sans', Arial, sans-serif" font-size="25">AI tutor, visual rationale, and a calmer package path.</text>
    ${fieldLines()}
    ${family.render(variant)}
  `, 1600, 520);
}

function logoCanvas(inner) {
  return `<svg width="560" height="340" viewBox="0 0 560 340" fill="none" xmlns="http://www.w3.org/2000/svg">
    <rect width="560" height="340" rx="34" fill="${paper}"/>
    <rect x="18" y="18" width="524" height="304" rx="26" fill="rgba(255,252,247,0.92)" stroke="rgba(205,189,165,0.46)"/>
    ${inner}
  </svg>`;
}

function wordmarkLockup(mark, descriptor, familyLabel) {
  return `
    <g transform="translate(48 64)">
      ${mark}
      <text x="168" y="108" fill="${dark}" font-family="'Source Serif 4', Georgia, serif" font-size="78" font-weight="600" letter-spacing="-3.2">ChapAI</text>
      <text x="170" y="150" fill="${muted}" font-family="'DM Sans', Arial, sans-serif" font-size="14" font-weight="700" letter-spacing="4">${descriptor}</text>
      <text x="170" y="178" fill="${muted}" font-family="'DM Sans', Arial, sans-serif" font-size="11" font-weight="700" letter-spacing="3">${familyLabel}</text>
    </g>
  `;
}

function pick(seed, colors) {
  return colors[seed % colors.length];
}

function heartWordmark(seed) {
  const accent = pick(seed, [clay, gold, teal, sage]);
  return logoCanvas(
    wordmarkLockup(
      `
        <path d="M92 26C76 18 60 18 44 26C28 34 18 50 16 74C14 96 20 118 34 140C48 162 68 182 94 200C120 184 142 162 158 136C174 110 180 86 178 64C176 44 166 30 148 22C130 14 112 18 92 34C84 24 78 18 72 16" stroke="rgba(24,22,20,0.9)" stroke-width="2.8" fill="none" stroke-linecap="round" stroke-linejoin="round"/>
        <path d="M94 38V86" stroke="${accent}" stroke-width="1.9" stroke-linecap="round"/>
        <path d="M72 110H100L112 96L126 142L142 84L154 116H176" stroke="${accent}" stroke-width="2" fill="none" stroke-linecap="round" stroke-linejoin="round"/>
      `,
      "NCLEX + CCRN",
      "CORONARY WORDMARK",
    ),
  );
}

function corticalWordmark(seed) {
  const accent = pick(seed, [gold, teal, sage, clay]);
  return logoCanvas(
    wordmarkLockup(
      `
        <path d="M82 20C124 12 156 22 178 50C200 78 206 110 196 146C186 182 164 210 130 230C96 248 62 252 28 242C4 234 -14 218 -26 194" transform="translate(22 0)" stroke="rgba(24,22,20,0.9)" stroke-width="2.8" fill="none" stroke-linecap="round"/>
        <path d="M122 30C112 78 110 122 116 164C122 206 124 230 122 238" transform="translate(22 0)" stroke="${accent}" stroke-width="1.94" fill="none" stroke-linecap="round"/>
        <path d="M74 60C50 62 34 74 26 96" transform="translate(22 0)" stroke="rgba(46,42,38,0.54)" stroke-width="1.54" fill="none" stroke-linecap="round"/>
        <path d="M86 102C56 106 36 124 26 156" transform="translate(22 0)" stroke="rgba(46,42,38,0.52)" stroke-width="1.48" fill="none" stroke-linecap="round"/>
        <path d="M160 62C184 66 200 78 208 98" transform="translate(22 0)" stroke="rgba(46,42,38,0.54)" stroke-width="1.54" fill="none" stroke-linecap="round"/>
        <path d="M150 102C182 106 202 124 212 156" transform="translate(22 0)" stroke="rgba(46,42,38,0.52)" stroke-width="1.48" fill="none" stroke-linecap="round"/>
      `,
      "NCLEX + CCRN",
      "CORTICAL WORDMARK",
    ),
  );
}

function pulseWordmark(seed) {
  const accent = pick(seed, [teal, gold, clay, sage]);
  return logoCanvas(`
    <g transform="translate(52 92)">
      <text x="0" y="94" fill="${dark}" font-family="'Source Serif 4', Georgia, serif" font-size="94" font-weight="600" letter-spacing="-4">ChapAI</text>
      <path d="M2 122H136L160 100L190 164L224 86L252 130H454" stroke="${accent}" stroke-width="2.28" fill="none" stroke-linecap="round" stroke-linejoin="round"/>
      <text x="4" y="162" fill="${muted}" font-family="'DM Sans', Arial, sans-serif" font-size="14" font-weight="700" letter-spacing="4">NCLEX + CCRN / PULSE WORDMARK</text>
    </g>
  `);
}

function sealWordmark(seed) {
  const accent = pick(seed, [gold, clay, teal, sage]);
  return logoCanvas(`
    <g transform="translate(84 54)">
      <circle cx="90" cy="92" r="66" fill="rgba(255,252,247,0.96)" stroke="rgba(203,187,162,0.54)"/>
      <path d="M90 42C74 34 58 34 42 42C26 50 16 66 14 90C12 112 18 134 32 156C46 178 66 198 92 216C118 198 140 178 156 156C172 132 180 110 180 90C180 70 172 54 156 42C140 30 122 30 102 42C98 34 94 30 90 30" stroke="rgba(24,22,20,0.88)" stroke-width="2.5" fill="none" stroke-linejoin="round"/>
      <path d="M90 48V96" stroke="${accent}" stroke-width="1.9" stroke-linecap="round"/>
      <text x="188" y="108" fill="${dark}" font-family="'Source Serif 4', Georgia, serif" font-size="82" font-weight="600" letter-spacing="-3">ChapAI</text>
      <text x="190" y="150" fill="${muted}" font-family="'DM Sans', Arial, sans-serif" font-size="14" font-weight="700" letter-spacing="4">INSTRUMENT SEAL</text>
    </g>
  `);
}

function compactWordmark(seed) {
  const accent = pick(seed, [teal, gold, clay, sage]);
  return logoCanvas(`
    <g transform="translate(56 82)">
      <path d="M26 88C56 54 94 36 140 34C182 34 216 48 242 76" stroke="${accent}" stroke-width="2.4" fill="none" stroke-linecap="round"/>
      <path d="M52 120C70 84 94 58 124 42C154 26 186 18 220 18" stroke="rgba(24,22,20,0.62)" stroke-width="1.7" fill="none" stroke-linecap="round"/>
      <text x="0" y="156" fill="${dark}" font-family="'Source Serif 4', Georgia, serif" font-size="92" font-weight="600" letter-spacing="-4">ChapAI</text>
      <text x="4" y="202" fill="${muted}" font-family="'DM Sans', Arial, sans-serif" font-size="14" font-weight="700" letter-spacing="4">EDITORIAL MEDICAL WORDMARK</text>
    </g>
  `);
}

const logoFamilies = [
  { title: "Coronary wordmark", render: heartWordmark, note: "Wordmark-first heart-line direction." },
  { title: "Cortical wordmark", render: corticalWordmark, note: "Wordmark-first top-view brain direction." },
  { title: "Pulse wordmark", render: pulseWordmark, note: "Pulse-led editorial wordmark." },
  { title: "Instrument seal", render: sealWordmark, note: "Premium medical seal around a visible wordmark." },
  { title: "Editorial medical", render: compactWordmark, note: "Minimal premium wordmark with anatomical sweep." },
];

const manifest = fs.existsSync(manifestPath)
  ? JSON.parse(fs.readFileSync(manifestPath, "utf8"))
  : { heroes: {}, headers: {}, logos: {} };

for (let index = 0; index < 10; index += 1) {
  const family = heroFamilies[index % heroFamilies.length];
  const variant = index < 5 ? 0 : 1;
  const id = 1201 + index;
  const file = `frontpage-${id}.svg`;
  const svg = frontpageConcept(id, family, variant);
  write(path.join(designDir, file), svg);
  write(path.join(reviewAssetsDir, file), svg);
  manifest.heroes[file] = {
    title: `${family.label} ${variant === 0 ? "A" : "B"}`,
    note: family.note,
  };
}

for (let index = 0; index < 10; index += 1) {
  const family = heroFamilies[index % heroFamilies.length];
  const variant = index < 5 ? 0 : 1;
  const id = 81 + index;
  const file = `social-header-${id}.svg`;
  const svg = socialHeader(id, family, variant);
  write(path.join(designDir, file), svg);
  write(path.join(reviewAssetsDir, file), svg);
  manifest.headers[file] = {
    title: `${family.label} header ${variant === 0 ? "A" : "B"}`,
    note: `Social banner matching the ${family.label.toLowerCase()} direction.`,
  };
}

for (let index = 0; index < 50; index += 1) {
  const family = logoFamilies[index % logoFamilies.length];
  const id = 1051 + index;
  const file = `chapai-option-${id}.svg`;
  const svg = family.render(index);
  write(path.join(brandDir, file), svg);
  write(path.join(logoReviewDir, file), svg);
  manifest.logos[file] = {
    title: `${family.title} ${Math.floor(index / logoFamilies.length) + 1}`,
    note: family.note,
  };
}

write(manifestPath, JSON.stringify(manifest, null, 2));
console.log(JSON.stringify({ ok: true, frontpages: "1201-1210", headers: "81-90", logos: "1051-1100" }));
