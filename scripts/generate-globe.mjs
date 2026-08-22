#!/usr/bin/env node
// ---------------------------------------------------------------------------
// Generates the hero globe: a contour-mapped sphere plus a separate orbit ring
// layer, both as SVG.
//
//   node scripts/generate-globe.mjs
//
// Why generated: the source artwork's sphere runs off the right edge of its own
// canvas, so no crop of it yields a WHOLE globe — and a whole globe is what the
// design calls for. Generating one also splits the orbits into their own layer,
// which is what lets them rotate independently of the mark. Rotating a single
// flat raster would spin the "C" with it.
//
// The contours are warped radially before being clipped to the circle, so the
// lines crowd toward the rim the way features do on a sphere seen face-on.
// Without that the disc reads as a flat coin.
//
// Deterministic from a fixed seed, so the committed SVGs can be regenerated and
// diffed rather than being opaque assets.
// ---------------------------------------------------------------------------
import { writeFileSync, mkdirSync } from "node:fs";
import { resolve, dirname } from "node:path";

const ROOT = resolve(import.meta.dirname, "..");
const OUT_DIR = resolve(ROOT, "apps/web/public/brand");

const SIZE = 1000;
const CX = SIZE / 2;
const CY = SIZE / 2;
const R = 452;
const GRID = 150;
const LEVELS = 30;
const SEED = 20260822;

function mulberry32(a) {
  return function () {
    a |= 0; a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
const rand = mulberry32(SEED);
const smooth = (t) => t * t * (3 - 2 * t);
const lerp = (a, b, t) => a + (b - a) * t;

function lattice(n) {
  const g = [];
  for (let y = 0; y <= n; y += 1) {
    const row = [];
    for (let x = 0; x <= n; x += 1) row.push(rand());
    g.push(row);
  }
  return g;
}
function sample(grid, u, v, n) {
  const x = u * n, y = v * n;
  const x0 = Math.floor(x), y0 = Math.floor(y);
  const x1 = Math.min(x0 + 1, n), y1 = Math.min(y0 + 1, n);
  const tx = smooth(x - x0), ty = smooth(y - y0);
  return lerp(lerp(grid[y0][x0], grid[y0][x1], tx), lerp(grid[y1][x0], grid[y1][x1], tx), ty);
}

const octaves = [
  { n: 3, amp: 1.0 },
  { n: 7, amp: 0.46 },
  { n: 15, amp: 0.22 },
  { n: 31, amp: 0.1 },
].map((o) => ({ ...o, grid: lattice(o.n) }));

/**
 * Height at a point on the disc. `u,v` are already the sphere-corrected
 * coordinates, so the noise is sampled in "surface" space and only then drawn
 * back onto the flat projection.
 */
function height(u, v) {
  let h = 0, norm = 0;
  for (const o of octaves) { h += sample(o.grid, u, v, o.n) * o.amp; norm += o.amp; }
  return h / norm;
}

// Build the field over the bounding square, marking anything outside the disc
// as NaN so marching squares simply skips it — that clips the contours to the
// sphere without needing a mask.
const field = [];
for (let r = 0; r <= GRID; r += 1) {
  const row = [];
  for (let c = 0; c <= GRID; c += 1) {
    const x = (c / GRID) * 2 - 1;          // -1..1 across the disc
    const y = (r / GRID) * 2 - 1;
    const d = Math.hypot(x, y);
    if (d > 1) { row.push(Number.NaN); continue; }
    // Inverse orthographic: a point at screen distance d sits at angle asin(d)
    // on the sphere, so surface coordinates stretch toward the rim. This is
    // what crowds the contour lines at the edge.
    const stretch = Math.asin(Math.min(1, d)) / (Math.PI / 2);
    const k = d > 1e-6 ? stretch / d : 1;
    row.push(height((x * k + 1) / 2, (y * k + 1) / 2));
  }
  field.push(row);
}

let min = Infinity, max = -Infinity;
for (const row of field) for (const v of row) {
  if (!Number.isNaN(v)) { if (v < min) min = v; if (v > max) max = v; }
}
for (let r = 0; r <= GRID; r += 1) {
  for (let c = 0; c <= GRID; c += 1) {
    if (!Number.isNaN(field[r][c])) field[r][c] = (field[r][c] - min) / (max - min);
  }
}

const cell = (2 * R) / GRID;
const px = (c) => CX - R + c * cell;
const py = (r) => CY - R + r * cell;
const round = (n) => Math.round(n * 10) / 10;

function contours(level) {
  const segs = [];
  const ix = (a, b, pa, pb) => a + (b - a) * ((level - pa) / (pb - pa || 1e-6));
  for (let r = 0; r < GRID; r += 1) {
    for (let c = 0; c < GRID; c += 1) {
      const tl = field[r][c], tr = field[r][c + 1], br = field[r + 1][c + 1], bl = field[r + 1][c];
      if ([tl, tr, br, bl].some(Number.isNaN)) continue;   // outside the sphere
      let idx = 0;
      if (tl > level) idx |= 8;
      if (tr > level) idx |= 4;
      if (br > level) idx |= 2;
      if (bl > level) idx |= 1;
      if (idx === 0 || idx === 15) continue;
      const x0 = px(c), y0 = py(r), x1 = px(c + 1), y1 = py(r + 1);
      const top = [ix(x0, x1, tl, tr), y0];
      const right = [x1, ix(y0, y1, tr, br)];
      const bottom = [ix(x0, x1, bl, br), y1];
      const left = [x0, ix(y0, y1, tl, bl)];
      const push = (a, b) => segs.push([a, b]);
      switch (idx) {
        case 1: case 14: push(left, bottom); break;
        case 2: case 13: push(bottom, right); break;
        case 3: case 12: push(left, right); break;
        case 4: case 11: push(top, right); break;
        case 5: push(left, top); push(bottom, right); break;
        case 6: case 9: push(top, bottom); break;
        case 7: case 8: push(left, top); break;
        case 10: push(left, bottom); push(top, right); break;
        default: break;
      }
    }
  }
  return segs;
}

const key = (x, y) => `${Math.round(x * 10)},${Math.round(y * 10)}`;
function stitch(segs) {
  const heads = new Map();
  segs.forEach((s, i) => {
    const k = key(...s[0]);
    if (!heads.has(k)) heads.set(k, []);
    heads.get(k).push(i);
  });
  const used = new Set();
  const paths = [];
  for (let i = 0; i < segs.length; i += 1) {
    if (used.has(i)) continue;
    used.add(i);
    const pts = [segs[i][0], segs[i][1]];
    let guard = 0;
    while (guard++ < 5000) {
      const cand = (heads.get(key(...pts[pts.length - 1])) ?? []).find((j) => !used.has(j));
      if (cand === undefined) break;
      used.add(cand);
      pts.push(segs[cand][1]);
    }
    if (pts.length >= 3) paths.push(pts);
  }
  return paths;
}

let body = "";
let count = 0;
for (let i = 1; i < LEVELS; i += 1) {
  const paths = stitch(contours(i / LEVELS));
  if (!paths.length) continue;
  const index = i % 5 === 0;
  const d = paths.map((pts) => `M${pts.map(([x, y]) => `${round(x)} ${round(y)}`).join("L")}`).join("");
  // Authored heavy on purpose: a 1000-unit viewBox displayed near 640px scales
  // strokes down by about a third, so sub-1px widths vanish into the paper.
  body += `<path d="${d}" stroke-width="${index ? 2.4 : 1.35}" opacity="${index ? 0.95 : 0.68}"/>`;
  count += paths.length;
}

// The rim, drawn last so it reads as the edge of a solid body.
body += `<circle cx="${CX}" cy="${CY}" r="${R}" stroke-width="2.6" opacity="0.85"/>`;

const globe =
  `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${SIZE} ${SIZE}" fill="none" ` +
  `stroke="currentColor" stroke-linejoin="round" stroke-linecap="round">${body}</svg>`;

// ─── orbit layer ─────────────────────────────────────────────────────────────
// Its own file so it can rotate independently. Ellipses are drawn about the
// same centre at varying tilts and radii, with a few nodes riding on them.
let orbits = "";
const rings = [
  { rx: 560, ry: 190, rot: -18, op: 0.78 },
  { rx: 610, ry: 250, rot: 14, op: 0.64 },
  { rx: 520, ry: 130, rot: 42, op: 0.56 },
  { rx: 650, ry: 320, rot: -46, op: 0.46 },
];
for (const ring of rings) {
  orbits += `<ellipse cx="${CX}" cy="${CY}" rx="${ring.rx}" ry="${ring.ry}" ` +
    `transform="rotate(${ring.rot} ${CX} ${CY})" stroke-width="1.9" opacity="${ring.op}"/>`;
}
for (const ring of rings) {
  // Two nodes per ring, at angles picked from the same seeded stream so the
  // arrangement is stable between builds.
  for (let k = 0; k < 2; k += 1) {
    const a = rand() * Math.PI * 2;
    const x = CX + Math.cos(a) * ring.rx;
    const y = CY + Math.sin(a) * ring.ry;
    const rad = (ring.rot * Math.PI) / 180;
    const rx = CX + (x - CX) * Math.cos(rad) - (y - CY) * Math.sin(rad);
    const ry = CY + (x - CX) * Math.sin(rad) + (y - CY) * Math.cos(rad);
    orbits += `<circle cx="${round(rx)}" cy="${round(ry)}" r="${k ? 3.4 : 5}" fill="currentColor" stroke="none" opacity="0.55"/>`;
  }
}
const orbitSvg =
  `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${SIZE} ${SIZE}" fill="none" ` +
  `stroke="currentColor" stroke-linecap="round">${orbits}</svg>`;

mkdirSync(OUT_DIR, { recursive: true });
writeFileSync(resolve(OUT_DIR, "globe-contours.svg"), globe);
writeFileSync(resolve(OUT_DIR, "globe-orbits.svg"), orbitSvg);
console.log(`globe-contours.svg  ${count} contours  ${(globe.length / 1024).toFixed(0)} KB`);
console.log(`globe-orbits.svg    ${rings.length} rings  ${(orbitSvg.length / 1024).toFixed(1)} KB`);
