import { spawnSync } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { assertPublishableBatch } from "../packages/content/scripts/publication-quality-gate.mjs";
import { questionToRow } from "./sync-d1-question-bank.mjs";

const scriptDir = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(scriptDir, "..");
const webDir = path.join(repoRoot, "apps", "web");
const defaultBatchPath = path.join(
  repoRoot,
  "packages",
  "content",
  "reviews",
  "readiness-high-risk-2026-07-24.json",
);

export const REVIEW_UPDATE_COLUMNS = [
  "category",
  "subcategory",
  "difficulty",
  "stem",
  "options",
  "answer",
  "rationale",
  "structured_rationale",
  "distractor_rationales",
  "tags",
  "concept_notes",
  "provenance",
  "review_status",
  "revision",
  "publish_state",
  "visual_rationale",
  "references_json",
];

const PREFLIGHT_COLUMNS = [
  "id",
  ...REVIEW_UPDATE_COLUMNS,
];

function parseArgs(argv) {
  const options = {
    apply: false,
    batchPath: defaultBatchPath,
    config: "wrangler.jsonc",
    database: "",
    printSql: false,
    remote: false,
  };

  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];
    const readValue = () => {
      index += 1;
      if (index >= argv.length) throw new Error(`Missing value for ${arg}`);
      return argv[index];
    };

    if (arg === "--apply") options.apply = true;
    else if (arg === "--remote") options.remote = true;
    else if (arg === "--print-sql") options.printSql = true;
    else if (arg === "--batch") options.batchPath = path.resolve(readValue());
    else if (arg.startsWith("--batch=")) options.batchPath = path.resolve(arg.slice("--batch=".length));
    else if (arg === "--database") options.database = readValue();
    else if (arg.startsWith("--database=")) options.database = arg.slice("--database=".length);
    else if (arg === "--config") options.config = readValue();
    else if (arg.startsWith("--config=")) options.config = arg.slice("--config=".length);
    else throw new Error(`Unknown option: ${arg}`);
  }

  if (!options.database) {
    throw new Error("Pass --database=<d1-name>; the script is dry-run-only unless --apply is also present.");
  }
  return options;
}

function readJson(filePath) {
  return JSON.parse(fs.readFileSync(filePath, "utf8").replace(/^\uFEFF/, ""));
}

export function loadReviewBatch(filePath = defaultBatchPath) {
  const batch = readJson(filePath);
  if (batch.reviewKind !== "source-verification") {
    throw new Error("Clinical review batch must declare reviewKind=source-verification.");
  }
  if (batch.clinicalReviewStatus !== "pending") {
    throw new Error("This workflow must not represent source verification as completed clinician review.");
  }
  if (!Array.isArray(batch.questions) || batch.questions.length === 0) {
    throw new Error("Clinical review batch contains no questions.");
  }

  const ids = new Set();
  for (const question of batch.questions) {
    if (!question.expectedCurrent?.stem || !("answer" in question.expectedCurrent)) {
      throw new Error(`${question.id ?? "(missing-id)"} lacks an exact expectedCurrent precondition.`);
    }
    if (ids.has(question.id)) throw new Error(`Duplicate review item: ${question.id}`);
    ids.add(question.id);
    if (question.qualityMetadata?.evidenceStatus !== "source-verified") {
      throw new Error(`${question.id} is not marked source-verified.`);
    }
    if (question.qualityMetadata?.clinicalReviewStatus !== "pending") {
      throw new Error(`${question.id} must remain pending licensed clinical review.`);
    }
    if (question.qualityMetadata?.psychometricStatus !== "precalibration") {
      throw new Error(`${question.id} must remain psychometric precalibration.`);
    }
  }

  assertPublishableBatch(batch.questions);
  return batch;
}

function wranglerCommand(args) {
  if (process.platform === "win32") {
    return { bin: "cmd.exe", args: ["/d", "/s", "/c", "npx", ...args] };
  }
  return { bin: "npx", args };
}

function wranglerBaseArgs(options) {
  const args = ["wrangler", "d1", "execute", options.database];
  if (options.remote) args.push("--remote");
  if (options.config) args.push("--config", options.config);
  return args;
}

function runWrangler(options, extraArgs) {
  const command = wranglerCommand([...wranglerBaseArgs(options), ...extraArgs]);
  const result = spawnSync(command.bin, command.args, {
    cwd: webDir,
    encoding: "utf8",
    stdio: ["ignore", "pipe", "pipe"],
  });
  if (result.status !== 0) {
    if (result.error) process.stderr.write(`${result.error.message}\n`);
    process.stderr.write(result.stdout ?? "");
    process.stderr.write(result.stderr ?? "");
    throw new Error("Wrangler D1 command failed.");
  }
  return result.stdout ?? "";
}

function sqlValue(value) {
  if (value == null) return "NULL";
  if (typeof value === "number") return Number.isFinite(value) ? String(value) : "NULL";
  return `'${String(value).replaceAll("'", "''")}'`;
}

function answerKey(value) {
  let parsed = value;
  if (typeof value === "string") {
    try {
      parsed = JSON.parse(value);
    } catch {
      parsed = value;
    }
  }
  if (Array.isArray(parsed)) {
    return JSON.stringify(parsed.map(String).sort());
  }
  return JSON.stringify(String(parsed ?? ""));
}

function sameDatabaseValue(left, right) {
  if (left == null || right == null) return left == null && right == null;
  if (typeof right === "number") return Number(left) === right;
  return String(left) === String(right);
}

export function expectedStateIssues(current, question) {
  const expected = question.expectedCurrent;
  const issues = [];
  if (current.stem !== expected.stem) issues.push("stem");
  if (answerKey(current.answer) !== answerKey(expected.answer)) issues.push("answer");
  if (current.category !== expected.category) issues.push("category");
  if (current.review_status !== expected.reviewStatus) issues.push("review_status");
  if (current.publish_state !== expected.publishState) issues.push("publish_state");
  return issues;
}

export function desiredStateIssues(current, desiredRow) {
  return REVIEW_UPDATE_COLUMNS.filter((column) => (
    !sameDatabaseValue(current[column], desiredRow[column])
  ));
}

function fetchRows(options, ids) {
  const idList = ids.map(sqlValue).join(", ");
  const sql = `SELECT ${PREFLIGHT_COLUMNS.join(", ")} FROM questions WHERE id IN (${idList}) ORDER BY id;`;
  const output = runWrangler(options, ["--json", "--command", sql]);
  const payload = JSON.parse(output);
  return payload.flatMap((entry) => entry.results ?? []);
}

export function buildGuardedReviewSql(plans) {
  const statements = [];
  for (const plan of plans) {
    if (plan.alreadyApplied) continue;
    const assignments = REVIEW_UPDATE_COLUMNS
      .map((column) => `${column}=${sqlValue(plan.desiredRow[column])}`)
      .join(", ");
    const expected = plan.question.expectedCurrent;
    const predicates = [
      `id=${sqlValue(plan.question.id)}`,
      `stem=${sqlValue(expected.stem)}`,
      `answer=${sqlValue(typeof expected.answer === "string" ? expected.answer : JSON.stringify(expected.answer))}`,
      `category=${sqlValue(expected.category)}`,
      `review_status=${sqlValue(expected.reviewStatus)}`,
      `publish_state=${sqlValue(expected.publishState)}`,
    ];
    statements.push(`UPDATE questions SET ${assignments} WHERE ${predicates.join(" AND ")};`);
  }
  return `${statements.join("\n")}\n`;
}

function createPlans(batch, currentRows) {
  const currentById = new Map(currentRows.map((row) => [row.id, row]));
  const missing = batch.questions.filter((question) => !currentById.has(question.id));
  if (missing.length > 0) {
    throw new Error(`D1 is missing reviewed questions: ${missing.map((question) => question.id).join(", ")}`);
  }

  return batch.questions.map((question) => {
    const current = currentById.get(question.id);
    const desiredRow = questionToRow(question, batch);
    const desiredIssues = desiredStateIssues(current, desiredRow);
    const alreadyApplied = desiredIssues.length === 0;
    const expectedIssues = expectedStateIssues(current, question);
    if (!alreadyApplied && expectedIssues.length > 0) {
      throw new Error(
        `${question.id} failed optimistic preflight: ${expectedIssues.join(", ")}. `
        + "Refusing to overwrite a changed live row.",
      );
    }
    return {
      alreadyApplied,
      current,
      desiredIssues,
      desiredRow,
      question,
    };
  });
}

function runSqlFile(options, sql) {
  const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), "clarity-clinical-review-"));
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
  const batch = loadReviewBatch(options.batchPath);
  const ids = batch.questions.map((question) => question.id);
  const currentRows = fetchRows(options, ids);
  const plans = createPlans(batch, currentRows);
  const sql = buildGuardedReviewSql(plans);
  const pending = plans.filter((plan) => !plan.alreadyApplied);

  process.stdout.write(`${JSON.stringify({
    mode: options.apply ? "apply" : "dry-run",
    batchId: batch.batchId,
    database: options.database,
    remote: options.remote,
    reviewedItems: plans.length,
    pendingUpdates: pending.length,
    alreadyApplied: plans.length - pending.length,
    ids,
  }, null, 2)}\n`);

  if (options.printSql) process.stdout.write(sql);
  if (!options.apply || pending.length === 0) return;

  runSqlFile(options, sql);
  const postflightRows = fetchRows(options, ids);
  const postflightById = new Map(postflightRows.map((row) => [row.id, row]));
  const failures = plans.flatMap((plan) => {
    const current = postflightById.get(plan.question.id);
    if (!current) return [`${plan.question.id}:missing`];
    const issues = desiredStateIssues(current, plan.desiredRow);
    return issues.length > 0 ? [`${plan.question.id}:${issues.join(",")}`] : [];
  });
  if (failures.length > 0) {
    throw new Error(`D1 postflight failed: ${failures.join("; ")}`);
  }
  process.stdout.write(`verified: ${plans.length} source-reviewed questions match the release artifact\n`);
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  main();
}
