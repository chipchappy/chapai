import fs from "node:fs";
import os from "node:os";
import path from "node:path";

const repoRoot = path.resolve(import.meta.dirname, "../../..");
const contentRoot = path.join(repoRoot, "packages", "content", "questions");
const outputFile = path.join(os.tmpdir(), "chapai-d1-question-seed.sql");

function readJsonArray(filePath) {
  if (!fs.existsSync(filePath)) {
    return [];
  }

  return JSON.parse(fs.readFileSync(filePath, "utf8"));
}

function readQuestionDirectory(exam) {
  const directory = path.join(contentRoot, exam, "live");
  if (!fs.existsSync(directory)) {
    return [];
  }

  return fs
    .readdirSync(directory)
    .filter((file) => file.endsWith(".json"))
    .flatMap((file) => readJsonArray(path.join(directory, file)));
}

function dedupeQuestions(questions) {
  const merged = new Map();
  for (const question of questions) {
    if (question?.id) {
      merged.set(question.id, question);
    }
  }
  return Array.from(merged.values());
}

function sqlString(value) {
  return `'${String(value).replaceAll("'", "''")}'`;
}

function sqlNumber(value) {
  return typeof value === "number" && Number.isFinite(value) ? String(value) : "NULL";
}

function sqlJson(value) {
  if (value == null) {
    return "NULL";
  }

  return sqlString(JSON.stringify(value));
}

function sqlValue(value) {
  if (value == null || value === "") {
    return "NULL";
  }
  return sqlString(value);
}

function normalizeQuestion(question) {
  return {
    id: question.id,
    exam: question.exam,
    type: question.type ?? "mcq",
    category: question.category,
    subcategory: question.subcategory ?? null,
    difficulty: question.difficulty ?? null,
    stem: question.stem,
    options: question.options ?? [],
    answer: typeof question.answer === "string" ? question.answer : JSON.stringify(question.answer ?? []),
    rationale: question.rationale ?? "",
    distractorRationales: question.distractorRationales ?? null,
    tags: question.tags ?? [],
    blueprintPct: typeof question.blueprintPct === "number" ? question.blueprintPct : null,
    conceptNotes: question.conceptNotes ?? [],
    provenance: question.provenance ?? question.sourcePath ?? null,
    reviewStatus: question.reviewStatus ?? "approved",
    revision: typeof question.revision === "number" ? question.revision : 1,
    publishState: question.publishState ?? "published",
    correctOrder: question.correctOrder ?? null,
  };
}

function buildInsertRows(questions) {
  return questions.map((question) => {
    const normalized = normalizeQuestion(question);
    return `(${[
      sqlValue(normalized.id),
      sqlValue(normalized.exam),
      sqlValue(normalized.type),
      sqlValue(normalized.category),
      sqlValue(normalized.subcategory),
      sqlNumber(normalized.difficulty),
      sqlValue(normalized.stem),
      sqlJson(normalized.options),
      sqlValue(normalized.answer),
      sqlValue(normalized.rationale),
      sqlJson(normalized.distractorRationales),
      sqlJson(normalized.tags),
      sqlNumber(normalized.blueprintPct),
      sqlJson(normalized.conceptNotes),
      sqlValue(normalized.provenance),
      sqlValue(normalized.reviewStatus),
      sqlNumber(normalized.revision),
      sqlValue(normalized.publishState),
      sqlJson(normalized.correctOrder),
      "unixepoch()",
    ].join(", ")})`;
  });
}

const allQuestions = dedupeQuestions([
  ...readQuestionDirectory("ccrn"),
  ...readQuestionDirectory("nclex"),
]);

if (allQuestions.length === 0) {
  throw new Error("No live questions found to seed.");
}

const chunkSize = 10;
const rows = buildInsertRows(allQuestions);
const statements = [
  "DELETE FROM questions;",
];

for (let index = 0; index < rows.length; index += chunkSize) {
  const chunk = rows.slice(index, index + chunkSize);
  statements.push(
    `INSERT OR REPLACE INTO questions (
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
      distractor_rationales,
      tags,
      blueprint_pct,
      concept_notes,
      provenance,
      review_status,
      revision,
      publish_state,
      correct_order,
      created_at
    ) VALUES
${chunk.join(",\n")};`,
  );
}

fs.writeFileSync(outputFile, `${statements.join("\n\n")}\n`, "utf8");
console.log(outputFile);
