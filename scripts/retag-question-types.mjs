import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

export const QUESTION_TYPES = Object.freeze([
  "mcq",
  "sata",
  "ordering",
  "matrix",
  "case_study",
  "bow_tie",
  "scenario_mcq",
  "decision_map_mcq",
]);

const scriptDir = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(scriptDir, "..");
const defaultBankDir = path.join(repoRoot, "packages", "content", "staging", "promoted-v2");

function usage() {
  return [
    "Usage: node scripts/retag-question-types.mjs [options]",
    "",
    "Options:",
    "  --input-dir <dir>       Source directory. Default: packages/content/staging/promoted-v2",
    "  --output-dir <dir>      Output directory. Default: same as input-dir",
    "  --validate-only         Scan without writing",
    "  --dry-run               Report proposed changes without writing",
    "  --force                 Allow replacing an existing output directory",
    "  --keep-backup           Keep backup when atomically replacing the input directory",
    "  --help                  Show this help text",
  ].join("\n");
}

function parseArgs(argv) {
  const options = {
    inputDir: defaultBankDir,
    outputDir: null,
    validateOnly: false,
    dryRun: false,
    force: false,
    keepBackup: false,
    help: false,
  };

  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];
    if (arg === "--input-dir") {
      options.inputDir = path.resolve(argv[++index]);
    } else if (arg === "--output-dir") {
      options.outputDir = path.resolve(argv[++index]);
    } else if (arg === "--validate-only") {
      options.validateOnly = true;
    } else if (arg === "--dry-run") {
      options.dryRun = true;
    } else if (arg === "--force") {
      options.force = true;
    } else if (arg === "--keep-backup") {
      options.keepBackup = true;
    } else if (arg === "--help" || arg === "-h") {
      options.help = true;
    } else {
      throw new Error(`Unknown argument: ${arg}`);
    }
  }

  options.outputDir = options.outputDir ?? options.inputDir;
  return options;
}

function normalizeText(value) {
  return String(value ?? "")
    .trim()
    .toLowerCase()
    .replace(/\s+/g, " ");
}

function scenarioKey(question) {
  const scenarioTitle = normalizeText(question.scenarioTitle);
  const scenario = normalizeText(question.scenario);
  if (!scenarioTitle || !scenario) {
    return "";
  }
  return `${scenarioTitle}\u0000${scenario}`;
}

function scenarioGroups(questions) {
  const groups = new Map();
  for (const question of questions) {
    const key = scenarioKey(question);
    if (!key) {
      continue;
    }
    const group = groups.get(key) ?? [];
    group.push(question);
    groups.set(key, group);
  }
  return groups;
}

export function hasRealCaseStudyShape(question, groups) {
  const key = scenarioKey(question);
  return Boolean(key && (groups.get(key)?.length ?? 0) >= 3);
}

export function hasRealBowTieShape(question) {
  const bowTie = question.bowTie;
  if (!bowTie || typeof bowTie !== "object") {
    return false;
  }

  const center = bowTie.center;
  const leftActions = Array.isArray(bowTie.leftActions) ? bowTie.leftActions : [];
  const rightMonitoring = Array.isArray(bowTie.rightMonitoring) ? bowTie.rightMonitoring : [];

  return Boolean(
    center
      && typeof center === "object"
      && "id" in center
      && "text" in center
      && leftActions.length >= 4
      && rightMonitoring.length >= 4,
  );
}

export function classifyQuestionType(question, groups) {
  const currentType = QUESTION_TYPES.includes(question.type) ? question.type : "mcq";

  if (currentType === "case_study") {
    return hasRealCaseStudyShape(question, groups) ? "case_study" : "scenario_mcq";
  }

  if (currentType === "bow_tie") {
    return hasRealBowTieShape(question) ? "bow_tie" : "decision_map_mcq";
  }

  return currentType;
}

function readJson(filePath) {
  return JSON.parse(fs.readFileSync(filePath, "utf8"));
}

function writeJson(filePath, payload) {
  fs.writeFileSync(filePath, `${JSON.stringify(payload, null, 2)}\n`, "utf8");
}

function listBatchFiles(dir) {
  if (!fs.existsSync(dir)) {
    throw new Error(`Input directory does not exist: ${dir}`);
  }

  return fs
    .readdirSync(dir)
    .filter((file) => file.endsWith(".json"))
    .sort()
    .map((file) => path.join(dir, file));
}

function summarizeQuestions(questions) {
  const groups = scenarioGroups(questions);
  const byType = {};
  let mislabeledCaseStudy = 0;
  let mislabeledBowTie = 0;
  let realCaseStudy = 0;
  let realBowTie = 0;

  for (const question of questions) {
    const type = QUESTION_TYPES.includes(question.type) ? question.type : "mcq";
    byType[type] = (byType[type] ?? 0) + 1;

    if (type === "case_study") {
      if (hasRealCaseStudyShape(question, groups)) {
        realCaseStudy += 1;
      } else {
        mislabeledCaseStudy += 1;
      }
    }

    if (type === "bow_tie") {
      if (hasRealBowTieShape(question)) {
        realBowTie += 1;
      } else {
        mislabeledBowTie += 1;
      }
    }
  }

  return {
    byType,
    mislabeledCaseStudy,
    mislabeledBowTie,
    realCaseStudy,
    realBowTie,
  };
}

export function scanQuestionTypes(dir) {
  const files = listBatchFiles(dir);
  const summary = {
    files: files.length,
    questions: 0,
    byType: {},
    retaggableCaseStudy: 0,
    retaggableBowTie: 0,
    realCaseStudy: 0,
    realBowTie: 0,
    invalidFiles: [],
  };

  for (const filePath of files) {
    try {
      const batch = readJson(filePath);
      const questions = Array.isArray(batch) ? batch : batch.questions;
      if (!Array.isArray(questions)) {
        throw new Error("Missing questions array");
      }

      const fileSummary = summarizeQuestions(questions);
      summary.questions += questions.length;
      summary.retaggableCaseStudy += fileSummary.mislabeledCaseStudy;
      summary.retaggableBowTie += fileSummary.mislabeledBowTie;
      summary.realCaseStudy += fileSummary.realCaseStudy;
      summary.realBowTie += fileSummary.realBowTie;

      for (const [type, count] of Object.entries(fileSummary.byType)) {
        summary.byType[type] = (summary.byType[type] ?? 0) + count;
      }
    } catch (error) {
      summary.invalidFiles.push({ file: path.basename(filePath), error: error.message });
    }
  }

  return summary;
}

export function retagBatch(batch) {
  const questions = Array.isArray(batch) ? batch : batch.questions;
  if (!Array.isArray(questions)) {
    throw new Error("Missing questions array");
  }

  const groups = scenarioGroups(questions);
  const changes = [];

  for (const question of questions) {
    const nextType = classifyQuestionType(question, groups);
    if (question.type !== nextType) {
      changes.push({
        id: question.id,
        from: question.type,
        to: nextType,
      });
      question.type = nextType;
    }
  }

  return changes;
}

function copyOrRetagFile(sourceFile, outputFile) {
  const batch = readJson(sourceFile);
  const changes = retagBatch(batch);
  writeJson(outputFile, batch);
  return changes;
}

function removeDir(dir) {
  if (fs.existsSync(dir)) {
    fs.rmSync(dir, { recursive: true, force: true });
  }
}

function makeTempDir(outputDir) {
  const parent = path.dirname(outputDir);
  const name = `${path.basename(outputDir)}.retag-tmp-${Date.now()}`;
  const tempDir = path.join(parent, name);
  fs.mkdirSync(tempDir, { recursive: true });
  return tempDir;
}

function moveTempToOutput(tempDir, outputDir, options) {
  const samePath = path.resolve(options.inputDir) === path.resolve(outputDir);

  if (samePath) {
    const backupDir = `${outputDir}.retag-bak-${Date.now()}`;
    fs.renameSync(outputDir, backupDir);
    fs.renameSync(tempDir, outputDir);
    if (!options.keepBackup) {
      removeDir(backupDir);
    }
    return { backupDir: options.keepBackup ? backupDir : null };
  }

  if (fs.existsSync(outputDir)) {
    if (!options.force) {
      throw new Error(`Output directory exists. Pass --force to replace it: ${outputDir}`);
    }
    const backupDir = `${outputDir}.retag-bak-${Date.now()}`;
    fs.renameSync(outputDir, backupDir);
    fs.renameSync(tempDir, outputDir);
    if (!options.keepBackup) {
      removeDir(backupDir);
    }
    return { backupDir: options.keepBackup ? backupDir : null };
  }

  fs.renameSync(tempDir, outputDir);
  return { backupDir: null };
}

export function retagQuestionTypes(options) {
  const sourceFiles = listBatchFiles(options.inputDir);
  const before = scanQuestionTypes(options.inputDir);
  const tempDir = makeTempDir(options.outputDir);
  const changes = [];

  try {
    for (const sourceFile of sourceFiles) {
      const outputFile = path.join(tempDir, path.basename(sourceFile));
      const fileChanges = copyOrRetagFile(sourceFile, outputFile);
      for (const change of fileChanges) {
        changes.push({ file: path.basename(sourceFile), ...change });
      }
    }

    const after = scanQuestionTypes(tempDir);
    if (after.invalidFiles.length > 0) {
      throw new Error(`Retagged output has invalid files: ${JSON.stringify(after.invalidFiles.slice(0, 5))}`);
    }
    if (after.retaggableCaseStudy > 0 || after.retaggableBowTie > 0) {
      throw new Error(
        `Retagged output still has mislabeled NGN items: case_study=${after.retaggableCaseStudy}, bow_tie=${after.retaggableBowTie}`,
      );
    }

    const move = moveTempToOutput(tempDir, options.outputDir, options);
    return {
      before,
      after,
      retagged: changes.length,
      changesByType: changes.reduce((acc, change) => {
        const key = `${change.from}->${change.to}`;
        acc[key] = (acc[key] ?? 0) + 1;
        return acc;
      }, {}),
      sampleChanges: changes.slice(0, 20),
      backupDir: move.backupDir,
    };
  } catch (error) {
    removeDir(tempDir);
    throw error;
  }
}

function assertCleanScan(summary) {
  if (summary.invalidFiles.length > 0) {
    throw new Error(`Invalid JSON files: ${JSON.stringify(summary.invalidFiles.slice(0, 5))}`);
  }
  if (summary.retaggableCaseStudy > 0 || summary.retaggableBowTie > 0) {
    throw new Error(
      `Mislabeled NGN items remain: case_study=${summary.retaggableCaseStudy}, bow_tie=${summary.retaggableBowTie}`,
    );
  }
}

function isDirectRun() {
  return process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url);
}

async function main() {
  const options = parseArgs(process.argv.slice(2));
  if (options.help) {
    process.stdout.write(`${usage()}\n`);
    return;
  }

  if (options.validateOnly || options.dryRun) {
    const summary = scanQuestionTypes(options.inputDir);
    process.stdout.write(`${JSON.stringify(summary, null, 2)}\n`);
    if (options.validateOnly) {
      assertCleanScan(summary);
    }
    return;
  }

  const result = retagQuestionTypes(options);
  process.stdout.write(`${JSON.stringify(result, null, 2)}\n`);
}

if (isDirectRun()) {
  main().catch((error) => {
    process.stderr.write(`${error.stack ?? error.message}\n`);
    process.exitCode = 1;
  });
}
