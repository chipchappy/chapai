import { spawnSync } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";

const scriptDir = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(scriptDir, "..");
const webDir = path.join(repoRoot, "apps", "web");

const migrations = [
  { table: "questions", column: "concept_notes", label: "questions.concept_notes", sql: "ALTER TABLE questions ADD COLUMN concept_notes TEXT" },
  { table: "questions", column: "provenance", label: "questions.provenance", sql: "ALTER TABLE questions ADD COLUMN provenance TEXT" },
  { table: "questions", column: "review_status", label: "questions.review_status", sql: "ALTER TABLE questions ADD COLUMN review_status TEXT" },
  { table: "questions", column: "revision", label: "questions.revision", sql: "ALTER TABLE questions ADD COLUMN revision INTEGER" },
  { table: "questions", column: "publish_state", label: "questions.publish_state", sql: "ALTER TABLE questions ADD COLUMN publish_state TEXT" },
  { table: "questions", column: "scenario_title", label: "questions.scenario_title", sql: "ALTER TABLE questions ADD COLUMN scenario_title TEXT" },
  { table: "questions", column: "case_study_id", label: "questions.case_study_id", sql: "ALTER TABLE questions ADD COLUMN case_study_id TEXT" },
  { table: "questions", column: "cjmm_step", label: "questions.cjmm_step", sql: "ALTER TABLE questions ADD COLUMN cjmm_step TEXT" },
  { table: "questions", column: "scenario", label: "questions.scenario", sql: "ALTER TABLE questions ADD COLUMN scenario TEXT" },
  { table: "questions", column: "additional_info", label: "questions.additional_info", sql: "ALTER TABLE questions ADD COLUMN additional_info TEXT" },
  { table: "questions", column: "exhibits", label: "questions.exhibits", sql: "ALTER TABLE questions ADD COLUMN exhibits TEXT" },
  { table: "questions", column: "chart_review", label: "questions.chart_review", sql: "ALTER TABLE questions ADD COLUMN chart_review TEXT" },
  { table: "questions", column: "matrix_columns", label: "questions.matrix_columns", sql: "ALTER TABLE questions ADD COLUMN matrix_columns TEXT" },
  { table: "questions", column: "matrix_rows", label: "questions.matrix_rows", sql: "ALTER TABLE questions ADD COLUMN matrix_rows TEXT" },
  { table: "questions", column: "bow_tie", label: "questions.bow_tie", sql: "ALTER TABLE questions ADD COLUMN bow_tie TEXT" },
  { table: "questions", column: "visual_rationale", label: "questions.visual_rationale", sql: "ALTER TABLE questions ADD COLUMN visual_rationale TEXT" },
  { table: "questions", column: "references_json", label: "questions.references_json", sql: "ALTER TABLE questions ADD COLUMN references_json TEXT" },
  { table: "questions", column: "structured_rationale", label: "questions.structured_rationale", sql: "ALTER TABLE questions ADD COLUMN structured_rationale TEXT" },
  { table: "quiz_answers", column: "points_earned", label: "quiz_answers.points_earned", sql: "ALTER TABLE quiz_answers ADD COLUMN points_earned REAL" },
  { table: "quiz_answers", column: "points_possible", label: "quiz_answers.points_possible", sql: "ALTER TABLE quiz_answers ADD COLUMN points_possible REAL" },
  { table: "quiz_answers", column: "partial_credit", label: "quiz_answers.partial_credit", sql: "ALTER TABLE quiz_answers ADD COLUMN partial_credit REAL" },
  { label: "idx_questions_case_study_id", sql: "CREATE INDEX IF NOT EXISTS idx_questions_case_study_id ON questions(case_study_id)" },
  { label: "idx_questions_cjmm_step", sql: "CREATE INDEX IF NOT EXISTS idx_questions_cjmm_step ON questions(cjmm_step)" },
];

function parseArgs(argv) {
  const options = {
    database: "",
    remote: false,
    config: "",
    dryRun: false,
  };

  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];
    const readValue = () => {
      index += 1;
      if (index >= argv.length) {
        throw new Error(`Missing value for ${arg}`);
      }
      return argv[index];
    };

    if (arg === "--database") {
      options.database = readValue();
    } else if (arg.startsWith("--database=")) {
      options.database = arg.slice("--database=".length);
    } else if (arg === "--remote") {
      options.remote = true;
    } else if (arg === "--config") {
      options.config = readValue();
    } else if (arg.startsWith("--config=")) {
      options.config = arg.slice("--config=".length);
    } else if (arg === "--dry-run") {
      options.dryRun = true;
    } else {
      throw new Error(`Unknown option: ${arg}`);
    }
  }

  if (!options.database) {
    throw new Error("Pass --database=<d1-name>");
  }
  return options;
}

function wranglerCommand(args) {
  if (process.platform === "win32") {
    return { bin: "cmd.exe", args: ["/d", "/s", "/c", "npx", ...args] };
  }
  return { bin: "npx", args };
}

function wranglerBaseArgs(options) {
  const args = ["wrangler", "d1", "execute", options.database];
  if (options.remote) {
    args.push("--remote");
  }
  if (options.config) {
    args.push("--config", options.config);
  }
  return args;
}

function fetchColumns(options, table) {
  if (options.dryRun) {
    return new Set();
  }
  const args = [...wranglerBaseArgs(options), "--json", "--command", `PRAGMA table_info(${table});`];
  const command = wranglerCommand(args);
  const result = spawnSync(command.bin, command.args, {
    cwd: webDir,
    encoding: "utf8",
    stdio: ["ignore", "pipe", "pipe"],
  });
  if (result.status !== 0) {
    if (result.error) {
      process.stderr.write(`${result.error.message}\n`);
    }
    process.stderr.write(result.stdout ?? "");
    process.stderr.write(result.stderr ?? "");
    throw new Error(`Could not inspect ${table} columns`);
  }
  const payload = JSON.parse(result.stdout);
  return new Set((payload[0]?.results ?? []).map((row) => row.name));
}

function runStatement(options, statement) {
  const args = [...wranglerBaseArgs(options), "--command", statement.sql];

  if (options.dryRun) {
    process.stdout.write(`[dry-run] ${statement.sql}\n`);
    return;
  }

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
  if (result.error) {
    process.stderr.write(`${result.error.message}\n`);
  }
  if (/duplicate column name/i.test(combined)) {
    process.stdout.write(`already present: ${statement.label}\n`);
    return;
  }
  process.stderr.write(combined);
  throw new Error(`Migration failed at ${statement.label}`);
}

function fetchQuestionTableSql(options) {
  if (options.dryRun) {
    return "";
  }
  const args = [...wranglerBaseArgs(options), "--json", "--command", "SELECT sql FROM sqlite_master WHERE type='table' AND name='questions';"];
  const command = wranglerCommand(args);
  const result = spawnSync(command.bin, command.args, {
    cwd: webDir,
    encoding: "utf8",
    stdio: ["ignore", "pipe", "pipe"],
  });
  if (result.status !== 0) {
    if (result.error) {
      process.stderr.write(`${result.error.message}\n`);
    }
    process.stderr.write(result.stdout ?? "");
    process.stderr.write(result.stderr ?? "");
    throw new Error("Could not inspect questions table SQL");
  }
  const payload = JSON.parse(result.stdout);
  return payload[0]?.results?.[0]?.sql ?? "";
}

function runSqlFile(options, label, sql) {
  if (options.dryRun) {
    process.stdout.write(`[dry-run] ${label}\n${sql}\n`);
    return;
  }
  const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), "chapai-d1-migrate-"));
  const filePath = path.join(tmpDir, `${label}.sql`);
  fs.writeFileSync(filePath, sql);
  const args = [...wranglerBaseArgs(options), "--file", filePath];
  const command = wranglerCommand(args);
  const result = spawnSync(command.bin, command.args, {
    cwd: webDir,
    encoding: "utf8",
    stdio: ["ignore", "pipe", "pipe"],
  });
  if (result.status !== 0) {
    if (result.error) {
      process.stderr.write(`${result.error.message}\n`);
    }
    process.stderr.write(result.stdout ?? "");
    process.stderr.write(result.stderr ?? "");
    throw new Error(`Migration failed at ${label}`);
  }
  process.stdout.write(result.stdout ?? "");
  process.stdout.write(`applied: ${label}\n`);
}

function ensureQuestionTypeConstraint(options) {
  const sql = fetchQuestionTableSql(options);
  if (!options.dryRun && /scenario_mcq/.test(sql) && /decision_map_mcq/.test(sql)) {
    process.stdout.write("already present: questions.type supports scenario_mcq and decision_map_mcq\n");
    return;
  }

  const columns = [
    "id",
    "exam",
    "type",
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
    "blueprint_pct",
    "correct_order",
    "concept_notes",
    "provenance",
    "review_status",
    "revision",
    "publish_state",
    "scenario_title",
    "case_study_id",
    "cjmm_step",
    "scenario",
    "additional_info",
    "exhibits",
    "chart_review",
    "matrix_columns",
    "matrix_rows",
    "bow_tie",
    "visual_rationale",
    "references_json",
    "created_at",
  ];

  const rebuildSql = `
PRAGMA foreign_keys=off;
DROP TABLE IF EXISTS questions_p1_type_rebuild;
CREATE TABLE questions_p1_type_rebuild (
  id TEXT PRIMARY KEY,
  exam TEXT NOT NULL CHECK(exam IN ('nclex','ccrn')),
  type TEXT DEFAULT 'mcq' CHECK(type IN ('mcq','sata','ordering','matrix','case_study','bow_tie','scenario_mcq','decision_map_mcq')),
  category TEXT NOT NULL,
  subcategory TEXT,
  difficulty INTEGER CHECK(difficulty BETWEEN 1 AND 5),
  stem TEXT NOT NULL,
  options TEXT NOT NULL,
  answer TEXT NOT NULL,
  rationale TEXT NOT NULL,
  structured_rationale TEXT,
  distractor_rationales TEXT,
  tags TEXT,
  blueprint_pct REAL,
  correct_order TEXT,
  concept_notes TEXT,
  provenance TEXT,
  review_status TEXT,
  revision INTEGER,
  publish_state TEXT,
  scenario_title TEXT,
  case_study_id TEXT,
  cjmm_step TEXT CHECK (
    cjmm_step IS NULL OR cjmm_step IN (
      'recognize-cues',
      'analyze-cues',
      'prioritize-hypotheses',
      'generate-solutions',
      'take-actions',
      'evaluate-outcomes'
    )
  ),
  scenario TEXT,
  additional_info TEXT,
  exhibits TEXT,
  chart_review TEXT,
  matrix_columns TEXT,
  matrix_rows TEXT,
  bow_tie TEXT,
  visual_rationale TEXT,
  references_json TEXT,
  created_at INTEGER DEFAULT (unixepoch())
);
INSERT INTO questions_p1_type_rebuild (${columns.join(", ")})
SELECT ${columns.join(", ")} FROM questions;
DROP TABLE questions;
ALTER TABLE questions_p1_type_rebuild RENAME TO questions;
CREATE INDEX IF NOT EXISTS idx_questions_exam_category ON questions(exam, category);
CREATE INDEX IF NOT EXISTS idx_questions_exam_difficulty ON questions(exam, difficulty);
CREATE INDEX IF NOT EXISTS idx_questions_case_study_id ON questions(case_study_id);
CREATE INDEX IF NOT EXISTS idx_questions_cjmm_step ON questions(cjmm_step);
PRAGMA foreign_keys=on;
`.trim();

  runSqlFile(options, "questions_type_constraint_rebuild", rebuildSql);
}

function main() {
  const options = parseArgs(process.argv.slice(2));
  const columnCache = new Map();
  for (const migration of migrations) {
    if (migration.table && migration.column) {
      if (!columnCache.has(migration.table)) {
        columnCache.set(migration.table, fetchColumns(options, migration.table));
      }
      if (columnCache.get(migration.table).has(migration.column)) {
        process.stdout.write(`already present: ${migration.label}\n`);
        continue;
      }
    }
    runStatement(options, migration);
  }
  ensureQuestionTypeConstraint(options);
}

main();
