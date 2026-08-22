#!/usr/bin/env node
// ---------------------------------------------------------------------------
// Generates the site's topographic background as SVG.
//
//   node scripts/generate-topography.mjs
//
// Why generated rather than CSS: repeating-radial-gradient draws PERFECT
// CONCENTRIC CIRCLES, and several of those layered over each other read as a
// woven grid, not as terrain. Real contour lines are irregular, nested, and
// occasionally closed into peaks — they come from slicing a height field at
// even intervals, which is what this does (value noise + marching squares).
//
// Deterministic: the same seed always produces the same map, so the committed
// SVG can be regenerated and diffed rather than being an opaque binary.
// ---------------------------------------------------------------------------
import { writeFileSync, mkdirSync } from "node:fs";
import { resolve, dirname } from "node:path";

const ROOT = resolve(import.meta.dirname, "..");
const OUT = resolve(ROOT, "apps/web/public/brand/topography-field.svg");

const W = 2400;            // viewBox width
const H = 1600;            // viewBox height
const COLS = 168;          // height-field resolution; higher = more wander
const ROWS = 112;
const LEVELS = 34;         // number of contour lines
const SEED = 20260821;

// ─── deterministic value noise ───────────────────────────────────────────────
function mulberry32(a) {
  return function () {
    a |= 0; a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function lattice(cols, rows, rand) {
  const g = [];
  for (let y = 0; y <= rows; y += 1) {
    const row = [];
    for (let x = 0; x <= cols; x += 1) row.push(rand());
    g.push(row);
  }
  return g;
}

const smooth = (t) => t * t * (3 - 2 * t);           // smoothstep
const lerp = (a, b, t) => a + (b - a) * t;

function sampleLattice(grid, u, v, cols, rows) {
  const x = u * cols, y = v * rows;
  const x0 = Math.floor(x), y0 = Math.floor(y);
  const x1 = Math.min(x0 + 1, cols), y1 = Math.min(y0 + 1, rows);
  const tx = smooth(x - x0), ty = smooth(y - y0);
  return lerp(
    lerp(grid[y0][x0], grid[y0][x1], tx),
    lerp(grid[y1][x0], grid[y1][x1], tx),
    ty,
  );
}

// Several octaves so the terrain has both broad basins and fine crenellation.
const rand = mulberry32(SEED);
const octaves = [
  { cells: 3, amp: 1.0 },
  { cells: 6, amp: 0.5 },
  { cells: 13, amp: 0.26 },
  { cells: 27, amp: 0.12 },
];
const lattices = octaves.map((o) => ({ ...o, grid: lattice(o.cells, o.cells, rand) }));

const field = [];
let min = Infinity, max = -Infinity;
for (let r = 0; r <= ROWS; r += 1) {
  const row = [];
  for (let c = 0; c <= COLS; c += 1) {
    const u = c / COLS, v = r / ROWS;
    let h = 0, norm = 0;
    for (const o of lattices) {
      h += sampleLattice(o.grid, u, v, o.cells, o.cells) * o.amp;
      norm += o.amp;
    }
    h /= norm;
    row.push(h);
    if (h < min) min = h;
    if (h > max) max = h;
  }
  field.push(row);
}
// Normalise so the contour levels spread evenly across the whole map.
for (let r = 0; r <= ROWS; r += 1) {
  for (let c = 0; c <= COLS; c += 1) field[r][c] = (field[r][c] - min) / (max - min);
}

// ─── marching squares ────────────────────────────────────────────────────────
// Emits one line segment per cell edge crossing. Segments are then stitched
// into polylines so the SVG carries a few long paths instead of ~40k stubs.
const cw = W / COLS, ch = H / ROWS;
const key = (x, y) => `${Math.round(x * 10)},${Math.round(y * 10)}`;

function contourSegments(level) {
  const segs = [];
  const ix = (a, b, pa, pb) => a + (b - a) * ((level - pa) / (pb - pa || 1e-6));
  for (let r = 0; r < ROWS; r += 1) {
    for (let c = 0; c < COLS; c += 1) {
      const tl = field[r][c], tr = field[r][c + 1], br = field[r + 1][c + 1], bl = field[r + 1][c];
      let idx = 0;
      if (tl > level) idx |= 8;
      if (tr > level) idx |= 4;
      if (br > level) idx |= 2;
      if (bl > level) idx |= 1;
      if (idx === 0 || idx === 15) continue;
      const x0 = c * cw, y0 = r * ch, x1 = x0 + cw, y1 = y0 + ch;
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

/** Stitch segments end-to-end so each contour becomes one path. */
function stitch(segs) {
  const heads = new Map();
  for (const s of segs) {
    const k = key(...s[0]);
    if (!heads.has(k)) heads.set(k, []);
    heads.get(k).push(s);
  }
  const used = new Set();
  const paths = [];
  for (let i = 0; i < segs.length; i += 1) {
    if (used.has(i)) continue;
    used.add(i);
    const pts = [segs[i][0], segs[i][1]];
    let guard = 0;
    while (guard++ < 4000) {
      const cand = heads.get(key(...pts[pts.length - 1]));
      if (!cand) break;
      const next = cand.find((s) => {
        const j = segs.indexOf(s);
        return j >= 0 && !used.has(j);
      });
      if (!next) break;
      used.add(segs.indexOf(next));
      pts.push(next[1]);
    }
    if (pts.length >= 3) paths.push(pts);   // drop 2-point specks
  }
  return paths;
}

const round = (n) => Math.round(n * 10) / 10;
let body = "";
let pathCount = 0;
for (let i = 1; i < LEVELS; i += 1) {
  const level = i / LEVELS;
  const paths = stitch(contourSegments(level));
  if (!paths.length) continue;
  // Every fifth line is an index contour, exactly as on a survey map — it is
  // what stops a contour field reading as noise.
  const index = i % 5 === 0;
  const d = paths
    .map((pts) => `M${pts.map(([x, y]) => `${round(x)} ${round(y)}`).join("L")}`)
    .join("");
  body += `<path d="${d}" stroke-width="${index ? 1.5 : 0.8}" opacity="${index ? 0.85 : 0.5}"/>`;
  pathCount += paths.length;
}

const svg =
  `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${H}" preserveAspectRatio="xMidYMid slice" fill="none" ` +
  `stroke="currentColor" stroke-linejoin="round" stroke-linecap="round">${body}</svg>`;

mkdirSync(dirname(OUT), { recursive: true });
writeFileSync(OUT, svg);
console.log(`wrote ${OUT}`);
console.log(`  levels: ${LEVELS}  contours: ${pathCount}  size: ${(svg.length / 1024).toFixed(0)} KB`);
