import fs from "node:fs";
import path from "node:path";

const root = "C:/Users/Chapman/Desktop/ai/chapai";
const brandDir = path.join(root, "apps/web/public/brand/options");
const reviewDir = path.join(root, "apps/web/public/design-review");

fs.mkdirSync(brandDir, { recursive: true });
fs.mkdirSync(reviewDir, { recursive: true });

const paper = "#FBF7F0";
const sand = "#F4EEE3";
const wash = "#EEE2D1";
const dark = "#201F21";
const muted = "#7D705F";
const teal = "#567C85";
const gold = "#C49758";
const clay = "#A87763";
const sage = "#7F8F79";

const motifs = [
  { key: "brain", label: "Neural canopy", accent: teal, secondary: gold },
  { key: "heart", label: "Coronary atlas", accent: gold, secondary: teal },
  { key: "lungs", label: "Pulmonary arbor", accent: sage, secondary: gold },
  { key: "cath", label: "Cath-lab field", accent: clay, secondary: teal },
];

function write(filePath, contents) {
  fs.writeFileSync(filePath, contents, "utf8");
}

function baseSvg(inner, { width = 1600, height = 960 } = {}) {
  return `<svg width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" fill="none" xmlns="http://www.w3.org/2000/svg">
  <rect width="${width}" height="${height}" fill="${paper}"/>
  <rect x="26" y="26" width="${width - 52}" height="${height - 52}" rx="28" fill="url(#page-wash)" stroke="rgba(195,178,154,0.36)"/>
  <defs>
    <radialGradient id="page-wash" cx="0" cy="0" r="1" gradientUnits="userSpaceOnUse" gradientTransform="translate(${width * 0.68} ${height * 0.32}) rotate(90) scale(${height * 0.48} ${height * 0.48})">
      <stop offset="0" stop-color="#fffdf8"/>
      <stop offset="0.68" stop-color="${sand}"/>
      <stop offset="1" stop-color="${sand}"/>
    </radialGradient>
    <radialGradient id="bleed" cx="0" cy="0" r="1" gradientUnits="userSpaceOnUse" gradientTransform="translate(${width * 0.76} ${height * 0.38}) rotate(90) scale(${height * 0.34} ${height * 0.34})">
      <stop offset="0" stop-color="rgba(255,253,248,0.96)"/>
      <stop offset="0.62" stop-color="rgba(239,226,206,0.56)"/>
      <stop offset="1" stop-color="rgba(239,226,206,0)"/>
    </radialGradient>
  </defs>
  ${inner}
</svg>`;
}

function textBlock({ eyebrow, title, body, cta = "Start the $10 sprint", secondary = "See full plans" }) {
  return `
    <text x="154" y="180" fill="${muted}" font-family="'DM Sans', Arial, sans-serif" font-size="15" font-weight="700" letter-spacing="5">${eyebrow.toUpperCase()}</text>
    <text x="154" y="268" fill="${dark}" font-family="'DM Sans', Arial, sans-serif" font-size="94" font-weight="500" letter-spacing="-7">${title[0]}</text>
    <text x="154" y="360" fill="${dark}" font-family="'DM Sans', Arial, sans-serif" font-size="94" font-weight="500" letter-spacing="-7">${title[1]}</text>
    <text x="154" y="452" fill="${dark}" font-family="'DM Sans', Arial, sans-serif" font-size="94" font-weight="500" letter-spacing="-7">${title[2]}</text>
    <text x="154" y="548" fill="${muted}" font-family="'DM Sans', Arial, sans-serif" font-size="30">${body}</text>
    <rect x="154" y="612" width="220" height="64" rx="32" fill="${teal}"/>
    <text x="196" y="652" fill="#fff" font-family="'DM Sans', Arial, sans-serif" font-size="25" font-weight="700">${cta}</text>
    <rect x="392" y="612" width="204" height="64" rx="32" fill="rgba(255,252,247,0.86)" stroke="rgba(194,178,154,0.7)"/>
    <text x="446" y="652" fill="${dark}" font-family="'DM Sans', Arial, sans-serif" font-size="24" font-weight="600">${secondary}</text>
  `;
}

function navBar() {
  return `
    <rect x="112" y="72" width="1376" height="82" rx="41" fill="rgba(255,252,247,0.86)" stroke="rgba(212,197,173,0.54)"/>
    <text x="188" y="122" fill="${dark}" font-family="'Source Serif 4', Georgia, serif" font-size="38" font-weight="600" letter-spacing="-2">ChapAI</text>
    <text x="1106" y="122" fill="${muted}" font-family="'DM Sans', Arial, sans-serif" font-size="20" font-weight="600">CCRN</text>
    <text x="1186" y="122" fill="${muted}" font-family="'DM Sans', Arial, sans-serif" font-size="20" font-weight="600">NCLEX</text>
    <text x="1276" y="122" fill="${muted}" font-family="'DM Sans', Arial, sans-serif" font-size="20" font-weight="600">PLANS</text>
    <rect x="1348" y="92" width="114" height="44" rx="22" fill="rgba(255,250,243,0.96)" stroke="rgba(212,197,173,0.54)"/>
    <text x="1385" y="120" fill="${dark}" font-family="'DM Sans', Arial, sans-serif" font-size="20" font-weight="700">SPRINT</text>
  `;
}

function renderBrainField(x = 1020, y = 164, scale = 1, accent = teal, secondary = gold) {
  return `
    <path d="M${x} ${y}C${x + 72 * scale} ${y - 48 * scale} ${x + 164 * scale} ${y - 74 * scale} ${x + 276 * scale} ${y - 72 * scale}C${x + 392 * scale} ${y - 68 * scale} ${x + 486 * scale} ${y - 24 * scale} ${x + 554 * scale} ${y + 58 * scale}C${x + 620 * scale} ${y + 138 * scale} ${x + 654 * scale} ${y + 240 * scale} ${x + 654 * scale} ${y + 362 * scale}C${x + 654 * scale} ${y + 448 * scale} ${x + 634 * scale} ${y + 528 * scale} ${x + 594 * scale} ${y + 602 * scale}C${x + 554 * scale} ${y + 676 * scale} ${x + 500 * scale} ${y + 736 * scale} ${x + 434 * scale} ${y + 782 * scale}C${x + 366 * scale} ${y + 828 * scale} ${x + 290 * scale} ${y + 850 * scale} ${x + 206 * scale} ${y + 846 * scale}C${x + 120 * scale} ${y + 840 * scale} ${x + 48 * scale} ${y + 812 * scale} ${x - 8 * scale} ${y + 758 * scale}C${x - 62 * scale} ${y + 704 * scale} ${x - 92 * scale} ${y + 634 * scale} ${x - 96 * scale} ${y + 548 * scale}C${x - 100 * scale} ${y + 460 * scale} ${x - 84 * scale} ${y + 384 * scale} ${x - 50 * scale} ${y + 322 * scale}C${x - 18 * scale} ${y + 260 * scale} ${x + 8 * scale} ${y + 208 * scale} ${x + 30 * scale} ${y + 166 * scale}C${x + 52 * scale} ${y + 124 * scale} ${x + 48 * scale} ${y + 90 * scale} ${x} ${y}Z" fill="url(#bleed)" opacity="0.9"/>
    <path d="M${x + 16 * scale} ${y + 22 * scale}C${x + 98 * scale} ${y - 24 * scale} ${x + 198 * scale} ${y - 46 * scale} ${x + 316 * scale} ${y - 42 * scale}C${x + 430 * scale} ${y - 38 * scale} ${x + 520 * scale} ${y + 2 * scale} ${x + 586 * scale} ${y + 78 * scale}C${x + 652 * scale} ${y + 152 * scale} ${x + 686 * scale} ${y + 246 * scale} ${x + 688 * scale} ${y + 362 * scale}C${x + 688 * scale} ${y + 478 * scale} ${x + 654 * scale} ${y + 576 * scale} ${x + 590 * scale} ${y + 654 * scale}C${x + 526 * scale} ${y + 732 * scale} ${x + 442 * scale} ${y + 786 * scale} ${x + 336 * scale} ${y + 814 * scale}C${x + 232 * scale} ${y + 842 * scale} ${x + 142 * scale} ${y + 842 * scale} ${x + 66 * scale} ${y + 816 * scale}" stroke="rgba(86,124,133,0.62)" stroke-width="${2.6 * scale}" fill="none" stroke-linecap="round" stroke-linejoin="round"/>
    <path d="M${x + 106 * scale} ${y + 122 * scale}C${x + 166 * scale} ${y + 88 * scale} ${x + 236 * scale} ${y + 72 * scale} ${x + 318 * scale} ${y + 74 * scale}C${x + 408 * scale} ${y + 76 * scale} ${x + 480 * scale} ${y + 108 * scale} ${x + 534 * scale} ${y + 170 * scale}C${x + 588 * scale} ${y + 230 * scale} ${x + 616 * scale} ${y + 308 * scale} ${x + 620 * scale} ${y + 404 * scale}C${x + 620 * scale} ${y + 500 * scale} ${x + 590 * scale} ${y + 582 * scale} ${x + 530 * scale} ${y + 650 * scale}C${x + 468 * scale} ${y + 718 * scale} ${x + 392 * scale} ${y + 762 * scale} ${x + 300 * scale} ${y + 780 * scale}" stroke="rgba(86,124,133,0.44)" stroke-width="${1.8 * scale}" fill="none" stroke-linecap="round" stroke-linejoin="round"/>
    <path d="M${x + 92 * scale} ${y + 204 * scale}C${x + 158 * scale} ${y + 174 * scale} ${x + 228 * scale} ${y + 164 * scale} ${x + 304 * scale} ${y + 168 * scale}C${x + 390 * scale} ${y + 172 * scale} ${x + 462 * scale} ${y + 202 * scale} ${x + 520 * scale} ${y + 258 * scale}C${x + 578 * scale} ${y + 312 * scale} ${x + 606 * scale} ${y + 382 * scale} ${x + 602 * scale} ${y + 470 * scale}" stroke="rgba(31,31,29,0.84)" stroke-width="${2.4 * scale}" fill="none" stroke-linecap="round" stroke-linejoin="round"/>
    <path d="M${x + 134 * scale} ${y + 318 * scale}C${x + 190 * scale} ${y + 280 * scale} ${x + 252 * scale} ${y + 262 * scale} ${x + 320 * scale} ${y + 262 * scale}C${x + 392 * scale} ${y + 262 * scale} ${x + 454 * scale} ${y + 286 * scale} ${x + 506 * scale} ${y + 334 * scale}" stroke="rgba(31,31,29,0.76)" stroke-width="${2.2 * scale}" fill="none" stroke-linecap="round" stroke-linejoin="round"/>
    <path d="M${x + 248 * scale} ${y + 430 * scale}C${x + 210 * scale} ${y + 384 * scale} ${x + 172 * scale} ${y + 344 * scale} ${x + 134 * scale} ${y + 312 * scale}" stroke="${accent}" stroke-width="${1.9 * scale}" fill="none" stroke-linecap="round"/>
    <path d="M${x + 310 * scale} ${y + 440 * scale}C${x + 328 * scale} ${y + 384 * scale} ${x + 362 * scale} ${y + 330 * scale} ${x + 414 * scale} ${y + 278 * scale}" stroke="${secondary}" stroke-width="${1.9 * scale}" fill="none" stroke-linecap="round"/>
    <path d="M${x + 300 * scale} ${y + 520 * scale}C${x + 248 * scale} ${y + 554 * scale} ${x + 206 * scale} ${y + 600 * scale} ${x + 176 * scale} ${y + 656 * scale}" stroke="${accent}" stroke-width="${1.8 * scale}" fill="none" stroke-linecap="round"/>
    <path d="M${x + 324 * scale} ${y + 520 * scale}C${x + 384 * scale} ${y + 544 * scale} ${x + 430 * scale} ${y + 586 * scale} ${x + 462 * scale} ${y + 646 * scale}" stroke="${secondary}" stroke-width="${1.8 * scale}" fill="none" stroke-linecap="round"/>
    <circle cx="${x + 248 * scale}" cy="${y + 430 * scale}" r="${7 * scale}" fill="${paper}" stroke="${accent}" stroke-width="${1.2 * scale}"/>
    <circle cx="${x + 324 * scale}" cy="${y + 520 * scale}" r="${7 * scale}" fill="${paper}" stroke="${secondary}" stroke-width="${1.2 * scale}"/>
  `;
}

function renderHeartAtlas(x = 1010, y = 176, scale = 1, accent = gold, secondary = teal) {
  return `
    <path d="M${x + 244 * scale} ${y + 102 * scale}C${x + 196 * scale} ${y + 40 * scale} ${x + 126 * scale} ${y + 10 * scale} ${x + 48 * scale} ${y + 18 * scale}C${x - 26 * scale} ${y + 24 * scale} ${x - 88 * scale} ${y + 68 * scale} ${x - 118 * scale} ${y + 136 * scale}C${x - 146 * scale} ${y + 200 * scale} ${x - 148 * scale} ${y + 270 * scale} ${x - 124 * scale} ${y + 346 * scale}C${x - 100 * scale} ${y + 422 * scale} ${x - 46 * scale} ${y + 494 * scale} ${x + 36 * scale} ${y + 558 * scale}C${x + 118 * scale} ${y + 622 * scale} ${x + 190 * scale} ${y + 674 * scale} ${x + 252 * scale} ${y + 716 * scale}C${x + 308 * scale} ${y + 684 * scale} ${x + 380 * scale} ${y + 634 * scale} ${x + 468 * scale} ${y + 566 * scale}C${x + 556 * scale} ${y + 498 * scale} ${x + 612 * scale} ${y + 426 * scale} ${x + 636 * scale} ${y + 350 * scale}C${x + 660 * scale} ${y + 272 * scale} ${x + 658 * scale} ${y + 200 * scale} ${x + 628 * scale} ${y + 134 * scale}C${x + 596 * scale} ${y + 66 * scale} ${x + 532 * scale} ${y + 22 * scale} ${x + 454 * scale} ${y + 18 * scale}C${x + 376 * scale} ${y + 14 * scale} ${x + 308 * scale} ${y + 44 * scale} ${x + 244 * scale} ${y + 102 * scale}Z" fill="url(#bleed)" opacity="0.86"/>
    <path d="M${x + 248 * scale} ${y + 120 * scale}C${x + 204 * scale} ${y + 64 * scale} ${x + 144 * scale} ${y + 38 * scale} ${x + 72 * scale} ${y + 44 * scale}C${x + 4 * scale} ${y + 50 * scale} ${x - 50 * scale} ${y + 92 * scale} ${x - 76 * scale} ${y + 154 * scale}C${x - 100 * scale} ${y + 214 * scale} ${x - 100 * scale} ${y + 280 * scale} ${x - 78 * scale} ${y + 348 * scale}C${x - 56 * scale} ${y + 416 * scale} ${x - 8 * scale} ${y + 478 * scale} ${x + 66 * scale} ${y + 534 * scale}C${x + 142 * scale} ${y + 590 * scale} ${x + 202 * scale} ${y + 636 * scale} ${x + 250 * scale} ${y + 672 * scale}C${x + 294 * scale} ${y + 644 * scale} ${x + 354 * scale} ${y + 600 * scale} ${x + 430 * scale} ${y + 542 * scale}C${x + 508 * scale} ${y + 484 * scale} ${x + 556 * scale} ${y + 422 * scale} ${x + 578 * scale} ${y + 356 * scale}C${x + 600 * scale} ${y + 290 * scale} ${x + 600 * scale} ${y + 226 * scale} ${x + 574 * scale} ${y + 164 * scale}C${x + 544 * scale} ${y + 100 * scale} ${x + 490 * scale} ${y + 56 * scale} ${x + 422 * scale} ${y + 50 * scale}C${x + 354 * scale} ${y + 44 * scale} ${x + 296 * scale} ${y + 68 * scale} ${x + 248 * scale} ${y + 120 * scale}Z" stroke="rgba(31,31,29,0.86)" stroke-width="${2.6 * scale}" fill="none" stroke-linecap="round" stroke-linejoin="round"/>
    <path d="M${x + 252 * scale} ${y + 146 * scale}V${y + 580 * scale}" stroke="${secondary}" stroke-width="${2.2 * scale}" stroke-linecap="round"/>
    <path d="M${x + 252 * scale} ${y + 176 * scale}C${x + 216 * scale} ${y + 154 * scale} ${x + 180 * scale} ${y + 148 * scale} ${x + 142 * scale} ${y + 160 * scale}" stroke="${accent}" stroke-width="${1.9 * scale}" stroke-linecap="round"/>
    <path d="M${x + 252 * scale} ${y + 176 * scale}C${x + 288 * scale} ${y + 154 * scale} ${x + 328 * scale} ${y + 144 * scale} ${x + 374 * scale} ${y + 150 * scale}" stroke="${accent}" stroke-width="${1.9 * scale}" stroke-linecap="round"/>
    <path d="M${x + 252 * scale} ${y + 252 * scale}C${x + 190 * scale} ${y + 260 * scale} ${x + 134 * scale} ${y + 282 * scale} ${x + 84 * scale} ${y + 320 * scale}" stroke="${secondary}" stroke-width="${1.8 * scale}" stroke-linecap="round"/>
    <path d="M${x + 252 * scale} ${y + 252 * scale}C${x + 314 * scale} ${y + 264 * scale} ${x + 372 * scale} ${y + 290 * scale} ${x + 428 * scale} ${y + 334 * scale}" stroke="${secondary}" stroke-width="${1.8 * scale}" stroke-linecap="round"/>
    <path d="M${x + 252 * scale} ${y + 360 * scale}C${x + 206 * scale} ${y + 404 * scale} ${x + 172 * scale} ${y + 456 * scale} ${x + 150 * scale} ${y + 520 * scale}" stroke="${accent}" stroke-width="${1.8 * scale}" stroke-linecap="round"/>
    <path d="M${x + 252 * scale} ${y + 360 * scale}C${x + 296 * scale} ${y + 404 * scale} ${x + 332 * scale} ${y + 454 * scale} ${x + 362 * scale} ${y + 516 * scale}" stroke="${accent}" stroke-width="${1.8 * scale}" stroke-linecap="round"/>
    <circle cx="${x + 252 * scale}" cy="${y + 252 * scale}" r="${8 * scale}" fill="${paper}" stroke="${secondary}" stroke-width="${1.2 * scale}"/>
  `;
}

function renderPulmonaryArbor(x = 1040, y = 148, scale = 1, accent = sage, secondary = gold) {
  return `
    <ellipse cx="${x + 182 * scale}" cy="${y + 306 * scale}" rx="${164 * scale}" ry="${240 * scale}" fill="url(#bleed)" opacity="0.58"/>
    <ellipse cx="${x + 442 * scale}" cy="${y + 306 * scale}" rx="${164 * scale}" ry="${240 * scale}" fill="url(#bleed)" opacity="0.58"/>
    <ellipse cx="${x + 182 * scale}" cy="${y + 316 * scale}" rx="${168 * scale}" ry="${244 * scale}" stroke="rgba(31,31,29,0.82)" stroke-width="${2.4 * scale}"/>
    <ellipse cx="${x + 442 * scale}" cy="${y + 316 * scale}" rx="${168 * scale}" ry="${244 * scale}" stroke="rgba(31,31,29,0.82)" stroke-width="${2.4 * scale}"/>
    <path d="M${x + 312 * scale} ${y + 62 * scale}V${y + 608 * scale}" stroke="${secondary}" stroke-width="${2.2 * scale}" stroke-linecap="round"/>
    <path d="M${x + 312 * scale} ${y + 118 * scale}C${x + 262 * scale} ${y + 146 * scale} ${x + 224 * scale} ${y + 182 * scale} ${x + 198 * scale} ${y + 228 * scale}" stroke="${accent}" stroke-width="${2 * scale}" stroke-linecap="round"/>
    <path d="M${x + 312 * scale} ${y + 118 * scale}C${x + 362 * scale} ${y + 146 * scale} ${x + 400 * scale} ${y + 182 * scale} ${x + 426 * scale} ${y + 228 * scale}" stroke="${accent}" stroke-width="${2 * scale}" stroke-linecap="round"/>
    <path d="M${x + 198 * scale} ${y + 228 * scale}C${x + 152 * scale} ${y + 248 * scale} ${x + 118 * scale} ${y + 278 * scale} ${x + 94 * scale} ${y + 318 * scale}" stroke="${secondary}" stroke-width="${1.8 * scale}" stroke-linecap="round"/>
    <path d="M${x + 198 * scale} ${y + 228 * scale}C${x + 168 * scale} ${y + 278 * scale} ${x + 146 * scale} ${y + 334 * scale} ${x + 132 * scale} ${y + 394 * scale}" stroke="${secondary}" stroke-width="${1.8 * scale}" stroke-linecap="round"/>
    <path d="M${x + 426 * scale} ${y + 228 * scale}C${x + 472 * scale} ${y + 248 * scale} ${x + 506 * scale} ${y + 278 * scale} ${x + 530 * scale} ${y + 318 * scale}" stroke="${secondary}" stroke-width="${1.8 * scale}" stroke-linecap="round"/>
    <path d="M${x + 426 * scale} ${y + 228 * scale}C${x + 456 * scale} ${y + 278 * scale} ${x + 478 * scale} ${y + 334 * scale} ${x + 492 * scale} ${y + 394 * scale}" stroke="${secondary}" stroke-width="${1.8 * scale}" stroke-linecap="round"/>
    <path d="M${x + 312 * scale} ${y + 222 * scale}C${x + 280 * scale} ${y + 304 * scale} ${x + 266 * scale} ${y + 394 * scale} ${x + 270 * scale} ${y + 492 * scale}" stroke="rgba(31,31,29,0.68)" stroke-width="${2 * scale}" stroke-linecap="round"/>
    <path d="M${x + 312 * scale} ${y + 222 * scale}C${x + 344 * scale} ${y + 304 * scale} ${x + 358 * scale} ${y + 394 * scale} ${x + 354 * scale} ${y + 492 * scale}" stroke="rgba(31,31,29,0.68)" stroke-width="${2 * scale}" stroke-linecap="round"/>
  `;
}

function renderCathSignal(x = 1000, y = 186, scale = 1, accent = clay, secondary = teal) {
  return `
    <path d="M${x + 24 * scale} ${y + 144 * scale}C${x + 124 * scale} ${y + 78 * scale} ${x + 244 * scale} ${y + 42 * scale} ${x + 384 * scale} ${y + 38 * scale}C${x + 522 * scale} ${y + 34 * scale} ${x + 624 * scale} ${y + 68 * scale} ${x + 688 * scale} ${y + 140 * scale}C${x + 752 * scale} ${y + 212 * scale} ${x + 784 * scale} ${y + 308 * scale} ${x + 784 * scale} ${y + 430 * scale}C${x + 784 * scale} ${y + 550 * scale} ${x + 758 * scale} ${y + 646 * scale} ${x + 706 * scale} ${y + 718 * scale}" stroke="rgba(86,124,133,0.42)" stroke-width="${2.2 * scale}" fill="none" stroke-linecap="round"/>
    <path d="M${x + 156 * scale} ${y + 208 * scale}H${x + 560 * scale}" stroke="rgba(31,31,29,0.18)" stroke-width="${1.5 * scale}" stroke-dasharray="${5 * scale} ${10 * scale}"/>
    <path d="M${x + 124 * scale} ${y + 324 * scale}H${x + 620 * scale}" stroke="rgba(31,31,29,0.16)" stroke-width="${1.4 * scale}" stroke-dasharray="${5 * scale} ${10 * scale}"/>
    <path d="M${x + 92 * scale} ${y + 440 * scale}H${x + 654 * scale}" stroke="rgba(31,31,29,0.16)" stroke-width="${1.4 * scale}" stroke-dasharray="${5 * scale} ${10 * scale}"/>
    <path d="M${x + 184 * scale} ${y + 246 * scale}C${x + 242 * scale} ${y + 198 * scale} ${x + 308 * scale} ${y + 174 * scale} ${x + 382 * scale} ${y + 174 * scale}C${x + 470 * scale} ${y + 174 * scale} ${x + 540 * scale} ${y + 208 * scale} ${x + 592 * scale} ${y + 278 * scale}C${x + 644 * scale} ${y + 348 * scale} ${x + 660 * scale} ${y + 430 * scale} ${x + 638 * scale} ${y + 522 * scale}C${x + 616 * scale} ${y + 614 * scale} ${x + 564 * scale} ${y + 688 * scale} ${x + 480 * scale} ${y + 742 * scale}C${x + 396 * scale} ${y + 794 * scale} ${x + 316 * scale} ${y + 810 * scale} ${x + 240 * scale} ${y + 790 * scale}" stroke="rgba(31,31,29,0.86)" stroke-width="${2.5 * scale}" fill="none" stroke-linecap="round" stroke-linejoin="round"/>
    <path d="M${x + 286 * scale} ${y + 286 * scale}C${x + 330 * scale} ${y + 254 * scale} ${x + 378 * scale} ${y + 238 * scale} ${x + 432 * scale} ${y + 238 * scale}C${x + 494 * scale} ${y + 238 * scale} ${x + 544 * scale} ${y + 264 * scale} ${x + 582 * scale} ${y + 316 * scale}" stroke="${secondary}" stroke-width="${1.9 * scale}" fill="none" stroke-linecap="round"/>
    <path d="M${x + 428 * scale} ${y + 144 * scale}V${y + 718 * scale}" stroke="${accent}" stroke-width="${1.8 * scale}" stroke-linecap="round"/>
    <path d="M${x + 204 * scale} ${y + 610 * scale}H${x + 258 * scale}L${x + 282 * scale} ${y + 566 * scale}L${x + 314 * scale} ${y + 690 * scale}L${x + 356 * scale} ${y + 490 * scale}L${x + 388 * scale} ${y + 610 * scale}H${x + 452 * scale}" stroke="${accent}" stroke-width="${2.2 * scale}" fill="none" stroke-linecap="round" stroke-linejoin="round"/>
    <circle cx="${x + 592 * scale}" cy="${y + 278 * scale}" r="${7 * scale}" fill="${paper}" stroke="${secondary}" stroke-width="${1.2 * scale}"/>
  `;
}

function medicalObject(motif, x, y, scale) {
  if (motif.key === "heart") {
    return renderHeartAtlas(x, y, scale, motif.accent, motif.secondary);
  }
  if (motif.key === "lungs") {
    return renderPulmonaryArbor(x, y, scale, motif.accent, motif.secondary);
  }
  if (motif.key === "cath") {
    return renderCathSignal(x, y, scale, motif.accent, motif.secondary);
  }
  return renderBrainField(x, y, scale, motif.accent, motif.secondary);
}

function frontpageConcept(id, motif) {
  const titles = {
    brain: ["A calmer, more", "intelligent way", "to prepare."],
    heart: ["Sharper answers.", "Better clinical", "instincts."],
    lungs: ["Respiratory, perfusion,", "and priority", "made cleaner."],
    cath: ["Premium nursing prep", "with real bedside", "signal."],
  };

  return baseSvg(`
    ${navBar()}
    ${textBlock({
      eyebrow: `${motif.label} / premium study surface`,
      title: titles[motif.key],
      body: "Original questions, elite rationale, and a faster path into the right plan.",
    })}
    <text x="154" y="744" fill="${muted}" font-family="'DM Sans', Arial, sans-serif" font-size="14" font-weight="700" letter-spacing="4">VISUAL RATIONALE + CLEANER CLINICAL FLOW</text>
    <path d="M154 770H594" stroke="rgba(212,197,173,0.62)"/>
    <text x="154" y="846" fill="${muted}" font-family="'DM Sans', Arial, sans-serif" font-size="14" font-weight="700" letter-spacing="4">CURRENT BUILD</text>
    <text x="154" y="888" fill="${dark}" font-family="'DM Sans', Arial, sans-serif" font-size="34" font-weight="700">Premium question + tutor path</text>
    <text x="486" y="846" fill="${muted}" font-family="'DM Sans', Arial, sans-serif" font-size="14" font-weight="700" letter-spacing="4">ANGLE</text>
    <text x="486" y="888" fill="${dark}" font-family="'DM Sans', Arial, sans-serif" font-size="34" font-weight="700">${motif.label}</text>
    ${medicalObject(motif, 900, 126, 0.9)}
  `);
}

function socialHeader(id, motif) {
  return baseSvg(`
    <rect x="46" y="46" width="1508" height="428" rx="34" fill="rgba(255,252,247,0.88)" stroke="rgba(212,197,173,0.52)"/>
    <text x="118" y="180" fill="${dark}" font-family="'Source Serif 4', Georgia, serif" font-size="72" font-weight="600" letter-spacing="-3">ChapAI</text>
    <text x="118" y="240" fill="${muted}" font-family="'DM Sans', Arial, sans-serif" font-size="18" font-weight="700" letter-spacing="5">NCLEX + CCRN / CLEANER CLINICAL PREP</text>
    <text x="118" y="318" fill="${dark}" font-family="'DM Sans', Arial, sans-serif" font-size="50" font-weight="500" letter-spacing="-3">Original questions. Elite rationale.</text>
    <text x="118" y="374" fill="${muted}" font-family="'DM Sans', Arial, sans-serif" font-size="26">AI tutor, visual guidance, and a faster path into the right plan.</text>
    ${medicalObject(motif, 900, 78, 0.56)}
  `, { width: 1600, height: 520 });
}

function logoFrame(inner) {
  return `<svg width="480" height="480" viewBox="0 0 480 480" fill="none" xmlns="http://www.w3.org/2000/svg">
    <rect width="480" height="480" rx="48" fill="${paper}"/>
    <rect x="36" y="36" width="408" height="408" rx="36" fill="rgba(255,252,247,0.82)" stroke="rgba(205,189,165,0.46)"/>
    ${inner}
  </svg>`;
}

function logoNeuralHalo(seed) {
  const accent = [teal, gold, clay, sage][seed % 4];
  return logoFrame(`
    <circle cx="240" cy="240" r="136" stroke="rgba(86,124,133,0.18)" stroke-width="1.5"/>
    <circle cx="240" cy="240" r="${98 + (seed % 5) * 4}" stroke="rgba(86,124,133,0.16)" stroke-width="1.1"/>
    <path d="M240 118V348" stroke="${accent}" stroke-width="2.2" stroke-linecap="round"/>
    <path d="M240 170C212 156 188 136 168 110" stroke="${dark}" stroke-width="2.4" stroke-linecap="round"/>
    <path d="M240 170C268 156 292 136 312 110" stroke="${dark}" stroke-width="2.4" stroke-linecap="round"/>
    <path d="M240 228C204 224 174 236 150 264" stroke="${accent}" stroke-width="1.9" stroke-linecap="round"/>
    <path d="M240 228C276 224 306 236 330 264" stroke="${accent}" stroke-width="1.9" stroke-linecap="round"/>
    <path d="M240 286C216 300 198 320 186 346" stroke="${dark}" stroke-opacity="0.52" stroke-width="1.8" stroke-linecap="round"/>
    <path d="M240 286C264 300 282 320 294 346" stroke="${dark}" stroke-opacity="0.52" stroke-width="1.8" stroke-linecap="round"/>
    <circle cx="240" cy="102" r="7" fill="${paper}" stroke="${accent}" stroke-width="1.2"/>
  `);
}

function logoCoronaryLoop(seed) {
  const accent = [gold, teal, clay, sage][seed % 4];
  return logoFrame(`
    <path d="M240 122C202 76 148 54 86 62C28 70 -10 106 -24 170C-38 234 -22 302 24 372C70 442 142 494 240 530C330 490 400 438 446 374C492 308 510 242 498 176C486 110 450 72 390 62C330 52 280 72 240 122Z" transform="translate(2 -42) scale(0.86)" fill="rgba(238,226,206,0.52)"/>
    <path d="M240 138C204 94 156 74 96 80C42 86 6 118 -10 176C-24 232 -12 292 28 354C68 416 138 474 240 526C334 478 404 420 446 352C488 284 502 224 490 172C478 118 444 86 390 80C334 74 284 94 240 138Z" transform="translate(2 -42) scale(0.86)" stroke="${dark}" stroke-width="2.5" fill="none" stroke-linejoin="round"/>
    <path d="M240 136V324" stroke="${accent}" stroke-width="2.2" stroke-linecap="round"/>
    <path d="M240 178C206 164 178 164 156 178" stroke="${accent}" stroke-width="1.8" stroke-linecap="round"/>
    <path d="M240 178C274 164 302 164 324 178" stroke="${accent}" stroke-width="1.8" stroke-linecap="round"/>
    <path d="M240 242C196 258 164 286 146 326" stroke="${dark}" stroke-opacity="0.52" stroke-width="1.8" stroke-linecap="round"/>
    <path d="M240 242C284 258 316 286 334 326" stroke="${dark}" stroke-opacity="0.52" stroke-width="1.8" stroke-linecap="round"/>
  `);
}

function logoPulmonarySeal(seed) {
  const accent = [sage, teal, gold, clay][seed % 4];
  return logoFrame(`
    <ellipse cx="184" cy="236" rx="74" ry="110" stroke="${dark}" stroke-width="2.3"/>
    <ellipse cx="296" cy="236" rx="74" ry="110" stroke="${dark}" stroke-width="2.3"/>
    <path d="M240 112V340" stroke="${accent}" stroke-width="2.1" stroke-linecap="round"/>
    <path d="M240 150C216 166 198 186 184 210" stroke="${accent}" stroke-width="1.8" stroke-linecap="round"/>
    <path d="M240 150C264 166 282 186 296 210" stroke="${accent}" stroke-width="1.8" stroke-linecap="round"/>
    <path d="M184 210C162 226 146 248 136 276" stroke="rgba(32,31,33,0.52)" stroke-width="1.7" stroke-linecap="round"/>
    <path d="M296 210C318 226 334 248 344 276" stroke="rgba(32,31,33,0.52)" stroke-width="1.7" stroke-linecap="round"/>
    <circle cx="240" cy="136" r="8" fill="${paper}" stroke="${accent}" stroke-width="1.2"/>
  `);
}

function logoVesselMonogram(seed) {
  const accent = [teal, clay, gold, sage][seed % 4];
  return logoFrame(`
    <circle cx="240" cy="240" r="138" stroke="rgba(86,124,133,0.16)" stroke-width="1.4"/>
    <path d="M166 160C190 140 216 130 244 130C270 130 294 136 316 148" stroke="${dark}" stroke-width="2.4" stroke-linecap="round"/>
    <path d="M166 318C190 338 216 348 244 348C272 348 298 340 322 324" stroke="${dark}" stroke-width="2.4" stroke-linecap="round"/>
    <path d="M240 134V344" stroke="${accent}" stroke-width="2.2" stroke-linecap="round"/>
    <path d="M206 200C218 190 230 186 242 186C256 186 268 190 278 200" stroke="${accent}" stroke-width="1.8" stroke-linecap="round"/>
    <path d="M202 274C216 288 232 295 250 295C268 295 284 288 298 274" stroke="rgba(32,31,33,0.48)" stroke-width="1.8" stroke-linecap="round"/>
  `);
}

function logoCathSignal(seed) {
  const accent = [clay, teal, gold, sage][seed % 4];
  return logoFrame(`
    <rect x="112" y="132" width="256" height="216" rx="28" stroke="rgba(32,31,33,0.18)" stroke-width="1.4"/>
    <path d="M136 250H188L212 210L242 306L276 174L308 250H350" stroke="${dark}" stroke-width="2.8" stroke-linecap="round" stroke-linejoin="round"/>
    <path d="M240 124V356" stroke="${accent}" stroke-width="1.8" stroke-linecap="round"/>
    <circle cx="212" cy="210" r="7" fill="${paper}" stroke="${accent}" stroke-width="1.2"/>
  `);
}

const logoFamilies = [
  logoNeuralHalo,
  logoCoronaryLoop,
  logoPulmonarySeal,
  logoVesselMonogram,
  logoCathSignal,
];

for (let i = 0; i < 10; i += 1) {
  const motif = motifs[i % motifs.length];
  const fileId = 901 + i;
  write(path.join(reviewDir, `frontpage-${fileId}.svg`), frontpageConcept(fileId, motif));
}

for (let i = 0; i < 8; i += 1) {
  const motif = motifs[i % motifs.length];
  const fileId = 31 + i;
  write(path.join(reviewDir, `social-header-${fileId}.svg`), socialHeader(fileId, motif));
}

for (let i = 0; i < 50; i += 1) {
  const fileId = 801 + i;
  const family = logoFamilies[i % logoFamilies.length];
  write(path.join(brandDir, `chapai-option-${fileId}.svg`), family(i));
}

console.log(JSON.stringify({ ok: true, frontpages: "901-910", headers: "31-38", logos: "801-850" }));
