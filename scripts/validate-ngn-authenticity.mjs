import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

export const CJMM_STEPS = Object.freeze([
  "recognize-cues",
  "analyze-cues",
  "prioritize-hypotheses",
  "generate-solutions",
  "take-actions",
  "evaluate-outcomes",
]);

const scriptDir = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(scriptDir, "..");
const defaultInputDir = path.join(repoRoot, "packages", "content", "staging", "promoted-v2");

function parseArgs(argv) {
  const options = {
    inputDir: defaultInputDir,
  };

  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];
    const next = () => {
      index += 1;
      if (index >= argv.length) {
        throw new Error(`Missing value for ${arg}`);
      }
      return argv[index];
    };

    if (arg === "--input-dir") {
      options.inputDir = path.resolve(next());
    } else if (arg.startsWith("--input-dir=")) {
      options.inputDir = path.resolve(arg.slice("--input-dir=".length));
    } else {
      throw new Error(`Unknown option: ${arg}`);
    }
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

function normalizeText(value) {
  return String(value ?? "").replace(/\s+/g, " ").trim();
}

function questionKey(filePath, question) {
  return `${path.basename(filePath)}:${question?.id ?? "unknown"}`;
}

function countCorrect(cells) {
  return cells.filter((cell) => cell?.isCorrect === true).length;
}

function hasRealBowTie(question) {
  const bowTie = question?.bowTie;
  if (!bowTie || typeof bowTie !== "object") {
    return false;
  }

  return Boolean(
    bowTie.center?.id
      && bowTie.center?.text
      && bowTie.center?.isCorrect === true
      && Array.isArray(bowTie.leftActions)
      && bowTie.leftActions.length === 4
      && countCorrect(bowTie.leftActions) === 2
      && Array.isArray(bowTie.rightMonitoring)
      && bowTie.rightMonitoring.length === 4
      && countCorrect(bowTie.rightMonitoring) === 2,
  );
}

function answerMatchesBowTie(question) {
  if (!hasRealBowTie(question) || !question.answer || typeof question.answer !== "object" || Array.isArray(question.answer)) {
    return false;
  }

  const leftCorrect = question.bowTie.leftActions.filter((cell) => cell.isCorrect).map((cell) => cell.id).sort();
  const rightCorrect = question.bowTie.rightMonitoring.filter((cell) => cell.isCorrect).map((cell) => cell.id).sort();
  const answerLeft = Array.isArray(question.answer.leftActions) ? [...question.answer.leftActions].sort() : [];
  const answerRight = Array.isArray(question.answer.rightMonitoring) ? [...question.answer.rightMonitoring].sort() : [];

  return question.answer.center === question.bowTie.center.id
    && JSON.stringify(answerLeft) === JSON.stringify(leftCorrect)
    && JSON.stringify(answerRight) === JSON.stringify(rightCorrect);
}

function validateCaseGroups(groups, errors) {
  for (const [caseStudyId, items] of groups.entries()) {
    if (items.length !== 6) {
      errors.push(`${caseStudyId}: expected 6 case_study sub-items, found ${items.length}`);
      continue;
    }

    const steps = new Set(items.map((item) => item.question.cjmmStep));
    for (const step of CJMM_STEPS) {
      if (!steps.has(step)) {
        errors.push(`${caseStudyId}: missing CJMM step ${step}`);
      }
    }
    if (steps.size !== 6) {
      errors.push(`${caseStudyId}: duplicate or invalid CJMM steps`);
    }

    const scenarioTitles = new Set(items.map((item) => normalizeText(item.question.scenarioTitle)));
    const scenarios = new Set(items.map((item) => normalizeText(item.question.scenario)));
    if (scenarioTitles.size !== 1 || ![...scenarioTitles][0]) {
      errors.push(`${caseStudyId}: case sub-items must share one non-empty scenarioTitle`);
    }
    if (scenarios.size !== 1 || ![...scenarios][0]) {
      errors.push(`${caseStudyId}: case sub-items must share one non-empty scenario`);
    }

    for (const item of items) {
      if (!Array.isArray(item.question.exhibits) || item.question.exhibits.length < 3) {
        errors.push(`${item.key}: case_study sub-item needs at least 3 exhibits`);
      }
    }
  }
}

export function scanNgnAuthenticity(inputDir = defaultInputDir) {
  const errors = [];
  const caseGroups = new Map();
  const summary = {
    files: 0,
    questions: 0,
    caseStudyItems: 0,
    caseStudies: 0,
    bowTieItems: 0,
    errors,
  };

  for (const filePath of listJsonFiles(inputDir)) {
    summary.files += 1;
    const questions = questionsFromPayload(readJson(filePath));
    summary.questions += questions.length;

    for (const question of questions) {
      const key = questionKey(filePath, question);
      if (question.type === "case_study") {
        summary.caseStudyItems += 1;
        if (!question.caseStudyId) {
          errors.push(`${key}: case_study missing caseStudyId`);
          continue;
        }
        if (!CJMM_STEPS.includes(question.cjmmStep)) {
          errors.push(`${key}: case_study has invalid cjmmStep`);
        }
        const group = caseGroups.get(question.caseStudyId) ?? [];
        group.push({ key, question });
        caseGroups.set(question.caseStudyId, group);
      }

      if (question.type === "bow_tie") {
        summary.bowTieItems += 1;
        if (!hasRealBowTie(question)) {
          errors.push(`${key}: bow_tie missing real 3-zone structure`);
        } else if (!answerMatchesBowTie(question)) {
          errors.push(`${key}: bow_tie answer does not match correct center/action/monitoring cells`);
        }
      }
    }
  }

  validateCaseGroups(caseGroups, errors);
  summary.caseStudies = caseGroups.size;
  return summary;
}

function main() {
  const options = parseArgs(process.argv.slice(2));
  const summary = scanNgnAuthenticity(options.inputDir);
  process.stdout.write(`${JSON.stringify(summary, null, 2)}\n`);
  if (summary.errors.length > 0) {
    process.exitCode = 1;
  }
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  main();
}
