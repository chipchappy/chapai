import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { spawnSync } from "node:child_process";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(__dirname, "..");
const webRoot = path.join(repoRoot, "apps", "web");
const migrationFile = path.join(repoRoot, "packages", "db", "drizzle", "migration-0001.sql");
const contentRoot = path.join(repoRoot, "packages", "content", "questions");
const syncAuthoredAt = Math.floor(Date.now() / 1000);

function parseArgs(argv) {
  const options = {
    database: "chapai-prod",
    remote: false,
    applyMigration: true,
    resetQuestions: false,
    batchSize: 20,
    nclexCanonicalFile: null,
    pruneStaleQuestions: false,
  };

  for (const arg of argv) {
    if (arg === "--remote") {
      options.remote = true;
    } else if (arg === "--local") {
      options.remote = false;
    } else if (arg === "--skip-migration") {
      options.applyMigration = false;
    } else if (arg === "--reset-questions") {
      options.resetQuestions = true;
    } else if (arg.startsWith("--database=")) {
      options.database = arg.slice("--database=".length);
    } else if (arg.startsWith("--batch-size=")) {
      const value = Number(arg.slice("--batch-size=".length));
      if (Number.isFinite(value) && value > 0) {
        options.batchSize = Math.max(1, Math.floor(value));
      }
    } else if (arg.startsWith("--nclex-canonical-file=")) {
      options.nclexCanonicalFile = arg.slice("--nclex-canonical-file=".length);
    } else if (arg === "--prune-stale-questions") {
      options.pruneStaleQuestions = true;
    }
  }

  return options;
}

function readJsonArray(filePath) {
  return JSON.parse(fs.readFileSync(filePath, "utf8"));
}

function loadQuestionDirectory(exam, options) {
  const dirPath = path.join(contentRoot, exam, "live");
  if (!fs.existsSync(dirPath)) {
    return [];
  }

  if (exam === "nclex") {
    const canonicalFile = options.nclexCanonicalFile
      ? path.resolve(repoRoot, options.nclexCanonicalFile)
      : path.join(dirPath, "reviewed-curated-live.unique.json");
    if (fs.existsSync(canonicalFile)) {
      return readJsonArray(canonicalFile).map((question) => ({
        ...question,
        exam,
        sourcePath: question.sourcePath ?? canonicalFile.replaceAll("\\", "/"),
      }));
    }
  }

  const merged = new Map();
  for (const file of fs.readdirSync(dirPath).filter((entry) => entry.endsWith(".json")).sort()) {
    const fullPath = path.join(dirPath, file);
    for (const question of readJsonArray(fullPath)) {
      merged.set(question.id, {
        ...question,
        exam,
        sourcePath: question.sourcePath ?? fullPath.replaceAll("\\", "/"),
      });
    }
  }

  return Array.from(merged.values());
}

function sqlEscape(value) {
  return String(value).replace(/'/g, "''");
}

function sqlValue(value) {
  if (value === null || value === undefined) {
    return "NULL";
  }
  if (typeof value === "number") {
    return Number.isFinite(value) ? String(value) : "NULL";
  }
  return `'${sqlEscape(value)}'`;
}

function jsonOrNull(value) {
  if (value === null || value === undefined) {
    return null;
  }
  if (Array.isArray(value) && value.length === 0) {
    return null;
  }
  if (typeof value === "object" && Object.keys(value).length === 0) {
    return null;
  }
  return JSON.stringify(value);
}

function normalizeQuestions(options) {
  const questions = [...loadQuestionDirectory("ccrn", options), ...loadQuestionDirectory("nclex", options)];

  return questions.map((question) => ({
    id: question.id,
    exam: question.exam,
    type: question.type ?? "mcq",
    category: question.category,
    subcategory: question.subcategory ?? null,
    difficulty: typeof question.difficulty === "number" ? question.difficulty : null,
    stem: question.stem,
    options: JSON.stringify(question.options ?? []),
    answer: Array.isArray(question.answer) || (question.answer && typeof question.answer === "object")
      ? JSON.stringify(question.answer)
      : question.answer,
    rationale: question.rationale,
    deepRationale: question.deepRationale ?? null,
    deepRationaleAuthoredAt: question.deepRationale
      ? (typeof question.deepRationaleAuthoredAt === "number" ? question.deepRationaleAuthoredAt : syncAuthoredAt)
      : null,
    distractorRationales: question.distractorRationales ? JSON.stringify(question.distractorRationales) : null,
    tags: JSON.stringify(question.tags ?? []),
    blueprintPct: typeof question.blueprintPct === "number" ? question.blueprintPct : null,
    conceptNotes: JSON.stringify(question.conceptNotes ?? []),
    provenance: question.provenance ?? question.sourcePath ?? null,
    reviewStatus: question.reviewStatus ?? "approved",
    revision: typeof question.revision === "number" ? question.revision : 1,
    publishState: question.publishState ?? "published",
    scenarioTitle: question.scenarioTitle ?? null,
    scenario: question.scenario ?? null,
    additionalInfo: question.additionalInfo ?? null,
    exhibits: jsonOrNull(question.exhibits),
    chartReview: jsonOrNull(question.chartReview),
    matrixColumns: jsonOrNull(question.matrixColumns),
    matrixRows: jsonOrNull(question.matrixRows),
    visualRationale: jsonOrNull(question.visualRationale),
    referencesJson: jsonOrNull(question.references),
    correctOrder: Array.isArray(question.correctOrder) ? JSON.stringify(question.correctOrder) : null,
  }));
}

function buildBatchSql(rows) {
  return rows.map((row) => {
    const values = `(
${[
  sqlValue(row.id),
  sqlValue(row.exam),
  sqlValue(row.type),
  sqlValue(row.category),
  sqlValue(row.subcategory),
  sqlValue(row.difficulty),
  sqlValue(row.stem),
  sqlValue(row.options),
  sqlValue(row.answer),
  sqlValue(row.rationale),
  sqlValue(row.deepRationale),
  sqlValue(row.deepRationaleAuthoredAt),
  sqlValue(row.distractorRationales),
  sqlValue(row.tags),
  sqlValue(row.blueprintPct),
  sqlValue(row.conceptNotes),
  sqlValue(row.provenance),
  sqlValue(row.reviewStatus),
  sqlValue(row.revision),
  sqlValue(row.publishState),
  sqlValue(row.scenarioTitle),
  sqlValue(row.scenario),
  sqlValue(row.additionalInfo),
  sqlValue(row.exhibits),
  sqlValue(row.chartReview),
  sqlValue(row.matrixColumns),
  sqlValue(row.matrixRows),
  sqlValue(row.visualRationale),
  sqlValue(row.referencesJson),
  sqlValue(row.correctOrder),
].join(",\n")}
)`;

    return `INSERT OR REPLACE INTO questions (
  id,
  exam,
  type,
  category,
  subcategory,
  difficulty,
  stem,
  options,
  answer,
  rationale,
  deep_rationale,
  deep_rationale_authored_at,
  distractor_rationales,
  tags,
  blueprint_pct,
  concept_notes,
  provenance,
  review_status,
  revision,
  publish_state,
  scenario_title,
  scenario,
  additional_info,
  exhibits,
  chart_review,
  matrix_columns,
  matrix_rows,
  visual_rationale,
  references_json,
  correct_order
)
VALUES
${values};`;
  }).join("\n\n");
}

function runWrangler(database, remote, sql) {
  const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), "chapai-d1-"));
  const tempFile = path.join(tempDir, "statement.sql");
  fs.writeFileSync(tempFile, sql, "utf8");

  try {
    const args = ["wrangler", "d1", "execute", database];
    if (remote) {
      args.push("--remote");
    }
    args.push("--file", tempFile);

    const command = process.platform === "win32" ? "cmd.exe" : "npx";
    const commandArgs = process.platform === "win32" ? ["/c", "npx", ...args] : args;
    const result = spawnSync(command, commandArgs, {
      cwd: webRoot,
      stdio: "pipe",
      encoding: "utf8",
    });

    if (result.error || result.status !== 0) {
      process.stderr.write(result.stdout ?? "");
      process.stderr.write(result.stderr ?? "");
      throw new Error(result.error?.message ?? `Wrangler D1 execute failed with code ${result.status ?? "unknown"}.`);
    }
  } finally {
    fs.rmSync(tempDir, { recursive: true, force: true });
  }
}

function chunk(items, size) {
  const batches = [];
  for (let index = 0; index < items.length; index += size) {
    batches.push(items.slice(index, index + size));
  }
  return batches;
}

function buildSyncSql(rows, batchSize) {
  return chunk(rows, batchSize)
    .map((batchRows) => buildBatchSql(batchRows))
    .join("\n\n");
}

function buildPruneSql(rows, batchSize) {
  const keepRows = rows.map((row) => ({ id: row.id, exam: row.exam }));
  const keepInsertStatements = chunk(keepRows, batchSize)
    .map((batchRows) => {
      const values = batchRows
        .map((row) => `(${sqlValue(row.id)}, ${sqlValue(row.exam)})`)
        .join(",\n");

      return `INSERT OR REPLACE INTO sync_keep_questions (id, exam)\nVALUES\n${values};`;
    })
    .join("\n\n");

  return [
    "CREATE TABLE IF NOT EXISTS sync_keep_questions (id TEXT NOT NULL, exam TEXT NOT NULL, PRIMARY KEY (id, exam));",
    "DELETE FROM sync_keep_questions;",
    keepInsertStatements,
    `DELETE FROM review_schedule
WHERE question_id IN (
  SELECT q.id
  FROM questions q
  LEFT JOIN sync_keep_questions keep
    ON keep.id = q.id
   AND keep.exam = q.exam
  WHERE q.exam IN ('ccrn', 'nclex')
    AND keep.id IS NULL
);`,
    `DELETE FROM quiz_answers
WHERE question_id IN (
  SELECT q.id
  FROM questions q
  LEFT JOIN sync_keep_questions keep
    ON keep.id = q.id
   AND keep.exam = q.exam
  WHERE q.exam IN ('ccrn', 'nclex')
    AND keep.id IS NULL
);`,
    `DELETE FROM questions
WHERE exam IN ('ccrn', 'nclex')
  AND NOT EXISTS (
    SELECT 1
    FROM sync_keep_questions keep
    WHERE keep.id = questions.id
      AND keep.exam = questions.exam
  );`,
    "DELETE FROM sync_keep_questions;",
  ].join("\n\n");
}

function main() {
  const options = parseArgs(process.argv.slice(2));
  const rows = normalizeQuestions(options);

  if (rows.length === 0) {
    throw new Error("No live questions found to sync.");
  }

  if (options.applyMigration) {
    runWrangler(options.database, options.remote, fs.readFileSync(migrationFile, "utf8"));
  }

  if (options.resetQuestions) {
    runWrangler(
      options.database,
      options.remote,
      [
        "-- Remove dependent rows first so question resets do not violate foreign keys.",
        "DELETE FROM review_schedule;",
        "DELETE FROM quiz_answers;",
        "DELETE FROM questions;",
      ].join("\n"),
    );
  }

  const batchCount = Math.ceil(rows.length / options.batchSize);
  let syncSql = buildSyncSql(rows, options.batchSize);
  if (options.pruneStaleQuestions) {
    syncSql = `${syncSql}\n\n${buildPruneSql(rows, options.batchSize)}`;
  }
  runWrangler(options.database, options.remote, syncSql);
  process.stdout.write(`Synced ${rows.length} questions across ${batchCount} SQL batches in one import.\n`);

  process.stdout.write(`Question bank sync complete. ${rows.length} live questions written to ${options.database}.\n`);
}

main();
