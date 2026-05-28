import { spawnSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const scriptDir = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(scriptDir, "..");
const webDir = path.join(repoRoot, "apps", "web");

const statements = [
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
  const args = [...baseArgs(options), "--command", statement.sql];
  const command = wranglerCommand(args);
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
}

const options = parseArgs(process.argv.slice(2));
for (const statement of statements) {
  run(options, statement);
}
