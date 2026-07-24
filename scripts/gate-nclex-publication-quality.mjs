import fs from "node:fs";
import path from "node:path";
import {
  evaluatePublicationBatch,
} from "../packages/content/scripts/publication-quality-gate.mjs";

function readJson(filePath) {
  return JSON.parse(fs.readFileSync(filePath, "utf8").replace(/^\uFEFF/, ""));
}

function questionsFromPayload(payload) {
  if (Array.isArray(payload)) return payload;
  if (Array.isArray(payload?.questions)) return payload.questions;
  return [];
}

function inputFiles(inputPath) {
  const resolved = path.resolve(inputPath);
  const stat = fs.statSync(resolved);
  if (stat.isFile()) return [resolved];
  return fs.readdirSync(resolved)
    .filter((name) => name.endsWith(".json"))
    .sort((left, right) => left.localeCompare(right, undefined, { numeric: true }))
    .map((name) => path.join(resolved, name));
}

const inputPath = process.argv[2];
if (!inputPath) {
  throw new Error("Usage: node scripts/gate-nclex-publication-quality.mjs <json-file-or-directory>");
}

const files = inputFiles(inputPath);
const questions = files.flatMap((filePath) => questionsFromPayload(readJson(filePath)));
const result = evaluatePublicationBatch(questions);
const failed = result.reports.filter((report) => !report.passed);

process.stdout.write(`${JSON.stringify({
  gateVersion: result.gateVersion,
  inputPath: path.resolve(inputPath),
  files: files.length,
  questions: questions.length,
  passed: result.reports.length - failed.length,
  failed: failed.length,
  batchIssues: result.batchIssues,
  failures: failed,
}, null, 2)}\n`);

if (!result.passed) {
  process.exitCode = 1;
}
