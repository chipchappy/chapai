// One-shot palette regrade: shifts the clinical scene from cold grey-teal to the
// Clarity warm sand/adobe palette used in the approved Sim Workspace V3 design.
// Lightness is preserved per swatch so all existing depth/shading still reads.
// Deliberately does NOT touch: skin CSS vars, monitor screen/neon colors, gown
// and blanket sage, or alarm/status colors.
import { readFileSync, writeFileSync } from "node:fs";

const MAP = {
  // room shell
  "#dce5e1": "#ded1b9", "#e3e9e6": "#eae0ca", "#c8ceca": "#c4b69b",
  "#aab6b1": "#b6a68b", "#bdc4c0": "#c9bca3", "#d9e4dd": "#e2d7c1",
  "#d8e4dd": "#e2d7c1", "#bfcac2": "#c6b89e", "#9ba9a7": "#ab9c85",
  "#8c9694": "#9a8c76",
  // headwall + panels
  "#e7ece9": "#f0e5d2", "#bac7c2": "#c8b99e", "#99aaa5": "#b3a389",
  "#f7fbf8": "#fdf8ea", "#f4f6f3": "#f9f1e2", "#869994": "#a3937a",
  "#f5f7f4": "#faf3e5", "#c5cfcb": "#cbbda3", "#dce4e1": "#e0d5bf",
  "#d3e0dc": "#ded2ba", "#78928a": "#97846a", "#a1b0ab": "#b2a288",
  // bed + frame
  "#f3f7f2": "#fbf5e8", "#e6ece8": "#ece1cb", "#d2dcd6": "#d6c9b0",
  "#a2b3ae": "#b6a68d", "#63776f": "#7a6a52", "#718783": "#8c7c63",
  "#4c5c59": "#5c5040", "#586b68": "#6e6150", "#4a5c59": "#5e5344",
  "#465956": "#5a4f40", "#5f7370": "#786a56", "#c7d3ce": "#d5c8b0",
  "#5d716d": "#736553", "#9dafaa": "#b0a087", "#b7c7c1": "#c9bba2",
  "#93a7a1": "#a89881", "#c4d0ca": "#d2c5ad", "#fbfdfa": "#fdf9ee",
  "#eef3ef": "#f7f0e1", "#c8d3cd": "#cfc2a9", "#e8b563": "#e0a95c",
  // wall fixtures
  "#eef2ef": "#f6efe0", "#b5c2bd": "#c4b59a", "#f8fbf8": "#fdf8ea",
  "#7d938d": "#96866d", "#dfe7e2": "#e7dcc6", "#f2f6f2": "#f9f2e4",
  "#8a9b95": "#a1917a", "#c1d0c9": "#cdbfa6", "#6b7f79": "#827259",
  "#fbfcfa": "#fdf9ef", "#a9b7b1": "#bcac92", "#e3ebe6": "#e9dfc9",
  "#c6d2cc": "#d3c6ad", "#9aa8a3": "#ac9c84", "#83938e": "#9c8c73",
  "#f8faf7": "#fcf7ea", "#dde5df": "#e5dac4", "#e6ece6": "#ece2cc",
  "#b0bfb8": "#c1b298", "#c3cfca": "#d0c3aa", "#e8efe6": "#efe6d2",
  "#c8d4ce": "#d4c7ae", "#9fb0a8": "#b0a088",
};

for (const file of process.argv.slice(2)) {
  let src = readFileSync(file, "utf8");
  let hits = 0;
  for (const [from, to] of Object.entries(MAP)) {
    const re = new RegExp(from, "gi");
    const found = src.match(re);
    if (found) { hits += found.length; src = src.replace(re, to); }
  }
  writeFileSync(file, src);
  console.log(`${file}: ${hits} swatches regraded`);
}
