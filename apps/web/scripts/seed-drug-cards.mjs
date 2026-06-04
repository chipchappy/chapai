#!/usr/bin/env node
// Bulk-seed drug_cards from packages/content/drug-cards-seed.json.
// Usage:
//   npm run seed:drug-cards -- --remote     # prod D1
//   npm run seed:drug-cards                  # local D1
//
// Each row uses ON CONFLICT(id) DO UPDATE so re-running patches existing rows
// instead of erroring. Keep the JSON catalog as the source of truth.

import { execSync } from "node:child_process";
import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, "..", "..", "..");
const SEED_PATH = join(ROOT, "packages", "content", "drug-cards-seed.json");
const TMP_DIR = join(__dirname, "..", ".tmp");

const args = process.argv.slice(2);
const remote = args.includes("--remote");
const dbName = args[args.indexOf("--database") + 1] || "chapai-prod";

function escapeSql(value) {
  if (value === null || value === undefined) return "NULL";
  return `'${String(value).replace(/'/g, "''")}'`;
}

function rowToInsert(card) {
  const cols = [
    "id",
    "generic_name",
    "brand_names",
    "drug_class",
    "mechanism",
    "indications",
    "contraindications",
    "black_box_warning",
    "priority_labs",
    "patient_teaching",
    "nursing_implications",
    "related_tags",
    "publish_state",
  ];
  const values = [
    card.id,
    card.generic_name,
    card.brand_names ?? null,
    card.drug_class,
    card.mechanism ?? null,
    card.indications ?? null,
    card.contraindications ?? null,
    card.black_box_warning ?? null,
    card.priority_labs ?? null,
    card.patient_teaching ?? null,
    card.nursing_implications ?? null,
    card.related_tags ?? null,
    "published",
  ].map(escapeSql);

  const updateSet = cols
    .filter((c) => c !== "id")
    .map((c) => `${c} = excluded.${c}`)
    .join(", ");

  return `INSERT INTO drug_cards (${cols.join(", ")}, updated_at) VALUES (${values.join(", ")}, unixepoch())
ON CONFLICT(id) DO UPDATE SET ${updateSet}, updated_at = unixepoch();`;
}

async function main() {
  console.log(`[seed-drug-cards] reading ${SEED_PATH}`);
  const seed = JSON.parse(readFileSync(SEED_PATH, "utf8"));
  if (!Array.isArray(seed.cards)) {
    console.error("[seed-drug-cards] seed.cards must be an array");
    process.exit(1);
  }
  console.log(`[seed-drug-cards] ${seed.cards.length} cards to upsert`);

  const statements = seed.cards.map(rowToInsert).join("\n");
  mkdirSync(TMP_DIR, { recursive: true });
  const sqlPath = join(TMP_DIR, "seed-drug-cards.sql");
  writeFileSync(sqlPath, statements, "utf8");

  const flag = remote ? "--remote" : "--local";
  const cmd = `npx wrangler d1 execute ${dbName} ${flag} --file=${sqlPath}`;
  console.log(`[seed-drug-cards] running: ${cmd}`);
  execSync(cmd, { stdio: "inherit" });
  console.log(`[seed-drug-cards] done.`);
}

main().catch((err) => {
  console.error("[seed-drug-cards] failed:", err);
  process.exit(1);
});
