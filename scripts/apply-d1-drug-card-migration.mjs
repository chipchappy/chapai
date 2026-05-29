import { spawnSync } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";

const scriptDir = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(scriptDir, "..");
const webDir = path.join(repoRoot, "apps", "web");

const statements = [
  {
    label: "drug_cards.table",
    sql: `
CREATE TABLE IF NOT EXISTS drug_cards (
  id TEXT PRIMARY KEY,
  generic_name TEXT NOT NULL,
  brand_names TEXT DEFAULT '[]',
  drug_class TEXT NOT NULL,
  mechanism TEXT,
  indications TEXT DEFAULT '[]',
  contraindications TEXT DEFAULT '[]',
  black_box_warning TEXT,
  source_name TEXT,
  source_href TEXT,
  priority_labs TEXT DEFAULT '[]',
  patient_teaching TEXT DEFAULT '[]',
  nursing_implications TEXT DEFAULT '[]',
  related_tags TEXT DEFAULT '[]',
  publish_state TEXT NOT NULL DEFAULT 'published',
  created_at INTEGER NOT NULL DEFAULT (unixepoch()),
  updated_at INTEGER NOT NULL DEFAULT (unixepoch())
)`.trim(),
  },
  {
    table: "drug_cards",
    column: "source_name",
    label: "drug_cards.source_name",
    sql: "ALTER TABLE drug_cards ADD COLUMN source_name TEXT",
  },
  {
    table: "drug_cards",
    column: "source_href",
    label: "drug_cards.source_href",
    sql: "ALTER TABLE drug_cards ADD COLUMN source_href TEXT",
  },
  {
    label: "idx_drug_cards_source_href",
    sql: "CREATE INDEX IF NOT EXISTS idx_drug_cards_source_href ON drug_cards(source_href)",
  },
  {
    label: "idx_drug_cards_generic_name",
    sql: "CREATE INDEX IF NOT EXISTS idx_drug_cards_generic_name ON drug_cards(generic_name)",
  },
  {
    label: "idx_drug_cards_drug_class",
    sql: "CREATE INDEX IF NOT EXISTS idx_drug_cards_drug_class ON drug_cards(drug_class)",
  },
  {
    label: "idx_drug_cards_publish_state",
    sql: "CREATE INDEX IF NOT EXISTS idx_drug_cards_publish_state ON drug_cards(publish_state)",
  },
];

function parseArgs(argv) {
  const options = { database: "", remote: false, config: "", dryRun: false };
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
    else if (arg === "--dry-run") options.dryRun = true;
    else throw new Error(`Unknown option: ${arg}`);
  }
  if (!options.database) throw new Error("Pass --database=<d1-name>");
  if (options.config && !path.isAbsolute(options.config)) {
    const repoRelative = path.resolve(repoRoot, options.config);
    const appRelative = path.resolve(webDir, options.config);
    options.config = fs.existsSync(repoRelative) ? repoRelative : appRelative;
  }
  return options;
}

function wranglerCommand(args) {
  if (process.platform === "win32") {
    return { bin: "cmd.exe", args: ["/d", "/s", "/c", "npx", ...args] };
  }
  return { bin: "npx", args };
}

function baseArgs(options) {
  const args = ["wrangler", "d1", "execute", options.database];
  if (options.remote) args.push("--remote");
  if (options.config) args.push("--config", options.config);
  return args;
}

function run(options, statement) {
  if (options.dryRun) {
    process.stdout.write(`[dry-run] ${statement.sql}\n`);
    return;
  }
  const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), "chapai-drug-card-migrate-"));
  const filePath = path.join(tmpDir, `${statement.label.replace(/[^a-z0-9_.-]/gi, "_")}.sql`);
  fs.writeFileSync(filePath, `${statement.sql};\n`, "utf8");
  const args = [...baseArgs(options), "--file", filePath];
  const command = wranglerCommand(args);
  try {
    const result = spawnSync(command.bin, command.args, {
      cwd: webDir,
      encoding: "utf8",
      stdio: ["ignore", "pipe", "pipe"],
    });
    const combined = `${result.stdout ?? ""}\n${result.stderr ?? ""}`;
    if (result.status === 0) {
      process.stdout.write(`applied: ${statement.label}\n`);
      return;
    }
    if (/duplicate column name/i.test(combined)) {
      process.stdout.write(`already present: ${statement.label}\n`);
      return;
    }
    process.stderr.write(combined);
    throw new Error(`Drug-card migration failed at ${statement.label}`);
  } finally {
    fs.rmSync(tmpDir, { recursive: true, force: true });
  }
}

const options = parseArgs(process.argv.slice(2));
for (const statement of statements) {
  run(options, statement);
}
