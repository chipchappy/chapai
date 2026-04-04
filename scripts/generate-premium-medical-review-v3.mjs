import fs from "node:fs";
import path from "node:path";

const root = "C:/Users/Chapman/Desktop/ai/chapai";
const brandDir = path.join(root, "apps/web/public/brand/options");
const reviewDir = path.join(root, "apps/web/public/design-review");

fs.mkdirSync(brandDir, { recursive: true });
fs.mkdirSync(reviewDir, { recursive: true });

const paper = "#FBF7F0";
const sand = "#F3EBDD";
const wash = "#EADBC6";
const dark = "#201F21";
const muted = "#7A7064";
const teal = "#567C85";
const gold = "#C49758";
const clay = "#AD7E65";
const sage = "#7F8F79";

const families = [
  { key: "neural", label: "Neural veil", accent: teal, secondary: gold },
  { key: "coronary", label: "Coronary lattice", accent: gold, secondary: teal },
  { key: "bronchial", label: "Bronchial sweep", accent: sage, secondary: gold },
  { key: "cath", label: "Cath-lab cadence", accent: clay, secondary: teal },
];

function write(filePath, contents) {
  fs.writeFileSync(filePath, contents, "utf8");
}

function baseSvg(inner, { width = 1600, height = 960 } = {}) {
  return `<svg width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" fill="none" xmlns="http://www.w3.org/2000/svg">
  <rect width="${width}" height="${height}" fill="${paper}"/>
  <defs>
    <radialGradient id="page-wash" cx="0" cy="0" r="1" gradientUnits="userSpaceOnUse" gradientTransform="translate(${width * 0.76} ${height * 0.36}) rotate(90) scale(${height * 0.42} ${height * 0.42})">
      <stop offset="0" stop-color="#fffdf8"/>
      <stop offset="0.62" stop-color="${sand}"/>
      <stop offset="1" stop-color="${sand}"/>
    </radialGradient>
    <radialGradient id="medical-bleed" cx="0" cy="0" r="1" gradientUnits="userSpaceOnUse" gradientTransform="translate(${width * 0.74} ${height * 0.34}) rotate(90) scale(${height * 0.28} ${height * 0.28})">
      <stop offset="0" stop-color="rgba(255,253,248,0.96)"/>
      <stop offset="0.58" stop-color="rgba(233,220,199,0.52)"/>
      <stop offset="1" stop-color="rgba(233,220,199,0)"/>
    </radialGradient>
  </defs>
  <rect x="26" y="26" width="${width - 52}" height="${height - 52}" rx="28" fill="url(#page-wash)" stroke="rgba(199,184,160,0.36)"/>
  ${inner}
</svg>`;
}

function navBar() {
  return `
    <rect x="110" y="70" width="1380" height="82" rx="41" fill="rgba(255,252,247,0.84)" stroke="rgba(212,197,173,0.52)"/>
    <text x="184" y="120" fill="${dark}" font-family="'Source Serif 4', Georgia, serif" font-size="38" font-weight="600" letter-spacing="-2">ChapAI</text>
    <text x="1110" y="120" fill="${muted}" font-family="'DM Sans', Arial, sans-serif" font-size="20" font-weight="600">CCRN</text>
    <text x="1192" y="120" fill="${muted}" font-family="'DM Sans', Arial, sans-serif" font-size="20" font-weight="600">NCLEX</text>
    <text x="1286" y="120" fill="${muted}" font-family="'DM Sans', Arial, sans-serif" font-size="20" font-weight="600">PLANS</text>
    <rect x="1348" y="90" width="114" height="44" rx="22" fill="rgba(255,250,243,0.96)" stroke="rgba(212,197,173,0.54)"/>
    <text x="1384" y="118" fill="${dark}" font-family="'DM Sans', Arial, sans-serif" font-size="20" font-weight="700">SPRINT</text>
  `;
}

function textBlock({ eyebrow, title, body }) {
  return `
    <text x="154" y="190" fill="${muted}" font-family="'DM Sans', Arial, sans-serif" font-size="15" font-weight="700" letter-spacing="5">${eyebrow.toUpperCase()}</text>
    <text x="154" y="280" fill="${dark}" font-family="'DM Sans', Arial, sans-serif" font-size="94" font-weight="500" letter-spacing="-7">${title[0]}</text>
    <text x="154" y="370" fill="${dark}" font-family="'DM Sans', Arial, sans-serif" font-size="94" font-weight="500" letter-spacing="-7">${title[1]}</text>
    <text x="154" y="460" fill="${dark}" font-family="'DM Sans', Arial, sans-serif" font-size="94" font-weight="500" letter-spacing="-7">${title[2]}</text>
    <text x="154" y="548" fill="${muted}" font-family="'DM Sans', Arial, sans-serif" font-size="30">${body}</text>
    <rect x="154" y="612" width="228" height="64" rx="32" fill="${teal}"/>
    <text x="194" y="652" fill="#fff" font-family="'DM Sans', Arial, sans-serif" font-size="25" font-weight="700">Start the $10 sprint</text>
    <rect x="402" y="612" width="196" height="64" rx="32" fill="rgba(255,252,247,0.88)" stroke="rgba(194,178,154,0.62)"/>
    <text x="452" y="652" fill="${dark}" font-family="'DM Sans', Arial, sans-serif" font-size="24" font-weight="600">See plans</text>
  `;
}

function renderNeuralVeil(x = 930, y = 132, scale = 1, accent = teal, secondary = gold) {
  return `
    <path d="M${x + 52 * scale} ${y + 92 * scale}C${x + 148 * scale} ${y + 36 * scale} ${x + 278 * scale} ${y + 6 * scale} ${x + 442 * scale} ${y + 10 * scale}C${x + 586 * scale} ${y + 14 * scale} ${x + 696 * scale} ${y + 58 * scale} ${x + 770 * scale} ${y + 142 * scale}C${x + 840 * scale} ${y + 222 * scale} ${x + 874 * scale} ${y + 322 * scale} ${x + 868 * scale} ${y + 442 * scale}C${x + 862 * scale} ${y + 560 * scale} ${x + 822 * scale} ${y + 658 * scale} ${x + 748 * scale} ${y + 734 * scale}C${x + 674 * scale} ${y + 808 * scale} ${x + 586 * scale} ${y + 852 * scale} ${x + 484 * scale} ${y + 866 * scale}C${x + 384 * scale} ${y + 880 * scale} ${x + 292 * scale} ${y + 868 * scale} ${x + 206 * scale} ${y + 826 * scale}C${x + 120 * scale} ${y + 784 * scale} ${x + 54 * scale} ${y + 720 * scale} ${x + 8 * scale} ${y + 632 * scale}C${x - 38 * scale} ${y + 544 * scale} ${x - 54 * scale} ${y + 444 * scale} ${x - 40 * scale} ${y + 332 * scale}C${x - 28 * scale} ${y + 220 * scale} ${x + 2 * scale} ${y + 140 * scale} ${x + 52 * scale} ${y + 92 * scale}Z" fill="url(#medical-bleed)" opacity="0.9"/>
    <path d="M${x + 76 * scale} ${y + 118 * scale}C${x + 170 * scale} ${y + 70 * scale} ${x + 290 * scale} ${y + 46 * scale} ${x + 438 * scale} ${y + 50 * scale}C${x + 574 * scale} ${y + 54 * scale} ${x + 678 * scale} ${y + 96 * scale} ${x + 748 * scale} ${y + 174 * scale}C${x + 814 * scale} ${y + 248 * scale} ${x + 846 * scale} ${y + 340 * scale} ${x + 840 * scale} ${y + 450 * scale}C${x + 834 * scale} ${y + 560 * scale} ${x + 796 * scale} ${y + 652 * scale} ${x + 726 * scale} ${y + 722 * scale}C${x + 656 * scale} ${y + 792 * scale} ${x + 572 * scale} ${y + 834 * scale} ${x + 474 * scale} ${y + 850 * scale}" stroke="rgba(31,31,29,0.84)" stroke-width="${2.6 * scale}" fill="none" stroke-linecap="round" stroke-linejoin="round"/>
    <path d="M${x + 114 * scale} ${y + 184 * scale}C${x + 166 * scale} ${y + 146 * scale} ${x + 224 * scale} ${y + 126 * scale} ${x + 286 * scale} ${y + 124 * scale}C${x + 358 * scale} ${y + 122 * scale} ${x + 420 * scale} ${y + 144 * scale} ${x + 472 * scale} ${y + 190 * scale}" stroke="rgba(31,31,29,0.78)" stroke-width="${2.2 * scale}" fill="none" stroke-linecap="round"/>
    <path d="M${x + 190 * scale} ${y + 284 * scale}C${x + 234 * scale} ${y + 246 * scale} ${x + 286 * scale} ${y + 228 * scale} ${x + 346 * scale} ${y + 230 * scale}C${x + 412 * scale} ${y + 232 * scale} ${x + 468 * scale} ${y + 258 * scale} ${x + 514 * scale} ${y + 308 * scale}" stroke="rgba(31,31,29,0.76)" stroke-width="${2.1 * scale}" fill="none" stroke-linecap="round"/>
    <path d="M${x + 306 * scale} ${y + 382 * scale}C${x + 256 * scale} ${y + 438 * scale} ${x + 224 * scale} ${y + 498 * scale} ${x + 210 * scale} ${y + 562 * scale}" stroke="${accent}" stroke-width="${1.85 * scale}" fill="none" stroke-linecap="round"/>
    <path d="M${x + 360 * scale} ${y + 400 * scale}C${x + 374 * scale} ${y + 458 * scale} ${x + 404 * scale} ${y + 516 * scale} ${x + 452 * scale} ${y + 574 * scale}" stroke="${secondary}" stroke-width="${1.85 * scale}" fill="none" stroke-linecap="round"/>
    <path d="M${x + 486 * scale} ${y + 428 * scale}C${x + 528 * scale} ${y + 388 * scale} ${x + 578 * scale} ${y + 364 * scale} ${x + 634 * scale} ${y + 354 * scale}C${x + 700 * scale} ${y + 342 * scale} ${x + 756 * scale} ${y + 350 * scale} ${x + 804 * scale} ${y + 378 * scale}" stroke="${accent}" stroke-width="${1.95 * scale}" fill="none" stroke-linecap="round"/>
    <path d="M${x + 354 * scale} ${y + 430 * scale}C${x + 358 * scale} ${y + 560 * scale} ${x + 378 * scale} ${y + 674 * scale} ${x + 416 * scale} ${y + 772 * scale}" stroke="${secondary}" stroke-width="${2 * scale}" fill="none" stroke-linecap="round"/>
    <path d="M${x + 366 * scale} ${y + 520 * scale}C${x + 328 * scale} ${y + 566 * scale} ${x + 298 * scale} ${y + 620 * scale} ${x + 278 * scale} ${y + 682 * scale}" stroke="${accent}" stroke-width="${1.7 * scale}" fill="none" stroke-linecap="round"/>
    <path d="M${x + 398 * scale} ${y + 534 * scale}C${x + 444 * scale} ${y + 572 * scale} ${x + 486 * scale} ${y + 622 * scale} ${x + 522 * scale} ${y + 686 * scale}" stroke="${accent}" stroke-width="${1.7 * scale}" fill="none" stroke-linecap="round"/>
    <circle cx="${x + 366 * scale}" cy="${y + 520 * scale}" r="${7 * scale}" fill="${paper}" stroke="${secondary}" stroke-width="${1.2 * scale}"/>
  `;
}

function renderCoronaryLattice(x = 1000, y = 172, scale = 1, accent = gold, secondary = teal) {
  return `
    <path d="M${x + 252 * scale} ${y + 98 * scale}C${x + 210 * scale} ${y + 34 * scale} ${x + 148 * scale} ${y + 2 * scale} ${x + 76 * scale} ${y + 8 * scale}C${x + 6 * scale} ${y + 14 * scale} ${x - 46 * scale} ${y + 58 * scale} ${x - 76 * scale} ${y + 126 * scale}C${x - 104 * scale} ${y + 190 * scale} ${x - 104 * scale} ${y + 260 * scale} ${x - 80 * scale} ${y + 336 * scale}C${x - 54 * scale} ${y + 414 * scale} ${x - 2 * scale} ${y + 486 * scale} ${x + 80 * scale} ${y + 554 * scale}C${x + 162 * scale} ${y + 622 * scale} ${x + 236 * scale} ${y + 680 * scale} ${x + 300 * scale} ${y + 726 * scale}C${x + 358 * scale} ${y + 690 * scale} ${x + 432 * scale} ${y + 636 * scale} ${x + 520 * scale} ${y + 562 * scale}C${x + 610 * scale} ${y + 488 * scale} ${x + 668 * scale} ${y + 414 * scale} ${x + 694 * scale} ${y + 340 * scale}C${x + 722 * scale} ${y + 264 * scale} ${x + 720 * scale} ${y + 196 * scale} ${x + 690 * scale} ${y + 136 * scale}C${x + 656 * scale} ${y + 74 * scale} ${x + 596 * scale} ${y + 32 * scale} ${x + 510 * scale} ${y + 18 * scale}C${x + 426 * scale} ${y + 4 * scale} ${x + 340 * scale} ${y + 30 * scale} ${x + 252 * scale} ${y + 98 * scale}Z" fill="url(#medical-bleed)" opacity="0.88"/>
    <path d="M${x + 252 * scale} ${y + 120 * scale}C${x + 210 * scale} ${y + 70 * scale} ${x + 158 * scale} ${y + 48 * scale} ${x + 98 * scale} ${y + 54 * scale}C${x + 40 * scale} ${y + 60 * scale} ${x - 4 * scale} ${y + 96 * scale} ${x - 28 * scale} ${y + 150 * scale}C${x - 50 * scale} ${y + 206 * scale} ${x - 50 * scale} ${y + 268 * scale} ${x - 28 * scale} ${y + 336 * scale}C${x - 6 * scale} ${y + 404 * scale} ${x + 42 * scale} ${y + 470 * scale} ${x + 118 * scale} ${y + 530 * scale}C${x + 194 * scale} ${y + 590 * scale} ${x + 254 * scale} ${y + 638 * scale} ${x + 298 * scale} ${y + 676 * scale}C${x + 346 * scale} ${y + 646 * scale} ${x + 406 * scale} ${y + 596 * scale} ${x + 478 * scale} ${y + 526 * scale}C${x + 550 * scale} ${y + 456 * scale} ${x + 594 * scale} ${y + 390 * scale} ${x + 614 * scale} ${y + 330 * scale}C${x + 634 * scale} ${y + 268 * scale} ${x + 632 * scale} ${y + 210 * scale} ${x + 606 * scale} ${y + 156 * scale}C${x + 578 * scale} ${y + 102 * scale} ${x + 528 * scale} ${y + 64 * scale} ${x + 458 * scale} ${y + 54 * scale}C${x + 388 * scale} ${y + 44 * scale} ${x + 322 * scale} ${y + 66 * scale} ${x + 252 * scale} ${y + 120 * scale}Z" stroke="rgba(31,31,29,0.86)" stroke-width="${2.5 * scale}" fill="none" stroke-linejoin="round"/>
    <path d="M${x + 300 * scale} ${y + 144 * scale}V${y + 574 * scale}" stroke="${secondary}" stroke-width="${2.1 * scale}" stroke-linecap="round"/>
    <path d="M${x + 300 * scale} ${y + 180 * scale}C${x + 256 * scale} ${y + 156 * scale} ${x + 220 * scale} ${y + 156 * scale} ${x + 188 * scale} ${y + 174 * scale}" stroke="${accent}" stroke-width="${1.8 * scale}" stroke-linecap="round"/>
    <path d="M${x + 300 * scale} ${y + 180 * scale}C${x + 346 * scale} ${y + 156 * scale} ${x + 386 * scale} ${y + 154 * scale} ${x + 424 * scale} ${y + 170 * scale}" stroke="${accent}" stroke-width="${1.8 * scale}" stroke-linecap="round"/>
    <path d="M${x + 300 * scale} ${y + 258 * scale}C${x + 236 * scale} ${y + 274 * scale} ${x + 182 * scale} ${y + 306 * scale} ${x + 136 * scale} ${y + 356 * scale}" stroke="${secondary}" stroke-width="${1.8 * scale}" stroke-linecap="round"/>
    <path d="M${x + 300 * scale} ${y + 258 * scale}C${x + 362 * scale} ${y + 278 * scale} ${x + 416 * scale} ${y + 310 * scale} ${x + 464 * scale} ${y + 362 * scale}" stroke="${secondary}" stroke-width="${1.8 * scale}" stroke-linecap="round"/>
    <path d="M${x + 300 * scale} ${y + 370 * scale}C${x + 252 * scale} ${y + 418 * scale} ${x + 218 * scale} ${y + 474 * scale} ${x + 200 * scale} ${y + 540 * scale}" stroke="${accent}" stroke-width="${1.8 * scale}" stroke-linecap="round"/>
    <path d="M${x + 300 * scale} ${y + 370 * scale}C${x + 350 * scale} ${y + 420 * scale} ${x + 392 * scale} ${y + 474 * scale} ${x + 426 * scale} ${y + 540 * scale}" stroke="${accent}" stroke-width="${1.8 * scale}" stroke-linecap="round"/>
    <circle cx="${x + 300 * scale}" cy="${y + 258 * scale}" r="${8 * scale}" fill="${paper}" stroke="${secondary}" stroke-width="${1.2 * scale}"/>
  `;
}

function renderBronchialSweep(x = 1030, y = 146, scale = 1, accent = sage, secondary = gold) {
  return `
    <ellipse cx="${x + 208 * scale}" cy="${y + 322 * scale}" rx="${176 * scale}" ry="${252 * scale}" fill="url(#medical-bleed)" opacity="0.6"/>
    <ellipse cx="${x + 488 * scale}" cy="${y + 322 * scale}" rx="${176 * scale}" ry="${252 * scale}" fill="url(#medical-bleed)" opacity="0.6"/>
    <ellipse cx="${x + 208 * scale}" cy="${y + 330 * scale}" rx="${180 * scale}" ry="${256 * scale}" stroke="rgba(31,31,29,0.84)" stroke-width="${2.4 * scale}"/>
    <ellipse cx="${x + 488 * scale}" cy="${y + 330 * scale}" rx="${180 * scale}" ry="${256 * scale}" stroke="rgba(31,31,29,0.84)" stroke-width="${2.4 * scale}"/>
    <path d="M${x + 348 * scale} ${y + 74 * scale}V${y + 618 * scale}" stroke="${secondary}" stroke-width="${2.1 * scale}" stroke-linecap="round"/>
    <path d="M${x + 348 * scale} ${y + 130 * scale}C${x + 300 * scale} ${y + 160 * scale} ${x + 264 * scale} ${y + 196 * scale} ${x + 238 * scale} ${y + 242 * scale}" stroke="${accent}" stroke-width="${2 * scale}" stroke-linecap="round"/>
    <path d="M${x + 348 * scale} ${y + 130 * scale}C${x + 396 * scale} ${y + 160 * scale} ${x + 432 * scale} ${y + 196 * scale} ${x + 458 * scale} ${y + 242 * scale}" stroke="${accent}" stroke-width="${2 * scale}" stroke-linecap="round"/>
    <path d="M${x + 238 * scale} ${y + 242 * scale}C${x + 190 * scale} ${y + 268 * scale} ${x + 152 * scale} ${y + 302 * scale} ${x + 124 * scale} ${y + 346 * scale}" stroke="${secondary}" stroke-width="${1.8 * scale}" stroke-linecap="round"/>
    <path d="M${x + 238 * scale} ${y + 242 * scale}C${x + 210 * scale} ${y + 296 * scale} ${x + 188 * scale} ${y + 356 * scale} ${x + 176 * scale} ${y + 422 * scale}" stroke="${secondary}" stroke-width="${1.8 * scale}" stroke-linecap="round"/>
    <path d="M${x + 458 * scale} ${y + 242 * scale}C${x + 506 * scale} ${y + 268 * scale} ${x + 544 * scale} ${y + 302 * scale} ${x + 572 * scale} ${y + 346 * scale}" stroke="${secondary}" stroke-width="${1.8 * scale}" stroke-linecap="round"/>
    <path d="M${x + 458 * scale} ${y + 242 * scale}C${x + 486 * scale} ${y + 296 * scale} ${x + 508 * scale} ${y + 356 * scale} ${x + 520 * scale} ${y + 422 * scale}" stroke="${secondary}" stroke-width="${1.8 * scale}" stroke-linecap="round"/>
    <path d="M${x + 348 * scale} ${y + 236 * scale}C${x + 318 * scale} ${y + 322 * scale} ${x + 306 * scale} ${y + 416 * scale} ${x + 312 * scale} ${y + 518 * scale}" stroke="rgba(31,31,29,0.66)" stroke-width="${1.9 * scale}" stroke-linecap="round"/>
    <path d="M${x + 348 * scale} ${y + 236 * scale}C${x + 378 * scale} ${y + 322 * scale} ${x + 390 * scale} ${y + 416 * scale} ${x + 384 * scale} ${y + 518 * scale}" stroke="rgba(31,31,29,0.66)" stroke-width="${1.9 * scale}" stroke-linecap="round"/>
  `;
}

function renderCathCadence(x = 980, y = 170, scale = 1, accent = clay, secondary = teal) {
  return `
    <path d="M${x + 40 * scale} ${y + 156 * scale}C${x + 154 * scale} ${y + 82 * scale} ${x + 286 * scale} ${y + 46 * scale} ${x + 438 * scale} ${y + 48 * scale}C${x + 590 * scale} ${y + 50 * scale} ${x + 712 * scale} ${y + 90 * scale} ${x + 804 * scale} ${y + 170 * scale}" stroke="rgba(86,124,133,0.42)" stroke-width="${2.2 * scale}" fill="none" stroke-linecap="round"/>
    <path d="M${x + 96 * scale} ${y + 282 * scale}H${x + 626 * scale}" stroke="rgba(31,31,29,0.16)" stroke-width="${1.4 * scale}" stroke-dasharray="${6 * scale} ${10 * scale}"/>
    <path d="M${x + 84 * scale} ${y + 420 * scale}H${x + 660 * scale}" stroke="rgba(31,31,29,0.16)" stroke-width="${1.4 * scale}" stroke-dasharray="${6 * scale} ${10 * scale}"/>
    <path d="M${x + 114 * scale} ${y + 558 * scale}H${x + 698 * scale}" stroke="rgba(31,31,29,0.16)" stroke-width="${1.4 * scale}" stroke-dasharray="${6 * scale} ${10 * scale}"/>
    <path d="M${x + 186 * scale} ${y + 238 * scale}C${x + 246 * scale} ${y + 196 * scale} ${x + 316 * scale} ${y + 174 * scale} ${x + 398 * scale} ${y + 174 * scale}C${x + 482 * scale} ${y + 174 * scale} ${x + 554 * scale} ${y + 204 * scale} ${x + 614 * scale} ${y + 264 * scale}C${x + 674 * scale} ${y + 324 * scale} ${x + 704 * scale} ${y + 402 * scale} ${x + 704 * scale} ${y + 500 * scale}C${x + 704 * scale} ${y + 604 * scale} ${x + 670 * scale} ${y + 690 * scale} ${x + 602 * scale} ${y + 758 * scale}C${x + 534 * scale} ${y + 826 * scale} ${x + 452 * scale} ${y + 864 * scale} ${x + 354 * scale} ${y + 872 * scale}" stroke="rgba(31,31,29,0.84)" stroke-width="${2.5 * scale}" fill="none" stroke-linecap="round" stroke-linejoin="round"/>
    <path d="M${x + 396 * scale} ${y + 160 * scale}V${y + 776 * scale}" stroke="${accent}" stroke-width="${1.9 * scale}" stroke-linecap="round"/>
    <path d="M${x + 196 * scale} ${y + 622 * scale}H${x + 250 * scale}L${x + 278 * scale} ${y + 576 * scale}L${x + 314 * scale} ${y + 702 * scale}L${x + 360 * scale} ${y + 494 * scale}L${x + 392 * scale} ${y + 622 * scale}H${x + 452 * scale}" stroke="${accent}" stroke-width="${2.2 * scale}" fill="none" stroke-linecap="round" stroke-linejoin="round"/>
    <path d="M${x + 396 * scale} ${y + 238 * scale}C${x + 456 * scale} ${y + 226 * scale} ${x + 516 * scale} ${y + 244 * scale} ${x + 574 * scale} ${y + 294 * scale}" stroke="${secondary}" stroke-width="${1.9 * scale}" fill="none" stroke-linecap="round"/>
    <path d="M${x + 396 * scale} ${y + 328 * scale}C${x + 344 * scale} ${y + 372 * scale} ${x + 306 * scale} ${y + 426 * scale} ${x + 282 * scale} ${y + 490 * scale}" stroke="${secondary}" stroke-width="${1.9 * scale}" fill="none" stroke-linecap="round"/>
    <circle cx="${x + 278 * scale}" cy="${y + 576 * scale}" r="${7 * scale}" fill="${paper}" stroke="${accent}" stroke-width="${1.2 * scale}"/>
  `;
}

function renderMedicalObject(family, x, y, scale) {
  if (family.key === "coronary") {
    return renderCoronaryLattice(x, y, scale, family.accent, family.secondary);
  }
  if (family.key === "bronchial") {
    return renderBronchialSweep(x, y, scale, family.accent, family.secondary);
  }
  if (family.key === "cath") {
    return renderCathCadence(x, y, scale, family.accent, family.secondary);
  }
  return renderNeuralVeil(x, y, scale, family.accent, family.secondary);
}

function frontpageConcept(id, family) {
  const titles = {
    neural: ["A calmer, more", "intelligent way", "to prepare."],
    coronary: ["Premium prep.", "Sharper bedside", "moves."],
    bronchial: ["Respiratory, perfusion,", "and priority", "made cleaner."],
    cath: ["Clinical signal", "without the", "clutter."],
  };

  return baseSvg(`
    ${navBar()}
    ${textBlock({
      eyebrow: `${family.label} / premium medical surface`,
      title: titles[family.key],
      body: "Original questions, elite rationale, and a cleaner route into the right plan.",
    })}
    <text x="154" y="744" fill="${muted}" font-family="'DM Sans', Arial, sans-serif" font-size="14" font-weight="700" letter-spacing="4">AI TUTOR + VISUAL RATIONALE + CLEANER CLINICAL FLOW</text>
    <path d="M154 770H640" stroke="rgba(212,197,173,0.62)"/>
    <text x="154" y="842" fill="${muted}" font-family="'DM Sans', Arial, sans-serif" font-size="14" font-weight="700" letter-spacing="4">ANGLE</text>
    <text x="154" y="886" fill="${dark}" font-family="'Source Serif 4', Georgia, serif" font-size="38" font-weight="600">${family.label}</text>
    ${renderMedicalObject(family, 880, 108, 0.88)}
  `);
}

function socialHeader(id, family) {
  return baseSvg(`
    <rect x="42" y="42" width="1516" height="434" rx="34" fill="rgba(255,252,247,0.88)" stroke="rgba(212,197,173,0.52)"/>
    <text x="116" y="174" fill="${dark}" font-family="'Source Serif 4', Georgia, serif" font-size="72" font-weight="600" letter-spacing="-3">ChapAI</text>
    <text x="116" y="234" fill="${muted}" font-family="'DM Sans', Arial, sans-serif" font-size="18" font-weight="700" letter-spacing="5">NCLEX + CCRN / CLEANER CLINICAL PREP</text>
    <text x="116" y="312" fill="${dark}" font-family="'DM Sans', Arial, sans-serif" font-size="50" font-weight="500" letter-spacing="-3">Original questions. Elite rationale.</text>
    <text x="116" y="368" fill="${muted}" font-family="'DM Sans', Arial, sans-serif" font-size="26">AI tutor, visual guidance, and a faster path into the right plan.</text>
    ${renderMedicalObject(family, 930, 64, 0.54)}
  `, { width: 1600, height: 520 });
}

function logoFrame(inner) {
  return `<svg width="480" height="480" viewBox="0 0 480 480" fill="none" xmlns="http://www.w3.org/2000/svg">
    <rect width="480" height="480" rx="48" fill="${paper}"/>
    <rect x="36" y="36" width="408" height="408" rx="36" fill="rgba(255,252,247,0.84)" stroke="rgba(205,189,165,0.46)"/>
    ${inner}
  </svg>`;
}

function wordLockup(mark, descriptor) {
  return `
    <circle cx="240" cy="164" r="76" fill="rgba(255,252,247,0.96)" stroke="rgba(205,189,165,0.54)"/>
    ${mark}
    <text x="240" y="308" fill="${dark}" text-anchor="middle" font-family="'Source Serif 4', Georgia, serif" font-size="62" font-weight="600" letter-spacing="-2.6">ChapAI</text>
    <text x="240" y="350" fill="${muted}" text-anchor="middle" font-family="'DM Sans', Arial, sans-serif" font-size="14" font-weight="700" letter-spacing="4">${descriptor}</text>
  `;
}

function logoNeuralLockup(seed) {
  const accent = [teal, gold, clay, sage][seed % 4];
  return logoFrame(wordLockup(`
    <path d="M240 108C278 108 308 120 332 144C356 168 368 196 368 228C368 264 356 294 332 318C308 342 276 354 236 354C198 354 168 342 146 318C124 294 114 264 116 228C118 198 130 170 152 146C174 122 204 110 240 108Z" stroke="rgba(32,31,33,0.88)" stroke-width="2.4" fill="none"/>
    <path d="M194 154C214 140 238 134 266 136C294 138 316 150 332 172" stroke="${accent}" stroke-width="1.8" stroke-linecap="round"/>
    <path d="M178 218C204 198 234 188 268 190C304 192 334 208 356 238" stroke="rgba(32,31,33,0.58)" stroke-width="1.7" stroke-linecap="round"/>
    <path d="M240 196V274" stroke="${accent}" stroke-width="2" stroke-linecap="round"/>
    <path d="M240 274C226 296 214 320 204 346" stroke="${accent}" stroke-width="1.7" stroke-linecap="round"/>
    <path d="M240 274C256 296 270 320 282 346" stroke="${accent}" stroke-width="1.7" stroke-linecap="round"/>
    <circle cx="240" cy="196" r="7" fill="${paper}" stroke="${accent}" stroke-width="1.1"/>
  `, "NEURAL CLINICAL SYSTEM"));
}

function logoCoronaryLockup(seed) {
  const accent = [gold, teal, clay, sage][seed % 4];
  return logoFrame(wordLockup(`
    <path d="M240 126C214 96 178 82 134 86C92 90 64 114 54 160C44 206 54 254 84 306C114 358 166 406 240 450C308 410 360 360 392 302C424 244 436 194 426 152C416 110 388 88 344 86C300 84 266 98 240 126Z" transform="translate(0 -58) scale(0.9)" fill="rgba(233,220,199,0.48)"/>
    <path d="M240 130C216 102 184 90 144 94C106 98 80 122 68 166C58 208 66 252 94 298C122 344 172 392 240 434C304 394 352 346 382 290C412 234 422 190 414 158C404 126 380 104 342 100C302 96 268 106 240 130Z" transform="translate(0 -54) scale(0.9)" stroke="rgba(32,31,33,0.88)" stroke-width="2.4" fill="none"/>
    <path d="M240 138V240" stroke="${accent}" stroke-width="2" stroke-linecap="round"/>
    <path d="M240 168C220 158 202 158 186 168" stroke="${accent}" stroke-width="1.7" stroke-linecap="round"/>
    <path d="M240 168C260 158 278 158 294 168" stroke="${accent}" stroke-width="1.7" stroke-linecap="round"/>
  `, "CORONARY PREP MARK"));
}

function logoPulmonaryLockup(seed) {
  const accent = [sage, teal, gold, clay][seed % 4];
  return logoFrame(wordLockup(`
    <ellipse cx="204" cy="172" rx="44" ry="64" stroke="rgba(32,31,33,0.88)" stroke-width="2.2"/>
    <ellipse cx="276" cy="172" rx="44" ry="64" stroke="rgba(32,31,33,0.88)" stroke-width="2.2"/>
    <path d="M240 112V246" stroke="${accent}" stroke-width="2.1" stroke-linecap="round"/>
    <path d="M240 136C226 148 214 162 206 178" stroke="${accent}" stroke-width="1.7" stroke-linecap="round"/>
    <path d="M240 136C254 148 266 162 274 178" stroke="${accent}" stroke-width="1.7" stroke-linecap="round"/>
    <path d="M206 178C194 188 184 202 176 220" stroke="rgba(32,31,33,0.54)" stroke-width="1.6" stroke-linecap="round"/>
    <path d="M274 178C286 188 296 202 304 220" stroke="rgba(32,31,33,0.54)" stroke-width="1.6" stroke-linecap="round"/>
  `, "PULMONARY STUDY MARK"));
}

function logoSignalLockup(seed) {
  const accent = [clay, teal, gold, sage][seed % 4];
  return logoFrame(wordLockup(`
    <rect x="170" y="122" width="140" height="84" rx="18" stroke="rgba(32,31,33,0.2)" stroke-width="1.2"/>
    <path d="M176 170H204L218 146L238 214L262 126L282 170H304" stroke="rgba(32,31,33,0.88)" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"/>
    <path d="M240 112V232" stroke="${accent}" stroke-width="1.8" stroke-linecap="round"/>
    <circle cx="218" cy="146" r="6.5" fill="${paper}" stroke="${accent}" stroke-width="1.1"/>
  `, "CLINICAL SIGNAL MARK"));
}

function logoSealLockup(seed) {
  const accent = [teal, gold, sage, clay][seed % 4];
  return logoFrame(wordLockup(`
    <circle cx="240" cy="164" r="52" stroke="rgba(32,31,33,0.2)" stroke-width="1.3"/>
    <path d="M206 140C218 128 232 122 248 122C264 122 278 128 290 140" stroke="rgba(32,31,33,0.88)" stroke-width="2.2" stroke-linecap="round"/>
    <path d="M240 124V204" stroke="${accent}" stroke-width="2" stroke-linecap="round"/>
    <path d="M212 182C224 196 238 202 254 202C270 202 284 194 296 178" stroke="${accent}" stroke-width="1.8" stroke-linecap="round"/>
  `, "INSTRUMENT GRADE"));
}

const logoFamilies = [
  logoNeuralLockup,
  logoCoronaryLockup,
  logoPulmonaryLockup,
  logoSignalLockup,
  logoSealLockup,
];

for (let index = 0; index < 10; index += 1) {
  const family = families[index % families.length];
  const fileId = 911 + index;
  write(path.join(reviewDir, `frontpage-${fileId}.svg`), frontpageConcept(fileId, family));
}

for (let index = 0; index < 10; index += 1) {
  const family = families[index % families.length];
  const fileId = 39 + index;
  write(path.join(reviewDir, `social-header-${fileId}.svg`), socialHeader(fileId, family));
}

for (let index = 0; index < 50; index += 1) {
  const fileId = 851 + index;
  const family = logoFamilies[index % logoFamilies.length];
  write(path.join(brandDir, `chapai-option-${fileId}.svg`), family(index));
}

console.log(JSON.stringify({ ok: true, frontpages: "911-920", headers: "39-48", logos: "851-900" }));
