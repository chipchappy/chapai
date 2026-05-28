import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const scriptDir = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(scriptDir, "..");
const inputPath = path.join(repoRoot, "packages", "content", "staging", "drug-cards", "nclex-high-yield.json");
const outputPath = path.join(repoRoot, "packages", "content", "staging", "drug-cards", "nclex-high-yield-index.json");

const cards = JSON.parse(fs.readFileSync(inputPath, "utf8").replace(/^\uFEFF/, ""));
if (!Array.isArray(cards)) {
  throw new Error("Drug card input must be an array");
}

const index = cards
  .map((card) => ({
    id: card.id,
    genericName: card.genericName,
    brandNames: Array.isArray(card.brandNames) ? card.brandNames : [],
  }))
  .sort((left, right) => left.genericName.localeCompare(right.genericName));

fs.writeFileSync(outputPath, `${JSON.stringify(index, null, 2)}\n`);
process.stdout.write(`wrote ${index.length} drug-card index entries\n`);
