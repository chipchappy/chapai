import fs from "node:fs";
import path from "node:path";

const root = "C:/Users/Chapman/Desktop/ai/chapai";
const brandDir = path.join(root, "apps/web/public/brand/options");
const reviewDir = path.join(root, "apps/web/public/design-review");

fs.mkdirSync(brandDir, { recursive: true });
fs.mkdirSync(reviewDir, { recursive: true });

const paper = "#FBF7F0";
const sand = "#F3EBDD";
const wash = "#E9DCCA";
const dark = "#1F1F21";
const muted = "#7A7064";
const teal = "#587E87";
const gold = "#C59858";
const clay = "#B67D66";
const sage = "#82927E";

function write(filePath, contents) {
  fs.writeFileSync(filePath, contents, "utf8");
}

function baseSvg(inner, { width = 1600, height = 960 } = {}) {
  return `<svg width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" fill="none" xmlns="http://www.w3.org/2000/svg">
  <rect width="${width}" height="${height}" fill="${paper}"/>
  <defs>
    <radialGradient id="paper-wash" cx="0" cy="0" r="1" gradientUnits="userSpaceOnUse" gradientTransform="translate(${width * 0.76} ${height * 0.34}) rotate(90) scale(${height * 0.44} ${height * 0.44})">
      <stop offset="0" stop-color="#fffdf7"/>
      <stop offset="0.5" stop-color="${sand}"/>
      <stop offset="1" stop-color="${paper}"/>
    </radialGradient>
    <radialGradient id="bleed-wash" cx="0" cy="0" r="1" gradientUnits="userSpaceOnUse" gradientTransform="translate(${width * 0.75} ${height * 0.38}) rotate(90) scale(${height * 0.26} ${height * 0.26})">
      <stop offset="0" stop-color="#fffaf1" stop-opacity="0.95"/>
      <stop offset="0.5" stop-color="${wash}" stop-opacity="0.58"/>
      <stop offset="1" stop-color="${wash}" stop-opacity="0"/>
    </radialGradient>
  </defs>
  <rect x="26" y="26" width="${width - 52}" height="${height - 52}" rx="28" fill="url(#paper-wash)" stroke="rgba(203,188,164,0.38)"/>
  ${inner}
</svg>`;
}

function navBar() {
  return `
    <rect x="110" y="70" width="1380" height="82" rx="41" fill="rgba(255,252,247,0.84)" stroke="rgba(212,197,173,0.52)"/>
    <text x="182" y="120" fill="${dark}" font-family="'Source Serif 4', Georgia, serif" font-size="38" font-weight="600" letter-spacing="-2">ChapAI</text>
    <text x="1106" y="120" fill="${muted}" font-family="'DM Sans', Arial, sans-serif" font-size="20" font-weight="600">CCRN</text>
    <text x="1190" y="120" fill="${muted}" font-family="'DM Sans', Arial, sans-serif" font-size="20" font-weight="600">NCLEX</text>
    <text x="1284" y="120" fill="${muted}" font-family="'DM Sans', Arial, sans-serif" font-size="20" font-weight="600">PLANS</text>
    <rect x="1348" y="90" width="114" height="44" rx="22" fill="rgba(255,250,243,0.96)" stroke="rgba(212,197,173,0.54)"/>
    <text x="1383" y="118" fill="${dark}" font-family="'DM Sans', Arial, sans-serif" font-size="20" font-weight="700">SPRINT</text>
  `;
}

function textBlock({ eyebrow, title, body, proof }) {
  return `
    <text x="154" y="192" fill="${muted}" font-family="'DM Sans', Arial, sans-serif" font-size="15" font-weight="700" letter-spacing="5">${eyebrow.toUpperCase()}</text>
    <text x="154" y="282" fill="${dark}" font-family="'DM Sans', Arial, sans-serif" font-size="94" font-weight="500" letter-spacing="-7">${title[0]}</text>
    <text x="154" y="372" fill="${dark}" font-family="'DM Sans', Arial, sans-serif" font-size="94" font-weight="500" letter-spacing="-7">${title[1]}</text>
    <text x="154" y="462" fill="${dark}" font-family="'DM Sans', Arial, sans-serif" font-size="94" font-weight="500" letter-spacing="-7">${title[2]}</text>
    <text x="154" y="546" fill="${muted}" font-family="'DM Sans', Arial, sans-serif" font-size="30">${body}</text>
    <rect x="154" y="610" width="232" height="64" rx="32" fill="${teal}"/>
    <text x="194" y="650" fill="#fff" font-family="'DM Sans', Arial, sans-serif" font-size="25" font-weight="700">Start the $10 sprint</text>
    <rect x="404" y="610" width="196" height="64" rx="32" fill="rgba(255,252,247,0.88)" stroke="rgba(194,178,154,0.62)"/>
    <text x="454" y="650" fill="${dark}" font-family="'DM Sans', Arial, sans-serif" font-size="24" font-weight="600">See plans</text>
    <text x="154" y="738" fill="${muted}" font-family="'DM Sans', Arial, sans-serif" font-size="14" font-weight="700" letter-spacing="4">${proof}</text>
    <path d="M154 766H654" stroke="rgba(212,197,173,0.62)"/>
  `;
}

function renderGuides() {
  return `
    <path d="M760 212C902 134 1044 100 1188 108C1324 116 1456 154 1584 224C1668 270 1732 322 1778 380" stroke="rgba(88,126,135,0.2)" stroke-width="1.4" fill="none" stroke-linecap="round"/>
    <path d="M724 420C874 334 1030 296 1194 304C1360 312 1514 354 1656 436C1742 486 1810 544 1858 608" stroke="rgba(88,126,135,0.12)" stroke-width="1.1" fill="none" stroke-linecap="round"/>
    <path d="M814 684C946 632 1074 610 1200 618C1328 626 1450 664 1566 732C1642 776 1702 826 1746 884" stroke="rgba(88,126,135,0.18)" stroke-width="1.34" fill="none" stroke-linecap="round"/>
    <path d="M1046 84C1052 234 1064 390 1076 548C1088 706 1110 844 1142 952" stroke="rgba(88,126,135,0.1)" stroke-width="1.1" fill="none" stroke-linecap="round"/>
    <path d="M1214 66C1218 226 1228 384 1242 542C1256 700 1282 838 1318 946" stroke="rgba(88,126,135,0.18)" stroke-width="1.22" fill="none" stroke-linecap="round"/>
    <path d="M1388 88C1358 214 1328 348 1298 490C1270 632 1246 780 1228 948" stroke="rgba(88,126,135,0.1)" stroke-width="1.04" fill="none" stroke-linecap="round"/>
  `;
}

function renderNeuralCanopy(x = 930, y = 134, scale = 0.92) {
  return `
    <path d="M${x + 44 * scale} ${y + 112 * scale}C${x + 150 * scale} ${y + 48 * scale} ${x + 286 * scale} ${y + 20 * scale} ${x + 452 * scale} ${y + 26 * scale}C${x + 608 * scale} ${y + 32 * scale} ${x + 728 * scale} ${y + 82 * scale} ${x + 810 * scale} ${y + 170 * scale}C${x + 888 * scale} ${y + 252 * scale} ${x + 926 * scale} ${y + 348 * scale} ${x + 922 * scale} ${y + 458 * scale}C${x + 918 * scale} ${y + 568 * scale} ${x + 878 * scale} ${y + 662 * scale} ${x + 802 * scale} ${y + 738 * scale}C${x + 726 * scale} ${y + 814 * scale} ${x + 636 * scale} ${y + 858 * scale} ${x + 532 * scale} ${y + 870 * scale}C${x + 432 * scale} ${y + 882 * scale} ${x + 338 * scale} ${y + 870 * scale} ${x + 250 * scale} ${y + 828 * scale}C${x + 162 * scale} ${y + 786 * scale} ${x + 92 * scale} ${y + 724 * scale} ${x + 42 * scale} ${y + 644 * scale}C${x - 8 * scale} ${y + 564 * scale} ${x - 30 * scale} ${y + 470 * scale} ${x - 24 * scale} ${y + 362 * scale}C${x - 18 * scale} ${y + 254 * scale} ${x + 4 * scale} ${y + 170 * scale} ${x + 44 * scale} ${y + 112 * scale}Z" fill="url(#bleed-wash)" opacity="0.92"/>
    <path d="M${x + 84 * scale} ${y + 144 * scale}C${x + 186 * scale} ${y + 94 * scale} ${x + 308 * scale} ${y + 74 * scale} ${x + 450 * scale} ${y + 80 * scale}C${x + 586 * scale} ${y + 86 * scale} ${x + 690 * scale} ${y + 126 * scale} ${x + 762 * scale} ${y + 194 * scale}C${x + 832 * scale} ${y + 262 * scale} ${x + 866 * scale} ${y + 346 * scale} ${x + 864 * scale} ${y + 446 * scale}C${x + 862 * scale} ${y + 546 * scale} ${x + 826 * scale} ${y + 632 * scale} ${x + 756 * scale} ${y + 700 * scale}C${x + 686 * scale} ${y + 768 * scale} ${x + 604 * scale} ${y + 808 * scale} ${x + 508 * scale} ${y + 822 * scale}" stroke="rgba(31,31,29,0.86)" stroke-width="${2.7 * scale}" fill="none" stroke-linecap="round" stroke-linejoin="round"/>
    <path d="M${x + 146 * scale} ${y + 194 * scale}C${x + 198 * scale} ${y + 154 * scale} ${x + 258 * scale} ${y + 134 * scale} ${x + 326 * scale} ${y + 136 * scale}C${x + 394 * scale} ${y + 138 * scale} ${x + 450 * scale} ${y + 162 * scale} ${x + 496 * scale} ${y + 206 * scale}" stroke="rgba(31,31,29,0.76)" stroke-width="${2.1 * scale}" fill="none" stroke-linecap="round"/>
    <path d="M${x + 236 * scale} ${y + 304 * scale}C${x + 288 * scale} ${y + 260 * scale} ${x + 350 * scale} ${y + 240 * scale} ${x + 420 * scale} ${y + 244 * scale}C${x + 492 * scale} ${y + 248 * scale} ${x + 554 * scale} ${y + 278 * scale} ${x + 606 * scale} ${y + 336 * scale}" stroke="rgba(31,31,29,0.74)" stroke-width="${2.06 * scale}" fill="none" stroke-linecap="round"/>
    <path d="M${x + 318 * scale} ${y + 420 * scale}C${x + 354 * scale} ${y + 548 * scale} ${x + 380 * scale} ${y + 672 * scale} ${x + 398 * scale} ${y + 792 * scale}" stroke="${gold}" stroke-width="${1.96 * scale}" fill="none" stroke-linecap="round"/>
    <path d="M${x + 398 * scale} ${y + 548 * scale}C${x + 352 * scale} ${y + 604 * scale} ${x + 318 * scale} ${y + 668 * scale} ${x + 296 * scale} ${y + 740 * scale}" stroke="${teal}" stroke-width="${1.76 * scale}" fill="none" stroke-linecap="round"/>
    <path d="M${x + 420 * scale} ${y + 568 * scale}C${x + 470 * scale} ${y + 612 * scale} ${x + 514 * scale} ${y + 670 * scale} ${x + 554 * scale} ${y + 744 * scale}" stroke="${teal}" stroke-width="${1.76 * scale}" fill="none" stroke-linecap="round"/>
    <path d="M${x + 516 * scale} ${y + 430 * scale}C${x + 560 * scale} ${y + 384 * scale} ${x + 618 * scale} ${y + 356 * scale} ${x + 690 * scale} ${y + 346 * scale}C${x + 760 * scale} ${y + 336 * scale} ${x + 820 * scale} ${y + 350 * scale} ${x + 872 * scale} ${y + 388 * scale}" stroke="${gold}" stroke-width="${1.96 * scale}" fill="none" stroke-linecap="round"/>
    <path d="M${x + 960 * scale} ${y + 656 * scale}H${x + 1340 * scale}" stroke="rgba(88,126,135,0.12)" stroke-width="${1.2 * scale}" fill="none" stroke-linecap="round"/>
  `;
}

function renderCoronaryAtlas(x = 1016, y = 168, scale = 0.96) {
  return `
    <path d="M${x + 250 * scale} ${y + 104 * scale}C${x + 214 * scale} ${y + 44 * scale} ${x + 154 * scale} ${y + 14 * scale} ${x + 78 * scale} ${y + 18 * scale}C${x + 2 * scale} ${y + 24 * scale} ${x - 54 * scale} ${y + 70 * scale} ${x - 84 * scale} ${y + 138 * scale}C${x - 112 * scale} ${y + 206 * scale} ${x - 106 * scale} ${y + 284 * scale} ${x - 66 * scale} ${y + 372 * scale}C${x - 26 * scale} ${y + 460 * scale} ${x + 40 * scale} ${y + 548 * scale} ${x + 132 * scale} ${y + 634 * scale}C${x + 220 * scale} ${y + 716 * scale} ${x + 284 * scale} ${y + 772 * scale} ${x + 326 * scale} ${y + 802 * scale}C${x + 366 * scale} ${y + 776 * scale} ${x + 430 * scale} ${y + 726 * scale} ${x + 516 * scale} ${y + 648 * scale}C${x + 602 * scale} ${y + 570 * scale} ${x + 658 * scale} ${y + 490 * scale} ${x + 682 * scale} ${y + 408 * scale}C${x + 708 * scale} ${y + 324 * scale} ${x + 704 * scale} ${y + 248 * scale} ${x + 668 * scale} ${y + 180 * scale}C${x + 632 * scale} ${y + 112 * scale} ${x + 572 * scale} ${y + 64 * scale} ${x + 488 * scale} ${y + 44 * scale}C${x + 404 * scale} ${y + 24 * scale} ${x + 324 * scale} ${y + 44 * scale} ${x + 250 * scale} ${y + 104 * scale}Z" fill="url(#bleed-wash)" opacity="0.88"/>
    <path d="M${x + 248 * scale} ${y + 126 * scale}C${x + 214 * scale} ${y + 84 * scale} ${x + 166 * scale} ${y + 64 * scale} ${x + 104 * scale} ${y + 68 * scale}C${x + 42 * scale} ${y + 72 * scale} ${x - 2 * scale} ${y + 106 * scale} ${x - 26 * scale} ${y + 158 * scale}C${x - 48 * scale} ${y + 212 * scale} ${x - 44 * scale} ${y + 274 * scale} ${x - 12 * scale} ${y + 342 * scale}C${x + 18 * scale} ${y + 410 * scale} ${x + 80 * scale} ${y + 482 * scale} ${x + 172 * scale} ${y + 560 * scale}C${x + 250 * scale} ${y + 626 * scale} ${x + 304 * scale} ${y + 672 * scale} ${x + 336 * scale} ${y + 700 * scale}C${x + 372 * scale} ${y + 678 * scale} ${x + 428 * scale} ${y + 632 * scale} ${x + 504 * scale} ${y + 558 * scale}C${x + 580 * scale} ${y + 484 * scale} ${x + 626 * scale} ${y + 414 * scale} ${x + 646 * scale} ${y + 348 * scale}C${x + 666 * scale} ${y + 282 * scale} ${x + 664 * scale} ${y + 224 * scale} ${x + 636 * scale} ${y + 170 * scale}C${x + 606 * scale} ${y + 116 * scale} ${x + 556 * scale} ${y + 78 * scale} ${x + 488 * scale} ${y + 66 * scale}C${x + 420 * scale} ${y + 54 * scale} ${x + 340 * scale} ${y + 74 * scale} ${x + 248 * scale} ${y + 126 * scale}Z" stroke="rgba(31,31,29,0.86)" stroke-width="${2.5 * scale}" fill="none" stroke-linejoin="round"/>
    <path d="M${x + 336 * scale} ${y + 132 * scale}V${y + 648 * scale}" stroke="${gold}" stroke-width="${1.9 * scale}" stroke-linecap="round"/>
    <path d="M${x + 336 * scale} ${y + 176 * scale}C${x + 282 * scale} ${y + 160 * scale} ${x + 232 * scale} ${y + 164 * scale} ${x + 186 * scale} ${y + 190 * scale}" stroke="${teal}" stroke-width="${1.7 * scale}" fill="none" stroke-linecap="round"/>
    <path d="M${x + 336 * scale} ${y + 176 * scale}C${x + 392 * scale} ${y + 160 * scale} ${x + 444 * scale} ${y + 166 * scale} ${x + 492 * scale} ${y + 196 * scale}" stroke="${teal}" stroke-width="${1.7 * scale}" fill="none" stroke-linecap="round"/>
    <path d="M${x + 336 * scale} ${y + 268 * scale}C${x + 264 * scale} ${y + 292 * scale} ${x + 206 * scale} ${y + 330 * scale} ${x + 162 * scale} ${y + 382 * scale}" stroke="${gold}" stroke-width="${1.74 * scale}" fill="none" stroke-linecap="round"/>
    <path d="M${x + 336 * scale} ${y + 268 * scale}C${x + 408 * scale} ${y + 292 * scale} ${x + 470 * scale} ${y + 332 * scale} ${x + 520 * scale} ${y + 392 * scale}" stroke="${gold}" stroke-width="${1.74 * scale}" fill="none" stroke-linecap="round"/>
    <path d="M${x + 336 * scale} ${y + 390 * scale}C${x + 282 * scale} ${y + 446 * scale} ${x + 244 * scale} ${y + 506 * scale} ${x + 224 * scale} ${y + 572 * scale}" stroke="${teal}" stroke-width="${1.7 * scale}" fill="none" stroke-linecap="round"/>
    <path d="M${x + 336 * scale} ${y + 390 * scale}C${x + 392 * scale} ${y + 446 * scale} ${x + 434 * scale} ${y + 506 * scale} ${x + 466 * scale} ${y + 572 * scale}" stroke="${teal}" stroke-width="${1.7 * scale}" fill="none" stroke-linecap="round"/>
    <circle cx="${x + 336 * scale}" cy="${y + 268 * scale}" r="${7.2 * scale}" fill="${paper}" stroke="${gold}" stroke-width="${1.1 * scale}"/>
  `;
}

function renderPulmonaryArbor(x = 1030, y = 156, scale = 0.96) {
  return `
    <ellipse cx="${x + 214 * scale}" cy="${y + 334 * scale}" rx="${176 * scale}" ry="${256 * scale}" fill="url(#bleed-wash)" opacity="0.58"/>
    <ellipse cx="${x + 502 * scale}" cy="${y + 334 * scale}" rx="${176 * scale}" ry="${256 * scale}" fill="url(#bleed-wash)" opacity="0.58"/>
    <ellipse cx="${x + 214 * scale}" cy="${y + 338 * scale}" rx="${180 * scale}" ry="${258 * scale}" stroke="rgba(31,31,29,0.84)" stroke-width="${2.36 * scale}"/>
    <ellipse cx="${x + 502 * scale}" cy="${y + 338 * scale}" rx="${180 * scale}" ry="${258 * scale}" stroke="rgba(31,31,29,0.84)" stroke-width="${2.36 * scale}"/>
    <path d="M${x + 358 * scale} ${y + 108 * scale}V${y + 650 * scale}" stroke="${gold}" stroke-width="${1.96 * scale}" stroke-linecap="round"/>
    <path d="M${x + 358 * scale} ${y + 146 * scale}C${x + 302 * scale} ${y + 180 * scale} ${x + 256 * scale} ${y + 220 * scale} ${x + 222 * scale} ${y + 270 * scale}" stroke="${teal}" stroke-width="${1.86 * scale}" fill="none" stroke-linecap="round"/>
    <path d="M${x + 358 * scale} ${y + 146 * scale}C${x + 414 * scale} ${y + 180 * scale} ${x + 460 * scale} ${y + 220 * scale} ${x + 494 * scale} ${y + 270 * scale}" stroke="${teal}" stroke-width="${1.86 * scale}" fill="none" stroke-linecap="round"/>
    <path d="M${x + 222 * scale} ${y + 270 * scale}C${x + 174 * scale} ${y + 306 * scale} ${x + 140 * scale} ${y + 348 * scale} ${x + 120 * scale} ${y + 396 * scale}" stroke="${gold}" stroke-width="${1.7 * scale}" fill="none" stroke-linecap="round"/>
    <path d="M${x + 222 * scale} ${y + 270 * scale}C${x + 196 * scale} ${y + 328 * scale} ${x + 178 * scale} ${y + 390 * scale} ${x + 170 * scale} ${y + 460 * scale}" stroke="${gold}" stroke-width="${1.7 * scale}" fill="none" stroke-linecap="round"/>
    <path d="M${x + 494 * scale} ${y + 270 * scale}C${x + 542 * scale} ${y + 306 * scale} ${x + 576 * scale} ${y + 348 * scale} ${x + 596 * scale} ${y + 396 * scale}" stroke="${gold}" stroke-width="${1.7 * scale}" fill="none" stroke-linecap="round"/>
    <path d="M${x + 494 * scale} ${y + 270 * scale}C${x + 520 * scale} ${y + 328 * scale} ${x + 538 * scale} ${y + 390 * scale} ${x + 546 * scale} ${y + 460 * scale}" stroke="${gold}" stroke-width="${1.7 * scale}" fill="none" stroke-linecap="round"/>
    <path d="M${x + 312 * scale} ${y + 658 * scale}H${x + 404 * scale}" stroke="rgba(31,31,29,0.18)" stroke-width="${1.1 * scale}" stroke-dasharray="${6 * scale} ${10 * scale}"/>
  `;
}

function renderCathSignal(x = 1004, y = 176, scale = 0.96) {
  return `
    <path d="M${x + 28 * scale} ${y + 160 * scale}C${x + 148 * scale} ${y + 84 * scale} ${x + 294 * scale} ${y + 50 * scale} ${x + 468 * scale} ${y + 58 * scale}C${x + 628 * scale} ${y + 66 * scale} ${x + 748 * scale} ${y + 108 * scale} ${x + 828 * scale} ${y + 184 * scale}" stroke="rgba(88,126,135,0.38)" stroke-width="${2.1 * scale}" fill="none" stroke-linecap="round"/>
    <path d="M${x + 102 * scale} ${y + 314 * scale}H${x + 714 * scale}" stroke="rgba(31,31,29,0.14)" stroke-width="${1.24 * scale}" stroke-dasharray="${6 * scale} ${10 * scale}"/>
    <path d="M${x + 126 * scale} ${y + 468 * scale}H${x + 728 * scale}" stroke="rgba(31,31,29,0.14)" stroke-width="${1.24 * scale}" stroke-dasharray="${6 * scale} ${10 * scale}"/>
    <path d="M${x + 176 * scale} ${y + 612 * scale}H${x + 742 * scale}" stroke="rgba(31,31,29,0.14)" stroke-width="${1.24 * scale}" stroke-dasharray="${6 * scale} ${10 * scale}"/>
    <path d="M${x + 226 * scale} ${y + 222 * scale}C${x + 294 * scale} ${y + 180 * scale} ${x + 378 * scale} ${y + 160 * scale} ${x + 478 * scale} ${y + 166 * scale}C${x + 582 * scale} ${y + 172 * scale} ${x + 668 * scale} ${y + 208 * scale} ${x + 736 * scale} ${y + 280 * scale}" stroke="rgba(31,31,29,0.84)" stroke-width="${2.46 * scale}" fill="none" stroke-linecap="round"/>
    <path d="M${x + 486 * scale} ${y + 156 * scale}V${y + 692 * scale}" stroke="${gold}" stroke-width="${1.9 * scale}" stroke-linecap="round"/>
    <path d="M${x + 226 * scale} ${y + 640 * scale}H${x + 286 * scale}L${x + 316 * scale} ${y + 598 * scale}L${x + 352 * scale} ${y + 716 * scale}L${x + 396 * scale} ${y + 532 * scale}L${x + 426 * scale} ${y + 638 * scale}H${x + 498 * scale}" stroke="${clay}" stroke-width="${2.18 * scale}" fill="none" stroke-linecap="round" stroke-linejoin="round"/>
    <path d="M${x + 486 * scale} ${y + 250 * scale}C${x + 550 * scale} ${y + 240 * scale} ${x + 612 * scale} ${y + 262 * scale} ${x + 676 * scale} ${y + 312 * scale}" stroke="${teal}" stroke-width="${1.82 * scale}" fill="none" stroke-linecap="round"/>
    <path d="M${x + 486 * scale} ${y + 350 * scale}C${x + 430 * scale} ${y + 396 * scale} ${x + 384 * scale} ${y + 454 * scale} ${x + 350 * scale} ${y + 530 * scale}" stroke="${teal}" stroke-width="${1.82 * scale}" fill="none" stroke-linecap="round"/>
    <circle cx="${x + 316 * scale}" cy="${y + 598 * scale}" r="${7 * scale}" fill="${paper}" stroke="${clay}" stroke-width="${1.1 * scale}"/>
  `;
}

function renderNeurovascularField(x = 948, y = 122, scale = 0.92) {
  return `
    <path d="M${x + 104 * scale} ${y + 118 * scale}C${x + 192 * scale} ${y + 54 * scale} ${x + 318 * scale} ${y + 20 * scale} ${x + 482 * scale} ${y + 24 * scale}C${x + 636 * scale} ${y + 28 * scale} ${x + 752 * scale} ${y + 74 * scale} ${x + 828 * scale} ${y + 154 * scale}C${x + 900 * scale} ${y + 228 * scale} ${x + 934 * scale} ${y + 312 * scale} ${x + 930 * scale} ${y + 406 * scale}C${x + 926 * scale} ${y + 498 * scale} ${x + 894 * scale} ${y + 582 * scale} ${x + 834 * scale} ${y + 658 * scale}" fill="url(#bleed-wash)" opacity="0.82"/>
    <path d="M${x + 176 * scale} ${y + 184 * scale}C${x + 250 * scale} ${y + 130 * scale} ${x + 348 * scale} ${y + 104 * scale} ${x + 472 * scale} ${y + 106 * scale}C${x + 596 * scale} ${y + 108 * scale} ${x + 692 * scale} ${y + 142 * scale} ${x + 760 * scale} ${y + 208 * scale}C${x + 824 * scale} ${y + 270 * scale} ${x + 856 * scale} ${y + 340 * scale} ${x + 856 * scale} ${y + 418 * scale}" stroke="rgba(31,31,29,0.84)" stroke-width="${2.48 * scale}" fill="none" stroke-linecap="round"/>
    <path d="M${x + 468 * scale} ${y + 108 * scale}V${y + 742 * scale}" stroke="${gold}" stroke-width="${1.94 * scale}" stroke-linecap="round"/>
    <path d="M${x + 468 * scale} ${y + 178 * scale}C${x + 398 * scale} ${y + 218 * scale} ${x + 346 * scale} ${y + 264 * scale} ${x + 314 * scale} ${y + 318 * scale}" stroke="${teal}" stroke-width="${1.84 * scale}" fill="none" stroke-linecap="round"/>
    <path d="M${x + 468 * scale} ${y + 178 * scale}C${x + 538 * scale} ${y + 218 * scale} ${x + 592 * scale} ${y + 264 * scale} ${x + 626 * scale} ${y + 320 * scale}" stroke="${teal}" stroke-width="${1.84 * scale}" fill="none" stroke-linecap="round"/>
    <path d="M${x + 468 * scale} ${y + 292 * scale}C${x + 394 * scale} ${y + 352 * scale} ${x + 344 * scale} ${y + 418 * scale} ${x + 318 * scale} ${y + 492 * scale}" stroke="${gold}" stroke-width="${1.78 * scale}" fill="none" stroke-linecap="round"/>
    <path d="M${x + 468 * scale} ${y + 292 * scale}C${x + 542 * scale} ${y + 350 * scale} ${x + 596 * scale} ${y + 414 * scale} ${x + 626 * scale} ${y + 488 * scale}" stroke="${gold}" stroke-width="${1.78 * scale}" fill="none" stroke-linecap="round"/>
    <path d="M${x + 468 * scale} ${y + 430 * scale}C${x + 434 * scale} ${y + 486 * scale} ${x + 412 * scale} ${y + 548 * scale} ${x + 404 * scale} ${y + 616 * scale}" stroke="${teal}" stroke-width="${1.72 * scale}" fill="none" stroke-linecap="round"/>
    <path d="M${x + 468 * scale} ${y + 430 * scale}C${x + 502 * scale} ${y + 486 * scale} ${x + 526 * scale} ${y + 548 * scale} ${x + 538 * scale} ${y + 616 * scale}" stroke="${teal}" stroke-width="${1.72 * scale}" fill="none" stroke-linecap="round"/>
    <circle cx="${x + 468 * scale}" cy="${y + 292 * scale}" r="${7.2 * scale}" fill="${paper}" stroke="${gold}" stroke-width="${1.1 * scale}"/>
  `;
}

const families = [
  { key: "neural", label: "Neural canopy", object: renderNeuralCanopy },
  { key: "coronary", label: "Coronary atlas", object: renderCoronaryAtlas },
  { key: "pulmonary", label: "Pulmonary arbor", object: renderPulmonaryArbor },
  { key: "cath", label: "Cath-lab field", object: renderCathSignal },
  { key: "neurovascular", label: "Neurovascular field", object: renderNeurovascularField },
];

function frontpageConcept(id, family) {
  const titles = {
    neural: ["A calmer, more", "intelligent way", "to prepare."],
    coronary: ["Premium prep", "with clearer", "clinical signals."],
    pulmonary: ["A cleaner route", "through vents,", "oxygen, and flow."],
    cath: ["Bedside signal,", "minus the", "busywork."],
    neurovascular: ["Pattern-rich", "medical prep,", "made crisp."],
  };

  return baseSvg(`
    ${navBar()}
    ${textBlock({
      eyebrow: `${family.label} / premium medical surface`,
      title: titles[family.key],
      body: "Original questions, elite rationale, and a direct path into the right plan.",
      proof: "AI TUTOR + VISUAL RATIONALE + CLEAN CLINICAL FLOW",
    })}
    ${renderGuides()}
    ${family.object()}
    <text x="154" y="842" fill="${muted}" font-family="'DM Sans', Arial, sans-serif" font-size="14" font-weight="700" letter-spacing="4">CURRENT ANGLE</text>
    <text x="154" y="888" fill="${dark}" font-family="'Source Serif 4', Georgia, serif" font-size="38" font-weight="600">${family.label}</text>
  `);
}

function socialHeader(id, family) {
  return baseSvg(`
    <rect x="42" y="42" width="1516" height="434" rx="34" fill="rgba(255,252,247,0.88)" stroke="rgba(212,197,173,0.52)"/>
    <text x="116" y="170" fill="${dark}" font-family="'Source Serif 4', Georgia, serif" font-size="72" font-weight="600" letter-spacing="-3">ChapAI</text>
    <text x="116" y="230" fill="${muted}" font-family="'DM Sans', Arial, sans-serif" font-size="18" font-weight="700" letter-spacing="5">NCLEX + CCRN / CLEANER CLINICAL PREP</text>
    <text x="116" y="304" fill="${dark}" font-family="'DM Sans', Arial, sans-serif" font-size="50" font-weight="500" letter-spacing="-3">Original questions. Elite rationale.</text>
    <text x="116" y="362" fill="${muted}" font-family="'DM Sans', Arial, sans-serif" font-size="26">AI tutor, visual guidance, and a faster path into the right plan.</text>
    ${renderGuides()}
    ${family.object(972, 48, 0.5)}
  `, { width: 1600, height: 520 });
}

function logoFrame(inner) {
  return `<svg width="480" height="480" viewBox="0 0 480 480" fill="none" xmlns="http://www.w3.org/2000/svg">
    <rect width="480" height="480" rx="48" fill="${paper}"/>
    <rect x="36" y="36" width="408" height="408" rx="36" fill="rgba(255,252,247,0.84)" stroke="rgba(205,189,165,0.46)"/>
    ${inner}
  </svg>`;
}

function lockup(mark, descriptor) {
  return `
    <circle cx="240" cy="166" r="76" fill="rgba(255,252,247,0.96)" stroke="rgba(205,189,165,0.54)"/>
    ${mark}
    <text x="240" y="308" fill="${dark}" text-anchor="middle" font-family="'Source Serif 4', Georgia, serif" font-size="60" font-weight="600" letter-spacing="-2.4">ChapAI</text>
    <text x="240" y="350" fill="${muted}" text-anchor="middle" font-family="'DM Sans', Arial, sans-serif" font-size="14" font-weight="700" letter-spacing="4">${descriptor}</text>
  `;
}

function logoCorticalHalo(seed) {
  const accent = [teal, gold, clay, sage][seed % 4];
  return logoFrame(lockup(`
    <circle cx="240" cy="166" r="48" stroke="rgba(32,31,33,0.18)" stroke-width="1.2"/>
    <path d="M240 124C214 124 196 142 196 166C196 180 202 192 214 204" stroke="rgba(32,31,33,0.86)" stroke-width="2.2" fill="none" stroke-linecap="round"/>
    <path d="M240 124C266 124 284 142 284 166C284 180 278 192 266 204" stroke="rgba(32,31,33,0.86)" stroke-width="2.2" fill="none" stroke-linecap="round"/>
    <path d="M218 142C224 136 232 132 240 132C248 132 256 136 262 142" stroke="${accent}" stroke-width="1.7" fill="none" stroke-linecap="round"/>
    <path d="M240 166V216" stroke="${accent}" stroke-width="1.8" fill="none" stroke-linecap="round"/>
    <path d="M240 186C228 194 220 204 216 218" stroke="${accent}" stroke-width="1.5" fill="none" stroke-linecap="round"/>
    <path d="M240 186C252 194 260 204 264 218" stroke="${accent}" stroke-width="1.5" fill="none" stroke-linecap="round"/>
  `, "CORTICAL HALO"));
}

function logoCoronaryArc(seed) {
  const accent = [gold, teal, sage, clay][seed % 4];
  return logoFrame(lockup(`
    <path d="M240 120C220 94 190 82 154 86C118 90 92 112 82 148C72 184 82 224 112 268C142 312 184 352 240 390C294 352 336 312 366 270C396 228 408 188 398 150C388 114 362 92 326 88C290 84 262 96 240 120Z" transform="translate(0 -34) scale(0.84)" fill="rgba(233,220,199,0.48)"/>
    <path d="M240 124C220 100 194 90 162 94C132 98 110 120 100 152C92 186 100 222 124 258C148 294 186 330 240 366C290 332 328 296 354 258C380 220 390 188 384 160C376 132 356 110 326 102C296 94 268 102 240 124Z" transform="translate(0 -34) scale(0.84)" stroke="rgba(32,31,33,0.86)" stroke-width="2.1" fill="none" stroke-linejoin="round"/>
    <path d="M240 128V206" stroke="${accent}" stroke-width="1.8" fill="none" stroke-linecap="round"/>
    <path d="M240 152C224 144 210 144 196 152" stroke="${accent}" stroke-width="1.5" fill="none" stroke-linecap="round"/>
    <path d="M240 152C256 144 270 144 284 152" stroke="${accent}" stroke-width="1.5" fill="none" stroke-linecap="round"/>
  `, "CORONARY ARC"));
}

function logoVesselMonogram(seed) {
  const accent = [teal, clay, gold, sage][seed % 4];
  return logoFrame(lockup(`
    <path d="M284 128C266 116 246 110 224 110C188 110 158 122 134 146C110 170 98 200 98 236C98 272 110 302 134 326C158 350 188 362 224 362C246 362 266 356 284 344" stroke="rgba(32,31,33,0.88)" stroke-width="2.4" fill="none" stroke-linecap="round"/>
    <path d="M250 148C232 138 214 138 198 146" stroke="${accent}" stroke-width="1.6" fill="none" stroke-linecap="round"/>
    <path d="M250 212C228 198 208 196 190 206" stroke="${accent}" stroke-width="1.6" fill="none" stroke-linecap="round"/>
    <path d="M250 278C228 264 208 262 190 272" stroke="${accent}" stroke-width="1.6" fill="none" stroke-linecap="round"/>
    <path d="M278 112V360" stroke="rgba(32,31,33,0.24)" stroke-width="1.2" fill="none"/>
  `, "VESSEL MONOGRAM"));
}

function logoNeuralSigil(seed) {
  const accent = [gold, sage, teal, clay][seed % 4];
  return logoFrame(lockup(`
    <path d="M240 124C204 124 180 150 180 184C180 206 188 222 204 232" stroke="rgba(32,31,33,0.86)" stroke-width="2.1" fill="none" stroke-linecap="round"/>
    <path d="M240 124C276 124 300 150 300 184C300 206 292 222 276 232" stroke="rgba(32,31,33,0.86)" stroke-width="2.1" fill="none" stroke-linecap="round"/>
    <path d="M214 148C222 140 232 136 242 136C252 136 260 140 268 148" stroke="${accent}" stroke-width="1.7" fill="none" stroke-linecap="round"/>
    <path d="M240 182V220" stroke="${accent}" stroke-width="1.8" fill="none" stroke-linecap="round"/>
    <path d="M240 220C226 232 216 246 210 262" stroke="${accent}" stroke-width="1.55" fill="none" stroke-linecap="round"/>
    <path d="M240 220C254 232 264 246 270 262" stroke="${accent}" stroke-width="1.55" fill="none" stroke-linecap="round"/>
    <circle cx="240" cy="182" r="6.5" fill="${paper}" stroke="${accent}" stroke-width="1.05"/>
  `, "NEURAL SIGIL"));
}

function logoInstrumentSeal(seed) {
  const accent = [sage, gold, teal, clay][seed % 4];
  return logoFrame(lockup(`
    <circle cx="240" cy="166" r="52" stroke="rgba(32,31,33,0.22)" stroke-width="1.2"/>
    <path d="M214 148C220 138 230 132 242 132C254 132 264 138 270 148" stroke="rgba(32,31,33,0.86)" stroke-width="2" fill="none" stroke-linecap="round"/>
    <path d="M240 132V212" stroke="${accent}" stroke-width="1.8" fill="none" stroke-linecap="round"/>
    <path d="M214 190C222 200 232 206 244 206C256 206 266 200 274 188" stroke="${accent}" stroke-width="1.7" fill="none" stroke-linecap="round"/>
    <path d="M198 164H282" stroke="rgba(32,31,33,0.18)" stroke-width="1.1" fill="none"/>
  `, "INSTRUMENT SEAL"));
}

const logoFamilies = [
  logoCorticalHalo,
  logoCoronaryArc,
  logoVesselMonogram,
  logoNeuralSigil,
  logoInstrumentSeal,
];

for (let index = 0; index < 10; index += 1) {
  const family = families[index % families.length];
  const id = 921 + index;
  write(path.join(reviewDir, `frontpage-${id}.svg`), frontpageConcept(id, family));
}

for (let index = 0; index < 10; index += 1) {
  const family = families[index % families.length];
  const id = 49 + index;
  write(path.join(reviewDir, `social-header-${id}.svg`), socialHeader(id, family));
}

for (let index = 0; index < 50; index += 1) {
  const id = 901 + index;
  const family = logoFamilies[index % logoFamilies.length];
  write(path.join(brandDir, `chapai-option-${id}.svg`), family(index));
}

console.log(JSON.stringify({ ok: true, frontpages: "921-930", headers: "49-58", logos: "901-950" }));
