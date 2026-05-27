import { spawnSync } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";

const scriptDir = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(scriptDir, "..");
const webDir = path.join(repoRoot, "apps", "web");
const defaultInputDir = path.join(repoRoot, "packages", "content", "staging", "promoted-v2");

const questionColumns = [
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
];

function parseArgs(argv) {
  const options = {
    database: "",
    remote: false,
    config: "",
    inputDir: defaultInputDir,
    resetQuestions: false,
    onlyP1: false,
    deletePrefixes: [],
    chunkSize: 40,
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
    } else if (arg === "--input-dir") {
      options.inputDir = path.resolve(readValue());
    } else if (arg.startsWith("--input-dir=")) {
      options.inputDir = path.resolve(arg.slice("--input-dir=".length));
    } else if (arg === "--reset-questions") {
      options.resetQuestions = true;
    } else if (arg === "--only-p1") {
      options.onlyP1 = true;
    } else if (arg === "--delete-prefix") {
      options.deletePrefixes = readValue().split(",").map((value) => value.trim()).filter(Boolean);
    } else if (arg.startsWith("--delete-prefix=")) {
      options.deletePrefixes = arg.slice("--delete-prefix=".length).split(",").map((value) => value.trim()).filter(Boolean);
    } else if (arg === "--chunk-size") {
      options.chunkSize = Number(readValue());
    } else if (arg.startsWith("--chunk-size=")) {
      options.chunkSize = Number(arg.slice("--chunk-size=".length));
    } else if (arg === "--dry-run") {
      options.dryRun = true;
    } else {
      throw new Error(`Unknown option: ${arg}`);
    }
  }

  if (!options.database) {
    throw new Error("Pass --database=<d1-name>");
  }
  if (options.onlyP1 && options.deletePrefixes.length === 0) {
    options.deletePrefixes = [];
  }
  if (!Number.isInteger(options.chunkSize) || options.chunkSize < 1) {
    throw new Error("--chunk-size must be a positive integer");
  }
  return options;
}

function readJson(filePath) {
  return JSON.parse(fs.readFileSync(filePath, "utf8").replace(/^\uFEFF/, ""));
}

function listJsonFiles(dir) {
  if (!fs.existsSync(dir)) {
    throw new Error(`Input directory does not exist: ${dir}`);
  }
  return fs.readdirSync(dir)
    .filter((file) => file.endsWith(".json"))
    .sort((left, right) => left.localeCompare(right, undefined, { numeric: true }))
    .map((file) => path.join(dir, file));
}

function questionsFromPayload(payload) {
  if (Array.isArray(payload)) {
    return payload;
  }
  if (Array.isArray(payload?.questions)) {
    return payload.questions;
  }
  return [];
}

function asJson(value) {
  if (value == null) {
    return null;
  }
  return JSON.stringify(value);
}

function answerValue(question) {
  if (typeof question.answer === "string") {
    return question.answer;
  }
  return JSON.stringify(question.answer ?? "");
}

function provenanceValue(question, batch) {
  return JSON.stringify({
    batchId: batch.batchId ?? null,
    generatedBy: batch.generatedBy ?? null,
    sourcePath: question.sourcePath ?? null,
    sourceStage: question.sourceStage ?? null,
  });
}

function questionToRow(question, batch) {
  return {
    id: question.id,
    exam: question.exam,
    type: question.type ?? "mcq",
    category: question.category,
    subcategory: question.subcategory ?? null,
    difficulty: question.difficulty ?? 3,
    stem: question.stem,
    options: asJson(question.options ?? []),
    answer: answerValue(question),
    rationale: question.rationale ?? "",
    distractor_rationales: asJson(question.distractorRationales ?? null),
    tags: asJson(question.tags ?? []),
    blueprint_pct: question.blueprintPct ?? null,
    correct_order: asJson(question.correctOrder ?? null),
    concept_notes: asJson(question.conceptNotes ?? null),
    provenance: question.provenance ?? provenanceValue(question, batch),
    review_status: question.reviewStatus ?? "review",
    revision: question.revision ?? 1,
    publish_state: question.publishState ?? "published",
    scenario_title: question.scenarioTitle ?? null,
    case_study_id: question.caseStudyId ?? null,
    cjmm_step: question.cjmmStep ?? null,
    scenario: question.scenario ?? null,
    additional_info: question.additionalInfo ?? null,
    exhibits: asJson(question.exhibits ?? null),
    chart_review: asJson(question.chartReview ?? null),
    matrix_columns: asJson(question.matrixColumns ?? null),
    matrix_rows: asJson(question.matrixRows ?? null),
    bow_tie: asJson(question.bowTie ?? null),
    visual_rationale: asJson(question.visualRationale ?? null),
    references_json: asJson(question.references ?? question.referencesJson ?? []),
  };
}

function sqlValue(value) {
  if (value == null) {
    return "NULL";
  }
  if (typeof value === "number") {
    return Number.isFinite(value) ? String(value) : "NULL";
  }
  return `'${String(value).replaceAll("'", "''")}'`;
}

function insertSql(row) {
  const values = questionColumns.map((column) => sqlValue(row[column]));
  const updates = questionColumns
    .filter((column) => column !== "id")
    .map((column) => `${column}=excluded.${column}`)
    .join(", ");
  return `INSERT INTO questions (${questionColumns.join(", ")}) VALUES (${values.join(", ")}) ON CONFLICT(id) DO UPDATE SET ${updates};`;
}

function deleteSql(options) {
  if (options.resetQuestions) {
    return "DELETE FROM questions;";
  }
  if (options.deletePrefixes.length === 0) {
    return "";
  }
  const predicates = options.deletePrefixes.map((prefix) => `id LIKE ${sqlValue(`${prefix}%`)}`);
  return `DELETE FROM questions WHERE ${predicates.join(" OR ")};`;
}

function loadRows(options) {
  const rows = [];
  for (const filePath of listJsonFiles(options.inputDir)) {
    const payload = readJson(filePath);
    for (const question of questionsFromPayload(payload)) {
      if (options.onlyP1 && !String(question.id ?? "").startsWith("p1-")) {
        continue;
      }
      rows.push(questionToRow(question, payload));
    }
  }
  return rows;
}

function wranglerCommand(args) {
  if (process.platform === "win32") {
    return { bin: "cmd.exe", args: ["/d", "/s", "/c", "npx", ...args] };
  }
  return { bin: "npx", args };
}

function runSqlFile(options, filePath) {
  const args = ["wrangler", "d1", "execute", options.database];
  if (options.remote) {
    args.push("--remote");
  }
  if (options.config) {
    args.push("--config", options.config);
  }
  args.push("--file", filePath);

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
    throw new Error(`D1 sync failed for ${filePath}`);
  }
  process.stdout.write(result.stdout ?? "");
}

function chunkRows(rows, chunkSize) {
  const chunks = [];
  for (let index = 0; index < rows.length; index += chunkSize) {
    chunks.push(rows.slice(index, index + chunkSize));
  }
  return chunks;
}

function main() {
  const options = parseArgs(process.argv.slice(2));
  const rows = loadRows(options);
  const chunks = chunkRows(rows, options.chunkSize);
  const deletion = deleteSql(options);

  process.stdout.write(JSON.stringify({
    database: options.database,
    remote: options.remote,
    inputDir: options.inputDir,
    rows: rows.length,
    chunks: chunks.length,
    resetQuestions: options.resetQuestions,
    deletePrefixes: options.deletePrefixes,
    dryRun: options.dryRun,
  }, null, 2));
  process.stdout.write("\n");

  if (options.dryRun) {
    return;
  }

  const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), "chapai-d1-sync-"));
  try {
    for (let index = 0; index < chunks.length; index += 1) {
      const statements = [];
      if (index === 0 && deletion) {
        statements.push(deletion);
      }
      statements.push(...chunks[index].map(insertSql));
      const sql = statements.join("\n");
      const filePath = path.join(tempDir, `chunk-${String(index + 1).padStart(3, "0")}.sql`);
      fs.writeFileSync(filePath, sql, "utf8");
      process.stdout.write(`sync chunk ${index + 1}/${chunks.length}: ${chunks[index].length} rows\n`);
      runSqlFile(options, filePath);
    }
  } finally {
    fs.rmSync(tempDir, { recursive: true, force: true });
  }
}

main();
