import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { buildRefinementReport, TARGET_APPROVED_UNIQUE } from "./nclex-second-pass-refinement-core.mjs";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const repoRoot = path.resolve(__dirname, "../../..");

const DEFAULT_SOURCE = path.join(repoRoot, "packages/content/questions/nclex/live/reviewed-curated-live.unique.json");
const DEFAULT_REVIEW_DIR = path.join(repoRoot, "packages/content/questions/nclex/review");
const DEFAULT_REPORT = path.join(DEFAULT_REVIEW_DIR, "nclex-second-pass-refinement-latest.json");
const DEFAULT_MANIFEST = path.join(DEFAULT_REVIEW_DIR, "nclex-refinement-manifest.latest.json");
const DEFAULT_TOPUP = path.join(DEFAULT_REVIEW_DIR, "nclex-top-up-needed.latest.json");

function argValue(name, fallback) {
  const prefix = `--${name}=`;
  const found = process.argv.find((arg) => arg.startsWith(prefix));
  return found ? found.slice(prefix.length) : fallback;
}

function readQuestions(filePath) {
  const raw = JSON.parse(fs.readFileSync(filePath, "utf8"));
  const questions = Array.isArray(raw) ? raw : raw.questions;
  if (!Array.isArray(questions)) {
    throw new Error(`Expected an array or { questions: [] } in ${filePath}`);
  }
  return questions.filter((question) => question?.exam === "nclex");
}

const sourcePath = path.resolve(argValue("source", DEFAULT_SOURCE));
const reportPath = path.resolve(argValue("report", DEFAULT_REPORT));
const manifestPath = path.resolve(argValue("manifest", DEFAULT_MANIFEST));
const topUpPath = path.resolve(argValue("top-up", DEFAULT_TOPUP));
const targetCount = Number(argValue("target", String(TARGET_APPROVED_UNIQUE)));

const questions = readQuestions(sourcePath);
const report = buildRefinementReport(questions, { targetCount });
const manifest = {
  generatedAt: report.generatedAt,
  exam: "nclex",
  sourceFile: path.relative(repoRoot, sourcePath).replace(/\\/g, "/"),
  targetApprovedRefinedUnique: targetCount,
  summary: report.summary,
  items: report.manifest,
};
const topUp = {
  generatedAt: report.generatedAt,
  exam: "nclex",
  sourceFile: manifest.sourceFile,
  topUpNeeded: report.summary.topUpNeeded,
  approvedRefinedUsableUnique: report.summary.approvedRefinedUsableUnique,
  remainingTo5000: report.summary.remainingTo5000,
  itemDeficits: report.topUp.itemDeficits,
  clientNeedDeficits: report.topUp.clientNeedDeficits,
  nextAction: report.topUp.nextAction,
};

fs.mkdirSync(path.dirname(reportPath), { recursive: true });
fs.writeFileSync(reportPath, `${JSON.stringify({ ...report, manifest: undefined }, null, 2)}\n`);
fs.writeFileSync(manifestPath, `${JSON.stringify(manifest, null, 2)}\n`);
fs.writeFileSync(topUpPath, `${JSON.stringify(topUp, null, 2)}\n`);

console.log(JSON.stringify({
  source: path.relative(repoRoot, sourcePath).replace(/\\/g, "/"),
  report: path.relative(repoRoot, reportPath).replace(/\\/g, "/"),
  manifest: path.relative(repoRoot, manifestPath).replace(/\\/g, "/"),
  topUp: path.relative(repoRoot, topUpPath).replace(/\\/g, "/"),
  summary: report.summary,
}, null, 2));
