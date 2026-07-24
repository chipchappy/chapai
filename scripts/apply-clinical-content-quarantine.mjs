import { spawnSync } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";

const scriptDir = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(scriptDir, "..");
const webDir = path.join(repoRoot, "apps", "web");
const defaultBatchPath = path.join(
  repoRoot,
  "packages",
  "content",
  "reviews",
  "readiness-clinical-quarantine-2026-07-24.json",
);

function parseArgs(argv) {
  const options = {
    apply: false,
    batchPath: defaultBatchPath,
    config: "wrangler.jsonc",
    database: "",
  };

  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];
    const readValue = () => {
      index += 1;
      if (index >= argv.length) throw new Error(`Missing value for ${arg}`);
      return argv[index];
    };
    if (arg === "--apply") options.apply = true;
    else if (arg === "--database") options.database = readValue();
    else if (arg.startsWith("--database=")) options.database = arg.slice("--database=".length);
    else if (arg === "--config") options.config = readValue();
    else if (arg.startsWith("--config=")) options.config = arg.slice("--config=".length);
    else if (arg === "--batch") options.batchPath = path.resolve(readValue());
    else if (arg.startsWith("--batch=")) options.batchPath = path.resolve(arg.slice("--batch=".length));
    else if (arg !== "--remote") throw new Error(`Unknown option: ${arg}`);
  }

  if (!options.database) {
    throw new Error("Pass --database=<d1-name>; the script is dry-run-only unless --apply is present.");
  }
  return options;
}

function sqlValue(value) {
  if (value == null) return "NULL";
  if (typeof value === "number") return String(value);
  return `'${String(value).replace(/'/g, "''")}'`;
}

function runWrangler(options, args) {
  const wranglerArgs = [
    "wrangler",
    "d1",
    "execute",
    options.database,
    "--remote",
    "--config",
    options.config,
    ...args,
  ];
  const command = process.platform === "win32"
    ? { bin: "cmd.exe", args: ["/d", "/s", "/c", "npx", ...wranglerArgs] }
    : { bin: "npx", args: wranglerArgs };
  const result = spawnSync(
    command.bin,
    command.args,
    {
      cwd: webDir,
      encoding: "utf8",
      env: process.env,
      maxBuffer: 20 * 1024 * 1024,
    },
  );
  if (result.status !== 0) {
    throw new Error((result.error?.message || result.stderr || result.stdout || "wrangler failed").trim());
  }
  return result.stdout;
}

export function loadQuarantineBatch(filePath = defaultBatchPath) {
  const batch = JSON.parse(fs.readFileSync(filePath, "utf8").replace(/^\uFEFF/, ""));
  if (batch.reviewKind !== "clinical-risk-quarantine") {
    throw new Error("Quarantine batch must declare reviewKind=clinical-risk-quarantine.");
  }
  if (!Array.isArray(batch.questions) || batch.questions.length === 0) {
    throw new Error("Quarantine batch has no questions.");
  }
  if (new Set(batch.questions.map((question) => question.id)).size !== batch.questions.length) {
    throw new Error("Quarantine batch contains duplicate IDs.");
  }
  return batch;
}

export function quarantinePreflightIssues(row, question, desiredState) {
  if (!row) return ["missing"];
  if (
    row.publish_state === desiredState.publishState
    && row.review_status === desiredState.reviewStatus
  ) {
    return [];
  }

  const issues = [];
  if (row.publish_state !== "published") issues.push("publish_state");
  if (row.review_status !== "curated-live") issues.push("review_status");
  if (row.category !== question.expectedCategory) issues.push("category");
  const searchable = `${row.stem ?? ""} ${row.options ?? ""} ${row.rationale ?? ""}`.toLowerCase();
  for (const pattern of question.requiredPatterns) {
    if (!searchable.includes(String(pattern).toLowerCase())) issues.push(`pattern:${pattern}`);
  }
  return issues;
}

function fetchRows(options, ids) {
  const sql = `SELECT id, category, stem, options, answer, rationale, review_status, publish_state, revision FROM questions WHERE id IN (${ids.map(sqlValue).join(", ")}) ORDER BY id;`;
  const payload = JSON.parse(runWrangler(options, ["--json", "--command", sql]));
  return payload.flatMap((entry) => entry.results ?? []);
}

export function buildGuardedQuarantineSql(plans, desiredState) {
  return `${plans
    .filter((plan) => !plan.alreadyApplied)
    .map(({ row }) => `UPDATE questions
      SET publish_state=${sqlValue(desiredState.publishState)},
          review_status=${sqlValue(desiredState.reviewStatus)},
          revision=COALESCE(revision, 0) + 1
      WHERE id=${sqlValue(row.id)}
        AND category=${sqlValue(row.category)}
        AND stem=${sqlValue(row.stem)}
        AND answer=${sqlValue(row.answer)}
        AND review_status='curated-live'
        AND publish_state='published';`)
    .join("\n")}\n`;
}

function runSqlFile(options, sql) {
  const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), "clarity-clinical-quarantine-"));
  const filePath = path.join(tempDir, "apply.sql");
  try {
    fs.writeFileSync(filePath, sql, "utf8");
    return runWrangler(options, ["--file", filePath]);
  } finally {
    fs.rmSync(tempDir, { force: true, recursive: true });
  }
}

function main() {
  const options = parseArgs(process.argv.slice(2));
  const batch = loadQuarantineBatch(options.batchPath);
  const ids = batch.questions.map((question) => question.id);
  const currentRows = fetchRows(options, ids);
  const currentById = new Map(currentRows.map((row) => [row.id, row]));
  const plans = batch.questions.map((question) => {
    const row = currentById.get(question.id);
    const issues = quarantinePreflightIssues(row, question, batch.desiredState);
    if (issues.length > 0) {
      throw new Error(`${question.id} failed quarantine preflight: ${issues.join(", ")}`);
    }
    return {
      alreadyApplied: row.publish_state === batch.desiredState.publishState
        && row.review_status === batch.desiredState.reviewStatus,
      question,
      row,
    };
  });
  const pending = plans.filter((plan) => !plan.alreadyApplied);

  process.stdout.write(`${JSON.stringify({
    mode: options.apply ? "apply" : "dry-run",
    batchId: batch.batchId,
    database: options.database,
    quarantinedItems: plans.length,
    pendingUpdates: pending.length,
    alreadyApplied: plans.length - pending.length,
    ids,
  }, null, 2)}\n`);

  if (!options.apply || pending.length === 0) return;
  runSqlFile(options, buildGuardedQuarantineSql(plans, batch.desiredState));

  const postflight = fetchRows(options, ids);
  const failures = postflight.filter((row) => (
    row.publish_state !== batch.desiredState.publishState
    || row.review_status !== batch.desiredState.reviewStatus
  ));
  if (postflight.length !== ids.length || failures.length > 0) {
    throw new Error(`Quarantine postflight failed for ${failures.map((row) => row.id).join(", ") || "missing rows"}`);
  }
  process.stdout.write(`verified: ${ids.length} high-risk questions are excluded from student delivery\n`);
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  main();
}
