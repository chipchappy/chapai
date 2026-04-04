import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const scriptDir = path.dirname(fileURLToPath(import.meta.url));
const packageRoot = path.resolve(scriptDir, "..");
const questionsRoot = path.join(packageRoot, "questions");
const stagingRoot = path.join(packageRoot, "staging");
const generatedRoot = path.join(stagingRoot, "generated");
const promotedRoot = path.join(stagingRoot, "promoted");
const summaryFile = path.join(packageRoot, "src", "generated-summary.ts");

function ensureDir(dir) {
  fs.mkdirSync(dir, { recursive: true });
}

function readJson(filePath, fallback) {
  try {
    return JSON.parse(fs.readFileSync(filePath, "utf8"));
  } catch {
    return fallback;
  }
}

function writeJson(filePath, payload) {
  ensureDir(path.dirname(filePath));
  fs.writeFileSync(filePath, JSON.stringify(payload, null, 2) + "\n", "utf8");
}

function listJsonFiles(dir) {
  if (!fs.existsSync(dir)) {
    return [];
  }
  return fs.readdirSync(dir)
    .filter((file) => file.endsWith(".json"))
    .map((file) => path.join(dir, file));
}

function validateQuestion(question, batchId, index) {
  const requiredStringKeys = ["id", "exam", "type", "category", "stem", "answer", "rationale"];
  for (const key of requiredStringKeys) {
    if (!String(question?.[key] ?? "").trim()) {
      throw new Error(`Invalid question in ${batchId} at index ${index}: missing ${key}`);
    }
  }

  if (!["ccrn", "nclex"].includes(question.exam)) {
    throw new Error(`Invalid exam in ${batchId} at index ${index}: ${question.exam}`);
  }

  if (!Array.isArray(question.options) || question.options.length < 2) {
    throw new Error(`Invalid options in ${batchId} at index ${index}`);
  }

  if (![1, 2, 3, 4, 5].includes(Number(question.difficulty))) {
    throw new Error(`Invalid difficulty in ${batchId} at index ${index}`);
  }

  return {
    ...question,
    sourceStage: "draft",
    tags: Array.isArray(question.tags) ? question.tags : [],
  };
}

function validateBatch(batch) {
  if (!String(batch?.batchId ?? "").trim()) {
    throw new Error("Batch missing batchId");
  }
  if (!Array.isArray(batch?.questions) || batch.questions.length === 0) {
    throw new Error(`Batch ${batch.batchId} has no questions`);
  }

  return {
    ...batch,
    questions: batch.questions.map((question, index) => validateQuestion(question, batch.batchId, index)),
  };
}

function mergeQuestions(targetFile, nextQuestions) {
  const existing = readJson(targetFile, []);
  const merged = new Map(existing.map((question) => [question.id, question]));
  let overwrittenDuplicates = 0;

  for (const question of nextQuestions) {
    if (merged.has(question.id)) {
      overwrittenDuplicates += 1;
    }
    merged.set(question.id, question);
  }

  const payload = Array.from(merged.values()).sort((left, right) => left.id.localeCompare(right.id));
  writeJson(targetFile, payload);
  return {
    totalAfterMerge: payload.length,
    netNew: payload.length - existing.length,
    incoming: nextQuestions.length,
    overwrittenDuplicates,
  };
}

function countQuestions(dir) {
  return listJsonFiles(dir)
    .flatMap((file) => readJson(file, []))
    .length;
}

function refreshSummary() {
  const payload = {
    generatedAt: new Date().toISOString(),
    ccrn: {
      live: countQuestions(path.join(questionsRoot, "ccrn", "live")),
      draft: countQuestions(path.join(questionsRoot, "ccrn", "draft")),
    },
    nclex: {
      live: countQuestions(path.join(questionsRoot, "nclex", "live")),
      draft: countQuestions(path.join(questionsRoot, "nclex", "draft")),
    },
  };

  fs.writeFileSync(summaryFile, `export const contentSummary = ${JSON.stringify(payload, null, 2)} as const;\n`, "utf8");
  return payload;
}

function main() {
  ensureDir(promotedRoot);
  const batchFiles = listJsonFiles(generatedRoot);
  const results = [];

  for (const batchFile of batchFiles) {
    const batch = validateBatch(readJson(batchFile, null));
    const byExam = {
      ccrn: batch.questions.filter((question) => question.exam === "ccrn"),
      nclex: batch.questions.filter((question) => question.exam === "nclex"),
    };

    const examCounts = {};
    if (byExam.ccrn.length) {
      examCounts.ccrn = mergeQuestions(
        path.join(questionsRoot, "ccrn", "draft", "generated-nemoclaw-batches.json"),
        byExam.ccrn,
      );
    }
    if (byExam.nclex.length) {
      examCounts.nclex = mergeQuestions(
        path.join(questionsRoot, "nclex", "draft", "generated-nemoclaw-batches.json"),
        byExam.nclex,
      );
    }

    const promotedFile = path.join(promotedRoot, path.basename(batchFile));
    fs.renameSync(batchFile, promotedFile);
    results.push({
      batchId: batch.batchId,
      promotedFile,
      counts: {
        ccrn: byExam.ccrn.length,
        nclex: byExam.nclex.length,
      },
      mergeStats: examCounts,
    });
  }

  const summary = refreshSummary();
  process.stdout.write(`${JSON.stringify({ promoted: results, summary }, null, 2)}\n`);
}

main();
