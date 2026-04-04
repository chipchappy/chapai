import fs from "node:fs";
import path from "node:path";

const repoRoot = path.resolve(process.cwd());
const aiRoot = path.resolve(repoRoot, "..");
const legacyBatchRoot = path.join(aiRoot, "ccrn-agent", "data", "review_batches");
const contentRoot = path.join(repoRoot, "packages", "content");
const questionsRoot = path.join(contentRoot, "questions");

function ensureDir(dir) {
  fs.mkdirSync(dir, { recursive: true });
}

function difficultyToNumber(value) {
  const normalized = String(value || "").toLowerCase();
  if (normalized === "easy") return 2;
  if (normalized === "medium") return 3;
  if (normalized === "hard") return 4;
  const parsed = Number.parseInt(normalized, 10);
  return Number.isFinite(parsed) ? parsed : 3;
}

function normalizeOptions(choices) {
  if (Array.isArray(choices)) {
    return choices.map((choice) => ({
      id: String(choice.key || choice.id || "").toLowerCase(),
      text: String(choice.text || ""),
    }));
  }

  return Object.entries(choices || {}).map(([key, text]) => ({
    id: key.toLowerCase(),
    text: String(text),
  }));
}

function normalizeQuestion(question, sourceFile) {
  const exam = String(question.exam_type || question.exam || "").toLowerCase().includes("nclex")
    ? "nclex"
    : "ccrn";
  const categoryLabel = String(question.category || "general");
  return {
    id: String(question.id),
    exam,
    type: "mcq",
    category: categoryLabel.toLowerCase().replace(/[^a-z0-9]+/g, "_").replace(/^_+|_+$/g, "") || "general",
    subcategory: categoryLabel,
    difficulty: difficultyToNumber(question.difficulty),
    stem: String(question.stem || ""),
    options: normalizeOptions(question.choices || question.options),
    answer: String(question.correct_answer || question.answer || "").toLowerCase(),
    rationale: String(question.rationale || ""),
    tags: [categoryLabel].filter(Boolean),
    takeaway: question.key_takeaway ? String(question.key_takeaway) : undefined,
    sourceStage: "draft",
    sourcePath: sourceFile,
    visualRationale: question.diagram
      ? {
          type: question.diagram.type || "overview",
          accent: question.diagram.accent,
          title: question.diagram.title || categoryLabel,
          caption: question.diagram.caption,
          metrics: question.diagram.metrics,
          nodes: question.diagram.nodes,
          conclusion: question.diagram.conclusion,
        }
      : undefined,
  };
}

const buckets = {
  ccrn: [],
  nclex: [],
};

if (fs.existsSync(legacyBatchRoot)) {
  for (const fileName of fs.readdirSync(legacyBatchRoot).filter((name) => name.endsWith(".json")).sort()) {
    const fullPath = path.join(legacyBatchRoot, fileName);
    const parsed = JSON.parse(fs.readFileSync(fullPath, "utf8"));
    if (!Array.isArray(parsed)) {
      continue;
    }

    for (const question of parsed) {
      const normalized = normalizeQuestion(question, fullPath);
      buckets[normalized.exam].push(normalized);
    }
  }
}

for (const exam of ["ccrn", "nclex"]) {
  const targetDir = path.join(questionsRoot, exam, "draft");
  ensureDir(targetDir);
  const outputPath = path.join(targetDir, "imported-review-batches.json");
  fs.writeFileSync(outputPath, JSON.stringify(buckets[exam], null, 2) + "\n", "utf8");
}

console.log(
  JSON.stringify(
    {
      importedFrom: legacyBatchRoot,
      ccrn: buckets.ccrn.length,
      nclex: buckets.nclex.length,
    },
    null,
    2,
  ),
);
