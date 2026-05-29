import { spawnSync } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";

const scriptDir = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(scriptDir, "..");
const webDir = path.join(repoRoot, "apps", "web");
const defaultInput = path.join(repoRoot, "packages", "content", "staging", "drug-cards", "nclex-high-yield.json");

const columns = [
  "id",
  "generic_name",
  "brand_names",
  "drug_class",
  "mechanism",
  "indications",
  "contraindications",
  "black_box_warning",
  "source_name",
  "source_href",
  "priority_labs",
  "patient_teaching",
  "nursing_implications",
  "related_tags",
  "publish_state",
  "updated_at",
];

function parseArgs(argv) {
  const options = {
    database: "",
    remote: false,
    config: "",
    input: defaultInput,
    chunkSize: 50,
    dryRun: false,
  };

  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];
    const readValue = () => {
      index += 1;
      if (index >= argv.length) throw new Error(`Missing value for ${arg}`);
      return argv[index];
    };

    if (arg === "--database") options.database = readValue();
    else if (arg.startsWith("--database=")) options.database = arg.slice("--database=".length);
    else if (arg === "--remote") options.remote = true;
    else if (arg === "--config") options.config = readValue();
    else if (arg.startsWith("--config=")) options.config = arg.slice("--config=".length);
    else if (arg === "--input") options.input = path.resolve(readValue());
    else if (arg.startsWith("--input=")) options.input = path.resolve(arg.slice("--input=".length));
    else if (arg === "--chunk-size") options.chunkSize = Number(readValue());
    else if (arg.startsWith("--chunk-size=")) options.chunkSize = Number(arg.slice("--chunk-size=".length));
    else if (arg === "--dry-run") options.dryRun = true;
    else throw new Error(`Unknown option: ${arg}`);
  }

  if (options.config && !path.isAbsolute(options.config)) {
    const repoRelative = path.resolve(repoRoot, options.config);
    const appRelative = path.resolve(webDir, options.config);
    options.config = fs.existsSync(repoRelative) ? repoRelative : appRelative;
  }

  if (!options.database && !options.dryRun) {
    throw new Error("Pass --database=<d1-name> or --dry-run");
  }
  if (!Number.isInteger(options.chunkSize) || options.chunkSize < 1) {
    throw new Error("--chunk-size must be a positive integer");
  }
  return options;
}

function sqlString(value) {
  if (value == null) return "NULL";
  return `'${String(value).replace(/'/g, "''")}'`;
}

function jsonText(value) {
  return JSON.stringify(Array.isArray(value) ? value : []);
}

function patientTeaching(card) {
  return card.nursingAssessments.filter((item) => /\b(teach|report|avoid|do not|separate|consistent|follow-up)\b/i.test(item));
}

function relatedTags(card) {
  return [
    card.nclexHighYield === false ? null : "nclex-high-yield",
    card.class,
    ...card.genericName.split(/\s+/),
  ].filter(Boolean);
}

function readCards(input) {
  const cards = JSON.parse(fs.readFileSync(input, "utf8").replace(/^\uFEFF/, ""));
  if (!Array.isArray(cards)) {
    throw new Error("Drug card input must be an array");
  }

  const ids = new Set();
  for (const card of cards) {
    for (const key of ["id", "genericName", "class", "mechanism"]) {
      if (typeof card[key] !== "string" || !card[key].trim()) {
        throw new Error(`Drug card missing ${key}: ${JSON.stringify(card)}`);
      }
    }
    for (const key of ["brandNames", "priorityLabs", "nursingAssessments", "contraindications"]) {
      if (!Array.isArray(card[key])) {
        throw new Error(`Drug card ${card.id} must include ${key}[]`);
      }
    }
    if (ids.has(card.id)) {
      throw new Error(`Duplicate drug card id: ${card.id}`);
    }
    ids.add(card.id);
  }
  return cards;
}

function toValues(card) {
  return [
    sqlString(card.id),
    sqlString(card.genericName),
    sqlString(jsonText(card.brandNames)),
    sqlString(card.class),
    sqlString(card.mechanism),
    sqlString(jsonText(card.indications)),
    sqlString(jsonText(card.contraindications)),
    sqlString(card.blackBoxWarning ?? null),
    sqlString(card.sourceName ?? null),
    sqlString(card.sourceHref ?? null),
    sqlString(jsonText(card.priorityLabs)),
    sqlString(jsonText(patientTeaching(card))),
    sqlString(jsonText(card.nursingAssessments)),
    sqlString(jsonText(relatedTags(card))),
    sqlString("published"),
    "(unixepoch())",
  ].join(", ");
}

function buildUpsertSql(cards) {
  const values = cards.map((card) => `(${toValues(card)})`).join(",\n");
  return `INSERT OR REPLACE INTO drug_cards (${columns.join(", ")}) VALUES\n${values};`;
}

function wranglerCommand(args) {
  if (process.platform === "win32") {
    return { bin: "cmd.exe", args: ["/d", "/s", "/c", "npx", ...args] };
  }
  return { bin: "npx", args };
}

function executeSql(options, sql, label) {
  if (options.dryRun) {
    process.stdout.write(`[dry-run] ${label}\n${sql}\n`);
    return;
  }

  const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), "chapai-drug-cards-"));
  const filePath = path.join(tmpDir, `${label}.sql`);
  fs.writeFileSync(filePath, sql);
  const args = ["wrangler", "d1", "execute", options.database, "--file", filePath];
  if (options.remote) args.push("--remote");
  if (options.config) args.push("--config", options.config);
  const command = wranglerCommand(args);
  const result = spawnSync(command.bin, command.args, {
    cwd: webDir,
    encoding: "utf8",
    stdio: ["ignore", "pipe", "pipe"],
  });

  if (result.status !== 0) {
    if (result.error) process.stderr.write(`${result.error.message}\n`);
    process.stderr.write(result.stdout ?? "");
    process.stderr.write(result.stderr ?? "");
    throw new Error(`Drug-card seed failed at ${label}`);
  }
  process.stdout.write(result.stdout ?? "");
}

const options = parseArgs(process.argv.slice(2));
const cards = readCards(options.input);
for (let start = 0; start < cards.length; start += options.chunkSize) {
  const chunk = cards.slice(start, start + options.chunkSize);
  executeSql(options, buildUpsertSql(chunk), `drug-cards-${start + 1}-${start + chunk.length}`);
}
process.stdout.write(`seeded drug cards: ${cards.length}\n`);
