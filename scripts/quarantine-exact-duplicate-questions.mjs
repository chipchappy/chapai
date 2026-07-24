import { spawnSync } from "node:child_process";
import crypto from "node:crypto";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";

const scriptDir = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(scriptDir, "..");
const webDir = path.join(repoRoot, "apps", "web");
const defaultPlanPath = path.join(
  repoRoot,
  "packages",
  "content",
  "reviews",
  "exact-duplicate-quarantine-2026-07-24.json",
);

const PLACEHOLDER_RATIONALE = /\b(?:n\/a|not applicable|no rationale|rationale unavailable|this is (?:a )?correct choice)\b/i;

function parseArgs(argv) {
  const options = {
    apply: false,
    config: "wrangler.jsonc",
    database: "",
    planPath: defaultPlanPath,
    writePlan: false,
  };

  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];
    const readValue = () => {
      index += 1;
      if (index >= argv.length) throw new Error(`Missing value for ${arg}`);
      return argv[index];
    };
    if (arg === "--apply") options.apply = true;
    else if (arg === "--write-plan") options.writePlan = true;
    else if (arg === "--remote") continue;
    else if (arg === "--database") options.database = readValue();
    else if (arg.startsWith("--database=")) options.database = arg.slice("--database=".length);
    else if (arg === "--config") options.config = readValue();
    else if (arg.startsWith("--config=")) options.config = arg.slice("--config=".length);
    else if (arg === "--plan") options.planPath = path.resolve(readValue());
    else if (arg.startsWith("--plan=")) options.planPath = path.resolve(arg.slice("--plan=".length));
    else throw new Error(`Unknown option: ${arg}`);
  }
  if (!options.database) throw new Error("Pass --database=<d1-name>.");
  if (options.apply && options.writePlan) throw new Error("Write and apply must be separate review steps.");
  return options;
}

function sqlValue(value) {
  if (value == null) return "NULL";
  return `'${String(value).replace(/'/g, "''")}'`;
}

function wranglerCommand(args) {
  return process.platform === "win32"
    ? { bin: "cmd.exe", args: ["/d", "/s", "/c", "npx", ...args] }
    : { bin: "npx", args };
}

function runWrangler(options, extraArgs) {
  const command = wranglerCommand([
    "wrangler",
    "d1",
    "execute",
    options.database,
    "--remote",
    "--config",
    options.config,
    ...extraArgs,
  ]);
  const result = spawnSync(command.bin, command.args, {
    cwd: webDir,
    encoding: "utf8",
    maxBuffer: 30 * 1024 * 1024,
    stdio: ["ignore", "pipe", "pipe"],
  });
  if (result.status !== 0) {
    throw new Error((result.error?.message || result.stderr || result.stdout || "wrangler failed").trim());
  }
  return result.stdout ?? "";
}

function parseJson(value, fallback) {
  if (!value) return fallback;
  try {
    return JSON.parse(value);
  } catch {
    return fallback;
  }
}

function wordCount(value) {
  return String(value ?? "").trim().split(/\s+/).filter(Boolean).length;
}

function evidenceRank(row) {
  const provenance = parseJson(row.provenance, {});
  const status = provenance?.qualityMetadata?.evidenceStatus;
  if (status === "clinician-reviewed") return 2;
  if (status === "source-verified") return 1;
  return 0;
}

function hasJsonContent(value) {
  const parsed = parseJson(value, null);
  if (Array.isArray(parsed)) return parsed.length > 0;
  return Boolean(parsed && typeof parsed === "object" && Object.keys(parsed).length > 0);
}

export function duplicateCandidateScore(row) {
  const words = wordCount(row.rationale);
  let score = 0;
  if (row.review_status === "final-curated-live") score += 25;
  else if (row.review_status === "curated-live") score += 14;
  else if (row.review_status === "approved") score += 6;

  score += evidenceRank(row) === 2 ? 12 : evidenceRank(row) === 1 ? 6 : 0;
  if (words >= 140) score += 20;
  else if (words >= 90) score += 16;
  else if (words >= 55) score += 11;
  else if (words >= 30) score += 6;
  if (words < 20) score -= 20;
  if (PLACEHOLDER_RATIONALE.test(String(row.rationale ?? ""))) score -= 50;
  if (hasJsonContent(row.structured_rationale)) score += 20;
  if (hasJsonContent(row.distractor_rationales)) score += 15;
  if (hasJsonContent(row.references_json)) score += 10;
  if (hasJsonContent(row.visual_rationale)) score += 5;
  return score;
}

function answerIds(answer) {
  const parsed = parseJson(answer, answer);
  if (Array.isArray(parsed)) return parsed.map(String);
  if (parsed && typeof parsed === "object") return [JSON.stringify(parsed)];
  return [String(parsed ?? "")];
}

export function answerMeaning(row) {
  const options = parseJson(row.options, []);
  const optionMap = new Map(
    (Array.isArray(options) ? options : [])
      .filter((option) => option && typeof option === "object")
      .map((option) => [String(option.id).toLowerCase(), String(option.text).trim().toLowerCase()]),
  );
  return answerIds(row.answer)
    .map((id) => optionMap.get(id.toLowerCase()) ?? id.trim().toLowerCase())
    .sort()
    .join(" || ");
}

function contentFingerprint(row) {
  return crypto.createHash("sha256").update(JSON.stringify({
    id: row.id,
    category: row.category,
    stem: row.stem,
    answer: row.answer,
  })).digest("hex");
}

function stemKey(stem) {
  return String(stem ?? "").trim().toLowerCase();
}

function planRow(row) {
  return {
    id: row.id,
    category: row.category,
    contentFingerprint: contentFingerprint(row),
    expectedPublishState: row.publish_state,
    expectedReviewStatus: row.review_status,
    qualityScore: duplicateCandidateScore(row),
  };
}

export function buildDuplicatePlan(rows, metadata = {}) {
  const grouped = new Map();
  for (const row of rows) {
    const key = stemKey(row.stem);
    const group = grouped.get(key) ?? [];
    group.push(row);
    grouped.set(key, group);
  }

  const groups = [];
  for (const [key, candidates] of grouped) {
    if (candidates.length < 2) continue;
    const ranked = [...candidates].sort((left, right) => (
      duplicateCandidateScore(right) - duplicateCandidateScore(left)
      || wordCount(right.rationale) - wordCount(left.rationale)
      || left.id.localeCompare(right.id)
    ));
    const answerMeanings = new Set(ranked.map(answerMeaning));
    const verifiedFinal = ranked.filter((row) => (
      row.review_status === "final-curated-live" && evidenceRank(row) > 0
    ));
    const winner = answerMeanings.size === 1 || verifiedFinal.length === 1
      ? (verifiedFinal[0] ?? ranked[0])
      : null;
    const quarantined = ranked.filter((row) => row.id !== winner?.id);
    groups.push({
      stemHash: crypto.createHash("sha256").update(key).digest("hex"),
      answerConflict: answerMeanings.size > 1,
      winner: winner ? planRow(winner) : null,
      quarantined: quarantined.map(planRow),
    });
  }

  groups.sort((left, right) => left.stemHash.localeCompare(right.stemHash));
  const quarantinedRows = groups.reduce((sum, group) => sum + group.quarantined.length, 0);
  const fullyQuarantinedGroups = groups.filter((group) => !group.winner).length;
  const distinctPublishedAfter = Number(metadata.distinctPublishedBefore ?? 0) - fullyQuarantinedGroups;
  if (distinctPublishedAfter > 0 && distinctPublishedAfter < 4_000) {
    throw new Error(`Deduplication would leave only ${distinctPublishedAfter} distinct published stems.`);
  }

  return {
    schemaVersion: 1,
    batchId: "exact-duplicate-quarantine-2026-07-24",
    reviewKind: "exact-stem-deduplication",
    createdAt: new Date().toISOString(),
    evidenceNotice: "Exact standalone-stem duplicates are quality-ranked. Conflicting groups without one source-verified final item are fully quarantined for review. No content is deleted.",
    desiredState: {
      publishState: "draft",
      reviewStatus: "needs-revision",
    },
    counts: {
      duplicateGroups: groups.length,
      answerConflictGroups: groups.filter((group) => group.answerConflict).length,
      fullyQuarantinedGroups,
      quarantinedRows,
      distinctPublishedBefore: Number(metadata.distinctPublishedBefore ?? 0),
      distinctPublishedAfter,
    },
    groups,
  };
}

function discoverDuplicateRows(options) {
  const sql = "WITH duplicate_stems AS (SELECT lower(trim(stem)) AS stem_key FROM questions WHERE exam='nclex' AND publish_state='published' AND case_study_id IS NULL GROUP BY stem_key HAVING COUNT(*) > 1) SELECT q.id,q.category,q.stem,q.options,q.answer,q.rationale,q.structured_rationale,q.distractor_rationales,q.references_json,q.visual_rationale,q.provenance,q.review_status,q.publish_state,q.revision FROM questions q JOIN duplicate_stems d ON lower(trim(q.stem))=d.stem_key WHERE q.exam='nclex' AND q.publish_state='published' AND q.case_study_id IS NULL ORDER BY d.stem_key,q.id;";
  const payload = JSON.parse(runWrangler(options, ["--json", "--command", sql]));
  return payload.flatMap((entry) => entry.results ?? []);
}

function fetchRowsByIds(options, ids) {
  const rows = [];
  for (let index = 0; index < ids.length; index += 40) {
    const chunk = ids.slice(index, index + 40);
    const sql = `SELECT id,category,stem,answer,review_status,publish_state,revision FROM questions WHERE id IN (${chunk.map(sqlValue).join(",")}) ORDER BY id;`;
    const payload = JSON.parse(runWrangler(options, ["--json", "--command", sql]));
    rows.push(...payload.flatMap((entry) => entry.results ?? []));
  }
  return rows;
}

function fetchDistinctPublishedCount(options) {
  const sql = "SELECT COUNT(DISTINCT lower(trim(stem))) AS count FROM questions WHERE exam='nclex' AND publish_state='published';";
  const payload = JSON.parse(runWrangler(options, ["--json", "--command", sql]));
  return Number(payload[0]?.results?.[0]?.count ?? 0);
}

function loadPlan(planPath) {
  const plan = JSON.parse(fs.readFileSync(planPath, "utf8").replace(/^\uFEFF/, ""));
  if (plan.reviewKind !== "exact-stem-deduplication") throw new Error("Invalid duplicate plan.");
  return plan;
}

function flattenPlan(plan) {
  return plan.groups.flatMap((group) => [
    ...(group.winner ? [{ ...group.winner, action: "keep" }] : []),
    ...group.quarantined.map((row) => ({ ...row, action: "quarantine" })),
  ]);
}

function preflightPlan(plan, rows) {
  const byId = new Map(rows.map((row) => [row.id, row]));
  return flattenPlan(plan).map((planned) => {
    const row = byId.get(planned.id);
    if (!row) throw new Error(`${planned.id} is missing from D1.`);
    if (contentFingerprint(row) !== planned.contentFingerprint) {
      throw new Error(`${planned.id} changed after duplicate review; refusing to continue.`);
    }
    const alreadyApplied = planned.action === "quarantine"
      && row.publish_state === plan.desiredState.publishState
      && row.review_status === plan.desiredState.reviewStatus;
    if (!alreadyApplied && (
      row.publish_state !== planned.expectedPublishState
      || row.review_status !== planned.expectedReviewStatus
    )) {
      throw new Error(`${planned.id} state changed after duplicate review; refusing to continue.`);
    }
    if (planned.action === "keep" && row.publish_state !== "published") {
      throw new Error(`${planned.id} selected winner is no longer published.`);
    }
    return { alreadyApplied, planned, row };
  });
}

function buildSql(plan, preflight) {
  return `${preflight
    .filter(({ alreadyApplied, planned }) => planned.action === "quarantine" && !alreadyApplied)
    .map(({ planned, row }) => `UPDATE questions
      SET publish_state=${sqlValue(plan.desiredState.publishState)},
          review_status=${sqlValue(plan.desiredState.reviewStatus)},
          revision=COALESCE(revision,0)+1
      WHERE id=${sqlValue(row.id)}
        AND category=${sqlValue(row.category)}
        AND stem=${sqlValue(row.stem)}
        AND answer=${sqlValue(row.answer)}
        AND publish_state=${sqlValue(planned.expectedPublishState)}
        AND review_status=${sqlValue(planned.expectedReviewStatus)};`)
    .join("\n")}\n`;
}

function runSqlFile(options, sql) {
  const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), "clarity-exact-dedupe-"));
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
  if (options.writePlan) {
    const rows = discoverDuplicateRows(options);
    const distinctPublishedBefore = fetchDistinctPublishedCount(options);
    const plan = buildDuplicatePlan(rows, { distinctPublishedBefore });
    fs.mkdirSync(path.dirname(options.planPath), { recursive: true });
    fs.writeFileSync(options.planPath, `${JSON.stringify(plan, null, 2)}\n`, "utf8");
    process.stdout.write(`${JSON.stringify({ mode: "write-plan", planPath: options.planPath, ...plan.counts }, null, 2)}\n`);
    return;
  }

  const plan = loadPlan(options.planPath);
  const plannedRows = flattenPlan(plan);
  const currentRows = fetchRowsByIds(options, plannedRows.map((row) => row.id));
  const preflight = preflightPlan(plan, currentRows);
  const pending = preflight.filter(({ alreadyApplied, planned }) => (
    planned.action === "quarantine" && !alreadyApplied
  ));
  process.stdout.write(`${JSON.stringify({
    mode: options.apply ? "apply" : "dry-run",
    batchId: plan.batchId,
    database: options.database,
    ...plan.counts,
    pendingUpdates: pending.length,
    alreadyApplied: plan.counts.quarantinedRows - pending.length,
  }, null, 2)}\n`);
  if (!options.apply || pending.length === 0) return;

  runSqlFile(options, buildSql(plan, preflight));
  const postflight = preflightPlan(
    plan,
    fetchRowsByIds(options, plannedRows.map((row) => row.id)),
  );
  const failures = postflight.filter(({ alreadyApplied, planned }) => (
    planned.action === "quarantine" && !alreadyApplied
  ));
  if (failures.length > 0) {
    throw new Error(`Duplicate quarantine postflight failed for ${failures.map(({ planned }) => planned.id).join(", ")}`);
  }
  const duplicateRowsAfter = discoverDuplicateRows(options);
  if (duplicateRowsAfter.length > 0) {
    throw new Error(`${duplicateRowsAfter.length} published rows still belong to exact duplicate groups.`);
  }
  process.stdout.write(`verified: ${plan.counts.quarantinedRows} duplicate rows are excluded; no exact published stem duplicates remain\n`);
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  main();
}
