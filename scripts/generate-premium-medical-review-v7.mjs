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

function shell(inner, width = 1600, height = 960) {
  return `<svg width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" fill="none" xmlns="http://www.w3.org/2000/svg">
    <defs>
      <radialGradient id="paper-wash" cx="0" cy="0" r="1" gradientUnits="userSpaceOnUse" gradientTransform="translate(1180 420) rotate(90) scale(420 420)">
        <stop offset="0" stop-color="${fog}" />
        <stop offset="0.4" stop-color="${sand}" />
        <stop offset="1" stop-color="${paper}" />
      </radialGradient>
      <radialGradient id="bleed-wash" cx="0" cy="0" r="1" gradientUnits="userSpaceOnUse" gradientTransform="translate(1260 446) rotate(90) scale(360 360)">
        <stop offset="0" stop-color="#fffaf2" stop-opacity="0.98" />
        <stop offset="0.52" stop-color="${wash}" stop-opacity="0.56" />
        <stop offset="1" stop-color="${wash}" stop-opacity="0" />
      </radialGradient>
    </defs>
    <rect width="${width}" height="${height}" fill="${paper}" />
    ${inner}
  </svg>`;
}

function navBar() {
  return `
    <rect x="108" y="68" width="1388" height="84" rx="42" fill="rgba(255,252,247,0.9)" stroke="rgba(213,198,175,0.56)"/>
    <text x="156" y="122" fill="${dark}" font-family="'Source Serif 4', Georgia, serif" font-size="38" font-weight="600" letter-spacing="-2">ChapAI</text>
    <text x="1170" y="120" fill="${muted}" font-family="'DM Sans', Arial, sans-serif" font-size="20" font-weight="600">CCRN</text>
    <text x="1252" y="120" fill="${muted}" font-family="'DM Sans', Arial, sans-serif" font-size="20" font-weight="600">NCLEX</text>
    <text x="1340" y="120" fill="${muted}" font-family="'DM Sans', Arial, sans-serif" font-size="20" font-weight="600">PLANS</text>
    <rect x="1388" y="88" width="102" height="44" rx="22" fill="rgba(255,250,243,0.96)" stroke="rgba(212,197,173,0.56)"/>
    <text x="1420" y="117" fill="${dark}" font-family="'DM Sans', Arial, sans-serif" font-size="20" font-weight="700">SPRINT</text>
  `;
}

function textBlock(lines, proof) {
  return `
    <text x="148" y="194" fill="${muted}" font-family="'DM Sans', Arial, sans-serif" font-size="15" font-weight="700" letter-spacing="4">PREMIUM MEDICAL PREP</text>
    <text x="148" y="292" fill="${dark}" font-family="'DM Sans', Arial, sans-serif" font-size="96" font-weight="500" letter-spacing="-7">${lines[0]}</text>
    <text x="148" y="382" fill="${dark}" font-family="'DM Sans', Arial, sans-serif" font-size="96" font-weight="500" letter-spacing="-7">${lines[1]}</text>
    <text x="148" y="472" fill="${dark}" font-family="'DM Sans', Arial, sans-serif" font-size="96" font-weight="500" letter-spacing="-7">${lines[2]}</text>
    <text x="148" y="556" fill="${muted}" font-family="'DM Sans', Arial, sans-serif" font-size="30">Original questions, AI tutor guidance, and cleaner clinical review.</text>
    <rect x="148" y="620" width="236" height="64" rx="32" fill="${teal}"/>
    <text x="192" y="660" fill="#fff" font-family="'DM Sans', Arial, sans-serif" font-size="25" font-weight="700">Start the $10 sprint</text>
    <rect x="402" y="620" width="190" height="64" rx="32" fill="rgba(255,252,247,0.92)" stroke="rgba(203,187,162,0.62)"/>
    <text x="454" y="660" fill="${dark}" font-family="'DM Sans', Arial, sans-serif" font-size="24" font-weight="600">See plans</text>
    <text x="148" y="742" fill="${muted}" font-family="'DM Sans', Arial, sans-serif" font-size="14" font-weight="700" letter-spacing="4">${proof}</text>
    <path d="M148 770H660" stroke="rgba(209,194,170,0.62)"/>
  `;
}

function backdropContours() {
  return `
    <path d="M786 152C910 130 1044 128 1188 144C1334 160 1472 196 1602 252C1718 302 1824 372 1920 462" stroke="rgba(92,104,110,0.15)" stroke-width="1.18" fill="none" stroke-linecap="round"/>
    <path d="M748 324C882 300 1018 302 1156 320C1296 338 1430 374 1558 432C1680 488 1794 572 1900 682" stroke="rgba(92,104,110,0.1)" stroke-width="1.08" fill="none" stroke-linecap="round"/>
    <path d="M764 548C906 520 1050 522 1196 542C1340 562 1478 602 1610 666C1728 722 1840 810 1946 932" stroke="rgba(92,104,110,0.12)" stroke-width="1.12" fill="none" stroke-linecap="round"/>
    <path d="M1000 92C1034 236 1060 386 1078 542C1094 704 1102 862 1102 1014" stroke="rgba(92,104,110,0.08)" stroke-width="1.04" fill="none" stroke-linecap="round"/>
    <path d="M1214 86C1216 236 1222 386 1232 538C1244 690 1262 850 1286 1014" stroke="rgba(92,104,110,0.14)" stroke-width="1.04" fill="none" stroke-linecap="round"/>
  `;
}

function corticalPlate(variant = 0) {
  const x = variant === 0 ? 1228 : 1252;
  return `
    <path d="M990 156C1090 122 1202 112 1328 124C1458 136 1568 168 1658 220C1748 272 1812 348 1848 448C1884 550 1880 658 1836 772C1792 886 1714 978 1602 1048C1490 1116 1360 1150 1212 1152C1076 1150 960 1118 864 1058C768 996 700 914 662 812C626 708 624 602 656 496C688 390 744 304 824 238C880 190 936 164 990 156Z" fill="url(#bleed-wash)" opacity="0.95"/>
    <path d="M1064 154C1128 140 1202 134 1288 138C1404 142 1502 166 1582 210C1662 254 1718 314 1750 392C1782 470 1786 560 1762 662C1738 764 1686 854 1604 936C1522 1018 1428 1072 1320 1102C1214 1132 1110 1134 1012 1108C916 1082 838 1030 780 952C722 876 694 784 694 678C694 572 712 478 748 396C786 314 842 250 916 208C958 184 1008 166 1064 154Z" stroke="rgba(24,22,20,0.92)" stroke-width="2.8" fill="none" stroke-linecap="round" stroke-linejoin="round"/>
    <path d="M${x} 160C${x - 10} 270 ${x - 6} 386 ${x} 510C${x + 6} 636 ${x + 8} 756 ${x} 872C${x - 6} 954 ${x - 14} 1024 ${x - 28} 1084" stroke="${gold}" stroke-width="2.06" fill="none" stroke-linecap="round"/>
    <path d="M1106 198C1046 208 994 234 950 276C912 314 890 358 884 408C878 458 890 504 920 548" stroke="rgba(46,42,38,0.58)" stroke-width="1.56" fill="none" stroke-linecap="round"/>
    <path d="M1150 228C1088 238 1036 266 996 310C958 352 940 398 942 448C946 498 964 544 998 588" stroke="rgba(46,42,38,0.56)" stroke-width="1.54" fill="none" stroke-linecap="round"/>
    <path d="M1190 264C1132 274 1086 300 1050 342C1018 380 1004 424 1008 472C1014 520 1034 564 1068 606" stroke="rgba(46,42,38,0.54)" stroke-width="1.5" fill="none" stroke-linecap="round"/>
    <path d="M1218 320C1164 330 1124 352 1098 386C1074 418 1068 454 1078 494C1088 534 1110 568 1144 596" stroke="rgba(46,42,38,0.52)" stroke-width="1.46" fill="none" stroke-linecap="round"/>
    <path d="M1230 382C1184 388 1152 402 1132 424C1112 448 1108 476 1120 508C1134 540 1158 568 1192 592" stroke="rgba(46,42,38,0.5)" stroke-width="1.42" fill="none" stroke-linecap="round"/>
    <path d="M1350 198C1410 208 1462 234 1506 276C1544 314 1566 358 1572 408C1578 458 1566 504 1536 548" stroke="rgba(46,42,38,0.58)" stroke-width="1.56" fill="none" stroke-linecap="round"/>
    <path d="M1306 228C1368 238 1420 266 1460 310C1498 352 1516 398 1514 448C1510 498 1492 544 1458 588" stroke="rgba(46,42,38,0.56)" stroke-width="1.54" fill="none" stroke-linecap="round"/>
    <path d="M1266 264C1324 274 1370 300 1406 342C1438 380 1452 424 1448 472C1442 520 1422 564 1388 606" stroke="rgba(46,42,38,0.54)" stroke-width="1.5" fill="none" stroke-linecap="round"/>
    <path d="M1238 320C1292 330 1332 352 1358 386C1382 418 1388 454 1378 494C1368 534 1346 568 1312 596" stroke="rgba(46,42,38,0.52)" stroke-width="1.46" fill="none" stroke-linecap="round"/>
    <path d="M1226 382C1272 388 1304 402 1324 424C1344 448 1348 476 1336 508C1322 540 1298 568 1264 592" stroke="rgba(46,42,38,0.5)" stroke-width="1.42" fill="none" stroke-linecap="round"/>
    <path d="M1020 688C970 740 936 796 918 856C902 912 904 968 926 1022" stroke="rgba(46,42,38,0.48)" stroke-width="1.3" fill="none" stroke-linecap="round"/>
    <path d="M1442 684C1492 734 1528 790 1548 848C1568 904 1568 958 1548 1010" stroke="rgba(46,42,38,0.48)" stroke-width="1.3" fill="none" stroke-linecap="round"/>
    <path d="M1516 266C1570 292 1618 328 1660 374" stroke="${teal}" stroke-width="1.38" fill="none" stroke-linecap="round"/>
    <path d="M1546 332C1592 360 1630 396 1662 438" stroke="${teal}" stroke-width="1.32" fill="none" stroke-linecap="round"/>
    <path d="M1570 412C1610 438 1640 470 1664 510" stroke="${teal}" stroke-width="1.28" fill="none" stroke-linecap="round"/>
    <path d="M1002 1036C944 1066 884 1104 824 1152" stroke="${clay}" stroke-width="1.34" fill="none" stroke-linecap="round"/>
    <path d="M1228 1098C1254 1142 1282 1186 1312 1226" stroke="${gold}" stroke-width="1.46" fill="none" stroke-linecap="round"/>
  `;
}

function coronaryContinuum(variant = 0) {
  const x = variant === 0 ? 1138 : 1160;
  return `
    <path d="M714 612H936L980 566L1038 684L1106 438L1154 632L1204 596H1392" stroke="${teal}" stroke-width="2.34" fill="none" stroke-linecap="round" stroke-linejoin="round"/>
    <path d="M1008 176C952 186 904 216 862 266C822 316 798 378 790 452C784 526 794 598 820 668C846 738 888 804 946 866C1004 928 1068 984 1138 1034C1210 998 1282 948 1354 884C1428 818 1488 748 1534 674C1582 598 1608 520 1612 440C1616 364 1600 302 1564 254C1528 206 1482 174 1426 158C1370 142 1310 148 1246 176C1184 204 1126 256 1070 332C1034 256 998 204 960 176" fill="url(#bleed-wash)" opacity="0.94"/>
    <path d="M1032 214C986 188 938 178 888 182C836 186 796 216 768 272C740 328 734 396 748 476C764 556 800 632 856 704C912 776 990 856 1090 944" stroke="rgba(24,22,20,0.92)" stroke-width="2.86" fill="none" stroke-linecap="round" stroke-linejoin="round"/>
    <path d="M1070 332C1118 258 1170 210 1228 188C1288 166 1348 170 1408 196C1468 222 1516 264 1552 322C1590 380 1608 446 1606 520C1604 596 1580 668 1534 736C1488 806 1424 878 1340 948C1280 1000 1214 1044 1142 1080" stroke="rgba(24,22,20,0.92)" stroke-width="2.86" fill="none" stroke-linecap="round" stroke-linejoin="round"/>
    <path d="M${x} 256C${x} 346 ${x + 10} 432 ${x + 26} 516C${x + 42} 600 ${x + 48} 684 ${x + 42} 770" stroke="${gold}" stroke-width="2" fill="none" stroke-linecap="round"/>
    <path d="M${x - 86} 308C${x - 136} 300 ${x - 182} 308 ${x - 224} 336" stroke="${clay}" stroke-width="1.76" fill="none" stroke-linecap="round"/>
    <path d="M${x - 60} 392C${x - 114} 414 ${x - 160} 452 ${x - 198} 506" stroke="${gold}" stroke-width="1.72" fill="none" stroke-linecap="round"/>
    <path d="M${x - 42} 486C${x - 86} 532 ${x - 118} 586 ${x - 138} 648" stroke="${teal}" stroke-width="1.68" fill="none" stroke-linecap="round"/>
    <path d="M${x + 16} 308C${x + 68} 296 ${x + 116} 304 ${x + 160} 332" stroke="${clay}" stroke-width="1.76" fill="none" stroke-linecap="round"/>
    <path d="M${x + 32} 392C${x + 86} 392 ${x + 138} 416 ${x + 188} 462" stroke="${gold}" stroke-width="1.72" fill="none" stroke-linecap="round"/>
    <path d="M${x + 42} 484C${x + 90} 522 ${x + 130} 570 ${x + 162} 628" stroke="${teal}" stroke-width="1.68" fill="none" stroke-linecap="round"/>
  `;
}

function neuralBloom(variant = 0) {
  const x = variant === 0 ? 1268 : 1286;
  return `
    <circle cx="${x}" cy="512" r="318" fill="url(#bleed-wash)" opacity="0.92"/>
    <circle cx="${x}" cy="512" r="326" stroke="rgba(93,107,112,0.18)" stroke-width="1.5"/>
    <circle cx="${x}" cy="512" r="62" fill="${fog}" stroke="rgba(24,22,20,0.18)" stroke-width="1.1"/>
    <path d="M${x} 512C${x - 74} 442 ${x - 150} 380 ${x - 228} 326C${x - 306} 272 ${x - 394} 232 ${x - 492} 206" stroke="rgba(24,22,20,0.92)" stroke-width="2.8" fill="none" stroke-linecap="round"/>
    <path d="M${x} 512C${x + 74} 442 ${x + 150} 380 ${x + 228} 326C${x + 306} 272 ${x + 394} 232 ${x + 492} 206" stroke="rgba(24,22,20,0.92)" stroke-width="2.8" fill="none" stroke-linecap="round"/>
    <path d="M${x} 512C${x - 72} 588 ${x - 142} 664 ${x - 210} 740C${x - 278} 816 ${x - 340} 900 ${x - 396} 992" stroke="rgba(24,22,20,0.84)" stroke-width="2.4" fill="none" stroke-linecap="round"/>
    <path d="M${x} 512C${x + 72} 588 ${x + 142} 664 ${x + 210} 740C${x + 278} 816 ${x + 340} 900 ${x + 396} 992" stroke="rgba(24,22,20,0.84)" stroke-width="2.4" fill="none" stroke-linecap="round"/>
    <path d="M${x} 512C${x} 430 ${x + 6} 340 ${x + 14} 238" stroke="${gold}" stroke-width="1.92" fill="none" stroke-linecap="round"/>
    <path d="M${x} 512C${x} 598 ${x + 2} 694 ${x + 10} 796" stroke="${gold}" stroke-width="1.92" fill="none" stroke-linecap="round"/>
    <circle cx="${x - 492}" cy="206" r="5" fill="${teal}"/>
    <circle cx="${x + 492}" cy="206" r="5" fill="${teal}"/>
    <circle cx="${x - 396}" cy="992" r="4.6" fill="${clay}"/>
    <circle cx="${x + 396}" cy="992" r="4.6" fill="${clay}"/>
  `;
}

function pulmonaryAtlas(variant = 0) {
  const x = variant === 0 ? 1258 : 1276;
  return `
    <path d="M982 236C928 292 894 356 880 428C866 500 874 586 904 686C936 784 980 870 1038 944C1090 892 1128 842 1154 792C1180 742 1196 658 1202 540C1208 420 1196 328 1166 266C1134 204 1072 194 982 236Z" fill="url(#bleed-wash)" opacity="0.9"/>
    <path d="M1534 236C1588 292 1622 356 1636 428C1650 500 1642 586 1612 686C1580 784 1536 870 1478 944C1426 892 1388 842 1362 792C1336 742 1320 658 1314 540C1308 420 1320 328 1350 266C1382 204 1444 194 1534 236Z" fill="url(#bleed-wash)" opacity="0.9"/>
    <path d="M982 236C928 292 894 356 880 428C866 500 874 586 904 686C936 784 980 870 1038 944" stroke="rgba(24,22,20,0.9)" stroke-width="2.76" fill="none"/>
    <path d="M1534 236C1588 292 1622 356 1636 428C1650 500 1642 586 1612 686C1580 784 1536 870 1478 944" stroke="rgba(24,22,20,0.9)" stroke-width="2.76" fill="none"/>
    <path d="M${x} 198V912" stroke="${gold}" stroke-width="2" stroke-linecap="round"/>
    <path d="M${x} 252C${x - 58} 296 ${x - 108} 348 ${x - 150} 406" stroke="${teal}" stroke-width="1.8" fill="none" stroke-linecap="round"/>
    <path d="M${x} 252C${x + 58} 296 ${x + 108} 348 ${x + 150} 406" stroke="${teal}" stroke-width="1.8" fill="none" stroke-linecap="round"/>
    <path d="M${x - 150} 406C${x - 198} 454 ${x - 232} 510 ${x - 252} 574" stroke="${gold}" stroke-width="1.72" fill="none" stroke-linecap="round"/>
    <path d="M${x + 150} 406C${x + 198} 454 ${x + 232} 510 ${x + 252} 574" stroke="${gold}" stroke-width="1.72" fill="none" stroke-linecap="round"/>
    <path d="M${x} 470C${x - 26} 528 ${x - 46} 590 ${x - 58} 656" stroke="${teal}" stroke-width="1.66" fill="none" stroke-linecap="round"/>
    <path d="M${x} 470C${x + 26} 528 ${x + 46} 590 ${x + 58} 656" stroke="${teal}" stroke-width="1.66" fill="none" stroke-linecap="round"/>
  `;
}

const heroFamilies = [
  {
    key: "cortical-atlas",
    label: "Cortical atlas",
    note: "Top-view brain plate with more literal engraved medical linework.",
    render: corticalPlate,
    titles: [["The cleaner", "clinical study", "surface."], ["Premium nursing", "prep with", "actual signal."]],
  },
  {
    key: "coronary-script",
    label: "Coronary continuum",
    note: "Continuous-line heart with stronger internal structure and telemetry.",
    render: coronaryContinuum,
    titles: [["Clinical prep", "with a steadier", "pulse."], ["Bedside logic,", "cleaned up", "and taught."]],
  },
  {
    key: "neuron-bloom",
    label: "Neuron bloom",
    note: "Dense neural object with actual branch weight and a stronger medical feel.",
    render: neuralBloom,
    titles: [["Pattern first.", "Noise out.", "Study better."], ["Original questions,", "clearer patterns,", "better recall."]],
  },
  {
    key: "pulmonary-atlas",
    label: "Pulmonary atlas",
    note: "Airway map with clearer lobe structure and a warmer wash underlay.",
    render: pulmonaryAtlas,
    titles: [["Shock, vents,", "oxygen, and", "clearer review."], ["A calmer", "critical-care", "workflow."]],
  },
];

function frontpageConcept(family, variant) {
  return shell(`
    ${navBar()}
    ${textBlock(family.titles[variant], "AI TUTOR + LIVE BANK + VISUAL RATIONALE")}
    ${backdropContours()}
    ${family.render(variant)}
    <text x="148" y="840" fill="${muted}" font-family="'DM Sans', Arial, sans-serif" font-size="14" font-weight="700" letter-spacing="4">CURRENT ANGLE</text>
    <text x="148" y="886" fill="${dark}" font-family="'Source Serif 4', Georgia, serif" font-size="38" font-weight="600">${family.label}</text>
  `);
}

function socialHeader(family, variant) {
  return shell(`
    <rect x="42" y="42" width="1516" height="434" rx="34" fill="rgba(255,252,247,0.9)" stroke="rgba(212,197,173,0.52)"/>
    <text x="112" y="164" fill="${dark}" font-family="'Source Serif 4', Georgia, serif" font-size="70" font-weight="600" letter-spacing="-3">ChapAI</text>
    <text x="112" y="224" fill="${muted}" font-family="'DM Sans', Arial, sans-serif" font-size="18" font-weight="700" letter-spacing="5">NCLEX + CCRN / CLEANER CLINICAL PREP</text>
    <text x="112" y="294" fill="${dark}" font-family="'DM Sans', Arial, sans-serif" font-size="48" font-weight="500" letter-spacing="-3">Original questions. Better bedside reasoning.</text>
    <text x="112" y="350" fill="${muted}" font-family="'DM Sans', Arial, sans-serif" font-size="25">AI tutor, visual rationale, and a calmer package path.</text>
    ${backdropContours()}
    ${family.render(variant)}
  `, 1600, 520);
}

function logoCanvas(inner) {
  return `<svg width="560" height="340" viewBox="0 0 560 340" fill="none" xmlns="http://www.w3.org/2000/svg">
    <rect width="560" height="340" rx="34" fill="${paper}"/>
    <rect x="18" y="18" width="524" height="304" rx="26" fill="rgba(255,252,247,0.94)" stroke="rgba(205,189,165,0.46)"/>
    ${inner}
  </svg>`;
}

function visibleWordmark(mark, sub, familyLabel) {
  return `
    <g transform="translate(48 62)">
      ${mark}
      <text x="164" y="110" fill="${dark}" font-family="'Source Serif 4', Georgia, serif" font-size="80" font-weight="600" letter-spacing="-3">ChapAI</text>
      <text x="166" y="150" fill="${muted}" font-family="'DM Sans', Arial, sans-serif" font-size="14" font-weight="700" letter-spacing="4">NCLEX + CCRN</text>
      <text x="166" y="176" fill="${muted}" font-family="'DM Sans', Arial, sans-serif" font-size="11" font-weight="700" letter-spacing="3">${familyLabel}</text>
      <text x="166" y="206" fill="${dark}" font-family="'DM Sans', Arial, sans-serif" font-size="18" font-weight="500">${sub}</text>
    </g>
  `;
}

function heartlineLogo(seed) {
  const accent = [clay, gold, teal, sage][seed % 4];
  return logoCanvas(
    visibleWordmark(
      `
        <path d="M94 26C74 18 56 18 40 28C24 38 14 54 12 78C10 100 16 122 30 144C44 166 64 186 92 204C120 184 142 162 158 138C174 112 180 88 178 66C176 46 166 32 148 24C130 16 112 20 94 36C86 24 80 18 74 16" stroke="rgba(24,22,20,0.92)" stroke-width="2.8" fill="none" stroke-linecap="round" stroke-linejoin="round"/>
        <path d="M6 118H72L90 96L112 146L136 82L158 120H212" stroke="${accent}" stroke-width="2.14" fill="none" stroke-linecap="round" stroke-linejoin="round"/>
      `,
      "Heartline editorial wordmark",
      "HEARTLINE WORDMARK",
    ),
  );
}

function corticalSweepLogo(seed) {
  const accent = [gold, teal, sage, clay][seed % 4];
  return logoCanvas(
    visibleWordmark(
      `
        <path d="M96 20C138 12 170 22 192 50C214 78 220 110 210 146C200 182 178 210 144 230C110 248 76 252 42 242C18 234 0 218 -12 194" stroke="rgba(24,22,20,0.92)" stroke-width="2.8" fill="none" stroke-linecap="round"/>
        <path d="M136 28C126 76 124 120 130 160C136 200 138 224 136 234" stroke="${accent}" stroke-width="1.96" fill="none" stroke-linecap="round"/>
        <path d="M88 60C64 62 48 74 40 96" stroke="rgba(46,42,38,0.56)" stroke-width="1.54" fill="none" stroke-linecap="round"/>
        <path d="M100 104C72 108 52 126 40 158" stroke="rgba(46,42,38,0.52)" stroke-width="1.48" fill="none" stroke-linecap="round"/>
        <path d="M172 60C196 66 212 78 220 98" stroke="rgba(46,42,38,0.56)" stroke-width="1.54" fill="none" stroke-linecap="round"/>
        <path d="M162 104C192 108 212 126 224 158" stroke="rgba(46,42,38,0.52)" stroke-width="1.48" fill="none" stroke-linecap="round"/>
      `,
      "Cortical editorial wordmark",
      "CORTICAL WORDMARK",
    ),
  );
}

function vesselUnderlineLogo(seed) {
  const accent = [teal, gold, clay, sage][seed % 4];
  return logoCanvas(`
    <g transform="translate(56 84)">
      <text x="0" y="112" fill="${dark}" font-family="'Source Serif 4', Georgia, serif" font-size="94" font-weight="600" letter-spacing="-4">ChapAI</text>
      <path d="M0 138C52 138 104 138 156 138C182 138 198 124 206 96C214 68 226 68 242 96C258 126 274 138 290 138H452" stroke="${accent}" stroke-width="2.18" fill="none" stroke-linecap="round" stroke-linejoin="round"/>
      <text x="4" y="186" fill="${muted}" font-family="'DM Sans', Arial, sans-serif" font-size="14" font-weight="700" letter-spacing="4">VASCULAR UNDERLINE</text>
    </g>
  `);
}

function anatomySealLogo(seed) {
  const accent = [gold, clay, teal, sage][seed % 4];
  return logoCanvas(`
    <g transform="translate(78 54)">
      <circle cx="92" cy="94" r="68" fill="rgba(255,252,247,0.96)" stroke="rgba(203,187,162,0.54)"/>
      <path d="M92 30C72 20 54 22 38 34C22 46 14 64 14 88C14 112 22 136 38 160C54 184 72 202 92 214C116 198 136 180 152 160C168 140 176 118 176 94C176 70 170 52 158 40C146 28 132 22 116 22C106 22 98 24 92 30Z" stroke="rgba(24,22,20,0.9)" stroke-width="2.36" fill="none"/>
      <path d="M68 122H92L102 110L118 146L132 88L144 122H164" stroke="${accent}" stroke-width="1.86" fill="none" stroke-linecap="round" stroke-linejoin="round"/>
      <text x="190" y="106" fill="${dark}" font-family="'Source Serif 4', Georgia, serif" font-size="82" font-weight="600" letter-spacing="-3">ChapAI</text>
      <text x="192" y="148" fill="${muted}" font-family="'DM Sans', Arial, sans-serif" font-size="14" font-weight="700" letter-spacing="4">INSTRUMENT SEAL</text>
      <text x="192" y="176" fill="${dark}" font-family="'DM Sans', Arial, sans-serif" font-size="18" font-weight="500">Premium medical mark</text>
    </g>
  `);
}

function neuralArcLogo(seed) {
  const accent = [teal, gold, clay, sage][seed % 4];
  return logoCanvas(`
    <g transform="translate(56 86)">
      <path d="M22 56C70 34 114 24 154 26C198 28 236 40 268 62" stroke="${accent}" stroke-width="2.24" fill="none" stroke-linecap="round"/>
      <circle cx="22" cy="56" r="4" fill="${accent}"/>
      <circle cx="268" cy="62" r="4" fill="${accent}"/>
      <text x="0" y="146" fill="${dark}" font-family="'Source Serif 4', Georgia, serif" font-size="94" font-weight="600" letter-spacing="-4">ChapAI</text>
      <text x="4" y="194" fill="${muted}" font-family="'DM Sans', Arial, sans-serif" font-size="14" font-weight="700" letter-spacing="4">NEURAL ARC WORDMARK</text>
    </g>
  `);
}

const logoFamilies = [
  { title: "Heartline wordmark", render: heartlineLogo, note: "Visible wordmark with integrated heartline." },
  { title: "Cortical sweep", render: corticalSweepLogo, note: "Brain-line wordmark with premium editorial weight." },
  { title: "Vessel underline", render: vesselUnderlineLogo, note: "Typographic mark carried by a vascular underline." },
  { title: "Instrument seal", render: anatomySealLogo, note: "Editorial seal with clear wordmark." },
  { title: "Neural arc", render: neuralArcLogo, note: "Simple premium wordmark with a subtle neural arc." },
];

const manifest = fs.existsSync(manifestPath)
  ? JSON.parse(fs.readFileSync(manifestPath, "utf8"))
  : { heroes: {}, headers: {}, logos: {} };

for (let index = 0; index < 10; index += 1) {
  const family = heroFamilies[index % heroFamilies.length];
  const variant = index < 5 ? 0 : 1;
  const id = 1301 + index;
  const file = `frontpage-${id}.svg`;
  const svg = frontpageConcept(family, variant);
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
  const id = 91 + index;
  const file = `social-header-${id}.svg`;
  const svg = socialHeader(family, variant);
  write(path.join(designDir, file), svg);
  write(path.join(reviewAssetsDir, file), svg);
  manifest.headers[file] = {
    title: `${family.label} header ${variant === 0 ? "A" : "B"}`,
    note: `Social banner matching the ${family.label.toLowerCase()} direction.`,
  };
}

for (let index = 0; index < 50; index += 1) {
  const family = logoFamilies[index % logoFamilies.length];
  const id = 1101 + index;
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
console.log(JSON.stringify({ ok: true, frontpages: "1301-1310", headers: "91-100", logos: "1101-1150" }));
